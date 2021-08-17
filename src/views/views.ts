import express, { Router } from "express";
import { router as cubeViewsRouter } from "./cubes_views";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.use('/', cubeViewsRouter);