//type imports
import { Router, Request, Response } from "express";
import { User, ViewUser } from "../types";
//express imports
import express from "express";
//internal imports
import { authenticateUser } from "../utils/passport_utils";
import { getUsers, getUserById, deleteUser, updateUser, addUser } from "../model/user";

export var router: Router = express.Router();

router.use(authenticateUser);

router.get('/', (req: Request, res: Response) => {
    getUsers()
        .then((users) => {
            // Remove option for an user to delete themself
            // @ts-ignore
            if(req.session.passport.user) {
                users.forEach((user: ViewUser) => {
                    // @ts-ignore
                    if (user.id === req.session.passport.user) {
                        user.deleteable = false;
                    } else {
                        user.deleteable = true;
                    }
                });
            }

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