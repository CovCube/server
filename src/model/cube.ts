//type imports
import { Actuator, Cube, CubeVariables, Sensor } from '../types';
import { QueryResult } from 'pg';
import { AxiosResponse } from "axios";
//other external imports
import format from 'pg-format';
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
//internal imports
import { pool } from "../index";
import { checkCubeId, checkSensorArray, checkActuatorArray } from '../utils/input_check_utils';
import { compareSensorTypes, getCubeSensorEndpointObject, getSensorTypesArray } from "../utils/general_utils";
import { subscribeCubeMQTTTopic, publishCube } from '../utils/mqtt_utils';

//Base tables
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, ip CHAR(15), location CHAR(255) NOT NULL)";
//Junction tables
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, scan_interval NUMERIC NOT NULL, PRIMARY KEY (cube_id, sensor_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, values CHAR(64)[] NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";

//Manage cubes
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const addCubeQuery: string = "INSERT INTO cubes (id, ip, location) VALUES ($1, $2, $3)";
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
//Manage cube sensors/actuators
const getCubeSensorsWithIdQuery: string = 'SELECT * FROM cube_sensors WHERE cube_id=$1';
const addCubeSensorsQuery: string = "INSERT INTO cube_sensors (cube_id, sensor_type, scan_interval) VALUES ($1, $2, $3)";
const updateCubeSensorsQuery: string = "UPDATE cube_sensors SET scan_interval=$3 WHERE cube_id=$1 AND sensor_type=$2";
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type, values) VALUES ($1, $2, $3)";

export async function createCubeTables(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createCubesTableQuery);
            await pool.query(createCubeSensorsTableQuery);
            await pool.query(createCubeActuatorsTableQuery);

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function getCubes(): Promise<Array<Cube>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getCubesQuery);

            let cubes: Array<Cube> = [];

            res.rows.forEach((row) => {
                let cube = row;
                cube.location = row.location.trim();

                cubes.push(cube);
            })

            return resolve(cubes);
        } catch(err) {
            return reject(err);
        }
    });
}

export function getCubeWithId(cubeId: string): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }

        try {
            let res: QueryResult = await pool.query(getCubeWithIdQuery, [cubeId]);

            if (res.rows.length == 0) {
                reject(new Error("no cube with specified id found"));
            }

            let cube: Cube = res.rows[0];
            cube.ip = cube.ip.trim();
            cube.location = cube.location.trim();

            let sensors: Array<Sensor> = await getCubeSensors(cubeId);
            cube.sensors = sensors;

            let actuators: Array<Actuator> = await getCubeActuators(cubeId);
            cube.actuators = actuators;

            return resolve(cube);
        } catch(err) {
            return reject(err);
        };
    });
}

async function getCubeSensors(cubeId: string): Promise<Array<Sensor>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }

        try {
            let sensors: Array<Sensor> = [];
            let res: QueryResult = await pool.query(getCubeSensorsWithIdQuery, [cubeId]);

            res.rows.forEach((sensor) => {
                sensors.push({
                    type: sensor.sensor_type.trim(),
                    scanInterval: parseInt(sensor.scan_interval)
                });
            })

            return resolve(sensors)
        } catch(err) {
            return reject(err);
        }
    });
}

async function getCubeActuators(cubeId: string): Promise<Array<Actuator>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        try {
            checkCubeId(cubeId);
        } catch(err) {
            return reject(err);
        }
        
        try {
            let actuators: Array<Actuator> = [];
            let res: QueryResult = await pool.query(getCubeActuatorsWithIdQuery, [cubeId]);

            res.rows.forEach((value) => {
                actuators.push({
                    "type": value.actuator_type.trim(),
                    "values": value.values
                });
            })

            return resolve(actuators)
        } catch(err) {
            return reject(err);
        }
    });
}

