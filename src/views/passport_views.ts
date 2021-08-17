import express, { Router, Request, Response } from "express";
import passport from "passport";

export var router: Router = express.Router();

router.get('/login', (req: Request, res:Response) => {
    res.render('login');
});

router.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    }
));