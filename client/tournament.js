(async () => {
    //Require dependencies here
    const axios = require('axios/dist/browser/axios.cjs');
    const bracketry = require('bracketry');
    const grid = require('gridjs');
    var _ = require('lodash');

    //State variables
    var index = 0;
    var selectedBracket = null;
    var selectedMatch = null;

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
            if(index !== -1) {
                if(tournamentData.events[index].type !== 'pool') {
                    tournamentData.events[index].main = mainBracket.getAllData();
                }

                if(tournamentData.events[index].type === 'double') {
                    tournamentData.events[index].back = backBracket.getAllData();
                }
            }
    
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

            //TODO: Alter this
            if(index === -1) {
                index = 0;
            }

            addEventTabs();    
            loadEvent(index);
        };
        
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
            tournamentData.events[index].main.contestants[playerAField.value] = playerAField.value;
            tournamentData.events[index].main.contestants[playerBField.value] = playerBField.value;

            if(tournamentData.events[index].type === 'double') {
                tournamentData.events[index].back.contestants[playerAField.value] = playerAField.value;
                tournamentData.events[index].back.contestants[playerBField.value] = playerBField.value;
            }
    
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
    
            update();
        };
    
        const bracketModal = new HystModal({
            beforeOpen: modalOpen,
            afterClose: modalClose
        });
    
        const matchClickHandler = (match) => {
            selectedMatch = _.cloneDeep(match);
    
            bracketModal.open('#bracketModal');  
        };

        const loadEvent = (index) => {
            eventTabs.children[index].classList.add('open');

            const event = tournamentData.events[index];
          
            eventTitle.textContent = tournamentData.name + ': ' + event.name;

            poolPlay.classList.add('hidden');
            mainDraw.classList.add('hidden');
            backDraw.classList.add('hidden');

            // Change this to display the schedule by default
            // if(!mainBracket) {
            //     mainBracket = bracketry.createBracket(event.main, mainWrapper, options('main'));
            // } else {
            //     mainBracket.replaceData(event.main);
            // }

            // var table = document.createElement('table');
            // var tableBody = document.createElement('tbody');
            // var row = document.createElement('tr');
            // var cell = document.createElement('td');
            // var cellText = document.createTextNode('TBA');
 
            // cell.appendChild(cellText);
            // row.appendChild(cell);
            // tableBody.appendChild(row);
            // table.appendChild(tableBody);
            // schedule.appendChild(table); 

            // Change this so that all events that are not being displayed are removed
            if(event.type === 'single') {
                schedule.classList.add('hidden');
                mainDraw.classList.remove('hidden');

                if(!mainBracket) {
                    mainBracket = bracketry.createBracket(event.main, mainWrapper, options('main'));
                } else {
                    mainBracket.replaceData(event.main);
                }
            }

            if(event.type === 'double') {
                schedule.classList.add('hidden');
                backDraw.classList.remove('hidden');

                if(!backBracket) {
                    backBracket = bracketry.createBracket(event.back, backWrapper, options('back'));
                } else {
                    backBracket.replaceData(event.back);
                }
            }

            if(event.type === 'pool') {
                schedule.classList.add('hidden');
                poolPlay.classList.remove('hidden');

                poolPlayWrapper.replaceChildren([]);

                // Generate a table for each pool
                for(var i = 0; i < event.count; i++) {
                    // Generate a single table
                    var poolTable = document.createElement('tbl');
                    var poolTableBody = document.createElement('tbody');

                    // Generate the rows for the table
                    for (var j = 0; j < event.pools[i].teams.length+1; j++) { 
                        var row = document.createElement('tr');

                        // Generate cells for each match up
                        for(var k = 0; k < event.pools[i].teams.length+1; k++) {
                            var cell = document.createElement('td');
                            if(j === 0 && k === 0)
                                var cellText = document.createTextNode('');
                            else if (j === 0 || k === 0)
                                var cellText = document.createTextNode(event.pools[i].teams[Math.max(j,k)-1]);
                            else
                                var cellText = document.createTextNode(event.pools[i].matches[j-1][k-1].time);
                            
                            cell.appendChild(cellText);
                            row.appendChild(cell);
                        }
                        poolTableBody.appendChild(row);
                    }
                    poolTable.appendChild(poolTableBody);
                    poolPlayWrapper.appendChild(poolTable);
                }  
            }
        };

        addEventTabs();

        eventTabs.addEventListener('click', (event) => {
            eventTabs.children[index].classList.remove('open');
            index = parseInt(event.target.dataset.index);
            loadEvent(event.target.dataset.index);
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
            if(index) {
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

        index = 0;
        loadEvent(0);
    } catch(error) {
        new Noty({
            type: 'error',
            layout: 'topRight',
            theme: 'relax',
            text: 'Error loading event!',
            closeWith: ['click', 'button'],
            timeout: 3000
        }).show();

        console.log(error);
    }
})();