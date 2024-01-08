import db from '../db.js';
import express from 'express';
import { ObjectId } from 'bson';
import { createSingleElim, createDoubleElim, createPooledEvent } from '../lib/events.js';

var publicRouter = express.Router();
var privateRouter = express.Router();

publicRouter.get('/', async (req, res, next) => {
    try {
        const coll = await db.collection('tournaments');
        const result = await coll.find({}).project({ name: 1 }).toArray();

        res.status(200).send(result);
    } catch(error) {
        console.error(error);

        res.status(501).send(error);
    }        
});

publicRouter.get('/:id', async (req, res, next) => {
    try {
        const coll = await db.collection('tournaments');
        const result = await coll.findOne({ _id: new ObjectId(req.params.id) });

        console.log(result);

        res.status(200).send(result);
    } catch(error) {
        console.error(error);

        res.status(401).send(error);
    }
});

privateRouter.delete('/', async function(req, res, next) {
    try {
        const coll = await db.collection('tournaments');
        const result = await coll.deleteOne({ _id: new ObjectId(req.query.id) });

        if(result.acknowledged && result.deletedCount === 1) {
            next();
        } else {
            res.status(401).send();
        }
    } catch(error) {
        console.error(error);

        res.status(501).send(error);
    }
});

privateRouter.post('/create', async function(req, res, next) {
    try {
        const coll = await db.collection('tournaments');
        const result = await coll.insertOne({ name: req.body.name, events: []});

        if(result.acknowledged) {
            res.status(200).send(result.insertedId);
        } else {
            res.status(401).send(-1);
        }
    } catch(error) {
        console.error(error);

        res.status(501).send(error);
    }
});

privateRouter.post('/:id/update', async (req, res, next) => {
    try {
        const coll = await db.collection('tournaments');

        req.body._id = new ObjectId(req.params.id);

        const result = await coll.findOneAndReplace({ _id: new ObjectId(req.params.id) }, req.body, { returnDocument: 'after' });

        res.status(200).send(result);
    } catch(error) {
        console.error(error);

        res.status(501).send(error);
    }
});

privateRouter.post('/:id/addevent', async function(req, res, next) {
    try {
        const coll = await db.collection('tournaments');
        var event; 

        if(req.body.type === 'single') {
            event = createSingleElim(req);
        } else if(req.body.type === 'double') {
            event = createDoubleElim(req);
        } else if(req.body.type === 'pool') {
            event = createPooledEvent(req);
        } else {
            res.status(400).send();

            return;
        }

        const result = await coll.updateOne({ _id: new ObjectId(req.params.id) }, { $push: { events: event } });

        if(result.modifiedCount === 1) {
            res.status(200).send();
        } else {
            res.status(501).send();
        }
    } catch(error) {
        console.error(error);

        res.status(501).send(error);
    }
});

export { publicRouter, privateRouter };