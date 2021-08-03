import express, { Router, Request, Response } from "express";
import { Sensor } from "../types";
import { addActuatorType, addSensorType, deactivateActuatorType, deactivateSensorType, getActuatorTypes, getSensorTypes, updateSensorTypePushRate } from "../utils/db_utils";

//Export the router
export var router: Router = express.Router();

router.get('/sensors', function(req: Request, res: Response) {
    getSensorTypes()
        .then((sensors: Array<Sensor>) => {
            res.status(200).send({
                sensors: sensors
            });
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});

router.post('/sensors', function(req: Request, res: Response) {

    let name: string = req.body['name'];
    let push_rate: number = parseInt(req.body['push_rate']);

    addSensorType(name, push_rate)
        .then(() => {
            res.sendStatus(201);
        })
        .catch ((e: Error) => {
            console.log(e.stack);

            switch (e.message) {
                case 'duplicate key value violates unique constraint "sensor_types_pkey"':
                    res.status(501).send("sensor name already exists");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.put('/sensors/:name', function(req: Request, res: Response) {

    let name: string = req.params['name'];
    let push_rate: number = parseInt(req.body['push_rate']);

    updateSensorTypePushRate(name, push_rate)
        .then(() => {
            res.status(200);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            
            switch (e.message) {
                case 'no sensor type with specified name found':
                    res.status(404).send("sensor type name not found");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.delete('/sensors/:name', function(req: Request, res: Response) {
    
    let name: string = req.params['name'];

    deactivateSensorType(name)
        .then(() => {
            res.sendStatus(200);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});

router.get('/actuators', function(req: Request, res: Response) {
    getActuatorTypes()
        .then((actuators: Array<string>) => {
            res.status(200).send({
                actuators: actuators
            });
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});

router.post('/actuators', function(req: Request, res: Response) {

    let name: string = req.body['name'];

    addActuatorType(name)
        .then(() => {
            res.sendStatus(201);
        })
        .catch ((e: Error) => {
            console.log(e.stack);

            switch (e.message) {
                case 'duplicate key value violates unique constraint "actuator_types_pkey"':
                    res.status(501).send("actuator name already exists");
                    break;
                default:
                    res.status(501).send("database error");
            }
        });
});

router.delete('/actuators/:name', function(req: Request, res: Response) {
    
    let name: string = req.params['name'];

    deactivateActuatorType(name)
        .then(() => {
            res.sendStatus(200);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});