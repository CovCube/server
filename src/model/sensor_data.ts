//internal imports
import { pool } from "../index";
import { getTimestamp } from "../utils/general_utils";

//sensor data tables
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
//Persist sensor data
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

export function createSensorDataTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createSensorDataTableQuery);

            resolve();
        } catch(err) {
            reject(err);
        }
    });
}

export function persistSensorData(sensorType: string, cubeId: string, data: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            let timestamp = getTimestamp();
            await pool.query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data]);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}