import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";
import { QueryResult } from "pg";
import { pool } from "..";
import { User } from "../types";

//User table
const createUsersTableQuery: string = "CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name CHAR(64) UNIQUE NOT NULL, password CHAR(32) NOT NULL)";
const getUserWithIdQuery: string = 'SELECT * FROM users WHERE id=$1';

export async function setupPassport():Promise<void> {
    passport.use(new LocalStrategy((username, password, done) => {
        //TODO: Return (null, user), (error) or (null, false, message) for incorrect credentials
        return done(null, "User");
    }));

    await pool.query(createUsersTableQuery);

    passport.serializeUser((user, done) => {
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

        pool.query(getUserWithIdQuery, [id])
            .then((res: QueryResult) => {
                let user: User = res.rows[0];
                done(null, user);
            })
            .catch((err: Error) => {
                done(err, null);
            });
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

//TODO: Add utils to add, update, remove users