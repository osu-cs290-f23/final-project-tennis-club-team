(async () => {    
    const axios = require('axios/dist/browser/axios.cjs');

    const tl = document.querySelector('#tournament-list');

    var data = await axios('/tournaments');

    for(const tourney of data.data) {
        const tElement = document.createElement('div');
        const tLink = document.createElement('a');

        tElement.classList.add('tournament');
        tLink.href = '/tournament.html?id=' + tourney._id;    
        tLink.innerText = tourney.name;

        tElement.appendChild(tLink);
        tl.appendChild(tElement);
    }
})();