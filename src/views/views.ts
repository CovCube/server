import express, { Router, Request, Response } from "express";
import { getCubes } from "../utils/db_utils";
import { Cube } from "../types";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.get('/', (req, res) => {
    getCubes()
        .then((cubes: Array<Cube>) => {
            let data = {
                cubes: cubes,
            }

            res.render('index', data);
        })
        .catch ((e: Error) => {
            console.log(e.stack);
            res.status(501).send("database error");
        });
});