//type imports
import { QueryResult } from "pg";
//external imports
import format from 'pg-format';
//internal imports
import { pool } from "../index";
import { getTimestamp } from "../utils/general_utils";
import { checkCubeId, checkTimestampValidity } from "../utils/input_check_utils";

//sensor data tables
const createNumericDataTableQuery: string = "CREATE TABLE IF NOT EXISTS numeric_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
const createAlphanumericDataTableQuery: string = "CREATE TABLE IF NOT EXISTS alphanumeric_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data CHAR(64) NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes(id) ON DELETE CASCADE)";
//Get sensor data
const getNumericDataQuery: string = "SELECT * FROM numeric_data";
const getAlphanumericDataQuery: string = "SELECT * FROM alphanumeric_data";
//Persist sensor data
const persistNumericDataQuery: string = "INSERT INTO numeric_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";
const persistAlphanumericDataQuery: string = "INSERT INTO alphanumeric_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

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

export function getSensorData(sensorType?: string, cubeId?: string, start?: string, end?: string): Promise<Array<Object>> {
    return new Promise(async (resolve, reject) => {
        let selectors: string = "";
        let whereAdded: boolean = false;

        //Add parameters to selectors
        if (sensorType !== undefined) {
            //Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            //Add selectors statement
            selectors = format(selectors + " %I=%L","sensor_type", sensorType);
        }
        if (cubeId !== undefined) {
            //Check that the id is valid
            try {
                checkCubeId(cubeId);
            } catch(err) {
                return reject(err);
            }

            //Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            //Add selectors statement
            selectors = format(selectors + " %I=%L","cube_id", cubeId);
        }
        //TODO: Fix bug with timestamptz, where comparing against a timestamptz does not factor in the timezone
        if (start !== undefined) {
            //Check that the timestamp is valid
            try {
                checkTimestampValidity(start);
            } catch(err) {
                return reject("start does not have the correct format");
            }
            //Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            let startTimestamp: string = getTimestamp(new Date(start));
            //Add selectors statement
            selectors = format(selectors + " %I>=timestamp %L","timestamp", startTimestamp);
        }
        if (end !== undefined) {
            //Check that the timestamp is valid
            try {
                checkTimestampValidity(end);
            } catch(err) {
                return reject("end does not have the correct format");
            }
            //Add needed selectors
            if (!whereAdded) {
                selectors = selectors + " WHERE";
                whereAdded = true;
            } else {
                selectors = selectors + " AND";
            }
            let endTimestamp: string = getTimestamp(new Date(end));
            //Add selectors statement
            selectors = format(selectors + " %I<=timestamp %L","timestamp", endTimestamp);
        }
        //Check that start and end are in correct order
        if (start !== undefined && end !== undefined) {
            let startDate: Date = new Date(start);
            let endDate: Date = new Date(end);
            if (startDate > endDate) {
                return reject("start date is after the end date");
            }
        }

        console.log(selectors);
        
        let res_rows;
        try {
            let numeric_res: QueryResult = await pool.query(getNumericDataQuery+selectors);
            let alphanumeric_res: QueryResult = await pool.query(getAlphanumericDataQuery+selectors);
            console.log(numeric_res.rows);
            console.log(alphanumeric_res.rows);
            res_rows = numeric_res.rows.concat(alphanumeric_res.rows);
        } catch(err) {
            return reject(err);
        }

        let sensor_data: Array<Object> = [];

        res_rows.forEach((row) => {

            if (typeof row.data == "string") {
                row.data = row.data.trim();
            }

            sensor_data.push({
                "sensorType": row.sensor_type.trim(),
                "cubeId": row.cube_id,
                "timestamp": row.timestamp,
                "data": row.data,
            });
        });

        return resolve(sensor_data);
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
            let timestamp = getTimestamp(new Date());

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