import express, { Router, Request, Response } from "express";
import passport from "passport";
import { getUsers } from "../utils/passport_utils";

export var router: Router = express.Router();

router.get('/login', (req: Request, res:Response) => {
    //TODO: Add css to template
    res.render('login');
});

router.get('/logout', (req: Request, res:Response) => {
    req.logout();
    res.redirect('/login');
});

router.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
    }
));

router.get('/users', (req: Request, res: Response) => {
    getUsers()
        .then((users) => {
            console.log(users);
            res.render("users-list", {users: users});
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});