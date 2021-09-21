//internal imports
import { pool } from "../index";

//Base tables
const createActuatorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS actuator_types (name CHAR(64) PRIMARY KEY, active BOOLEAN NOT NULL)";
//Manage actuator
const getActuatorTypesQuery: string = 'SELECT * FROM actuator_types';
const addActuatorTypeQuery: string = "INSERT INTO actuator_types (name, active) VALUES ($1, TRUE)";
const deactivateActuatorTypeQuery: string = "UPDATE actuator_types SET active= FALSE WHERE name= $1";

export function createActuatorTypesTable(): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(createActuatorTypesTableQuery)
            .then(() => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getActuatorTypes(): Promise<Array<string>>  {
    return new Promise((resolve, reject) => {
        pool.query(getActuatorTypesQuery)
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

export function addActuatorType(actuator_type: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(addActuatorTypeQuery, [actuator_type])
            .then(() => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function deactivateActuatorType(actuator_type: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(deactivateActuatorTypeQuery, [actuator_type])
            .then(() => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}