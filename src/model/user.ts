/** 
 * Module for managing [Users]{@link types.User}.
 * 
 * @module
 */

// Type imports
import { User } from "../types";
import { QueryResult } from "pg";
// External imports
import bcrypt from "bcrypt";
import { v5 as uuidv5 } from "uuid";
// Internal imports
import { pool } from "..";
import { comparePassword } from "../utils/passport_utils";
import { checkUserIdValidity, checkPasswordValidity } from "../utils/input_check_utils";

// User table
const createUsersTableQuery: string = "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name CHAR(64) UNIQUE NOT NULL, password CHAR(60) NOT NULL)";
const getUsersQuery: string = 'SELECT * FROM users';
const getUserWithIdQuery: string = 'SELECT * FROM users WHERE id=$1';
const getUserWithUsernameQuery: string = 'SELECT * FROM users WHERE name=$1';
const addUserQuery: string = "INSERT INTO users (id, name, password) VALUES ($1, $2, $3)";
const updateUserQuery: string = "UPDATE users SET name=$2, password=$3 WHERE id=$1";
const deleteUserQuery: string = "DELETE FROM users WHERE id=$1";
// bcrypt
const saltRounds: number = parseInt(process.env.BCRYPTSALTROUNDS || "10");
// uuid
const uuidNamespace: string = process.env.UUIDNAMESPACE || "976eacb6-ce9b-4eda-9d44-55c942464a38";

/**
 * Creates the necessary database tables for user management.
 * As well as an initial amdin user, if no other user is present.
 * 
 * @returns 
 */
export function createUserTable(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            await pool.query(createUsersTableQuery);
            let users: Array<User> = await getUsers();

            // If no user is present, add an admin user
            if (users.length == 0) {
                let admin_username: string = process.env.ADMINUSERNAME || "admin";
                let admin_password: string = process.env.ADMINPASSWORD || "admin";
                await addUser(admin_username, admin_password);
                console.warn("created admin user with:");
                console.log("    username: admin");
                console.log("    password: admin");
                console.warn("you should change the password of the admin user right away")
            }

            return resolve();
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Returns all [Users]{@link types.User}.
 * 
 * @returns promise of an array of [Users]{@link types.User}
 */
export function getUsers(): Promise<Array<User>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getUsersQuery);
            let users: Array<User> = res.rows;

            users.forEach(user => {
                user.name = user.name.trim();
            });

            return resolve(users);
        } catch (err) {
            return reject(err);
        }
    });
}

/**
 * Returns a [User]{@link types.User} with a specified username.
 * 
 * @param username the username of the user to be found
 * @returns a promise of the user
 */
export function getUserByUsername(username: string): Promise<User> {
    return new Promise(async (resolve, reject) => {

        // Check username
        if (username === undefined || !username.trim()) {
            return reject("username is undefined or empty");
        }

        try {
            let res = await pool.query(getUserWithUsernameQuery, [username]);

            // If there is no user, return nothing
            if (!res.rows) {
                return reject("no user found");
            }

            // Return user
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Returns a [User]{@link types.User} with a specified id.
 * 
 * @param id the id of the user to be found
 * @returns a promise of the user
 */
export function getUserById(id: string): Promise<User> {
    return new Promise(async (resolve, reject) => {
        
        // Check id
        try {
            checkUserIdValidity(id);
        } catch(e) {
            reject(e);
        }

        try {
            let res = await pool.query(getUserWithIdQuery, [id]);

            // If there is no user, return nothing
            if (!res.rows) {
                return reject("user does not exist");
            }

            // Return user
            return resolve(res.rows[0]);
        } catch(err) {
            return reject(err);
        }
    });
}

/**
 * Adds a [User]{@link types.User} to the database.
 * 
 * @param name username of the user
 * @param password password of the user
 * @returns 
 */

export function addUser(name: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {

        try {
            // Check name
            if (name === undefined || !name.trim()) {
                throw(new Error("username is undefined or empty"));
            }
            // Check password
            checkPasswordValidity(password);
        } catch(e) {
            reject(e);
        }
        
        // Create id from the username
        let id: string = uuidv5(name, uuidNamespace);
        // Hash the password
        let hashed_password: string = await bcrypt.hash(password, saltRounds);
        
        try {
            await pool.query(addUserQuery, [id, name, hashed_password]);

            return resolve();
        } catch (err) {
            return reject(err);
        };
    });
}

/**
 * Update an existing [User]{@link types.User}.
 * 
 * @param inputUser the user with the changed properties
 * @returns the updated user
 */
export function updateUser(inputUser: User): Promise<User> {
    return new Promise(async (resolve, reject) => {

        // Check input
        try {
            
            if (inputUser === undefined) {
                throw(new Error("inputUser is undefined"));
            }
            
            checkUserIdValidity(inputUser.id);
            
            if (inputUser.name === undefined || !inputUser.name.trim()) {
                throw(new Error("user name is undefined or empty"));
            }

            checkPasswordValidity(inputUser.password, true);
        } catch(e) {
            reject(e);
        }

        try {
            // Get user with id from database
            let oldUser: User = await getUserById(inputUser.id);
            let updatedUser: User = oldUser;

            // Check if name has changed
            if (oldUser.name != inputUser.name) {
                updatedUser.name = inputUser.name;
            }

            // Check if password has changed
            let passwordCheck = await comparePassword(oldUser, inputUser.password);
            if (!passwordCheck) {
                updatedUser.password = await bcrypt.hash(inputUser.password, saltRounds);
            }
            
            // Commit new user data
            await pool.query(updateUserQuery, [updatedUser.id, updatedUser.name, updatedUser.password]);
            
            return resolve(updatedUser);
        } catch (err) {
            return reject(err);
        }
    });
}

/**
 * Deletes an [User]{@link types.User} from the database.
 * 
 * @param user the user to be deleted
 * @returns 
 */
export function deleteUser(user: User): Promise<void> {
    return new Promise(async (resolve, reject) => {

        // Check input
        try {
            
            if (user === undefined) {
                throw(new Error("inputUser is undefined"));
            }
            
            checkUserIdValidity(user.id);
        } catch(e) {
            reject(e);
        }

        try {
            await pool.query(deleteUserQuery, [user.id]);

            return resolve();
        } catch (err) {
            return reject(err);
        }
    });
}