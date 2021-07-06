import express, { Router } from "express";
import path from 'path';
import {router as cubesRoute} from "./cubes";
import {router as dataRoute} from "./data";

//Export the router
export var router: Router = express.Router();

//Delegate api-routes to their routers
router.use('/cubes', cubesRoute);
router.use('/data', dataRoute);

//Handle root to display frontend
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/api_docs.json'))
});