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
        //TODO: Return user id
        done(null, 1);
    });

    passport.deserializeUser((id, done) => {

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

//TODO: Add utils to add, update, remove users