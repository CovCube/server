/**
 * Module for util methods for checking method input.
 * 
 * @module
 */

//type imports
import { Sensor } from '../types';
//external imports
import { validate as uuidvalidate } from "uuid";

// Constants
const URL_REGEX: RegExp = /^[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/

/**
 * Check validity of the id of a [Cube]{@link types.Cube}
 * 
 * Can not be undefined\
 * Has to be a valid UUID
 * 
 * @param cubeId the id of a [Cube]{@link types.Cube}
 */
export function checkCubeId(cubeId: string | undefined): void {
    //Check cubeId
    if (cubeId === undefined) {
        throw(new Error("cubeId is undefined"));
    }
    if (!uuidvalidate(cubeId)) {
        throw(new Error("cubeId is not a valid uuid"));
    }
}

/**
 * Check validity of the [Sensors]{@link types.Sensor} of a [Cube]{@link types.Cube}
 * 
 * Array can not be empty of undefined\
 * Each [Sensor]{@link types.Sensor} can not have empty or undefined sensor type or scanInterval
 * 
 * @param sensors the [Sensors]{@link types.Sensor} of a [Cube]{@link types.Cube}
 */
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

/**
 * Check validity of the name of an [App]{@link types.App}
 * 
 * @param name of an [App]{@link types.App}
 */
export function checkAppName(name: string): void {
    if (name === undefined || !name.trim()) {
        throw new Error("name is undefined or empty");
    }
}

export function checkAppAddress(address: string): void {
    if (address === undefined || !address.trim()) {
        throw new Error("address is undefined or empty");
    }

    if (!URL_REGEX.test(address)) {
        //throw new Error("address not a valid URL");
    }
}

/**
 * Check the validity of a [Tokens]{@link types.Token} token string
 * 
 * Can not be undefined\
 * Has to be of length 32 (36 - 4 dashes)\
 * Has to be a valid UUID if dashes are added back into it
 * 
 * @param token the [Tokens]{@link types.Token} token string to be checked
 */
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

/**
 * Check the validity of a user id of a [User]{@link types.User}
 * 
 * Can not be undefined or empty\
 * Has to be a valid UUID
 * 
 * @param userId the id of a [User]{@link types.User}
 */
export function checkUserIdValidity(userId: string): void {

    // Check if undefined or empty
    if (userId === undefined || !userId.trim()) {
        throw(new Error("id is undefined or empty"));
    }

    // Check if valid uuid
    if (!uuidvalidate(userId)) {
        throw(new Error("id is not a valid uuid"));
    }
}

/**
 * Check the validity of a password of a [User]{@link types.User}
 * 
 * Can not be undefined\
 * Might not be allowed to be empty (depending on canBeEmpty)
 * 
 * @param canBeEmpty says if the password can be empty (default: false)
 */
export function checkPasswordValidity(password: string, canBeEmpty: boolean = false): void {

    //Check if password is undefined
    if (password === undefined) {
        throw(new Error("password is undefined"));
    }
    //Check if password empty or only spaces
    if (!canBeEmpty && !password.trim()) {
        throw(new Error("password is empty or consists only of spaces"));
    }
}

/**
 * Check the validity of a timestamp
 * 
 * Has to be formatted according to [RFC2822]{@link https://datatracker.ietf.org/doc/html/rfc2822#page-14}
 * or [ISO8601]{@link https://www.iso.org/iso-8601-date-and-time-format.html}
 */
export function checkTimestampValidity(timestamp: string): void {
    let date = new Date(timestamp);
    
    if (date.toString() === "Invalid Date") {
        throw(new Error("The timestamp has an incorrect format"));
    }
}
