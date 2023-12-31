// Creating an event

import _ from 'lodash';

export const createSingleElim = (req) => {
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

    event.main.rounds.reverse();

    for(var i = 0; i < req.body.players.length; i++) {
        event.main.contestants[req.body.players[i]] = {
            entryStatus: ((i < event.size / 2) ? '' + (i + 1) : ''),
            players: [ { title: req.body.players[i] } ]
        };
    }

    event.main.contestants['Bye'] = {
        entryStatus: '',
        players: [ { title: 'Bye' } ]
    };

    for(var i = 0, size = event.size / 2; i < event.main.rounds.length; i++, size /= 2) {
        for(var j = 0; j < size; j++) {
            event.main.matches.push({
                roundIndex: i,
                order: j,
                sides: [],
                matchStatus: 'TBA | TBA'
            });
        }
    }

    var delta = event.size / 2;
    var stack = [ 0 ];
    event.main.matches[0].sides.push({ contestantId: req.body.players[0] });

    while(stack.length < event.size) {
        for(var i = stack.length - 1; i >= 0; i--) {
            if(i % 2 === 0) {
                if(stack.length < req.body.players.length) {
                    event.main.matches[stack[i] + delta - 1].sides.push({ contestantId: req.body.players[stack.length] });
                } else {
                    event.main.matches[stack[i] + delta - 1].sides.push({ contestantId: 'Bye' });
                }

                stack.push(stack[i] + delta - 1);
            } else {
                if(stack.length < req.body.players.length) {
                    event.main.matches[stack[i] - delta + 1].sides.splice(0, 0, { contestantId: req.body.players[stack.length] });
                } else {
                    event.main.matches[stack[i] - delta + 1].sides.splice(0, 0, { contestantId: 'Bye' });
                }
                stack.push(stack[i] - delta + 1);
            }
        }

        delta /= 2;
    }

    return event;
};

export const createDoubleElim = (req) => {
    var event = createSingleElim(req);

    event.back = _.cloneDeep(event.main);
    event.back.rounds.shift();
    event.back.matches = event.back.matches
        .filter((match) => match.roundIndex > 0)
        .map((match) => {
            match.roundIndex = match.roundIndex - 1;

            return match;
        });

    return event;
};


// Creating a pool event in the create event page
export const createPooledEvent = (req) => {
    // create an event object
    var event = {
        name: req.body.name,
        type: req.body.type,
        teams: req.body.players,
        count: Math.floor(req.body.players.length / 3), // number of pools to generate
        pools: [] // array of pools
    };

    // Place the top ranked teams into their respective pools
    for(var i = 0; i < event.count; i++) {
        event.pools.push({ teams: [ req.body.players[i] ] });
    }

    // Place the remaining teams into their respective pools
    for(var i = event.count; i < req.body.players.length;) {
        for(var j = event.count - 1; i < req.body.players.length && j >= 0; i++, j--) {
            event.pools[j].teams.push(req.body.players[i]);
        }
    }

    for(var pool of event.pools) {
        pool.matches = []; // Match ups in the pools

        for(var i = 0; i < pool.teams.length; i++) {
            pool.matches.push([]);

            for(var j = 0; j < pool.teams.length; j++) {
                pool.matches[i].push({
                    score: 0,
                    time: 'TBA | TBA'
                });
            }
        }
    }

    return event;
};