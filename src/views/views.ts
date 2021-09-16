//type imports
import { Request, Response, Router } from "express";
//express imports
import express from "express";
//internal imports
import { router as cubeViewsRouter } from "./cubes_views";
import { router as userViewsRouter } from "./user_views";
import { router as tokenViewsRouter } from "./token_views";
import { router as passportViewsRouter } from "./passport_views";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.use('/', passportViewsRouter)
router.get('/', (req: Request, res: Response) => {res.redirect(303, '/cubes')})
router.use('/cubes', cubeViewsRouter);
router.use('/users', userViewsRouter);
router.use('/tokens', tokenViewsRouter);