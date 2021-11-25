//type imports
import e, { Router, Request, Response, NextFunction } from "express";
//express imports
import express from "express";
//passport imports
import passport from "passport";

export var router: Router = express.Router();

router.get('/login', (req: Request, res:Response) => {
    let redirect: any = req.query.redirect;

    if(redirect) {
        return res.render('login', {redirect: encodeURIComponent(redirect)});
    } else {
        return res.render('login');
    }
});

router.post('/login', (req: Request, res:Response, next: NextFunction) => {
    let redirect: string = req.body['redirect'];

    if (redirect === undefined) {
        redirect = '';
    }

    passport.authenticate('local', {
        successRedirect: decodeURIComponent(redirect),
    })(req, res, next);
});

router.get('/logout', (req: Request, res:Response) => {
    req.logout();
    res.redirect('/login');
});