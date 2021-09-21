//type imports
import { Router, Request, Response } from "express";
import { Cube, CubeVariables } from "../types";
//express imports
import express from "express";
//internal imports
import { deleteCubeWithId, getCubes, getCubeWithId, addCube, updateCubeWithId } from "../model/cube";

//Export the router
export var router: Router = express.Router();

//Get cubes
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

//Get cube with cubeId
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

//Add cube
router.post('/', function(req: Request, res: Response) {

    let targetIP: string = req.body['targetIP'];
    let location: string = req.body['location'];

    addCube(targetIP, location)
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

//Update cube with cubeId
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

//Delete cube with cubeId
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