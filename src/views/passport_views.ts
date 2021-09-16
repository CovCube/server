//type imports
import { Router, Request, Response } from "express";
import { User } from "../types";
//express imports
import express from "express";
//passport imports
import passport from "passport";
//internal imports
import { authenticateUser } from "../utils/passport_utils";
import { getUsers, getUserById, deleteUser, updateUser } from "../utils/db_user_utils";

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

router.get('/users', authenticateUser, (req: Request, res: Response) => {
    getUsers()
        .then((users) => {
            res.render("users-list", {users: users});
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.post('/users/:user_id', authenticateUser, (req: Request, res: Response, next) => {
    let user: User = {
        id: req.params['user_id'],
        name: req.body['name'],
        password: req.body['password']
    }

    updateUser(user)
        .then(() => {
            res.redirect(303, '/users');
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.get('/users/delete/:user_id', authenticateUser, async (req: Request, res: Response) => {

    let userId: string = req.params['user_id'];
    let user: User | null = await getUserById(userId);

    if(!user) {
        res.status(404).send("user does not exist");
    } else {
        await deleteUser(user)
                .catch((e: Error) => {
                    console.log(e.stack);
                    res.status(501).send("view error");
                });

        //getUsersList(req, res);
        res.redirect(303, "/users");
    }
});