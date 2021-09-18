//type imports
import { Cube, Sensor } from "../types";

export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}

export function cleanSensorsArray(sensors: Array<Sensor>): Array<string> {
    let cleanSensors: Array<string> = [];

    sensors.forEach(sensor => {
        cleanSensors.push(sensor.type);
    });

    return cleanSensors;
}