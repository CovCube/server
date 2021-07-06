import express, { Router } from "express";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req, res) {
    res.send(200);
});