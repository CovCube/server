//type imports
import { Sensor } from '../types';
//internal imports
import { pool } from "../index";

//Base tables
const createSensorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_types (name CHAR(64) PRIMARY KEY, scan_interval NUMERIC NOT NULL, active BOOLEAN NOT NULL)";
//Manage sensor
const getSensorTypesQuery: string = 'SELECT * FROM sensor_types';
const getSensorTypeWithNameQuery: string = 'SELECT * FROM sensor_types WHERE name= $1';
const addSensorTypeQuery: string = "INSERT INTO sensor_types (name, scan_interval, active) VALUES ($1, $2, TRUE)";
const updateSensorTypePushRateQuery: string = "UPDATE sensor_types SET scan_interval= $2 WHERE name= $1";
const deactivateSensorTypeQuery: string = "UPDATE sensor_types SET active= FALSE WHERE name= $1";

export function createSensorTypesTable(): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(createSensorTypesTableQuery)
            .then(() => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getSensorTypes(): Promise<Array<Sensor>>  {
    return new Promise((resolve, reject) => {
        pool.query(getSensorTypesQuery)
            .then((res) => {
                let sensor_types: Array<Sensor> = [];

                res.rows.forEach((value) => {
                    sensor_types.push({
                        type: value.name.trim(),
                        scanInterval: parseInt(value.scan_interval)
                    })
                })

                resolve(sensor_types);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function addSensorType(sensor_type: string, scan_interval: number): Promise<void>  {
    return new Promise((resolve, reject) => {
        pool.query(addSensorTypeQuery, [sensor_type, scan_interval])
            .then(() => {
                resolve()
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function updateSensorTypePushRate(sensor_type: string, scan_interval: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await pool.query(getSensorTypeWithNameQuery, [sensor_type])
                    .catch((err: Error) => reject(new Error("no sensor type with specified name found")));

        pool.query(updateSensorTypePushRateQuery, [sensor_type, scan_interval])
            .then(() => {
                resolve()
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function deactivateSensorType(sensor_type: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(deactivateSensorTypeQuery, [sensor_type])
            .then(() => {
                resolve()
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}