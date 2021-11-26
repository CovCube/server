/** 
 * Module for managing [Apps]{@link types.App}.
 * 
 * @module
 */

// Type imports
import { App } from "../types";
import { QueryResult } from "pg";
// External imports
import axios, { AxiosResponse } from "axios";
// Internal imports
import { pool, updateHelmetCSP } from "..";
import { checkAppName, checkAppAddress } from "../utils/input_check_utils";
import { addToken } from "./token";

// App table
const createAppsTableQuery: string = "CREATE TABLE IF NOT EXISTS apps (name CHAR(32) PRIMARY KEY, address VARCHAR, token CHAR(32))";
const getAppsQuery: string = 'SELECT * FROM apps';
const getAppByNameQuery: string = 'Select * FROM apps WHERE name=$1'
const addAppQuery: string = "INSERT INTO apps (name, address, token) VALUES ($1, $2, $3)";
const deleteAppQuery: string = "DELETE FROM apps WHERE name=$1";

// Hold global app list
var available: Array<App>;

/**
 * Creates the apps database
 * 
 * @returns 
 */
export function createAppsTable(): Promise<QueryResult<any>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(createAppsTableQuery);

            // Get existing apps & add them to global variable
            let apps: Array<App> = await getApps();
            apps.forEach((app: App) => {
                app.token = "";
            });
            available = apps;

            // Update Content Security policy
            updateHelmetCSP();

            return resolve(res);
        } catch(err) {
            return reject(err);
        }
    });
}

export function getAvailableApps(): Array<App> {
    return available;
}

/**
 * Gets all [Apps]{@link types.App}
 * 
 * @returns array of all [Apps]{@link types.App}
 */
export function getApps(): Promise<Array<App>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getAppsQuery);

            let apps: Array<App> = res.rows;

            apps.forEach((app: App) => {
                app.name = app.name.trim();
                app.address = app.address.trim();
            });

            return resolve(apps);
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Gets an [App]{@link types.App} with the specified name
 * 
 * @param name of the [App]{@link types.App}
 * @returns the [App]{@link types.App}
 */
export function getAppByName(name: string): Promise<App> {
    return new Promise(async (resolve, reject) => {
        // Check input
        try {
            checkAppName(name);
        } catch(err) {
            return reject(err);
        }

        try {
            let res = await pool.query(getAppByNameQuery, [name]);

            // If there is no app, return nothing
            if (!res.rows) {
                return reject("no app with this name found");
            }

            // Return app
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Adds an [App]{@link types.App} and exchanges access [tokens]{@link types.Token} for each other
 * 
 * @param name of the [App]{@link types.App}
 * @param address network address of the [App]{@link types.App}
 * @returns the [App]{@link types.App}
 */
export function addApp(name: string, address: string): Promise<App> {
    return new Promise(async (resolve, reject) => {
        // Check input
        try {
            checkAppName(name);
            checkAppAddress(address);
        } catch (err) {
            return reject(err);
        }

        try {
            let serverToken = await addToken("App_"+name);
            // Send access token to app and get one in return
            let response: AxiosResponse = await axios.post("http://"+address.trim(), {serverToken});
            let appToken = response.data["token"];

            let res: QueryResult = await pool.query(addAppQuery, [name, address, appToken]);

            // Add to available apps
            // token can be empty, because it is not necessary for the use case
            available.push({
                name: name.trim(),
                address: address.trim(),
                token: ""
            });

            // Update Content Security policy
            updateHelmetCSP();

            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Removes an app
 * 
 * @param name of the [App]{@link types.App}
 * @returns 
 */
export function deleteApp(name: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        // Check input
        try {
            checkAppName(name);
        } catch(err) {
            return reject(err);
        }
        
        try {
            await pool.query(deleteAppQuery, [name]);

            // Update Content Security policy
            updateHelmetCSP();

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}