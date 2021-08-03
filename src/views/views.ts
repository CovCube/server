import express, { Router, Request, Response } from "express";
import { getActuatorTypes, getCubes, getCubeWithId, getSensorTypes } from "../utils/db_utils";
import { Cube, CubeDetailDataObject, Sensor } from "../types";
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

    Promise.all([getCubeWithId(cubeId), getSensorTypes(), getActuatorTypes()])
        .then((values: Array<any>) => {

            let cube: Cube = values[0];
            let all_sensors = values[1].filter((sensor: Sensor) => {
                return !cube.sensors.includes(sensor.name.trim())
            });
            let all_actuators = values[2].filter((actuator: string) => {
                return !cube.actuators.includes(actuator.trim())
            });
            
            let data: CubeDetailDataObject = {
                'title': 'Cube',
                'cube':  cube,
                'all_sensors': all_sensors,
                'all_actuators': all_actuators
            }

            res.render('cube-detail', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("view error");
        });
});