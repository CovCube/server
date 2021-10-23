/** 
 * Module for general util methods.
 * 
 * @module
 */

//type imports
import { Cube, Sensor } from "../types";


/**
 * Compares two Cubes by their location.
 * 
 * @param a first Cube
 * @param b second Cube
 * 
 * @returns negative number (if a occurs before b), positive number (if a occurs after b), 0 (if a and b are equivalent)
 */
export function compareCubes(a: Cube, b:Cube):number {
    return a.location.localeCompare(b.location, undefined, {numeric: true});
}

/**
 * Extracts the sensor types from an array of [Sensors]{@link types.Sensor}.
 * Can contain duplicates of a sensor type.
 * 
 * @param sensors an array of [Sensors]{@link types.Sensor}
 * 
 * @return an array of sensor types
 */
export function getSensorTypesArray(sensors: Array<Sensor>): Array<string> {
    let sensorTypes: Array<string> = [];

    sensors.forEach(sensor => {
        let type = sensor.type.trim();
        sensorTypes.push(type);
    });

    return sensorTypes;
}

/**
 * Checks if two sensor types are equal.
 * 
 * @param sensor the [Sensor]{@link types.Sensor} to be checked against
 */
export function compareSensorTypes(sensor: Sensor): boolean {
    //this is the sensor whose index in the array is supposed to be found
    //@ts-ignore
    return sensor.type == this.type;
}

/**
 * Creates an object of sensor types.
 * 
 * @param sensors the [Sensors]{@link types.Sensor} to be tranformed
 * 
 * @returns Object with sensor types as keys and the scan interval of that
 * sensor type as value.
 */
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