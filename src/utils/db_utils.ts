import {PoolClient, QueryResult} from 'pg';
import {pool} from "../index";
import { Cube } from '../types';

const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (cube_id UUID NOT NULL, location CHAR(255) NOT NULL, sensors CHAR(5)[], actuators CHAR(5)[], PRIMARY KEY (cube_id))";
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL UNIQUE NOT NULL,sensor_type CHAR(5) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, PRIMARY KEY (id), FOREIGN KEY(cube_id) REFERENCES cubes (cube_id))";
const persistCubeQuery: string = "INSERT INTO cubes (cube_id, location, sensors, actuators) VALUES ($1, $2, $3, $4)";
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

const getCubesQuery: string = 'SELECT * FROM cubes';

export function setupDB(): void {
    pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(createCubesTableQuery)
                .then((res: QueryResult) => {
                    client
                        .query(createSensorDataTableQuery)
                        .then((res: QueryResult) => {
                            client.release();
                        })
                        .catch((err: Error) => {
                            client.release();
                            console.log(err.stack);
                        });
                })
                .catch((err: Error) => {
                    client.release();
                    console.log(err.stack);
                });
        });
}

export function persistCube(cubeId: string, location: string, sensors: Array<string>, actuators: Array<string>): Promise<void> {
    return new Promise((resolve, reject) => {
        pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(persistCubeQuery, [cubeId, location, sensors, actuators])
                .then((res: QueryResult) => {
                    client.release();
                    resolve();
                })
                .catch((err: Error) => {
                    client.release();
                    reject(err);
                });
        })
        .catch((err: Error) => {
            reject(err);
        });
    });
}

export function persistSensorData(sensorType: string, cubeId: string, timestamp: string, data: string): void {
    pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data])
                .then((res: QueryResult) => {
                    client.release();
                })
                .catch((err: Error) => {
                    client.release();
                    console.log(err.stack);
                });
        });
}

export function getCubes(): Promise<Array<Cube>> {
    return new Promise((resolve, reject) => {
        pool
        .connect()
        .then((client: PoolClient) => {
            client
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
                    client.release();
                    reject(err);
                });
        })
        .catch((err: Error) => {
            reject(err);
        });
    });
}

export function getTimestamp(): string {
    let time = new Date();

    return `${time.getUTCFullYear()}-${time.getUTCMonth()}-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}-0`
}