export async function addCube(targetIP: string, location: string): Promise<void> {
    //Check input
    if (targetIP === undefined || !targetIP.trim()) {
        return Promise.reject("targetIP is undefined or empty");
    }
    if (location === undefined || !location.trim()) {
        return Promise.reject("location is undefined or empty");
    }

    //Get mqtt server address
    let serverAddress: string = process.env.MQTT_PUBLIC || process.env.MQTTURL || 'test.mosquitto.org';
    let serverPort: number = parseInt(process.env.MQTT_PUBLICPORT || process.env.MQTTPORT || '1883');
    //Generate random id for cube
    let id: string = uuidv4();

    let data = {
        'address': serverAddress,
        'port': serverPort,
        'uuid': id,
        'location': location.trim()
    }

    //Send config data to cube
    let response: AxiosResponse = await axios.post("http://"+targetIP.trim(), data)
    //Get cube sensors and actuators
    let sensors: Array<Sensor> = response.data['sensors'];
    let actuators: Array<Actuator> = response.data['actuators']; 

    //Persist cube
    return persistCube(id, targetIP, location, sensors, actuators);
}

function persistCube(cubeId: string, ip: string, location: string, sensors: Array<Sensor>, actuators: Array<Actuator>): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            checkCubeId(cubeId);
            if (ip === undefined || !ip.trim()) {
                throw(new Error("ip is undefined or empty"));
            }
            if (location === undefined || !location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
            checkSensorArray(sensors);
            checkActuatorArray(actuators);
        } catch(err) {
            return reject(err);
        }
        
        try {
            //Get client
            let client = await pool.connect()

            //Add cube
            await client.query(addCubeQuery, [cubeId, ip, location]);

            //Add sensors to cube
            sensors.forEach(async (sensor: Sensor) => {
                await client.query(addCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval])
                            .catch((err: Error) => {
                                reject(err);
                            });
            })

            //Add actuators to cube
            actuators.forEach(async (actuator: Actuator) => {
                await client.query(addCubeActuatorsQuery, [cubeId, actuator.type, actuator.values])
                            .catch((err: Error) => {
                                reject(err);
                            });
            });

            //Subscribe to cube topic
            await subscribeCubeMQTTTopic(cubeId, 2);
            // Publish cube creation
            publishCube("create", {
                id: cubeId,
                ip: "",
                location: location,
                sensors: sensors,
                actuators: actuators
            });

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}

export function updateCubeWithId(cubeId: string, variables: CubeVariables): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check input
        try {
            checkCubeId(cubeId);
            if (variables.location === undefined || !variables.location.trim()) {
                throw(new Error("location is undefined or empty"));
            }
            checkSensorArray(variables.sensors);
            if (variables.actuators === undefined || variables.actuators.length == 0) {
                throw(new Error("actuators array is undefined or empty"));
            }
        } catch(err) {
            return reject(err);
        }

        try {
            //Check if cube exists
            let cube: Cube = await getCubeWithId(cubeId);
            //Update cube location
            await pool.query(format(updateCubeWithIdQuery, 'location', variables.location, cubeId));
            await axios.post("http://"+cube.ip, {
                "location": variables.location
            });

            let old_sensors: Array<Sensor> = await getCubeSensors(cubeId);
            let old_sensor_types: Array<string> = getSensorTypesArray(old_sensors);
            let new_sensors: Array<Sensor> = variables.sensors;

            new_sensors.forEach(async (sensor: Sensor) => {
                //Check if sensor type exists for this cube
                if (!old_sensor_types.includes(sensor.type)) {
                    throw(new Error("sensor type does not exist on this cube"));
                }

                //Update scan interval, if it was changed
                let sensors_index = old_sensors.findIndex(compareSensorTypes,sensor);
                if (old_sensors[sensors_index].scanInterval != sensor.scanInterval) {
                    //Persist to database
                    await pool.query(updateCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval]);
                    //Send to cube
                    let data = getCubeSensorEndpointObject(new_sensors);
                    await axios.post("http://"+cube.ip+"/sensor", data);
                }
            });

            //Publish cube update
            publishCube("update", {
                id: cube.id,
                ip: "",
                location: variables.location,
                sensors: variables.sensors,
                actuators: variables.actuators
            });

            return resolve(getCubeWithId(cubeId));
        } catch(err) {
            return reject(err);
        }
    });
}

export function deleteCubeWithId(cubeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        //Check cubeId
        checkCubeId(cubeId);

        try {
            pool.query(deleteCubeWithIdQuery, [cubeId]);

            //Publish cube deletion
            publishCube("delete", {
                id: cubeId,
                ip: "",
                location: "",
                sensors: [],
                actuators: []
            });

            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}