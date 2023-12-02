const axios = require('axios/dist/browser/axios.cjs');

const tl = document.querySelector('#tournament-list');

(async () => {    
    var data = await axios('http://localhost:3000/tournaments');

    for(const tourney of data.data) {
        const tElement = document.createElement('div');
        const tLink = document.createElement('a');

        tElement.classList.add('tournament');
        tLink.href = 'http://localhost:3000/tournaments/' + tourney._id;    
        tLink.innerText = tourney.name;

        tElement.appendChild(tLink);
        tl.appendChild(tElement);
    }
})();