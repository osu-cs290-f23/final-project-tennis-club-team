import db from '../db.js';
import express from 'express';
import { ObjectId } from 'bson';
import { createSingleElim, createDoubleElim } from '../lib/events.js';

var router = express.Router();

router.get('/', async (req, res, next) => {
    const coll = await db.collection('tournaments');
    const result = await coll.find({}).project({ name: 1 }).toArray();

    res.status(200).send(result);
});

router.get('/:id', async (req, res, next) => {
    const coll = await db.collection('tournaments');
    const result = await coll.findOne({ _id: new ObjectId(req.params.id) });

    console.log(result);

    res.status(200).send(result);
});

router.post('/create', async function(req, res, next) {
    const coll = await db.collection('tournaments');
    const result = await coll.insertOne({ name: req.body.name, events: []});

    if(result.acknowledged) {
        res.status(200).send(result.insertedId);
    } else {
        res.status(501).send(-1);
    }
});

router.post('/:id/update', async (req, res, next) => {
    const coll = await db.collection('tournaments');

    req.body._id = new ObjectId(req.params.id);

    const result = await coll.findOneAndReplace({ _id: new ObjectId(req.params.id) }, req.body, { returnDocument: 'after' });

    res.status(200).send(result);
});

router.post('/:id/addevent', async function(req, res, next) {
    const coll = await db.collection('tournaments');
    var event; 

    if(req.body.type === 'single') {
        event = createSingleElim(req);
    } else if(req.body.type === 'double') {
        event = createDoubleElim(req);
    } else {
        res.status(401).send();

        return;
    }

    const result = await coll.updateOne({ _id: new ObjectId(req.params.id) }, { $push: { events: event } });

    if(result.modifiedCount === 1) {
        res.status(200).send();
    } else {
        res.status(501).send();
    }
});

export default router;