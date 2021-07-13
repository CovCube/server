import {PoolClient, QueryResult} from 'pg';
import {pool} from "../index";

const cubes_table: string = "CREATE TABLE IF NOT EXISTS cubes (cube_id UUID NOT NULL, location CHAR(255) NOT NULL, sensors CHAR(5)[], actuators CHAR(5)[], PRIMARY KEY (cube_id))";
const sensor_data_table: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL UNIQUE NOT NULL,sensor_type CHAR(5) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, PRIMARY KEY (id), FOREIGN KEY(cube_id) REFERENCES cubes (cube_id))";
const cube_persist: string = "INSERT INTO cubes (cube_id, location, sensors, actuators) VALUES ($1, $2, $3, $4)"
const sensor_data_persist: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)"

export function setupDB(): void {
    pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(cubes_table)
                .then((res: QueryResult) => {
                    client
                        .query(sensor_data_table)
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

export function persistCube(cubeId: String, location: String, sensors: Array<String>, actuators: Array<String>): void {
    pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(cube_persist, [cubeId, location, sensors, actuators])
                .then((res: QueryResult) => {
                    client.release();
                })
                .catch((err: Error) => {
                    client.release();
                    console.log(err.stack);
                });
        });
}

export function persistSensorData(sensorType: String, cubeId: String, timestamp: string, data: String): void {
    pool
        .connect()
        .then((client: PoolClient) => {
            client
                .query(sensor_data_persist, [sensorType, cubeId, timestamp, data])
                .then((res: QueryResult) => {
                    client.release();
                })
                .catch((err: Error) => {
                    client.release();
                    console.log(err.stack);
                });
        });
}

export function getTimestamp(): string {
    let time = new Date();

    return `${time.getUTCFullYear()}-${time.getUTCMonth()}-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}-0`
}