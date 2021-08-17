import passport from "passport";
import {Strategy as LocalStrategy} from "passport-local";

export function setupPassport():void {
    passport.use(new LocalStrategy((username, password, done) => {
        //Return (null, user), (error) or (null, false, message) for incorrect credentials
        return done(null, "User");
    }));

    passport.serializeUser((user, done) => {
        //Return user id
        done(null, 1);
    });

    passport.deserializeUser((id, done) => {
        //Return user object
        done(null, "Test");
    });
}