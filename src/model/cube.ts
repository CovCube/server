//type imports
import { Cube, CubeVariables, Sensor } from '../types';
import { QueryResult } from 'pg';
import { AxiosResponse } from "axios";
//other external imports
import format from 'pg-format';
import ip from "ip";
import axios from "axios";
import { v4 as uuidv4, validate as uuidvalidate } from "uuid";
//internal imports
import { pool } from "../index";
import { findSensorIndex, getCubeSensorEndpointObject, getSensorTypesArray } from "../utils/general_utils";
import { subscribeCubeMQTTTopic } from '../utils/mqtt_utils';

//Base tables
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, ip CHAR(15), location CHAR(255) NOT NULL)";
//Junction tables
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, scan_interval NUMERIC NOT NULL, PRIMARY KEY (cube_id, sensor_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE)";

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
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type) VALUES ($1, $2)";

export async function createCubeTables(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createCubesTableQuery);
            await pool.query(createCubeSensorsTableQuery);
            await pool.query(createCubeActuatorsTableQuery);

            resolve();
        } catch(err) {
            reject(err);
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

            resolve(cubes);
        } catch(err) {
            reject(err);
        }
    });
}

export function getCubeWithId(cubeId: string): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
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

            let actuators: Array<string> = await getCubeActuators(cubeId);
            cube.actuators = actuators;

            resolve(cube);
        } catch(err) {
            reject(err);
        };
    });
}

async function getCubeSensors(cubeId: string): Promise<Array<Sensor>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
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

            resolve(sensors)
        } catch(err) {
            reject(err);
        }
    });
}

async function getCubeActuators(cubeId: string): Promise<Array<string>> {
    return new Promise(async (resolve, reject) => {
        //Check cubeId
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
        }
        
        try {
            let actuators: Array<string> = [];
            let res: QueryResult = await pool.query(getCubeActuatorsWithIdQuery, [cubeId]);

            res.rows.forEach((value) => {
                actuators.push(value.actuator_type.trim());
            })

            resolve(actuators)
        } catch(err) {
            reject(err);
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

    //Get own ip address
    let serverIP: string = ip.address();
    //Generate random id for cube
    let id: string = uuidv4();

    let data = {
        'adress': serverIP,
        'uuid': id,
        'location': location
    }

    //Send config data to cube
    let response: AxiosResponse = await axios.post("http://"+targetIP, data)
    //Get cube sensors and actuators
    let sensors: Array<Sensor> = response.data['sensors'];
    let actuators: Array<string> = response.data['actuators']; 

    //Persist cube
    return persistCube(id, targetIP, location, sensors, actuators);
}

function persistCube(cubeId: string, ip: string, location: string, sensors: Array<Sensor>, actuators: Array<string>): Promise<void> {
    return new Promise(async (resolve, reject) => {
        //Check input
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
        }
        if (ip === undefined || !ip.trim()) {
            return reject("ip is undefined or empty");
        }
        if (location === undefined || !location.trim()) {
            return reject("location is undefined or empty");
        }
        if (sensors === undefined || sensors.length == 0) {
            return reject("sensors array is undefined or empty");
        }
        if (actuators === undefined || actuators.length == 0) {
            return reject("actuators array is undefined or empty");
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
            actuators.forEach(async (value: string) => {
                await client.query(addCubeActuatorsQuery, [cubeId, value])
                            .catch((err: Error) => {
                                reject(err);
                            });
            });

            //Subscribe to cube topic
            await subscribeCubeMQTTTopic(cubeId, 2);

            resolve();
        } catch(err) {
            reject(err);
        };
    });
}

export function updateCubeWithId(cubeId: string, variables: CubeVariables): Promise<Cube> {
    return new Promise(async (resolve, reject) => {
        //Check input
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
        }
        if (variables.location === undefined || !variables.location.trim()) {
            return reject("location is undefined or empty");
        }
        if (variables.sensors === undefined || variables.sensors.length == 0) {
            return reject("sensors array is undefined or empty");
        }
        if (variables.actuators === undefined || variables.actuators.length == 0) {
            return reject("actuators array is undefined or empty");
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
                //Check if sensor exists for this cube
                if (!old_sensor_types.includes(sensor.type)) {
                    throw(new Error("sensor_type does not exist on this cube"));
                } 

                //Update scan interval, if it was changed
                let sensors_index = old_sensors.findIndex(findSensorIndex,sensor);
                if (old_sensors[sensors_index].scanInterval != sensor.scanInterval) {
                    //Persist to database
                    await pool.query(updateCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval]);
                    //Send to cube
                    let data = getCubeSensorEndpointObject(new_sensors);
                    console.log(data);
                    await axios.post("http://"+cube.ip+"/sensor", data);
                }
            });

            resolve(getCubeWithId(cubeId));
        } catch(err) {
            reject(err);
        }
    });
}

export function deleteCubeWithId(cubeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        //Check cubeId
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (!uuidvalidate(cubeId)) {
            return reject("cubeId is not a valid uuid");
        }

        try {
            pool.query(deleteCubeWithIdQuery, [cubeId]);

            resolve();
        } catch(err) {
            reject(err);
        };
    });
}