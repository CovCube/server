import { Client } from 'mqtt';
import {PoolClient, QueryResult} from 'pg';
import format from 'pg-format';
import {pool} from "../index";
import { Cube, CubeVariables, Sensor } from '../types';

//Base tables
const createSensorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_types (name CHAR(64) PRIMARY KEY, push_rate NUMERIC NOT NULL, active BOOLEAN NOT NULL)";
const createActuatorTypesTableQuery: string = "CREATE TABLE IF NOT EXISTS actuator_types (name CHAR(64) PRIMARY KEY, active BOOLEAN NOT NULL)";
const createCubesTableQuery: string = "CREATE TABLE IF NOT EXISTS cubes (id UUID PRIMARY KEY, location CHAR(255) NOT NULL)";
//Junction tables
const createCubeSensorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_sensors (cube_id UUID NOT NULL, sensor_type CHAR(64) NOT NULL, PRIMARY KEY (cube_id, sensor_type),FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (sensor_type) REFERENCES sensor_types (name) ON DELETE CASCADE)";
const createCubeActuatorsTableQuery: string = "CREATE TABLE IF NOT EXISTS cube_actuators (cube_id UUID NOT NULL, actuator_type CHAR(64) NOT NULL, PRIMARY KEY (cube_id, actuator_type), FOREIGN KEY (cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY (actuator_type) REFERENCES actuator_types (name) ON DELETE CASCADE)";
//sensor data tables
const createSensorDataTableQuery: string = "CREATE TABLE IF NOT EXISTS sensor_data (id SERIAL PRIMARY KEY, sensor_type CHAR(64) NOT NULL, cube_id UUID NOT NULL, timestamp TIMESTAMPTZ NOT NULL, data NUMERIC NOT NULL, FOREIGN KEY(cube_id) REFERENCES cubes (id) ON DELETE CASCADE, FOREIGN KEY(sensor_type) REFERENCES sensor_types(name) ON DELETE CASCADE)";

//Manage sensors
const getSensorTypesQuery: string = 'SELECT * FROM sensor_types';
const getSensorTypeWithNameQuery: string = 'SELECT * FROM sensor_types WHERE name= $1';
const addSensorTypeQuery: string = "INSERT INTO sensor_types (name, push_rate, active) VALUES ($1, $2, TRUE)";
const updateSensorTypePushRateQuery: string = "UPDATE sensor_types SET push_rate= $2 WHERE name= $1";
const deactivateSensorTypeQuery: string = "UPDATE sensor_types SET active= FALSE WHERE name= $1";
const getActuatorTypesQuery: string = 'SELECT * FROM actuator_types';
const addActuatorTypeQuery: string = "INSERT INTO actuator_types (name, active) VALUES ($1, TRUE)";
const deactivateActuatorTypeQuery: string = "UPDATE actuator_types SET active= FALSE WHERE name= $1";
//Manage cubes
const getCubesQuery: string = 'SELECT * FROM cubes';
const getCubeWithIdQuery: string = 'SELECT * FROM cubes WHERE id=$1';
const addCubeQuery: string = "INSERT INTO cubes (id, location) VALUES ($1, $2)";
const updateCubeWithIdQuery: string = 'UPDATE cubes SET %I=%L WHERE id=%L';
const deleteCubeWithIdQuery: string = 'DELETE FROM cubes WHERE id=$1';
//Manage cube sensors/actuators
const getCubeSensorsWithIdQuery: string = 'SELECT * FROM cube_sensors WHERE cube_id=$1';
const addCubeSensorsQuery: string = "INSERT INTO cube_sensors (cube_id, sensor_type) VALUES ($1, $2)";
const getCubeActuatorsWithIdQuery: string = 'SELECT * FROM cube_actuators WHERE cube_id=$1';
const addCubeActuatorsQuery: string = "INSERT INTO cube_actuators (cube_id, actuator_type) VALUES ($1, $2)";
//Persist sensor data
const persistSensorDataQuery: string = "INSERT INTO sensor_data (sensor_type, cube_id, timestamp, data) VALUES ($1, $2, $3, $4)";

export function setupDB(): Promise<[void, void | QueryResult]> {

    let createSensorTypesTableRes: Promise<QueryResult> = pool.query(createSensorTypesTableQuery);
    let createActuatorTypesTableRes: Promise<QueryResult> = pool.query(createActuatorTypesTableQuery);
    let createCubesTableRes: Promise<QueryResult> = pool.query(createCubesTableQuery);

    //Wait for base table creation
    let junctionTableRes = Promise.all([createSensorTypesTableRes, createActuatorTypesTableRes, createCubesTableRes])
        .then(() => {
            //Create junction tables
            pool.query(createCubeSensorsTableQuery);
            pool.query(createCubeActuatorsTableQuery);
        }).catch((err) => {
            console.log(err.stack);
        });
            
    //Create sensor_data table, when cube table is created
    let sensorDataTableRes = createCubesTableRes
        .then(() => {
            return pool.query(createSensorDataTableQuery);
        }).catch((err) => {
            console.log(err.stack);
        });

    return Promise.all([junctionTableRes, sensorDataTableRes]);
}

