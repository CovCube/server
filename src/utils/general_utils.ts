//type imports
import { Cube, Sensor } from "../types";

export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}

export function getSensorArrayFromString(sensors_string: string): Array<Sensor> {
    let end;
    let sensors: Array<Sensor> = [];

    while (end != -1) {
        let index: number = sensors_string.indexOf('},');
        sensors.push(JSON.parse(sensors_string.substring(0, index+1)));
        sensors_string = sensors_string.slice(index+2);
        console.log(sensors);
        console.log(sensors_string);
    }

    return sensors;
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