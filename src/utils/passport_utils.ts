//type imports
import { User } from "../types";
import { NextFunction, Request, Response } from "express";
//passport imports
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
//other external imports
import bcrypt from "bcrypt";
//internal imports
import { createUserTable, getUserByUsername, getUserById } from "./user_db_utils";

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

    await createUserTable();

    passport.serializeUser((user, done) => {
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