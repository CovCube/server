import express, { Router, Request, Response } from "express";
import passport from "passport";

export var router: Router = express.Router();

router.get('/login', (req: Request, res:Response) => {
    //TODO: Add css to template
    res.render('login');
});

router.post('/login', 
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    }
));