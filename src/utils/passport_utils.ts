//type imports
import { BarebonesUser, User, Token } from "../types";
import { NextFunction, Request, Response } from "express";
//passport imports
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as HttpBearerStrategy } from "passport-http-bearer";
//other external imports
import bcrypt from "bcrypt";
//internal imports
import { createUserTable, getUserByUsername, getUserById } from "../model/user";
import { createTokensTable, getTokenByToken } from "../model/token";

export async function setupPassport():Promise<void> {

    //Use local strategy (username, password)
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

    //Use httpbearer strategy (token)
    passport.use(new HttpBearerStrategy((token, done) => {
        getTokenByToken(token)
            .then(async (tokenObj: null | Token) => {
                //Check if token object returned
                if (!tokenObj) {
                    return done(null, false, {message: 'Token existiert nicht', scope: 'all'});
                }

                //return tokenObj if all is correct
                return done(null, tokenObj);
            })
            .catch((err: Error) => {
                return done(err);
            });

    }));

    //Get id from user
    passport.serializeUser((user: BarebonesUser, done) => {
        done(null, user.id);
    });

    //Get user from id
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

export async function checkPassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
}