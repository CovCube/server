import express, { Router, Request, Response } from "express";

//Export the router
export var router: Router = express.Router();

router.get('/', function(req: Request, res: Response) {
    res.send(200);
});

router.post('/', function(req: Request, res: Response) {
    res.send(200);
});

router.get('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});

router.put('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});

router.delete('/:cubeId', function(req: Request, res: Response) {
    res.send(200);
});