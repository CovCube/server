import express, { Router, Request, Response } from "express";
import { getCubes } from "../utils/db_utils";
import { Cube } from "../types";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req: Request, res: Response) {
    getCubes()
        .then((cubes: Array<Cube>) => {
            res.status(200).send({
                cubes: cubes
            });
        })
        .catch ((e: Error) => {
            res.status(501).send("Database error.");
        });
});

router.post('/', function(req: Request, res: Response) {
    res.send(200);
});

router.get('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});

router.put('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});

router.delete('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});