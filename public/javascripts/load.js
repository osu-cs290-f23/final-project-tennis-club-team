const axios = require('axios/dist/browser/axios.cjs');
var Sortable = require('@shopify/draggable').Sortable;
var XLSX = require('xlsx');

const fp = document.querySelector('#file-picker');
const pl = document.querySelector('#player-list');
const pn = document.querySelector('#player-name');
const lp = document.querySelector('#load-player');
const lps = document.querySelector('#load-players');
const ef = document.querySelector('#event-form');

const sortable = new Sortable(pl, {
    draggable: 'li',
});

const addPlayer = (player) => {
    const playerEntry = document.createElement('li');

    for(const child of pl.children) {
        if(child.textContent === player) {
            alert(`A player with name ${player} is already in the draw!`);

            return;
        }
    }

    playerEntry.textContent = player;

    pl.appendChild(playerEntry);
}

lp.addEventListener('click', async () => {
    if(pn.value) {
        addPlayer(pn.value);
    }
});

lps.addEventListener('click', async () => {
    const data = await new Promise((resolve, reject) => {
        var reader = new FileReader();

        reader.addEventListener('load', () => {
            resolve(reader.result);
        });

        reader.addEventListener('error', () => {
            reject('error');
        });

        reader.addEventListener('abort', () => {
            reject('abort');
        });

        reader.readAsArrayBuffer(fp.files[0]);

        setTimeout(() => {
            reader.abort();
        }, 5000);
    });

    const workbook = XLSX.read(data);
    const players = workbook.Sheets[workbook.SheetNames[0]];
    const range = XLSX.utils.decode_range(players['!ref']);

    if(range.s.c === 0 && range.e.c === 0 && range.s.r === 0) {
        for(var i = range.s.r; i <= range.e.r; i++) {
            addPlayer(players[XLSX.utils.encode_cell({ c: 0, r: i })].v);
        }
    }
});

ef.addEventListener('submit', async (event) => {
    event.stopPropagation();
    event.preventDefault();

    const data = {
        name: document.querySelector('#name').value,
        type: document.querySelector('input[type="radio"]:checked').value,
        players: Array.from(pl.children).map((player) => player.textContent)
    };

    await axios.post('/tournaments/655aad5fc2bc1f4db1207ede/addevent', data, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
});