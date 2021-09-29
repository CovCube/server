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