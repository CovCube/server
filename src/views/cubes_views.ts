//type imports
import { Router, Request, Response } from "express";
import { Cube, CubeDetailDataObject, Sensor } from "../types";
//express imports
import express from "express";
//internal imports
import { addCube, getCubes, getCubeWithId, updateCubeWithId } from "../model/cube";
import { getSensorTypes } from "../model/sensor";
import { getActuatorTypes } from "../model/actuator";
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

//Return cube detail view
function getCubeWithIdView (req: Request, res: Response): void {

    let cubeId: string = req.params['cubeId'];

    Promise.all([getCubeWithId(cubeId), getSensorTypes(), getActuatorTypes()])
        .then((values: Array<any>) => {

            let cube: Cube = values[0];
            let sensor_types: Array<string> = getSensorTypesArray(cube.sensors);
            let additional_sensors = values[1].filter((sensor: Sensor) => {
                return !sensor_types.includes(sensor.type)
            });
            let additional_actuators = values[2].filter((actuator: string) => {
                return !cube.actuators.includes(actuator)
            });
            
            let data: CubeDetailDataObject = {
                'title': 'Cube',
                'cube':  cube,
                'additional_sensors': additional_sensors,
                'additional_actuators': additional_actuators
            }

            res.render('cube-detail', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
}