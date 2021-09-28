//type imports
import { User } from "../types";
import { QueryResult } from "pg";
//other external imports
import bcrypt from "bcrypt";
import { v5 as uuidv5, validate as uuidvalidate } from "uuid";
//internal imports
import { pool } from "..";
import { checkPassword } from "../utils/passport_utils";

//User table
const createUsersTableQuery: string = "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name CHAR(64) UNIQUE NOT NULL, password CHAR(32) NOT NULL)";
const getUsersQuery: string = 'SELECT * FROM users';
const getUserWithIdQuery: string = 'SELECT * FROM users WHERE id=$1';
const getUserWithUsernameQuery: string = 'SELECT * FROM users WHERE name=$1';
const addUserQuery: string = "INSERT INTO users (id, name, password) VALUES ($1, $2, $3)";
const updateUserQuery: string = "UPDATE users SET name=$2, password=$3 WHERE id=$1";
const deleteUserQuery: string = "DELETE FROM users WHERE id=$1";
//bcrypt
const saltRounds: number = parseInt(process.env.BCRYPTSALTROUNDS || "10");
//uuid
const uuidNamespace: string = process.env.UUIDNAMESPACE || "976eacb6-ce9b-4eda-9d44-55c942464a38";

export function createUserTable(): Promise<QueryResult<any>> {
    return pool.query(createUsersTableQuery);
}

export function getUsers(): Promise<Array<User>> {
    return new Promise(async (resolve, reject) => {
        try {
            let res: QueryResult = await pool.query(getUsersQuery);
            let users: Array<User> = res.rows;

            users.forEach(user => {
                user.name = user.name.trim()
            })

            resolve(users);
        } catch (err) {
            reject(err);
        }
    });
}

export function getUserByUsername(username: string): Promise<null | User> {
    return new Promise(async (resolve, reject) => {

        //Check username
        if (username === undefined || !username.trim()) {
            reject("username is undefined or empty");
        }

        try {
            let res = await pool.query(getUserWithUsernameQuery, [username]);

            //If there is no user, return nothing
            if (!res.rows) {
                resolve(null);
            }

            //Return user
            resolve(res.rows[0]);
        } catch(err) {
            reject(err);
        }
    });
}

export function getUserById(id: string): Promise<User> {
    return new Promise(async (resolve, reject) => {

        //check id
        if (id === undefined || !id.trim()) {
            reject("id is undefined or empty");
        }
        if (!uuidvalidate(id)) {
            reject("id is not a valid uuid");
        }

        try {
            let res = await pool.query(getUserWithIdQuery, [id]);

            //If there is no user, return nothing
            if (!res.rows) {
                reject("user does not exist");
            }

            //Return user
            resolve(res.rows[0]);
        } catch(err) {
            reject(err);
        }
    });
}

export function addUser(name: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {

        //check name
        if (name === undefined || !name.trim()) {
            reject("username is undefined or empty");
        }
        //check password
        if (password === undefined || !password.trim()) {
            reject("password is undefined or empty");
        }

        //Create id from the username
        let id: string = uuidv5(name, uuidNamespace);
        //Hash the password
        let hashed_password: string = await bcrypt.hash(password, saltRounds);
        
        try {
            await pool.query(addUserQuery, [id, name, hashed_password])

            resolve();
        } catch (err) {
            reject(err);
        };
    });
}

export function updateUser(inputUser: User): Promise<User> {
    return new Promise(async (resolve, reject) => {

        //Check input
        if (inputUser === undefined) {
            reject("inputUser is undefined");
        }
        if (inputUser.id === undefined || !inputUser.id.trim()) {
            reject("user id is undefined or empty");
        }
        if (inputUser.name === undefined || !inputUser.name.trim()) {
            reject("user name is undefined or empty");
        }
        if (inputUser.password === undefined || !inputUser.password.trim()) {
            reject("user password is undefined or empty");
        }

        try {
            //Get user with id from database
            let oldUser: User = await getUserById(inputUser.id);
            let updatedUser: User = oldUser;

            //Check if name has changed
            if (oldUser.name != inputUser.name) {
                updatedUser.name = inputUser.name;
            }

            //Check if password has changed
            let passwordCheck = await checkPassword(oldUser, inputUser.password);
            if (inputUser.password && !passwordCheck) {
                updatedUser.password = await bcrypt.hash(inputUser.password, saltRounds);
            }
            //Commit new user data
            await pool.query(updateUserQuery, [updatedUser.id, updatedUser.name, updatedUser.password])
            
            resolve(updatedUser);
        } catch (err) {
            reject(err);
        }
    });
}

export function deleteUser(user: User): Promise<void> {
    return new Promise(async (resolve, reject) => {

        //Check input
        if (user === undefined) {
            reject("inputUser is undefined");
        }
        if (user.id === undefined || !user.id.trim()) {
            reject("user id is undefined or empty");
        }

        try {
            await pool.query(deleteUserQuery, [user.id]);

            resolve();
        } catch (err) {
            reject(err);
        }
    });
}