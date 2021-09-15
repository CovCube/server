import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import bcrypt from "bcrypt";
import { v5 as uuidv5 } from "uuid";
import { pool } from "..";
import { User } from "../types";
import { QueryResult } from "pg";
import { NextFunction, Request, Response } from "express";

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

export async function setupPassport():Promise<void> {
    passport.use(new LocalStrategy((username, password, done) => {
        getUserByUsername(username)
            .then(async (user: null | User) => {
                //Check if user returned
                if (!user) {
                    return done(null, false, {message: 'Nutzer existiert nicht'});
                }
                //check if correct password is provided
                let passCheck = await checkPassword(user, password);
                if (!passCheck) {
                    return done(null, false, {message: 'Passwort ist inkorrekt'});
                }
                //return user if all is correct
                return done(null, user);
            })
            .catch((err: Error) => {
                return done(err);
            });
    }));

    await pool.query(createUsersTableQuery);

    passport.serializeUser((user, done) => {
        console.log(user);
        //Error is that Express.user has no id, but this is how the documentation shows it
        //@ts-ignore
        done(null, user.id);
    });

    passport.deserializeUser(async (id: string, done) => {

        getUserById(id)
            .then((user: null | User) => {
                if (!user) {
                    done("User does not exist", null);
                }

                done(null, user);
            })
            .catch((err: Error) => {
                done(err, null);
            });
    });
}

export function authenticateUser(req: Request, res: Response, next: NextFunction) {
    //@ts-ignore
    if (req.isAuthenticated()) {
        return next();
    }

    res.redirect(303, '/login');
}

async function checkPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
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

function getUserByUsername(username: string): Promise<null | User> {
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