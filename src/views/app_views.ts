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
import axios, { AxiosResponse } from "axios";
// Internale import
import { authenticateUser } from "../utils/passport_utils";
import { addApp, deleteApp, getAppByName, getApps } from "../model/app";
import { filterHTMLContent, addBaseAddress } from "../utils/content_util";

export var router: Router = express.Router();

// TODO: reenable
//router.use(authenticateUser);

// Routes
router.get('/',  getAppsView);
router.post('/', addAppView);
router.get('/delete/:name', deleteAppView);
router.get('/content/:name', getAppContent);

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
async function addAppView(req: Request, res: Response): Promise<void> {

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
 * Reidrects to the app overview
 * 
 * @param req 
 * @param res 
 */
async function deleteAppView(req: Request, res: Response): Promise<void> {

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


/**
 * Renders the view for an app by fetching the html of an app
 * Replaces the urls to point to the correct path
 * 
 * @param req 
 * @param res 
 */
async function getAppContent(req: Request, res: Response): Promise<void> {
    let name: string = decodeURIComponent(req.params["name"]);
    let app: App = await getAppByName(name);

    let url: string = req.query["url"]?.toString() ?? "";
    let address: string = "http://" + app.address + "/" + url
    
    try {
        let response: AxiosResponse = await axios.get(address, {
            headers: {
                Authorization: "Bearer " + app.token
            }
        });

        let content: string = response.data;
        
        let header = filterHTMLContent(content, "head");
        let body = filterHTMLContent(content, "body");

        header = addBaseAddress(header, app.address, "/apps/content/" + req.params["name"] + "/");
        body = addBaseAddress(body, app.address, "/apps/content/" + req.params["name"] + "/");

        res.render('app-content', {
            header: header,
            content: body,
            appAddress: app.address
        });
    } catch (e) {
        console.log(e);
        res.sendStatus(500).end();
    }
}