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

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

export function persistSensorData(sensorType: string, cubeId: string, data: string): Promise<void> {
    return new Promise(async (resolve, reject) => {

        //Check parameters
        if (sensorType === undefined) {
            return reject("sensorType is undefined");
        }
        if (cubeId === undefined) {
            return reject("cubeId is undefined");
        }
        if (data === undefined) {
            return reject("data is undefined");
        }
        if (!data.trim()) {
            return reject("data is empty");
        }

        try {
            let timestamp = getTimestamp();
            await pool.query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data]);

            return resolve();
        } catch (err) {
            return reject(err);
        }
    });
}