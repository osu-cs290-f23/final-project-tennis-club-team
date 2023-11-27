const axios = require('axios/dist/browser/axios.cjs');
const bracketry = require('bracketry');
var _ = require('lodash');

//Define form data fields
const playerAField = document.querySelector('#player-a-name');
const playerBField = document.querySelector('#player-b-name');
const timeField = document.querySelector('#time');
const placeField = document.querySelector('#place');
const aScoreMain = document.querySelector('#a-score-main');
const aScoreSub = document.querySelector('#a-score-sub');
const bScoreMain = document.querySelector('#b-score-main');
const bScoreSub = document.querySelector('#b-score-sub');

(async () => {
    const wrapper = document.querySelector('#bracket');
    var data = await axios('http://localhost:3000/tournaments/655aad5fc2bc1f4db1207ede');

    const update = async () => {
        data.data.events[7].main = bracket.getAllData();

        data = await await axios.post('/tournaments/655aad5fc2bc1f4db1207ede/update', data.data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        bracket.replaceData(data.data.events[7].main);
    };

    const modalOpen = (modal) => {
        playerAField.value = selectedMatch.sides[0]?.contestantId;
        playerBField.value = selectedMatch.sides[1]?.contestantId;

        timeField.value = selectedMatch.matchStatus?.split('|')[0].trim();
        placeField.value = selectedMatch.matchStatus?.split('|')[1].trim();

        aScoreMain.value = selectedMatch.sides?.[0].scores?.[0]?.mainScore;
        aScoreSub.value = selectedMatch.sides?.[0].scores?.[0]?.subscore;

        bScoreMain.value = selectedMatch.sides?.[1].scores?.[0]?.mainScore;
        bScoreSub.value = selectedMatch.sides?.[1].scores?.[0]?.subscore;
    };

    const modalClose = (modal) => {
        data.data.events[7].main.contestants[playerAField.value] = playerAField.value;
        data.data.events[7].main.contestants[playerBField.value] = playerBField.value;

        selectedMatch.sides[0] = {
            contestantId: playerAField.value,
            scores: [
                {
                    mainScore: aScoreMain.value,
                    subscore: aScoreSub.value
                }
            ]
        };

        console.log(aScoreMain.value, selectedMatch.sides[0]);

        selectedMatch.sides[1] = {
            contestantId: playerBField.value,
            scores: [
                {
                    mainScore: bScoreMain.value,
                    subscore: bScoreSub.value
                }
            ]
        };

        if(!timeField.value) {
            timeField.value = 'TBA';
        }

        if(!placeField.value) {
            placeField.value = 'TBA';
        }

        selectedMatch.matchStatus = timeField.value + ' | ' + placeField.value;

        bracket.applyMatchesUpdates([selectedMatch]);

        update();
    };

    const myModal = new HystModal({
        linkAttributeName: "data-hystmodal",
        beforeOpen: modalOpen,
        afterClose: modalClose
    });

    const matchClickHandler = (match) => {
        selectedMatch = _.cloneDeep(match);

        myModal.open('#myModal');  
    };
    
    const options = {
        onMatchClick: matchClickHandler
    };

    const bracket = bracketry.createBracket(data.data.events[7].main, wrapper, options);
})();