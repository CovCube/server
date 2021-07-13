import express, { Router, Request, Response } from "express";
import { deleteCubeWithId, getCubes, getCubeWithId, persistCube, updateCubeWithId } from "../utils/db_utils";
import { Cube, CubeVariables } from "../types";

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
            console.log(e.stack);
            res.status(501).send("Database error.");
        });
});

router.post('/', function(req: Request, res: Response) {
    let cubeId = req.body['cubeId'];
    let location = req.body['location'];
    let sensors = req.body['sensors'];
    let actuators= req.body['actuators'];


    persistCube(cubeId, location, sensors, actuators)
        .then(() => {
            res.sendStatus(201);
        })
        .catch ((e: Error) => {
            console.log(e.stack);

            switch (e.message) {
                case 'duplicate key value violates unique constraint "cubes_pkey"':
                    res.status(501).send("cubeId already exists.");
                    break;
                default:
                    res.status(501).send("Database error.");
            }
        });
});

router.get('/:cubeId', function(req: Request, res: Response) {

    let cubeId = req.params['cubeId'];

    getCubeWithId(cubeId)
        .then((cube: Cube) => {
            res.status(200).send(cube);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("Database error.");
        });
});

router.put('/:cubeId', function(req: Request, res: Response) {

    let cubeId: string = req.params['cubeId'];
    let variables: CubeVariables = req.body;
    console.log(variables);

    updateCubeWithId(cubeId, variables)
        .then((cube: Cube) => {
            res.status(200).send(cube);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("Database error.");
        });
});

router.delete('/:cubeId', function(req: Request, res: Response) {
    
    let cubeId = req.params['cubeId'];

    deleteCubeWithId(cubeId)
        .then(() => {
            res.sendStatus(200);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("Database error.");
        });
});