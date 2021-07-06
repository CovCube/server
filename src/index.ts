import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import helmet from "helmet";
import dotenv from "dotenv";
import {router as apiRoutes} from "./api/api";

dotenv.config();

const PORT = process.env.PORT || 3000;
const app: Express = express();
//const index = require('./routes/index')

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", apiRoutes);

app.listen(PORT, () => console.log(`Running on port: ${PORT}`));