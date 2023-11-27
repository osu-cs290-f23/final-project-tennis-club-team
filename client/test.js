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

var selectedMatch = 'somethingNew';

(async () => {
    const wrapper = document.querySelector('#bracket');
    const data = await axios('http://localhost:3000/tournaments/655aad5fc2bc1f4db1207ede');

    const modalOpen = (modal) => {
        playerAField.value = selectedMatch.sides[0].contestantId;
        playerBField.value = selectedMatch.sides[1].contestantId;
        timeField.value = selectedMatch.matchStatus?.split('|')[0].trim();
        placeField.value = selectedMatch.matchStatus?.split('|')[1].trim();

        if(selectedMatch.sides[0].scores) {
            aScoreMain.value = selectedMatch.sides[0].scores[0].mainScore;
            aScoreSub.value = selectedMatch.sides[0].scores[0].subscore;
        }

        if(selectedMatch.sides[1].scores) {
            bScoreMain.value = selectedMatch.sides[1].scores[0].mainScore;
            bScoreSub.value = selectedMatch.sides[1].scores[0].subscore;
        }
    };

    const modalClose = (modal) => {
        selectedMatch.sides[0].contestantId = playerAField.value;
        selectedMatch.sides[1].contestantId = playerBField.value;
        selectedMatch.matchStatus = timeField.value + ' | ' + placeField.value;

        if(aScoreMain.value !== '') {
            if(!selectedMatch.sides[0].scores) {
                selectedMatch.sides[0].scores = [{}];
            }
            
            selectedMatch.sides[0].scores[0].mainScore = aScoreMain.value;
            selectedMatch.sides[0].scores[0].subscore = aScoreSub.value;
        }

        if(bScoreMain.value !== '') {
            if(!selectedMatch.sides[1].scores) {
                selectedMatch.sides[1].scores = [{}];
            }

            selectedMatch.sides[1].scores[0].mainScore = bScoreMain.value;
            selectedMatch.sides[1].scores[0].subscore = bScoreSub.value;
        }

        bracket.applyMatchesUpdates([selectedMatch]);
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