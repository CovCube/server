//type imports
import { Router, Request, Response, response } from "express";
import { AxiosResponse } from "axios";
import { Cube, CubeDetailDataObject, Sensor } from "../types";
//express imports
import express from "express";
//other external imports
import ip from "ip";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
//internal imports
import { addCube, getActuatorTypes, getCubes, getCubeWithId, getSensorTypes, updateCubeWithId } from "../utils/db_cube_utils";
import { cleanSensorsArray, compareCubes } from "../utils/general_utils";
import { authenticateUser } from "../utils/passport_utils";

export var router: Router = express.Router();

router.use(authenticateUser);

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

router.post('/', (req: Request, res: Response) => {
    let targetIP: string = req.body['ip'];
    let location: string = req.body['location'];

    let serverIP: string = ip.address();
    let id: string = uuidv4();

    let data = {
        'adress': serverIP,
        'uuid': id,
        'location': location
    }

    axios.post("http://"+targetIP, data)
        .then((response: AxiosResponse) => {
            let sensors = cleanSensorsArray(response.data['sensors']);
            let actuators = response.data['actuators'];

            return addCube(id, location, sensors, actuators);
        })
        .then(() => {
            res.redirect(303, '/cubes');
        })
        .catch((err: Error) => {
            console.log(err.stack);
            res.status(501).send("view error");
        });
})

router.get('/:cubeId',  (req, res) => {

    getCubeWithIdView(req, res);
});

router.post('/:cubeId',  async (req, res) => {

    let cubeId: string = req.params['cubeId'];
    let variables = req.body;

    await updateCubeWithId(cubeId, variables);
    
    getCubeWithIdView(req, res);
});

function getCubeWithIdView (req: Request, res: Response): void {

    let cubeId: string = req.params['cubeId'];

    Promise.all([getCubeWithId(cubeId), getSensorTypes(), getActuatorTypes()])
        .then((values: Array<any>) => {

            let cube: Cube = values[0];
            let additional_sensors = values[1].filter((sensor: Sensor) => {
                return !cube.sensors.includes(sensor.type.trim())
            });
            let additional_actuators = values[2].filter((actuator: string) => {
                return !cube.actuators.includes(actuator.trim())
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