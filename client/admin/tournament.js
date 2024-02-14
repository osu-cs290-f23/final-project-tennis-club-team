// Viewing a single event

(async () => {
    //Require dependencies here
    const axios = require('axios/dist/browser/axios.cjs');
    const bracketry = require('bracketry');
    const flatpickr = require("flatpickr");
    const socket = io();
    const _ = require('lodash');

    //State variables
    var index = 0;
    var selectedBracket = null;
    var selectedMatch = null;
    var playerMap = new Map();
    var locationMap = new Map();
    var errors = [];

    const dayOrder = {
        'Monday': 0,
        'Tuesday': 1,
        'Wednesday': 2,
        'Thursday': 3,
        'Friday': 4,
        'Saturday': 5,
        'Sunday': 6
    };

    //Define tournament search fields
    const url = document.URL;
    const searchParams = new URLSearchParams(url.split('?')[1]);  
    
    //Define event title
    const eventTitle = document.querySelector('#event-title');
    
    //Define modal form fields
    const playerAField = document.querySelector('#a-name');
    const playerBField = document.querySelector('#b-name');
    const timeField = document.querySelector('#time');
    const clearButton = document.querySelector('#clear');
    const placeField = document.querySelector('#place');
    const courtField = document.querySelector('#courts');
    const aScoreMain = document.querySelector('#a-score-main');
    const aScoreSub = document.querySelector('#a-score-sub');
    const bScoreMain = document.querySelector('#b-score-main');
    const bScoreSub = document.querySelector('#b-score-sub');
    const dateTimePicker = flatpickr('#time', {
        enableTime: true,
        dateFormat: "l, h:iK",
        static: true
    });

    const optionMenu = document.querySelector(".select-menu");
    const optionButton = optionMenu.querySelector(".select-btn");
    const addEvent = optionMenu.querySelector("#add-event");
    const removeEvent = optionMenu.querySelector("#remove-event");
    const verifyTimes = optionMenu.querySelector('#verify-times');

    //Define html data locations
    const backDraw = document.querySelector('#back-draw');
    const mainDraw = document.querySelector('#main-draw');
    const mainWrapper = document.querySelector('#main-bracket');
    const backWrapper = document.querySelector('#back-bracket');
    const poolPlay = document.querySelector('#pool-play');
    const Leaderboard = document.querySelector('#leaderboard-wrapper');
    const poolPlayWrapper = document.querySelector('#pool-play-wrapper');
    const schedule = document.querySelector('#schedule');
    const scheduleWrapper = document.querySelector('#schedule-wrapper');
    const eventTabs = document.querySelector('#event-tabs');

    //Define bracket object holder
    var mainBracket = null;
    var backBracket = null;

    //Fetch tournament data
    try {
        var tournamentData = (await axios('/tournaments/' + searchParams.get('id'))).data;
        console.log("tournament data: ", tournamentData);
        socket.on('update',async (msg) => {
            try {
                tournamentData = (await axios('/tournaments/' + searchParams.get('id'))).data;
            } catch(error) {
                new Noty({
                    type: 'error',
                    layout: 'topRight',
                    theme: 'relax',
                    text: 'Error updating event!',
                    closeWith: ['click', 'button'],
                    timeout: 3000
                }).show();
            }

            addEventTabs();    
            loadEvent(index);
        });
        const style = {
            wrapperBorderColor: 'transparent',
            roundTitlesBorderColor: 'transparent',
            hoveredMatchBorderColor: '#DC4405',
            rootFontFamily: 'Comfortaa'
        };

        const options = (bracket) => {
            return {
                ...style,
                navButtonsPosition: 'overTitles',
                onMatchClick: (match) => {
                    selectedBracket = bracket;

                    matchClickHandler(match);
                }
            };
        };

        const addEventTabs = () => {
            eventTabs.replaceChildren([]);

            const eventTab = document.createElement('input');

            eventTab.type = 'button';
            eventTab.title = "Schedule";
            eventTab.value = "Schedule";
            eventTab.dataset.index = -1;

            eventTabs.appendChild(eventTab);

            for(var i = 0; i < tournamentData.events.length; i++) {
                const eventTab = document.createElement('input');
    
                eventTab.type = 'button';
                eventTab.title = tournamentData.events[i].name;
                eventTab.value = tournamentData.events[i].name;
                eventTab.dataset.index = i;
    
                eventTabs.appendChild(eventTab);
            }
        };

        const update = async () => {
            try {
                tournamentData = (await axios.post('/tournaments/' + searchParams.get('id') + '/update', tournamentData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })).data;
                socket.emit('update','update')
            } catch(error) {
                new Noty({
                    type: 'error',
                    layout: 'topRight',
                    theme: 'relax',
                    text: 'Error updating event!',
                    closeWith: ['click', 'button'],
                    timeout: 3000
                }).show();
            }

            // addEventTabs();    
            // loadEvent(index);
        };
        
        const poolModalOpen = (modal) => {
            var pool = parseInt(selectedMatch.dataset.i);
            var row = parseInt(selectedMatch.dataset.j);
            var col = parseInt(selectedMatch.dataset.k);
            var match1 = tournamentData.events[index].pools[pool].matches[row][col];
            var match2 = tournamentData.events[index].pools[pool].matches[col][row];
            var team = tournamentData.events[index].pools[pool].teams;
            playerAField.value = team[row];
            playerBField.value = team[col];

            timeField.value = match1.time.split('|')[0].trim();

            if(timeField.value === 'TBA') {
                timeField.value = '';
            }

            if(match1.date && timeField.value) 
                dateTimePicker.setDate(match1.date);

            const placeCourt = match1.time.split('|')[1].trim();

            if(placeCourt === 'TBA') {
                placeField.value = '';
                courtField.value = '';
            } else if(!placeCourt.includes(',')) {
                placeField.value = placeCourt;
                courtField.value = '';
            } else {
                placeField.value = placeCourt.split(',')[0].trim();
                courtField.value = placeCourt.split(',')[1].trim();
            }

            aScoreMain.value = match1.score;
            aScoreSub.disabled = true;
            aScoreSub.value = '';
    
            bScoreMain.value = match2.score;
            bScoreSub.disabled = true;
            bScoreSub.value = '';
        }

        const poolModalClose = (modal) => {
            var pool = parseInt(selectedMatch.dataset.i);
            var row = parseInt(selectedMatch.dataset.j);
            var col = parseInt(selectedMatch.dataset.k);
            var match1 = tournamentData.events[index].pools[pool].matches[row][col];
            var match2 = tournamentData.events[index].pools[pool].matches[col][row];
            var team = tournamentData.events[index].pools[pool].teams;

            // Setting the players correctly
            if(playerAField.value)
                team[row] = playerAField.value;

            if(playerBField.value)
                team[col] = playerBField.value;

            // Setting the scores correctly
            if(aScoreMain.value)
                match1.score = parseInt(aScoreMain.value);
            else 
                match1.score = 0;
            
            if(bScoreMain.value)    
                match2.score = parseInt(bScoreMain.value);
            else
                match2.score = 0

            // Setting the time and place correctly
            if(!timeField.value)
                timeField.value = 'TBA'

            if(dateTimePicker.selectedDates.length) {
                match1.date = dateTimePicker.selectedDates[0];
                match2.date = dateTimePicker.selectedDates[0];
            }

            if(!placeField.value)
                placeField.value = 'TBA';
            
            if(!courtField.value)
                courtField.value = 'TBA';

            if(placeField.value === 'TBA' || courtField.value === 'TBA')
                placeField.value = 'TBA';
            else
                placeField.value = placeField.value + ', ' + courtField.value;

            match1.time = timeField.value + ' | ' + placeField.value;
            match2.time = match1.time;

            // Adding players, time, and place to schedule information
            verify();
            update();
        }

        const modalOpen = (modal) => {
            playerAField.value = selectedMatch.sides[0]?.contestantId;
            playerBField.value = selectedMatch.sides[1]?.contestantId;

            if(!selectedMatch.sides[0]?.contestantId) {
                playerAField.value = '';
            }

            if(!selectedMatch.sides[1]?.contestantId) {
                playerBField.value = '';
            }
    
            timeField.value = selectedMatch.matchStatus?.split('|')[0].trim();

            if(timeField.value === 'TBA') {
                timeField.value = '';
            }

            if(selectedMatch.date && timeField.value)
                dateTimePicker.setDate(selectedMatch.date);
            
            const placeCourt = selectedMatch.matchStatus?.split('|')[1].trim();

            if(placeCourt === 'TBA') {
                placeField.value = '';
                courtField.value = '';
            } else if(!placeCourt.includes(',')) {
                placeField.value = placeCourt;
                courtField.value = '';
            } else {
                placeField.value = placeCourt.split(',')[0].trim();
                courtField.value = placeCourt.split(',')[1].trim();
            }
    
            aScoreMain.value = selectedMatch.sides?.[0]?.scores?.[0]?.mainScore;
            aScoreSub.disabled = false;
            aScoreSub.value = selectedMatch.sides?.[0]?.scores?.[0]?.subscore;
    
            bScoreMain.value = selectedMatch.sides?.[1]?.scores?.[0]?.mainScore;
            bScoreSub.disabled = false;
            bScoreSub.value = selectedMatch.sides?.[1]?.scores?.[0]?.subscore;
        };
    
        const modalClose = (modal) => {
            selectedMatch.sides[0] = {
                scores: [
                    {
                        mainScore: aScoreMain.value,
                        subscore: aScoreSub.value
                    }
                ]
            };

            if(playerAField.value) {
                selectedMatch.sides[0].contestantId = playerAField.value;
            }
        
            selectedMatch.sides[1] = {
                scores: [
                    {
                        mainScore: bScoreMain.value,
                        subscore: bScoreSub.value
                    }
                ]
            };

            if(playerBField.value) {
                selectedMatch.sides[1].contestantId = playerBField.value;
            }
    
            if(!timeField.value) {
                timeField.value = 'TBA';
            }
    
            if(!placeField.value)
                placeField.value = 'TBA';
            
            if(!courtField.value)
                courtField.value = 'TBA';

            if(placeField.value === 'TBA' || courtField.value === 'TBA')
                placeField.value = 'TBA';
            else
                placeField.value = placeField.value + ', ' + courtField.value;

            selectedMatch.matchStatus = timeField.value + ' | ' + placeField.value;

            if(selectedBracket === 'main') {
                mainBracket.applyMatchesUpdates([selectedMatch]);
            } else {
                backBracket.applyMatchesUpdates([selectedMatch]);
            }

            if(tournamentData.events[index].type !== 'pool') {
                tournamentData.events[index].main = mainBracket.getAllData();
            }

            if(tournamentData.events[index].type === 'double') {
                tournamentData.events[index].back = backBracket.getAllData();
            }

            if(selectedBracket === 'main') {
                for(const match of tournamentData.events[index].main.matches) {
                    if(match.roundIndex === selectedMatch.roundIndex && match.order === selectedMatch.order) {
                        if(dateTimePicker.selectedDates.length) {
                            match.date = dateTimePicker.selectedDates[0];
                        }

                        break;
                    }
                }
            } else {
                for(const match of tournamentData.events[index].back.matches) {
                    if(match.roundIndex === selectedMatch.roundIndex && match.order === selectedMatch.order) {
                        if(dateTimePicker.selectedDates.length) {
                            match.date = dateTimePicker.selectedDates[0];
                        }

                        break;
                    }
                }
            }

            if(!tournamentData.events[index].main.contestants[playerAField.value]) {
                tournamentData.events[index].main.contestants[playerAField.value] = {
                    entryStatus: '',
                    players: [ { title: playerAField.value } ]
                };
            }

            if(!tournamentData.events[index].main.contestants[playerBField.value]) {
                tournamentData.events[index].main.contestants[playerBField.value] = {
                    entryStatus: '',
                    players: [ { title: playerBField.value } ]
                };
            }

            if(tournamentData.events[index].type === 'double') {
                if(!tournamentData.events[index].back.contestants[playerAField.value]) {
                    tournamentData.events[index].back.contestants[playerAField.value] = {
                        entryStatus: '',
                        players: [ { title: playerAField.value } ]
                    };
                }

                if(!tournamentData.events[index].back.contestants[playerBField.value]) {
                    tournamentData.events[index].back.contestants[playerBField.value] = {
                        entryStatus: '',
                        players: [ { title: playerBField.value } ]
                    };
                }
            }

            verify();
            update();
        };
    
        // Modal for brackets
        const bracketModal = new HystModal({
            beforeOpen: modalOpen,
            afterClose: modalClose
        });
    
        const matchClickHandler = (match) => {
            selectedMatch = match;
            bracketModal.open('#bracketModal');  
        };

        // Modal for pools
        const poolModal = new HystModal({
            beforeOpen: poolModalOpen,
            afterClose: poolModalClose
        });

        const poolClickHandler = (event) => {
            if(!('i' in event.target.dataset) || !('j' in event.target.dataset) || !('k' in event.target.dataset)) {
                return;
            }

            if(parseInt(event.target.dataset.j) < 0 || parseInt(event.target.dataset.k) < 0 || event.target.dataset.j === event.target.dataset.k) {
                return;
            }

            if(tournamentData.events[index].pools[event.target.dataset.i].teams.length === 4 && (parseInt(event.target.dataset.j) === (3 - parseInt(event.target.dataset.k)))) {
                return;
            }

            selectedMatch = event.target;
            poolModal.open('#bracketModal');
        };

        const verify = () => {
            const matchups = [];

            for(const event of tournamentData.events) {
                if(event.type === 'pool') { // Adding all pool matchups

                    for(var i = 0; i < event.count; i++) { // Iterate through all the pools
                        if(event.pools[i].teams.length < 4) { // Add matchups for pools of 3
                            matchups.push({
                                matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1],
                                time: event.pools[i].matches[0][1].time.split('|')[0].trim(),
                                place: event.pools[i].matches[0][1].time.split('|')[1].trim()
                            });
                            matchups.push({
                                matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2],
                                time: event.pools[i].matches[0][2].time.split('|')[0].trim(),
                                place: event.pools[i].matches[0][2].time.split('|')[1].trim()
                            });
                            matchups.push({
                                matchup: event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[2],
                                time: event.pools[i].matches[1][2].time.split('|')[0].trim(),
                                place: event.pools[i].matches[1][2].time.split('|')[1].trim()
                            });
                        } else { // Add matchups for pools of 4
                            matchups.push({
                                matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1],
                                time: event.pools[i].matches[0][1].time.split('|')[0].trim(),
                                place: event.pools[i].matches[0][1].time.split('|')[1].trim()
                            });
                            matchups.push({
                                matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2],
                                time: event.pools[i].matches[0][2].time.split('|')[0].trim(),
                                place: event.pools[i].matches[0][2].time.split('|')[1].trim()
                            });
                            matchups.push({
                                matchup: event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[3],
                                time: event.pools[i].matches[1][3].time.split('|')[0].trim(),
                                place: event.pools[i].matches[1][3].time.split('|')[1].trim()
                            });
                            matchups.push({
                                matchup: event.pools[i].teams[2] + ' vs ' + event.pools[i].teams[3],
                                time: event.pools[i].matches[2][3].time.split('|')[0].trim(),
                                place: event.pools[i].matches[2][3].time.split('|')[1].trim()
                            });
                        }
                    }
                } else if (event.type === 'single'){ // Adding bracket matches for single elim
                    for(var i = 0; i < event.main.matches.length; i++) {
                        matchups.push({
                            matchup: event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId,
                            time: event.main.matches[i].matchStatus.split('|')[0].trim(),
                            place: event.main.matches[i].matchStatus.split('|')[1].trim(),
                        });
                    }
                } else { // Adding bracket matchups for double elim
                    for(var i = 0; i < event.main.matches.length; i++) {
                        matchups.push({
                            matchup: event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId,
                            time: event.main.matches[i].matchStatus.split('|')[0].trim(),
                            place: event.main.matches[i].matchStatus.split('|')[1].trim(),
                        });
                    }
                    for(var i = 0; i < event.back.matches.length; i++) {
                        matchups.push({
                            matchup: event.back.matches[i].sides?.[0]?.contestantId + ' vs ' + event.back.matches[i].sides?.[1]?.contestantId,
                            time: event.back.matches[i].matchStatus.split('|')[0].trim(),
                            place: event.back.matches[i].matchStatus.split('|')[1].trim(),
                        });
                    }
                }
            }

            playerMap = new Map();
            locationMap = new Map();
            errors = [];

            for(const matchup of matchups) {
                if(matchup.time === 'TBA') {
                    continue;
                }

                const players = [...matchup.matchup.split(' vs ')[0].split(' / '), ...matchup.matchup.split(' vs ')[1].split(' / ')];
                
                for(const player of players) {
                    if(player && player !== 'Bye' && playerMap.get(player)?.has(matchup.time)) {
                        errors.push({
                            fault: player,
                            time: matchup.time
                        });
                    } else {
                        if(!playerMap.has(player)) {
                            playerMap.set(player, new Set());
                        } 
    
                        playerMap.get(player).add(matchup.time);
                    }
                }

                if(location !== 'TBA' && locationMap.get(matchup.place)?.has(matchup.time)) {
                    errors.push({
                        fault: matchup.place,
                        time: matchup.time
                    });
                } else {
                    if(!locationMap.has(matchup.place)) {
                        locationMap.set(matchup.place, new Set());
                    } 

                    locationMap.get(matchup.place).add(matchup.time);
                }
            }

            const errorList = document.createElement('ul');

            for(const error of errors) {
                const errorMessage = document.createElement('li');

                errorMessage.textContent = error.fault + ' @ ' + error.time;

                errorList.appendChild(errorMessage);
            }

            //TODO: Color text when there is time conflict

            if(errors.length !== 0) {
                console.log(errors);

                swal({
                    title: 'Time Conflicts',
                    content: errorList,
                    icon: 'error'
                });
            }
        };

        const loadEvent = (index) => {
            eventTabs.children[index+1].classList.add('open');

            schedule.classList.add('hidden');            
            poolPlay.classList.add('hidden');
            mainDraw.classList.add('hidden');
            backDraw.classList.add('hidden');

            if(index === -1) { // Rendering the Tournament Schedule
                schedule.classList.remove('hidden');
                eventTitle.textContent = tournamentData.name + ': Schedule';

                // Compile list of all matchups in brackets and pools
                const matchups = [];

                for(const event of tournamentData.events) {
                    if(event.type === 'pool') { // Adding all pool matchups
                        for(var i = 0; i < event.count; i++) { // Iterate through all the pools
                            if(event.pools[i].teams.length < 4) { // Add matchups for pools of 3
                                for(var j = 0; j < 3; j++) {
                                    for(var k = 0; k < j; k++) {
                                        if(j === k) continue;

                                        matchups.push({
                                            matchup: event.pools[i].teams[j] + ' vs ' + event.pools[i].teams[k],
                                            time: event.pools[i].matches[j][k].time.split('|')[0].trim(),
                                            place: event.pools[i].matches[j][k].time.split('|')[1].trim()
                                        });
                                    }
                                }
                                // matchups.push({
                                //     matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1],
                                //     time: event.pools[i].matches[0][1].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[0][1].time.split('|')[1].trim()
                                // });
                                // matchups.push({
                                //     matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2],
                                //     time: event.pools[i].matches[0][2].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[0][2].time.split('|')[1].trim()
                                // });
                                // matchups.push({
                                //     matchup: event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[2],
                                //     time: event.pools[i].matches[1][2].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[1][2].time.split('|')[1].trim()
                                // });
                            } else { // Add matchups for pools of 4
                                for(var j = 0; j < 4; j++) {
                                    for(var k = 0; k < j; k++) {
                                        if(j === k || k-j === j) continue;
                                        matchups.push({
                                            matchup: event.pools[i].teams[j] + ' vs ' + event.pools[i].teams[k],
                                            time: event.pools[i].matches[j][k].time.split('|')[0].trim(),
                                            place: event.pools[i].matches[j][k].time.split('|')[1].trim()
                                        });
                                    }
                                }
                                // matchups.push({
                                //     matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1],
                                //     time: event.pools[i].matches[0][1].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[0][1].time.split('|')[1].trim()
                                // });
                                // matchups.push({
                                //     matchup: event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2],
                                //     time: event.pools[i].matches[0][2].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[0][2].time.split('|')[1].trim()
                                // });
                                // matchups.push({
                                //     matchup: event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[3],
                                //     time: event.pools[i].matches[1][3].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[1][3].time.split('|')[1].trim()
                                // });
                                // matchups.push({
                                //     matchup: event.pools[i].teams[2] + ' vs ' + event.pools[i].teams[3],
                                //     time: event.pools[i].matches[2][3].time.split('|')[0].trim(),
                                //     place: event.pools[i].matches[2][3].time.split('|')[1].trim()
                                // });
                            }
                        }
                    } else if (event.type === 'single'){ // Adding bracket matches for single elim
                        for(var i = 0; i < event.main.matches.length; i++) {
                            matchups.push({
                                matchup: event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId,
                                time: event.main.matches[i].matchStatus.split('|')[0].trim(),
                                place: event.main.matches[i].matchStatus.split('|')[1].trim(),
                            });
                        }
                    } else { // Adding bracket matchups for double elim
                        for(var i = 0; i < event.main.matches.length; i++) {
                            matchups.push({
                                matchup: event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId,
                                time: event.main.matches[i].matchStatus.split('|')[0].trim(),
                                place: event.main.matches[i].matchStatus.split('|')[1].trim(),
                            });
                        }
                        for(var i = 0; i < event.back.matches.length; i++) {
                            matchups.push({
                                matchup: event.back.matches[i].sides?.[0]?.contestantId + ' vs ' + event.back.matches[i].sides?.[1]?.contestantId,
                                time: event.back.matches[i].matchStatus.split('|')[0].trim(),
                                place: event.back.matches[i].matchStatus.split('|')[1].trim(),
                            });
                        }
                    }
                }

                // Create a map of all the matches happening at different sites
                // Map structure is as follows
                //       Site
                //        ||
                //        \/
                //   Day and Court
                //        ||
                //        \/
                // Time and Matchup
                ////////////////////////////////////////////////////////////////

                console.log(matchups);

                var site = new Map();
                for(var i = 0; i < matchups.length; i++) {
                    if(matchups[i].time.includes(',') &&
                        matchups[i].place.includes(',')) {
                                
                        // Add a site to the map if a site exists
                        if (!site.has(matchups[i].place.split(',')[0].trim())) {
                            site.set(matchups[i].place.split(',')[0].trim(), new Map()); // Value of the site map is a day map
                        }

                        let dayMap = site.get(matchups[i].place.split(',')[0].trim()); // Set key of the day map

                            // Add the day and court the match is at if it exists
                            if(!dayMap.has(matchups[i].time.split(',')[0].trim() + ', ' + matchups[i].place.split(',')[1].trim())) {
                                dayMap.set(matchups[i].time.split(',')[0].trim() + ', ' + matchups[i].place.split(',')[1].trim(), new Map()); // Value of the day map is a time map
                            }

                            let timeMap = dayMap.get(
                                matchups[i].time.split(',')[0].trim() + ', ' + matchups[i].place.split(',')[1].trim() // Set key of the time map
                            );
            
                            // Add the time of the match and the matchup if it exists
                            if(!timeMap.has(matchups[i].time.split(',')[1].trim())) {
                                timeMap.set(matchups[i].time.split(',')[1].trim(), matchups[i].matchup); // Value of the time map is the matchup
                            }
                    }                    
                }

                // Rendering the schedule table
                scheduleWrapper.replaceChildren([]);

                for (let [key, dayMap] of site) {
                    // Creating a title for each schedule based on the number of sites
                    let siteSection = document.createElement('section');
                    let siteTitle = document.createElement('h1');
                    let siteName = document.createTextNode(key);
                    let siteDayList = [];

                    siteTitle.classList.add('pool-title');
                    siteTitle.appendChild(siteName);

                    siteSection.classList.add('schedule-group');
                    siteSection.appendChild(siteTitle); 

                    var dayTracker = new Set();

                    // For each unique day create a new table
                    for(let [key, timeMap] of dayMap) {
                        // If the day is not unique we skip iteration of this loops
                        if (dayTracker.has(key.split(',')[0].trim())) continue;

                        // Create the header for the schedule of that day
                        let dayTitle = document.createElement('h1');
                        let dayName = document.createTextNode(key.split(',')[0].trim());
                        dayTitle.appendChild(dayName);

                        dayTracker.add(key.split(',')[0].trim()); // Keep track of this day

                        // Create a table to place matchups
                        let table = document.createElement('tbl');
                        let tableBody = document.createElement('tbody');
                        let headerRow = document.createElement('tr');

                        let courts = [];
                        let times = []; 
                        
                        // Go through the dayMap again
                        for(let [tkey, value] of dayMap) {
                            // If a a timeMap has not been gone through yet skip iteration of this loop
                            if(key.split(',')[0].trim() !== tkey.split(',')[0].trim()) continue;                             

                            // Add the court to the array
                            courts.push(tkey.split(',')[1].trim());

                            // Add the time of the matchup
                            let timeMap = dayMap.get(tkey);
                            for(let [rkey, value] of timeMap) {
                                if(!times.includes(rkey)) {
                                    times.push(rkey);
                                }
                            }
                        }
                        
                        courts.sort();
                        times.sort((a, b) => {
                            let aD = new Date();
                            let bD = new Date();

                            aD.setHours(parseInt(a.split(':')[0]) + 12 * a.toLocaleLowerCase().endsWith('pm'), parseInt(a.split(':')[1].substring(0, 2)));
                            bD.setHours(parseInt(b.split(':')[0]) + 12 * b.toLocaleLowerCase().endsWith('pm'), parseInt(b.split(':')[1].substring(0, 2)));

                            if(aD < bD) return -1;
                            else if(aD > bD) return 1;
                            else return 0;
                        });

                        // Rendering the cells of the header row of the table
                        for(let i = 0; i <= courts.length; i++) {
                            let cell = document.createElement('td');
                            if(i === 0) {
                                let cText = document.createTextNode(' ');
                                cell.appendChild(cText);
                                cell.classList.add('cell-wrapper');
                                headerRow.appendChild(cell);
                            } else {
                                let cText = document.createTextNode(courts[i-1]);
                                cell.appendChild(cText);
                                cell.classList.add('cell-wrapper');
                                headerRow.appendChild(cell);
                            }
                            
                        }

                        tableBody.appendChild(headerRow);

                        // Rendering the actual schedule in the table
                        for(let i = 0; i < times.length; i++) {
                            let row = document.createElement('tr');
                            let cell = document.createElement('td');
                            let cText = document.createTextNode(times[i]);
                            cell.appendChild(cText);
                            cell.classList.add('cell-wrapper');
                            row.appendChild(cell);
                            for(let j = 0; j < courts.length; j++) {
                                let cValue = ' ';
                                for (let [key, dayMap] of site) {
                                    for (let [key, timeMap] of dayMap) {
                                        if (key.split(',')[1].trim() === courts[j]) {
                                            if (timeMap.has(times[i])) {
                                                cValue = timeMap.get(times[i]);
                                            }
                                        }
                                    }
                                }
                                let cell = document.createElement('td');
                                let cText = document.createTextNode(cValue);
                                cell.appendChild(cText);
                                cell.classList.add('cell-wrapper');
                                row.appendChild(cell);
                            } 
                            tableBody.appendChild(row);
                        }
                        
                        table.appendChild(tableBody);
                        siteDayList.push({
                            'dayName': dayName,
                            'dayTitle': dayTitle,
                            'table': table
                        });
                    }

                    siteDayList.sort((a, b) => Math.max(-1, Math.min(1, dayOrder[a.dayTitle] - dayOrder[b.dayTitle])));
                    siteDayList.forEach(dayObj => {
                        siteSection.appendChild(dayObj.dayTitle);
                        siteSection.appendChild(dayObj.table);
                    })

                    scheduleWrapper.appendChild(siteSection);
                }
            } else { // Rendering brackets or pools depending on the event type          
                const event = tournamentData.events[index];
                eventTitle.textContent = tournamentData.name + ': ' + event.name;

                if(event.type === 'single') { // Rendering a single elimination bracket
                    mainDraw.classList.remove('hidden');

                    if(!mainBracket) {
                        mainBracket = bracketry.createBracket(event.main, mainWrapper, options('main'));
                    } else {
                        mainBracket.replaceData(event.main);
                    }
                }

                if(event.type === 'double') { // Rendering a double elimination bracket
                    backDraw.classList.remove('hidden');
                    mainDraw.classList.remove('hidden');

                    if(!mainBracket) {
                        mainBracket = bracketry.createBracket(event.main, mainWrapper, options('main'));
                    } else {
                        mainBracket.replaceData(event.main);
                    }

                    if(!backBracket) {
                        backBracket = bracketry.createBracket(event.back, backWrapper, options('back'));
                    } else {
                        backBracket.replaceData(event.back);
                    }
                }

                if(event.type === 'pool') { // Rendering pool play
                    poolPlay.classList.remove('hidden');

                    poolPlayWrapper.replaceChildren([]);

                    // Generate a table for each pool
                    for(var i = 0; i < event.count; i++) {
                        // Generate a single table
                        var poolTable = document.createElement('tbl');
                        var poolTableBody = document.createElement('tbody');

                        var poolTitle = document.createElement('p');
                        var poolTitleText = document.createTextNode('Pool ' + (i+1));
                        poolTitle.appendChild(poolTitleText);
                        poolTitle.classList.add('pool-title');


                        // Generate the rows for the table
                        for (var j = 0; j < event.pools[i].teams.length+1; j++) { 
                            var row = document.createElement('tr');

                            // Generate cells for each match up
                            for(var k = 0; k < event.pools[i].teams.length+1; k++) {

                                var cell = document.createElement('td')
                                cell.dataset.i = i;
                                cell.dataset.j = j-1;
                                cell.dataset.k = k-1;

                                // Rendering cells in the table based on positions
                                if (j === 0 && k === 0) { // Setting first cell of the table to be empty
                                    var cellText = document.createTextNode('');
                                }
                                else if(j - k === 0) { // Setting 'disabled' cells
                                    var cellText = document.createTextNode('');
                                    cell.style.backgroundColor = "black";
                                }
                                else if (j === 0 || k === 0) { // Setting the row/column headers to the teams/players
                                    var cellText = document.createTextNode(event.pools[i].teams[Math.max(j,k)-1]);
                                }
                                else { // Setting the cells that are for the matchups
                                    if (event.pools[i].matches[j-1][k-1].score === 0 && event.pools[i].matches[k-1][j-1].score === 0) {
                                        var cellText = document.createTextNode(event.pools[i].matches[j-1][k-1].time);
                                    }
                                    else {
                                        var cellText = document.createTextNode(event.pools[i].matches[j-1][k-1].score);
                                    }
                                }
                                
                                // Setting 'disabled' cells for pools of 4
                                if((event.pools[i].teams.length === 4) &&
                                    ((j === 4 && k === 1) ||
                                    (j === 3 && k === 2) ||
                                    (j === 2 && k === 3) ||
                                    (j === 1 && k === 4))) {
                                        var cellText = document.createTextNode('');
                                        cell.style.backgroundColor = "black";
                                }
                                
                                cell.appendChild(cellText);
                                if(j > 0 && k > 0) {
                                    cell.title = event.pools[i].matches[j-1][k-1].time;
                                }
                                cell.classList.add('cell-wrapper');

                                row.appendChild(cell);
                            }
                            poolTableBody.appendChild(row);
                        }
                        poolTable.appendChild(poolTableBody);
                        poolPlayWrapper.appendChild(poolTitle);
                        poolPlayWrapper.appendChild(poolTable);
                        poolPlayWrapper.addEventListener('click', poolClickHandler);
                    }  
                    
                    const playermap = new Map();

                    for(var k = 0; k < event.teams.length; k++){
                      playermap.set(event.teams[k], {
                        won: 0, 
                        loss: 0
                      })
                    }
                    console.log(playermap)
                    for(const pool of event.pools)
                    {
                      for(var i = 0; i < pool.teams.length; i++){
                        for(var j = 0; j < pool.teams.length; j++){
                          playermap.get(pool.teams[i]).won += pool.matches[i][j].score
                          playermap.get(pool.teams[j]).loss += pool.matches[i][j].score
                          }
                      }
                    }
                    
                    // Keep track of each players/teams W/L record for ranking purposes
                    const RankedArray = Array.from(playermap.entries()).toSorted((a,b)=> {
                        if(a[1].won + a[1].loss === 0) {
                            return 1;
                        }

                        if(b[1].won + b[1].loss === 0) {
                            return -1;
                        } 

                        return b[1].won * (a[1].won + a[1].loss) - a[1].won * (b[1].won + b[1].loss);
                    })                    

                    console.log(RankedArray)

                    // Rendering the leaderboard for pool play
                    Leaderboard.replaceChildren([])

                    var poolTable = document.createElement('tbl');
                    var poolTableBody = document.createElement('tbody');

                    var poolTitle = document.createElement('p');
                    var poolTitleText = document.createTextNode('Leaderboard');
                    poolTitle.appendChild(poolTitleText);
                    poolTitle.classList.add('leaderboards-title');

                    var header = document.createElement('tr');
                    var rHeader = document.createElement('td')
                    var nHeader = document.createElement('td')
                    var kHeader = document.createElement('td')
                    rHeader.textContent = 'Rank';
                    nHeader.textContent = 'Team'
                    kHeader.textContent = 'Win-%'
                    
                    rHeader.classList.add("cell-wrapper")
                    nHeader.classList.add("cell-wrapper")
                    kHeader.classList.add("cell-wrapper")

                    header.appendChild(rHeader)
                    header.appendChild(nHeader)
                    header.appendChild(kHeader)
                    poolTableBody.appendChild(header)
                    

                    for(var i = 0; i < RankedArray.length; i++){
                        var row = document.createElement('tr');
                        var ratio = document.createElement('td')
                        var name = document.createElement('td')
                        var rank = document.createElement('td')
                        rank.textContent = i+1;
                        name.textContent = RankedArray[i][0]
                        ratio.textContent = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(RankedArray[i][1].won * 100 / (RankedArray[i][1].won + RankedArray[i][1].loss))  + '%'
                        
                        row.appendChild(rank)
                        row.appendChild(name)
                        row.appendChild(ratio)
                        poolTableBody.appendChild(row)
                        rank.classList.add("cell-wrapper")
                        name.classList.add("cell-wrapper")
                        ratio.classList.add("cell-wrapper")
                    }

                    cell.classList.add('leaderboard-wrapper');
                    poolTable.appendChild(poolTableBody);
                    Leaderboard.appendChild(poolTitle);
                    Leaderboard.appendChild(poolTable);
                }
            }
        };

        addEventTabs();

        eventTabs.addEventListener('click', (event) => {
            if('index' in event.target.dataset) {
                eventTabs.children[index+1].classList.remove('open');
                index = parseInt(event.target.dataset.index);
                loadEvent(index);
            }
        });

        optionButton.addEventListener('click', (event) => {
            if(!optionMenu.classList.contains('active')) {
                event.stopPropagation();
            }

            optionMenu.classList.toggle('active');

            document.querySelector('.options.hidden')?.classList.remove('hidden');
            
            window.addEventListener("click", (event) => {
                if(!optionButton.contains(event.target)) {
                    optionMenu.classList.remove('active');
                }
            }, { once: true });
        });        

        addEvent.addEventListener('click', () => window.location.href = '/load.html?id=' + searchParams.get('id'));
        
        removeEvent.addEventListener('click', () => {
            if(index !== -1) {
                swal({
                    title: 'Are you sure?',
                    text: 'Once deleted, you cannot recover this event!',
                    icon: 'warning',
                    buttons: true,
                    dangerMode: true,
                })
                .then(async (willDelete) => {
                    if (willDelete) {
                        tournamentData.events.splice(index, 1);

                        index = -1;

                        await update();
                        
                        new Noty({
                            type: 'success',
                            layout: 'topRight',
                            theme: 'relax',
                            text: 'Done!',
                            closeWith: ['click', 'button'],
                            timeout: 3000
                        }).show();                        
                    }
                });
            }
        });

        verifyTimes.addEventListener('click', () => verify(index));

        clearButton.addEventListener('click', () => {
            timeField.value = '';
            dateTimePicker.setDate(undefined);
        })

        index = -1;
        loadEvent(-1);
    } catch(error) {
        console.log(error);

        // window.location.href="/404.html";
    }
})();