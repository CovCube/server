import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import {Pool} from "pg";
import mqtt, {Client as MQTTClient} from "mqtt";
import {setupDB} from "./utils/db_utils";
import {setupMQTT} from "./utils/mqtt_utils";
import {router as apiRoutes} from "./api/api";

//Parse environment variables
dotenv.config();

//Connect to database
export const pool: Pool = new Pool();
setupDB();

//Connect to MQTT broker
let mqttUrl: string = process.env.MQTTURL || 'mqtt://test.mosquitto.org';
let mqttPort: number = parseInt(process.env.MQTTPORT || '1883');
export const mqttClient: MQTTClient = mqtt.connect(mqttUrl, {port: mqttPort});

mqttClient.on('connect', function() {
    console.log('Connected to MQTT server.');
    setupMQTT();
});

//Create express app
const PORT: number = parseInt(process.env.PORT || '3000');
const app: Express = express();

//Add middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Delegate routing
app.use('/api', apiRoutes);

//Start server
app.listen(PORT, () => console.log(`Running on port: ${PORT}`));