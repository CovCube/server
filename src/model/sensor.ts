//type imports
import { Sensor } from '../types';
//internal imports
import { pool } from "../index";

//Base tables
const createSensorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_types (name CHAR(64) PRIMARY KEY, active BOOLEAN NOT NULL)";
//Manage sensor
const getSensorTypesQuery: string = 'SELECT * FROM sensor_types';
const addSensorTypeQuery: string = "INSERT INTO sensor_types (name, active) VALUES ($1, TRUE)";
const deactivateSensorTypeQuery: string = "UPDATE sensor_types SET active=FALSE WHERE name=$1";

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

export function getSensorTypes(): Promise<Array<string>>  {
    return new Promise((resolve, reject) => {
        pool.query(getSensorTypesQuery)
            .then((res) => {
                let sensor_types: Array<string> = [];

                res.rows.forEach((value) => {
                    sensor_types.push(value.name.trim());
                })

                resolve(sensor_types);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function addSensorType(sensor_type: string): Promise<void>  {
    return new Promise((resolve, reject) => {
        pool.query(addSensorTypeQuery, [sensor_type])
            .then(() => {
                resolve()
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

// export function updateSensorTypeScanInterval(sensor_type: string, scan_interval: number): Promise<void> {
//     return new Promise(async (resolve, reject) => {
//         await pool.query(getSensorTypeWithNameQuery, [sensor_type])
//                     .catch((err: Error) => reject(new Error("no sensor type with specified type found")));

//         pool.query(updateSensorTypeScanIntervalQuery, [sensor_type, scan_interval])
//             .then(() => {
//                 resolve()
//             })
//             .catch((err: Error) => {
//                 reject(err);
//             });
//     });
// }

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

export async function checkIfSensorTypesExist(sensors: Array<Sensor>) {
    let existing_sensors: Array<string> = await getSensorTypes();

    sensors.forEach(async (sensor: Sensor) => {
        let check = existing_sensors.includes(sensor.type);

        if (!check) {
            await addSensorType(sensor.type);
        }
    });
}