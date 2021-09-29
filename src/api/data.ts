//type imports
import { Router, Request, Response } from "express";
//express imports
import express from "express";
import { getSensorData } from "../model/sensor_data";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req: Request, res: Response) {
    getSensorData()
        .then((sensor_data) => {
            res.status(200).send({
                "sensor_data": sensor_data
            });
        })
        .catch((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});

router.post('/', function(req: Request, res: Response) {

    let sensorType: string | undefined = req.body["sensorType"] || undefined;
    let cubeId: string | undefined = req.body["cubeId"] || undefined;
    let start: string | undefined = req.body["start"] || undefined;
    let end: string | undefined = req.body["end"] || undefined;

    getSensorData(sensorType, cubeId, start, end)
        .then((sensor_data) => {
            res.status(200).send({
                "sensor_data": sensor_data
            });
        })
        .catch((e: Error) => {
            console.log(e);
            res.status(501).send("database error");
        });
});