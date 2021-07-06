import express, { Router } from "express";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req, res) {
    res.send(200);
});

router.post('/', function(req, res) {
    res.send(200);
});

router.get('/:cubeId', function(req, res) {
    res.send(200);
});

router.put('/:cubeId', function(req, res) {
    res.send(200);
});

router.delete('/:cubeId', function(req, res) {
    res.send(200);
});