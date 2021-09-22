//type imports
import { Cube, Sensor } from "../types";

export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}

export function getSensorValuesFromString(sensors_string: string): Array<Sensor> {
    let string_array: Array<string> = sensors_string.split(',');

    string_array.forEach((sensor_string: string) => {
        sensor_string = sensor_string.substring(1);
        sensor_string = sensor_string.slice(0, -1);
        let sensor_string_array = sensor_string.split(',');
    });
}

export function cleanSensorsArray(sensors: Array<Sensor>): Array<Sensor> {
    let ret: Array<Sensor> = [];

    sensors.forEach(sensor => {
        sensor.type = sensor.type.trim();
        ret.push(sensor);
    });

    return ret;
}

export function makeSensorTypesArray(sensors: Array<Sensor>): Array<string> {
    let sensorTypes: Array<string> = [];

    sensors.forEach(sensor => {
        let type = sensor.type.trim();
        sensorTypes.push(type);
    });

    return sensorTypes;
}

export function getTimestamp(): string {
    let time: Date = new Date();

    return `${time.getUTCFullYear()}-${time.getUTCMonth()}-${time.getUTCDate()} ${time.getUTCHours()}:${time.getUTCMinutes()}:${time.getUTCSeconds()}-0`;
}