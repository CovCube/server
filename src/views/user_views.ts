//type imports
import { Router, Request, Response } from "express";
import { User } from "../types";
//express imports
import express from "express";
//internal imports
import { authenticateUser } from "../utils/passport_utils";
import { getUsers, getUserById, deleteUser, updateUser, addUser } from "../model/db_user_utils";

export var router: Router = express.Router();

router.use(authenticateUser);

router.get('/', (req: Request, res: Response) => {
    getUsers()
        .then((users) => {
            res.render("users-list", {users: users});
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.post('/', (req: Request, res: Response) => {
    let name: string = req.body['name'];
    let password: string= req.body['password'];

    addUser(name, password)
        .then(() => {
            res.redirect(303, '/users');
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.post('/:user_id', (req: Request, res: Response) => {
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

router.get('/delete/:user_id', async (req: Request, res: Response) => {

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