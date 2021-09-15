import express, { Router, Request, Response } from "express";
import path from 'path';
import {router as cubesRoute} from "./cubes";
import {router as dataRoute} from "./data";
import {router as configRoute} from "./config";

//Export the router
export var router: Router = express.Router();

//TODO: Protect API routes with login
//Delegate API-routes to their routers
router.use('/cubes', cubesRoute);
router.use('/data', dataRoute);
router.use('/config', configRoute);

//Handle root to display API documentation
router.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/api_docs.json'))
});