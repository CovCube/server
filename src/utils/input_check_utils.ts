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