//type imports
import { Router, Request, Response } from "express";
import { Token } from "../types";
//express imports
import express from "express";
//internal imports
import { authenticateUser } from "../utils/passport_utils";
import { getTokens, getTokenByToken, deleteToken, addToken } from "../utils/db_token_utils";

export var router: Router = express.Router();

router.use(authenticateUser);

router.get('/', (req: Request, res: Response) => {
    getTokens()
        .then((tokens) => {
            res.render("tokens-list", {tokens: tokens});
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.post('/', (req: Request, res: Response) => {
    let owner: string = req.body['owner'];

    addToken(owner)
        .then(() => {
            res.redirect(303, '/tokens');
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.get('/delete/:token', async (req: Request, res: Response) => {

    let token: string = req.params['token'];
    let tokenObj: Token | null = await getTokenByToken(token);

    if(!tokenObj) {
        res.status(404).send("token does not exist");
    } else {
        await deleteToken(tokenObj)
                .catch((e: Error) => {
                    console.log(e.stack);
                    res.status(501).send("view error");
                });

        //getUsersList(req, res);
        res.redirect(303, "/tokens");
    }
});