import express, { Router, Request, Response } from "express";
import { getCubes, getCubeWithId } from "../utils/db_utils";
import { Cube } from "../types";
import { compareCubes } from "../utils/utils";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.get('/', (req: Request, res:Response) => {
    getCubes()
        .then((cubes: Array<Cube>) => {
            let data = {
                title: 'Cube Overview',
                cubes: cubes.sort(compareCubes),
            }

            res.render('cubes-list', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});

router.get('/cubes/:cubeId', (req, res) => {

    let cubeId: string = req.params['cubeId'];

    getCubeWithId(cubeId)
        .then((cube: Cube) => {
            let data = {
                title: 'Cube',
                cube: cube,
            }

            res.render('cube-detail', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});