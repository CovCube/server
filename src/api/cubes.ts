//type imports
import { Router, Request, Response } from "express";
import { Cube, CubeVariables } from "../types";
//express imports
import express from "express";
//internal imports
import { deleteCubeWithId, getCubes, getCubeWithId, addCube, updateCubeWithId } from "../utils/db_utils";

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
            res.status(501).send("database error");
        });
});

router.post('/', function(req: Request, res: Response) {

    let cubeId: string = req.body['id'];
    let location: string = req.body['location'];
    let sensors: Array<string> = req.body['sensors'];
    let actuators: Array<string> = req.body['actuators'];

    addCube(cubeId, location, sensors, actuators)
        .then(() => {
            res.sendStatus(201);
        })
        .catch ((e: Error) => {
            console.log(e.stack);

            switch (e.message) {
                case 'duplicate key value violates unique constraint "cubes_pkey"':
                    res.status(501).send("cubeId already exists");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.get('/:cubeId', function(req: Request, res: Response) {

    let cubeId: string = req.params['cubeId'];

    getCubeWithId(cubeId)
        .then((cube: Cube) => {
            res.status(200).send(cube);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            
            switch (e.message) {
                case 'no cube with specified id found':
                    res.status(404).send("cubeId not found");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.put('/:cubeId', function(req: Request, res: Response) {

    let cubeId: string = req.params['cubeId'];
    let variables: CubeVariables = req.body;

    updateCubeWithId(cubeId, variables)
        .then((cube: Cube) => {
            res.status(200).send(cube);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            
            switch (e.message) {
                case 'no cube with specified id found':
                    res.status(404).send("cubeId not found");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.delete('/:cubeId', function(req: Request, res: Response) {
    
    let cubeId: string = req.params['cubeId'];

    deleteCubeWithId(cubeId)
        .then(() => {
            res.sendStatus(200);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});