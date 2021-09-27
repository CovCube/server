//type imports
import { Router, Request, Response } from "express";
//express imports
import express from "express";
//passport imports
import passport from "passport";

export var router: Router = express.Router();

router.get('/login', (req: Request, res:Response) => {
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