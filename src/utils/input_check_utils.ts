//type imports
import { Sensor } from '../types';
//external imports
import { validate as uuidvalidate } from "uuid";

export function checkCubeId(cubeId: string): void {
    //Check cubeId
    if (cubeId === undefined) {
        throw(new Error("cubeId is undefined"));
    }
    if (!uuidvalidate(cubeId)) {
        throw(new Error("cubeId is not a valid uuid"));
    }
}

export function checkSensorArray(sensors: Array<Sensor>): void {
    if (sensors === undefined || sensors.length == 0) {
        throw(new Error("sensors array is undefined or empty"));
    }

    sensors.forEach((sensor: Sensor) => {
        //Check if sensor type is valid
        if (sensor.type === undefined || !sensor.type.trim()) {
            throw(new Error("sensor type is not valid"));
        }
        //Check if sensor scan_interval is valid
        if (!sensor.scanInterval || sensor.scanInterval <= 0) {
            throw(new Error ("sensor scan_interval is not valid."))
        }
    });
}

export function checkTokenValidity(token: string): void {
    //Check if token is defined
    if (token === undefined) {
        throw(new Error("token is undefined"));
    }
    //Check length
    if (token.length != 32) {
        throw(new Error("token has to have length of 32"));
    }

    //Create uuid from token
    let uuid: string = token.slice(0, 8) + "-" + token.slice(8, 12)
                        + "-" + token.slice(12, 16) + "-" + token.slice(16, 20)
                        + "-" + token.slice(20, 32);
    //check if valid uuid
    if (!uuidvalidate(uuid)) {
        throw(new Error("token structure is not valid"));
    }
}