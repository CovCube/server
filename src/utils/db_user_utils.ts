//type imports
import { User } from "../types";
import { QueryResult } from "pg";
//other external imports
import bcrypt from "bcrypt";
import { v5 as uuidv5 } from "uuid";
//internal imports
import { pool } from "..";

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
    return new Promise((resolve, reject) => {
        pool.query(getUsersQuery)
            .then((res: QueryResult) => {
                let users: Array<User> = res.rows;

                users.forEach(user => {
                    user.name = user.name.trim()
                })

                resolve(users);
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}

export function getUserByUsername(username: string): Promise<null | User> {
    return new Promise(async (resolve, reject) => {
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

export function getUserById(id: string): Promise<null | User> {
    return new Promise(async (resolve, reject) => {
        try {
            let res = await pool.query(getUserWithIdQuery, [id]);

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

export function addUser(name: string, password: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        let id: string = uuidv5(name, uuidNamespace);
        let hashed_password: string = await bcrypt.hash(password, saltRounds);
        
        pool.query(addUserQuery, [id, name, hashed_password])
            .then(() => {
                resolve();
            })
            .catch((err: Error)=> {
                reject(err);
            });
    });
}

export function updateUser(inputUser: User): Promise<User> {
    return new Promise(async (resolve, reject) => {
        let oldUser: User | null = await getUserById(inputUser.id);

        if (!oldUser) {
            reject("User does not exist");
        } else {
            let updatedUser: User = oldUser;

            if (oldUser.name != inputUser.name) {
                updatedUser.name = inputUser.name;
            }
            
            let passwordCheck = await checkPassword(oldUser, inputUser.password);
            if (inputUser.password && !passwordCheck) {
                updatedUser.password = await bcrypt.hash(inputUser.password, saltRounds);
            }

            pool.query(updateUserQuery, [updatedUser.id, updatedUser.name, updatedUser.password])
                .then((res: QueryResult) => {
                    resolve(updatedUser);
                })
                .catch((err: Error) => {
                    reject(err);
                });
        }
    });
}

export function deleteUser(user: User): Promise<void> {
    return new Promise((resolve, reject) => {
        pool.query(deleteUserQuery, [user.id])
            .then((res: QueryResult) => {
                resolve();
            })
            .catch((err: Error) => {
                reject(err);
            });
    });
}