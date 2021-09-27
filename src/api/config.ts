//type imports
import { Router, Request, Response } from "express";
//express imports
import express from "express";
//internal imports
import { deactivateSensorType, getSensorTypes } from "../model/sensor";
import { deactivateActuatorType, getActuatorTypes } from "../model/actuator";

//Export the router
export var router: Router = express.Router();

router.get('/sensors', function(req: Request, res: Response) {
    getSensorTypes()
        .then((sensors: Array<string>) => {
            console.log(sensors);
            res.status(200).send(sensors);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
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