/** 
 * Module for the app related views.
 * 
 * @module
 */

// Type imports
import { Router, Request, Response } from "express";
import { App } from "../types";
// External imports
import express from "express";
// Internale import
import { authenticateUser } from "../utils/passport_utils";
import { addApp, deleteApp, getAppByName, getApps } from "../model/app";

export var router: Router = express.Router();
// Routes
router.use(authenticateUser);
router.get('/',  getAppsView);
router.post('/', addAppEndpoint);
router.get('/delete/:name', deleteAppEndpoint);

/**
 * Renders the view of the overview of all apps
 * 
 * @param req 
 * @param res 
 */
async function getAppsView(req: Request, res: Response): Promise<void> {
    try {
        let apps: Array<App> = await getApps();
        res.render('apps-list', { apps: apps })
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.stack);
        } else {
            console.log(err);
        }
    
        res.status(501).send("view error");
    }
    
}

/**
 * Endpoint for creating an app
 * 
 * Redirects to the app overview
 * 
 * @param req 
 * @param res 
 */
async function addAppEndpoint(req: Request, res: Response): Promise<void> {

    let name: string = req.body["name"];
    let address: string = req.body["address"];
    
    try {
        await addApp(name, address);
        res.redirect(303, "/apps");
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.stack);
        } else {
            console.log(err);
        }
    
        res.status(501).send("view error");
    }
}

/**
 * Endpoint for deleting an app
 * 
 * Reidrect to the app overview
 * 
 * @param req 
 * @param res 
 */
async function deleteAppEndpoint(req: Request, res: Response): Promise<void> {

    let name: string = req.params["name"];

    try {
        await deleteApp(name);
        res.redirect(303, "/apps");
    } catch (err) {
        if (err instanceof Error) {
            console.log(err.stack);
        } else {
            console.log(err);
        }
    
        res.status(501).send("view error");
    }
}