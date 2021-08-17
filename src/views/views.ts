import express, { Router } from "express";
import { router as cubeViewsRouter } from "./cubes_views";
import { router as passportViewsRouter } from "./passport_views";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.use('/', cubeViewsRouter);
router.use('/', passportViewsRouter)