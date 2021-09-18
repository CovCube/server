//type imports
import { Router, Request, Response } from "express";
//express imports
import express from "express";
//passport imports
import passport from "passport";
//other external imports
import path from 'path';
//internal imports
import { router as cubesRoute } from "./cubes";
import { router as dataRoute } from "./data";
import { router as configRoute } from "./config";

//Export the router
export var router: Router = express.Router();

//Authenticate user
router.use('/', passport.authenticate('bearer', {session: false}));

//Delegate API-routes to their routers
router.use('/cubes', cubesRoute);
router.use('/data', dataRoute);
router.use('/config', configRoute);

//Handle root to display API documentation
router.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/api_docs.json'))
});