export function getSensorTypes(): Promise<Array<Sensor>>  {
    return new Promise((resolve, reject) => {
        pool.query(getSensorTypesQuery)
            .then((res) => {
                let sensor_types: Array<Sensor> = [];

                res.rows.forEach((value) => {
                    sensor_types.push({
                        name: value.name.trim(),
                        push_rate: parseInt(value.push_rate)
                    })
                })

                resolve(sensor_types);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function addSensorType(sensor_type: string, push_rate: number): Promise<void>  {
    return new Promise((resolve, reject) => {
        pool.query(addSensorTypeQuery, [sensor_type, push_rate])
            .then(() => {
                resolve()
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function updateSensorTypePushRate(sensor_type: string, push_rate: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await pool.query(getSensorTypeWithNameQuery, [sensor_type])
                    .catch((err: Error) => reject(new Error("no sensor type with specified name found")));

        pool.query(updateSensorTypePushRateQuery, [sensor_type, push_rate])
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

export function persistCube(cubeId: string, location: string, sensors: Array<string>, actuators: Array<string>): Promise<void> {
    return new Promise((resolve, reject) => {

        pool.connect()
            .then(async (client: PoolClient) => {
                await client.query(addCubeQuery, [cubeId, location]);

                return client;
            })
            .then((client: PoolClient) => {
                sensors.forEach(async (value: string) => {
                    await client.query(addCubeSensorsQuery, [cubeId, value])
                                .catch((err: Error) => {
                                    reject(err);
                                });
                })
                
                return client;
            })
            .then(async (client: PoolClient) => {
                actuators.forEach(async (value: string) => {
                    await client.query(addCubeActuatorsQuery, [cubeId, value])
                                .catch((err: Error) => {
                                    reject(err);
                                });
            })

            resolve()
            })
            .catch((err: Error) => {
                reject(err);
            })
    })
}

export function persistSensorData(sensorType: string, cubeId: string, timestamp: string, data: string): Promise<void | QueryResult> {
    return pool.query(persistSensorDataQuery, [sensorType, cubeId, timestamp, data])
}

export function getCubes(): Promise<Array<Cube>> {
    return new Promise((resolve, reject) => {
        pool
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
                reject(err);
            });
    });
}

async function getCubeSensors(cubeId: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        let sensors: Array<string> = [];

        pool.query(getCubeSensorsWithIdQuery, [cubeId])
            .then((res) => {
                res.rows.forEach((value) => {
                    sensors.push(value.sensor_type.trim());
                })

                resolve(sensors)
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

async function getCubeActuators(cubeId: string): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
        let actuators: Array<string> = [];

        pool.query(getCubeActuatorsWithIdQuery, [cubeId])
            .then((res) => {
                res.rows.forEach((value) => {
                    actuators.push(value.actuator_type.trim());
                })

                resolve(actuators)
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getCubeWithId(cubeId: string): Promise<Cube> {
    return new Promise((resolve, reject) => {
        let cube: Cube;

        pool
            .query(getCubeWithIdQuery, [cubeId])
            .then((res: QueryResult) => {

                if (res.rows.length == 0) {
                    reject(new Error("no cube with specified id found"));
                }

                cube= res.rows[0];
                cube.location = cube.location.trim();

                return;
            })
            .then(() => {
                return getCubeSensors(cubeId);
            })
            .then((sensors: Array<string>) => {
                cube.sensors = sensors;
            })
            .then(() => {
                return getCubeActuators(cubeId);
            })
            .then((actuators: Array<string>) => {
                cube.actuators = actuators;
            })
            .then (() => {
                resolve(cube);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function updateCubeWithId(cubeId: string, variables: CubeVariables): Promise<Cube> {
    return new Promise(async (resolve, reject) => {

        await pool.query(getCubeWithIdQuery, [cubeId])
                    .catch((err: Error) => reject(new Error("no cube with specified id found")));

        let cube_sensors: Array<string>;
        let cube_actuators: Array<string>;

        pool.query(format(updateCubeWithIdQuery, 'location', variables.location, cubeId))
            .then(() => {
                return Promise.all([getCubeSensors(cubeId), getCubeActuators(cubeId)]);
            })
            .then((values) => {
                cube_sensors = values[0];
                cube_actuators = values[1];
            })
            .then(() => {
                let sensors = variables.sensors.split(',');

                sensors.forEach(async (value) => {
                    if (!cube_sensors.includes(value)) {
                        await pool.query(addCubeSensorsQuery, [cubeId, value]);
                    }
                })
            })
            .then(() => {
                let actuators = variables.actuators.split(',');

                actuators.forEach(async (value) => {
                    if (!cube_actuators.includes(value)) {
                        await pool.query(addCubeActuatorsQuery, [cubeId, value]);
                    }
                })
            })
            .then(() => {
                resolve(getCubeWithId(cubeId));
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function deleteCubeWithId(cubeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
        pool
            .query(deleteCubeWithIdQuery, [cubeId])
            .then((res: QueryResult) => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getTimestamp(): string {
    let time: Date = new Date();

    return `${time.getUTCFullYear()}-${time.getUTCMonth()}-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}-0`;
}