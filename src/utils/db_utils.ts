import {PoolClient, QueryResult} from 'pg';
import format from 'pg-format';
import {pool} from "../index";
import { Cube, CubeVariables } from '../types';

const createSensorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_types (name CHAR(64) NOT NULL, push_rate NUMERIC NOT NULL, PRIMARY KEY (name))";
const createActuatorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS actuator_types (name CHAR(64) NOT NULL, PRIMARY KEY (name))";
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID NOT NULL, location CHAR(255) NOT NULL, PRIMARY KEY (id))";
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (id SERIAL UNIQUE NOT NULL, cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, FOREIGN KEY (cube_id) REFERENCES cubes (id), FOREIGN KEY (sensor_type) REFERENCES sensor_types (name))";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (id SERIAL UNIQUE NOT NULL, cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, FOREIGN KEY (cube_id) REFERENCES cubes (id), FOREIGN KEY (actuator_type) REFERENCES actuator_types (name))";
//TODO: Add foreign key for sensor_type to sensor_data table
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL UNIQUE NOT NULL,sensor_type CHAR(5) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, PRIMARY KEY (id), FOREIGN KEY(cube_id) REFERENCES cubes (id))";

const persistCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
//TODO: Add queries to link cubes with their sensors, actuators
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
//TODO: Add queries to get a cubes sensors, actuators
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
//TODO: Make sure cube references are deleted everywhere

export function setupDB(): Promise<[void, void | QueryResult]> {

    let createSensorTypesTableRes: Promise<QueryResult> = pool.query(createSensorTypesTableQuery);
    let createActuatorTypesTableRes: Promise<QueryResult> = pool.query(createActuatorTypesTableQuery);
    let createCubesTableRes: Promise<QueryResult> = pool.query(createCubesTableQuery);

    //Wait for base table creation
    let junctionTableRes = Promise.all([createSensorTypesTableRes, createActuatorTypesTableRes, createCubesTableRes])
        .then(() => {
            //Create junction tables
            pool.query(createCubeSensorsTableQuery);
            pool.query(createCubeActuatorsTableQuery);
        }).catch((err) => {
            console.log(err.stack);
        });
            
    //Create sensor_data table, when cube table is created
    let sensorDataTableRes = createCubesTableRes
        .then(() => {
            return pool.query(createSensorDataTableQuery);
        }).catch((err) => {
            console.log(err.stack);
        });

    return Promise.all([junctionTableRes, sensorDataTableRes]);
}

export function persistCube(cubeId: string, location: string, sensors: Array<string>, actuators: Array<string>): Promise<void | QueryResult> {
    return pool.query(persistCubeQuery, [cubeId, location])
}

export function persistSensorData(sensorType: string, cubeId: string, timestamp: string, data: string): Promise<void | QueryResult> {
    return pool.query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data])
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
    return new Promise((resolve, reject) => {
        pool
            .query(getCubeWithIdQuery, [cubeId])
            .then((res: QueryResult) => {

                if (res.rows.length == 0) {
                    reject(new Error("no cube with specified id found"));
                }

                let cube: Cube = res.rows[0];
                cube.location = cube.location.trim();

                resolve(cube);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function updateCubeWithId(cubeId: string, variables: CubeVariables): Promise<Cube> {
    return new Promise((resolve, reject) => {
        pool
            .connect()
            .then((client: PoolClient) => {
                Object.keys(variables).forEach((key: string) => {
                    let query = format(updateCubeWithIdQuery, key, variables[key], cubeId);

                    client
                        .query(query)
                        .catch((err: Error) => {
                            client.release();
                            reject(err);
                        });
                });

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

export function getTimestamp(): string {
    let time: Date = new Date();

    return `${time.getUTCFullYear()}-${time.getUTCMonth()}-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}-0`;
}