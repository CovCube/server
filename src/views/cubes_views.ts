//type imports
import { Router, Request, Response } from "express";
import { Cube, CubeDetailDataObject, Sensor } from "../types";
//express imports
import express from "express";
//internal imports
import { addCube, deleteCubeWithId, getCubes, getCubeWithId, updateCubeWithId } from "../model/cube";
import { compareCubes, getSensorTypesArray } from "../utils/general_utils";
import { authenticateUser } from "../utils/passport_utils";

export var router: Router = express.Router();

router.use(authenticateUser);

//Get cubes
router.get('/',  (req: Request, res:Response) => {
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

//Add cube
router.post('/', (req: Request, res: Response) => {
    let targetIP: string = req.body['ip'];
    let location: string = req.body['location'];

    addCube(targetIP, location)
        .then(() => {
            res.redirect(303, '/cubes');
        })
        .catch((err: Error) => {
            console.log(err.stack);
            res.status(501).send("view error");
        });
})

//Get cube with cubeId
router.get('/:cubeId',  (req, res) => {

    getCubeWithIdView(req, res);
});

//Update cube with cubeId
router.post('/:cubeId',  async (req, res) => {

    let cubeId: string = req.params['cubeId'];
    let variables = req.body;

    await updateCubeWithId(cubeId, variables);
    
    getCubeWithIdView(req, res);
});

//Delete cube with cubeId
router.get('/delete/:cubeId',  async (req, res) => {

    let cubeId: string = req.params['cubeId'];

    await deleteCubeWithId(cubeId);
    
    res.redirect(303, '/cubes');
});

//Return cube detail view
function getCubeWithIdView (req: Request, res: Response): void {

    let cubeId: string = req.params['cubeId'];

    getCubeWithId(cubeId)
        .then((cube: Cube) => {
            
            let data: CubeDetailDataObject = {
                'title': 'Cube',
                'cube':  cube
            }

            res.render('cube-detail', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
}