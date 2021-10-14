//type imports
import { Express } from "express";
//base imports
import express from "express";
import hbs from 'hbs';
import path from 'path';
//middleware imports
import session from 'express-session';
import helmet from "helmet";
import dotenv from "dotenv";
import passport from "passport";
//pg imports
import { Pool } from "pg";
//internal imports
import { createCubeTables } from "./model/cube";
import { createSensorDataTable } from "./model/sensor_data";
import { createUserTable } from "./model/user";
import { createTokensTable } from "./model/token";
import { setupPassport } from "./utils/passport_utils";
import { setupMQTT } from "./utils/mqtt_utils";
import { router as viewRoutes } from "./views/views";
import { router as apiRoutes } from "./api/api";

//Parse environment variables
dotenv.config();

//Set databse connection variable
export var pool: Pool;

//Setup database, passport and mqtt broker connection
setupServer();

//Create express app
const PORT: number = parseInt(process.env.PORT || '3000');
const app: Express = express();

//Register template engine
app.set('views', './templates');
app.set('view engine', 'hbs');
//Register partials
hbs.registerPartials(__dirname + '/templates/partials', function() {});

//Register static path
app.use('/static', express.static(path.join(__dirname, './public')));

//Add middleware
app.use(helmet());
app.use(session({
    secret: process.env.SESSIONSECRET || 'secret',
    //Check if session store implements touch
    resave: false,
    //Because of cookie banner
    saveUninitialized: false
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

//Delegate routing
app.use('/', viewRoutes);
app.use('/api', apiRoutes);

//Start server
app.listen(PORT, () => console.log(`Running on port: ${PORT}`));

async function setupServer() {

    //Connect to database
    let db_connection: boolean = false;
    while(!db_connection) {
        try {
            console.log("attempting database connection ...")
            pool = new Pool();
            await pool.query("SELECT 1")
        } catch(e) {
            console.log(e);

            await new Promise(resolve => setTimeout(resolve, 5000));

            continue;
        }

        console.log("connected to database")
        db_connection = true;
    }
    
    try {
        //Setup cube database
        await createCubeTables();
        await createSensorDataTable();
        //Setup passport
        await createUserTable();
        await createTokensTable();
        setupPassport();
        //setup mqtt
        setupMQTT();
    } catch(err) {
        console.log(err);
    }
}