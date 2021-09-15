import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import bcrypt from "bcrypt";
import { v5 as uuidv5 } from "uuid";
import { pool } from "..";
import { User } from "../types";

//User table
const createUsersTableQuery: string = "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name CHAR(64) UNIQUE NOT NULL, password CHAR(32) NOT NULL)";
const getUserWithIdQuery: string = 'SELECT * FROM users WHERE id=$1';
const getUserWithUsernameQuery: string = 'SELECT * FROM users WHERE name=$1';
const addUserQuery: string = "INSERT INTO users (id, name, password) VALUES ($1, $2, $3)";
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

function getUserById(id: string): Promise<null | User> {
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

async function checkPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
}

function addUser(name: string, password: string): Promise<void> {
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
    })
}

//TODO: Add utils to update, remove users