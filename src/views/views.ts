//type imports
import { Router } from "express";
//express imports
import express from "express";
//internal imports
import { router as cubeViewsRouter } from "./cubes_views";
import { router as passportViewsRouter } from "./passport_views";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.use('/', cubeViewsRouter);
router.use('/', passportViewsRouter)