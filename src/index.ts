/**
 * This is the entry point to the application. It sets everything up.
 * 
 * @module
 */

// Type imports
import { Express } from "express";
import { App } from "./types";
// External imports
import express from "express";
import hbs from 'hbs';
import path from 'path';
import { Pool } from "pg";
// Middleware imports
import session from 'express-session';
import helmet from "helmet";
import dotenv from "dotenv";
import passport from "passport";
// Internal imports
import { nav_apps } from "./views/views";
import { createCubeTables } from "./model/cube";
import { createSensorDataTable } from "./model/sensor_data";
import { createAppsTable, getAvailableApps } from "./model/app";
import { createUserTable } from "./model/user";
import { createTokensTable } from "./model/token";
import { setupPassport } from "./utils/passport_utils";
import { setupMQTT } from "./utils/mqtt_utils";
import { router as viewRoutes } from "./views/views";
import { router as apiRoutes } from "./api/api";

// Parse environment variables
dotenv.config();

// Set databse connection variable
export var pool: Pool;

// Setup database, passport and mqtt broker connection
setupServer();

// Create express app
const PORT: number = parseInt(process.env.PORT || '3000');
const app: Express = express();

// Register template engine
app.set('views', __dirname+'/templates');
app.set('view engine', 'hbs');
// Register partials
hbs.registerPartials(__dirname + '/templates/partials', function() {});
hbs.registerHelper('nav_apps', nav_apps);

// Register static path
app.use('/static', express.static(path.join(__dirname, './public')));

// Add helmet middleware
// CSP middleware needs to be axtra, so it can be replaced later
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));
app.use(helmet.contentSecurityPolicy());

// Add other middleware
app.use(session({
    secret: process.env.SESSIONSECRET || 'secret',
    // Check if session store implements touch
    resave: false,
    // Because of cookie banner
    saveUninitialized: false
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

// Delegate routing
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

// Start server
app.listen(PORT, () => console.log(`Running on port: ${PORT}`));

/**
 * Setup the database, passport authentication and mqtt
 * 
 * @returns
 * @internal
 */
async function setupServer(): Promise<void> {

    //Connect to database
    let db_connection: boolean = false;
    while(!db_connection) {
        try {
            console.log("attempting database connection ...")
            // Establish connection to database by getting a Pool
            pool = new Pool();
            // Query the pool to see if connection was successful
            await pool.query("SELECT 1")
        } catch(e) {
            console.log(e);
            // Wait for 5s before testing again
            await new Promise(resolve => setTimeout(resolve, 5000));

            continue;
        }

        console.log("connected to database")
        db_connection = true;
    }
    
    try {
        // Setup cube database
        await createCubeTables();
        await createSensorDataTable();
        // Setup app database
        await createAppsTable();
        // Setup passport
        await createUserTable();
        await createTokensTable();
        setupPassport();
        // Setup mqtt
        await setupMQTT();
    } catch(err) {
        console.log(err);
    }
}

export function updateHelmetCSP() {
    
    // Get apps
    let apps: Array<App> = getAvailableApps();
    // Define standard directives
    let frame_src: Array<string> = ["'self'"];
    let script_src: Array<string> = ["'self'"];
    let style_src: Array<string> = ["'self'", "https: 'unsafe-inline'"];

    // Add custom directives
    apps.forEach((app: App) => {
        if (app.address !== '') {
            frame_src.push(app.address);
            script_src.push(app.address);
            style_src.push(app.address);
        }
    });

    // Remove existing helmet middleware from stack
    let stack: Array<any> = app._router.stack;
    let helmetIndex: number = stack.length + 1;

    stack.forEach((layer: any, index: number) => {
        if (!layer.name) {
            return;
        }

        if (layer.name === 'contentSecurityPolicyMiddleware') {
            helmetIndex = index;
        }
    });

    if (helmetIndex <= stack.length) {
        stack.splice(helmetIndex, 1);
        app._router.stack = stack;
    }

    // Add new helmet middleware
    app.use(helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "frame-src": frame_src,
            "script-src": script_src,
            "style-src": style_src
        }
    }));

    // Move middleware before routers
    stack = app._router.stack;
    let middleware = stack.pop();
    stack.splice(helmetIndex, 0, middleware);
    app._router.stack = stack;
}