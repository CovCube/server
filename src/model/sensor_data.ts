//internal imports
import { pool } from "../index";
import { getTimestamp } from "../utils/general_utils";
import { checkCubeId } from "../utils/input_check_utils";

//sensor data tables
const createNumericDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
const createAlphanumericDataTableQuery: string = "CREATE TABLE IF NOT EXISTS nfc_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data CHAR(64) NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
//Persist sensor data
const persistNumericDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";
const persistAlphanumericDataQuery: string = "INSERT INTO nfc_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

export function createSensorDataTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createNumericDataTableQuery);
            await pool.query(createAlphanumericDataTableQuery);

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
        checkCubeId(cubeId);
        if (data === undefined || !data.trim()) {
            return reject("data is undefined or empty");
        }

        try {
            let timestamp = getTimestamp();

            //Check which sensor type
            switch (sensorType) {
                //nfcID has alphanumeric data and has to be stored seperately
                case "nfcID":
                    await pool.query(persistAlphanumericDataQuery, [sensorType, cubeId, timestamp, data]);
                    break;
            
                default:
                    await pool.query(persistNumericDataQuery, [sensorType, cubeId, timestamp, data]);
                    break;
            }

            return resolve();
        } catch (err) {
            return reject(err);
        }
    });
}