import express, { Router, Request, Response } from "express";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req: Request, res: Response) {
    res.send(200);
});