//type imports
import { Request, Response, Router } from "express";
import { App } from "../types";
//express imports
import express from "express";
//internal imports
import { router as passportViewsRouter } from "./passport_views";
import { router as cubeViewsRouter } from "./cubes_views";
import { router as userViewsRouter } from "./user_views";
import { router as appViewsRouter } from "./app_views";
import { router as tokenViewsRouter } from "./token_views";
import { getAvailableApps } from "../model/app";

//Export the router
export var router: Router = express.Router();

//Delegate view-routes to their views
router.use('/', passportViewsRouter)
router.get('/', (req: Request, res: Response) => {res.redirect(303, '/cubes')})
router.use('/cubes', cubeViewsRouter);
router.use('/users', userViewsRouter);
router.use('/apps', appViewsRouter);
router.use('/tokens', tokenViewsRouter);

// Define handlebars helper for displaying app links in the navbar
export function nav_apps() {
    let apps: Array<App> = getAvailableApps();
    let html: string = "";

    apps.forEach((app: App) => {
        let a: string = "<a href=\"/apps/installed/" + encodeURIComponent(app.name) + "\">" + app.name + "</a>";
        html += a + "\n";
    })

    return html;
}