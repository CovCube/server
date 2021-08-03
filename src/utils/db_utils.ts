import { Client } from 'mqtt';
import {PoolClient, QueryResult} from 'pg';
import format from 'pg-format';
import {pool} from "../index";
import { Cube, CubeVariables } from '../types';

const createSensorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_types (name CHAR(64) NOT NULL, push_rate NUMERIC NOT NULL, active BOOLEAN NOT NULL, PRIMARY KEY (name))";
const createActuatorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS actuator_types (name CHAR(64) NOT NULL, active BOOLEAN NOT NULL, PRIMARY KEY (name))";
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID NOT NULL, location CHAR(255) NOT NULL, PRIMARY KEY (id))";
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (id SERIAL UNIQUE NOT NULL, cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (sensor_type) REFERENCES sensor_types (name) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (id SERIAL UNIQUE NOT NULL, cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (actuator_type) REFERENCES actuator_types (name) ON DELETE CASCADE)";
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL UNIQUE NOT NULL,sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, PRIMARY KEY (id), FOREIGN KEY(cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY(sensor_type) REFERENCES sensor_types(name) ON DELETE CASCADE)";

const persistCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
const persistCubeSensorsQuery: string = "INSERT INTO cube_sensors (cube_id, sensor_type) VALUES ($1, $2)";
const persistCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type) VALUES ($1, $2)";
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const getCubeSensorsWithIdQuery: string = 'SELECT * FROM cube_sensors WHERE cube_id=$1';
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';

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

export function persistCube(cubeId: string, location: string, sensors: Array<string>, actuators: Array<string>): Promise<void> {
    return new Promise((resolve, reject) => {

        pool.connect()
            .then(async (client: PoolClient) => {
                await client.query(persistCubeQuery, [cubeId, location]);

                return client;
            })
            .then((client: PoolClient) => {
                sensors.forEach(async (value: string) => {
                    await client.query(persistCubeSensorsQuery, [cubeId, value])
                })
                
                return client;
            })
            .then(async (client: PoolClient) => {
                actuators.forEach(async (value: string) => {
                    await client.query(persistCubeActuatorsQuery, [cubeId, value])
            })

            resolve()
            })
            .catch((err: Error) => {
                reject(err);
            })
    })
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
        let cube: Cube;

        pool
            .query(getCubeWithIdQuery, [cubeId])
            .then((res: QueryResult) => {

                if (res.rows.length == 0) {
                    reject(new Error("no cube with specified id found"));
                }

                cube= res.rows[0];
                cube.location = cube.location.trim();

                return;
            })
            .then(() => {
                return pool.query(getCubeSensorsWithIdQuery, [cubeId]);
            })
            .then((res: QueryResult) => {
                cube.sensors = [];

                res.rows.forEach((value) => {
                    cube.sensors.push(value.sensor_type.trim());
                })

                return;
            })
            .then(() => {
                return pool.query(getCubeActuatorsWithIdQuery, [cubeId]);
            })
            .then((res: QueryResult) => {
                cube.actuators = [];

                res.rows.forEach((value) => {
                    cube.actuators.push(value.actuator_type.trim());
                })

                return;
            })
            .then (() => {
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