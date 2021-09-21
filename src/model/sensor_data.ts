//type imports
import { QueryResult } from 'pg';
//internal imports
import { pool } from "../index";

//sensor data tables
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE, FOREIGN KEY(sensor_type) REFERENCES sensor_types(name) ON DELETE CASCADE)";
//Persist sensor data
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

export function createSensorDataTable(): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(createSensorDataTableQuery)
            .then(() => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function persistSensorData(sensorType: string, cubeId: string, timestamp: string, data: string): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
        pool.query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data])
            .then((res: QueryResult) => {
                resolve(res);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}