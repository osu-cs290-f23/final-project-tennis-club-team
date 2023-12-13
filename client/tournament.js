// Viewing a single event

(async () => {
    //Require dependencies here
    const axios = require('axios/dist/browser/axios.cjs');
    const bracketry = require('bracketry');
    var _ = require('lodash');

    //State variables
    var index = 0;
    var selectedBracket = null;
    var selectedMatch = null;
    const scheduleInfo = new Map([]);


    //Define tournament search fields
    const url = document.URL;
    const searchParams = new URLSearchParams(url.split('?')[1]);  
    
    //Define event title
    const eventTitle = document.querySelector('#event-title');
    
    //Define modal form fields
    const playerAField = document.querySelector('#a-name');
    const playerBField = document.querySelector('#b-name');
    const timeField = document.querySelector('#time');
    const placeField = document.querySelector('#place');
    const aScoreMain = document.querySelector('#a-score-main');
    const aScoreSub = document.querySelector('#a-score-sub');
    const bScoreMain = document.querySelector('#b-score-main');
    const bScoreSub = document.querySelector('#b-score-sub');

    const optionMenu = document.querySelector(".select-menu");
    const optionButton = optionMenu.querySelector(".select-btn");
    const addEvent = optionMenu.querySelector("#add-event");
    const removeEvent = optionMenu.querySelector("#remove-event");

    //Define html data locations
    const backDraw = document.querySelector('#back-draw');
    const mainDraw = document.querySelector('#main-draw');
    const mainWrapper = document.querySelector('#main-bracket');
    const backWrapper = document.querySelector('#back-bracket');
    const poolPlay = document.querySelector('#pool-play');
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

        const style = {
            rootBorderColor: 'transparent',
            rootFontFamily: 'Comfortaa',
        };

        const options = (bracket) => {
            return {
                ...style,
                navButtonsPosition: 'overTitles',
                useClassicalLayout: true,
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
            placeField.value = match1.time.split('|')[1].trim();
    
            aScoreMain.value = match1.score;
            //aScoreSub.value = match2.score;
    
            bScoreMain.value = match2.score;
            //bScoreSub.value = selectedMatch.sides?.[1]?.scores?.[0]?.subscore;
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
            
            if(bScoreMain.value)    
                match2.score = parseInt(bScoreMain.value);

            // Setting the time and place correctly
            if(!timeField.value)
                timeField.value = 'TBA'

            if(!placeField.value)
                placeField.value = 'TBA'

            match1.time = timeField.value + ' | ' + placeField.value;
            match2.time = match1.time;

            // Adding players, time, and place to schedule information
            

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
            placeField.value = selectedMatch.matchStatus?.split('|')[1].trim();
    
            aScoreMain.value = selectedMatch.sides?.[0]?.scores?.[0]?.mainScore;
            aScoreSub.value = selectedMatch.sides?.[0]?.scores?.[0]?.subscore;
    
            bScoreMain.value = selectedMatch.sides?.[1]?.scores?.[0]?.mainScore;
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
    
            if(!placeField.value) {
                placeField.value = 'TBA';
            }
    
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
            selectedMatch = event.target;
            poolModal.open('#bracketModal');
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
                                matchups.push(event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1]);
                                matchups.push(event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2]);
                                matchups.push(event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[2]);
                            } else { // Add matchups for pools of 4
                                matchups.push(event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[1]);
                                matchups.push(event.pools[i].teams[0] + ' vs ' + event.pools[i].teams[2]);
                                matchups.push(event.pools[i].teams[1] + ' vs ' + event.pools[i].teams[3]);
                                matchups.push(event.pools[i].teams[2] + ' vs ' + event.pools[i].teams[3]);
                            }
                        }
                    } else if (event.type === 'single'){ // Adding bracket matches for single elim
                        for(var i = 0; i < event.main.matches.length; i++) {
                            matchups.push(event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId);
                        }
                    } else { // Adding bracket matchups for double elim
                        for(var i = 0; i < event.main.matches.length; i++) {
                            matchups.push(event.main.matches[i].sides?.[0]?.contestantId + ' vs ' + event.main.matches[i].sides?.[1]?.contestantId);
                        }
                        for(var i = 0; i < event.back.matches.length; i++) {
                            matchups.push(event.back.matches[i].sides?.[0]?.contestantId + ' vs ' + event.back.matches[i].sides?.[1]?.contestantId);
                        }
                    }
                }

                
                console.log(matchups.length);
                for(var i = 0; i < matchups.length; i++) {
                    console.log(matchups[i]);
                }

                //TODO: Render schedule here
            } else {          
                const event = tournamentData.events[index];
                eventTitle.textContent = tournamentData.name + ': ' + event.name;

                if(event.type === 'single') {
                    mainDraw.classList.remove('hidden');

                    if(!mainBracket) {
                        mainBracket = bracketry.createBracket(event.main, mainWrapper, options('main'));
                    } else {
                        mainBracket.replaceData(event.main);
                    }
                }

                if(event.type === 'double') {
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

                if(event.type === 'pool') {
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
                                    if (event.pools[i].matches[j-1][k-1].score === 0) {
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

        index = -1;
        loadEvent(-1);
    } catch(error) {
        // new Noty({
        //     type: 'error',
        //     layout: 'topRight',
        //     theme: 'relax',
        //     text: 'Error loading event!',
        //     closeWith: ['click', 'button'],
        //     timeout: 3000
        // }).show();
        window.location.href="/404.html";

        // console.log(error);
    }
})();