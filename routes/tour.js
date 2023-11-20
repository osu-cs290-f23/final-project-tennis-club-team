import db from '../db.js';
import express from 'express';
import { ObjectId } from 'bson';

const shuffle = (array, block) => {
    for (var i = block; i < array.length; i++) {
        var j = Math.floor(Math.random() * (array.length - i)) + i;

        [array[i], array[j]] = [array[j], array[i]];
    }
}

var router = express.Router();

router.get('/', async (req, res, next) => {
    const coll = await db.collection('tournaments');
    const result = await coll.find({}).project({ name: 1 }).toArray();

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

router.post('/addevent', async function(req, res, next) {
    const coll = await db.collection('tournaments');
    var event = {
        name: req.body.name,
        type: req.body.type,
        size: 2,
        main: {
            rounds: [],
            matches: [],
            contestants: {}
        }
    };

    event.main.rounds.push({ name: 'Finals' });

    while(event.size < req.body.players.length) {
        event.size *= 2;

        if(event.size === 4) {
            event.main.rounds.push({ name: 'Semifinals' });
        } else if(event.size === 8) {
            event.main.rounds.push({ name: 'Quarterfinals' });
        } else {
            event.main.rounds.push({ name: 'Round of ' + event.size });
        }
    }

    shuffle(req.body.players, event.size / 2);

    for(var i = 0; i < req.body.players.length; i++) {
        event.main.contestants['' + i] = {
            entryStatus: ((i < event.size / 2) ? '' + (i + 1) : ''),
            players: [ { name: req.body.players[i] } ]
        };
    }

    for(var i = 0; i < event.size / 2; i++) {
        event.main.matches.push({
            roundIndex: 0,
            order: i,
            sides: []
        });
    }

    var delta = event.size / 2;
    var stack = [ 0 ];
    event.main.matches[0].sides.push({ contestantId: 0 });

    while(stack.length < event.size) {
        for(var i = stack.length - 1; i >= 0; i--) {
            if(i % 2 === 0) {
                if(stack.length < req.body.players.length) {
                    event.main.matches[stack[i] + delta - 1].sides.push({ contestantId: stack.length });
                } else {
                    event.main.matches[stack[i] + delta - 1].sides.push({ title: 'Bye' });
                }

                stack.push(stack[i] + delta - 1);
            } else {
                if(stack.length < req.body.players.length) {
                    event.main.matches[stack[i] - delta + 1].sides.push({ contestantId: stack.length });
                } else {
                    event.main.matches[stack[i] - delta + 1].sides.push({ title: 'Bye' });
                }
                stack.push(stack[i] - delta + 1);
            }
        }

        delta /= 2;
    }

    const result = await coll.updateOne({ _id: new ObjectId(req.body.t_id) }, { $push: { events: event }});

    if(result.modifiedCount === 1) {
        res.status(200).send();
    } else {
        res.status(501).send();
    }
});

export default router;