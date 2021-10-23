//type imports
import { Cube, Sensor } from "../types";

export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}

export function getSensorTypesArray(sensors: Array<Sensor>): Array<string> {
    let sensorTypes: Array<string> = [];

    sensors.forEach(sensor => {
        let type = sensor.type.trim();
        sensorTypes.push(type);
    });

    return sensorTypes;
}

export function compareSensorTypes(sensor: Sensor): boolean {
    //this is the sensor whose index in the array is supposed to be found
    //@ts-ignore
    return sensor.type == this.type;
}

export function getCubeSensorEndpointObject(sensors: Array<Sensor>): Object {
    let object: Object = {};

    sensors.forEach((sensor) => {
        Object.defineProperty(object, sensor.type, {
            value: {
                "scanInterval": sensor.scanInterval,
            },
            writable: true,
            enumerable: true,
            configurable: true
        });
    });

    return object;
}