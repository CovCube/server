//type imports
import { Cube, CubeVariables, Sensor } from '../types';
import { PoolClient, QueryResult } from 'pg';
import { AxiosResponse } from "axios";
//other external imports
import format from 'pg-format';
import ip from "ip";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
//internal imports
import { pool } from "../index";
import { cleanSensorsArray, getSensorArrayFromString } from "../utils/general_utils";
import { subscribeCubeMQTTTopic } from '../utils/mqtt_utils';

//Base tables
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, location CHAR(255) NOT NULL)";
//Junction tables
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, scan_interval number NOT NULL, PRIMARY KEY (cube_id, sensor_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (sensor_type) REFERENCES sensor_types (name) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (actuator_type) REFERENCES actuator_types (name) ON DELETE CASCADE)";

//Manage cubes
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const addCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
//Manage cube sensors/actuators
const getCubeSensorsWithIdQuery: string = 'SELECT * FROM cube_sensors WHERE cube_id=$1';
const addCubeSensorsQuery: string = "INSERT INTO cube_sensors (cube_id, sensor_type, scan_interval) VALUES ($1, $2, $3)";
const deleteCubeSensorsQuery: string = "DELETE FROM cube_sensors WHERE cube_id=$1 AND sensor_type=$2"
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type) VALUES ($1, $2)";
const deleteCubeActuatorsQuery: string = "DELETE FROM cube_actuators WHERE cube_id=$1 AND actuator_type=$2"

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
    return new Promise((resolve, reject) => {
        pool
            .query(getCubesQuery)
            .then((res: QueryResult) => {
                let cubes: Array<Cube> = [];

                res.rows.forEach((row) => {
                    let cube = row;
                    cube.location = row.location.trim();

                    cubes.push(cube);
                })

                resolve(cubes);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getCubeWithId(cubeId: string): Promise<Cube> {
    return new Promise(async (resolve, reject) => {

        try {

            let res: QueryResult = await pool.query(getCubeWithIdQuery, [cubeId]);

        if (res.rows.length == 0) {
            reject(new Error("no cube with specified id found"));
        }

        let cube: Cube = res.rows[0];
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
    return new Promise((resolve, reject) => {
        let sensors: Array<Sensor> = [];

        pool.query(getCubeSensorsWithIdQuery, [cubeId])
            .then((res) => {
                res.rows.forEach((sensor) => {
                    sensors.push({
                        type: sensor.sensor_type.trim(),
                        scanInterval: parseInt(sensor.scanInterval)
                    });
                })

                resolve(sensors)
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

async function getCubeActuators(cubeId: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        let actuators: Array<string> = [];

        pool.query(getCubeActuatorsWithIdQuery, [cubeId])
            .then((res) => {
                res.rows.forEach((value) => {
                    actuators.push(value.actuator_type.trim());
                })

                resolve(actuators)
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export async function addCube(targetIP: string, location: string): Promise<void> {
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
    return persistCube(id, location, sensors, actuators);
}

export function persistCube(cubeId: string, location: string, sensors: Array<Sensor>, actuators: Array<string>): Promise<void> {
    return new Promise(async (resolve, reject) => {

        try {
            //Get client
            let client = await pool.connect()

            //Add cube
            await client.query(addCubeQuery, [cubeId, location]);

            //Add sensors
            sensors.forEach(async (sensor: Sensor) => {
                await client.query(addCubeSensorsQuery, [cubeId, sensor.type, sensor.scanInterval])
                            .catch((err: Error) => {
                                reject(err);
                            });
            })

            //Add actuators
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

        //Get current cube config
        let current_cube: Cube = await pool.query(getCubeWithIdQuery, [cubeId])
                    .catch((err: Error) => reject(new Error("no cube with specified id found")));
        //Update cube location
        await pool.query(format(updateCubeWithIdQuery, 'location', variables.location, cubeId));

        let new_sensors: Array<Sensor> = getSensorArrayFromString(variables.sensors);
        let new_actuators: Array<string> = variables.actuators.split(',');

        cube_sensors.forEach(async (sensor: Sensor) => {
            let type = sensor.type.trim();
            //If sensor is empty, skip the rest
            //TODO: Check this?
            if (!sensor) return;

            //Add sensor if not already existent
            if (!cube_sensors.includes(value)) {
                await pool.query(addCubeSensorsQuery, [cubeId, value]);
            } else {
                //Remove sensor from array of existing sensors, to later remove the remaining sensors in the array
                let index = cube_sensors.indexOf(value);
                cube_sensors.splice(index, 1);
            }
        });

                //Remove sensors from cube, that aren't in the update
                cube_sensors.forEach(async (value) => {
                    await pool.query(deleteCubeSensorsQuery, [cubeId, value]);
                });
        
            .then(() => {
                let actuators = variables.actuators.split(',');

                actuators.forEach(async (value) => {
                    value = value.trim();
                    //If value is empty, skip the rest
                    if (!value) return;

                    //Add actuator if not already existent
                    if (!cube_actuators.includes(value)) {
                        await pool.query(addCubeActuatorsQuery, [cubeId, value]);
                    } else {
                        //Remove actuator from array of existing actuators, to later remove the remaining actuators in the array
                        let index = cube_actuators.indexOf(value);
                        cube_actuators.splice(index, 1);
                    }
                });

                //Remove actuators from cube, that aren't in the update
                cube_actuators.forEach(async (value) => {
                    await pool.query(deleteCubeActuatorsQuery, [cubeId, value]);
                });
            })
            .then(() => {
                resolve(getCubeWithId(cubeId));
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function deleteCubeWithId(cubeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool
            .query(deleteCubeWithIdQuery, [cubeId])
            .then((res: QueryResult) => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}