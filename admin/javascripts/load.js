// Loading players into an event

(async () => {
    const axios = require('axios/dist/browser/axios.cjs');
    var Sortable = require('@shopify/draggable').Sortable;
    var XLSX = require('xlsx');

    //Input elements
    const fn = document.querySelector('#file-name');
    const fp = document.querySelector('#file-picker');
    const fw = document.querySelector('#file-wrapper');
    const pl = document.querySelector('#player-list');
    const ef = document.querySelector('#event-form');
    const fs = document.querySelector('#form-submit');

    //Define tournament search fields
    const url = document.URL;
    const searchParams = new URLSearchParams(url.split('?')[1]);  

    const sortable = new Sortable(pl, {
        draggable: 'li',
    });

    const addPlayer = (player) => {
        const playerEntry = document.createElement('li');

        for(const child of pl.children) {
            if(child.textContent === player) {
                new Noty({
                    type: 'error',
                    layout: 'topRight',
                    theme: 'relax',
                    text: `${player} is already in the draw!`,
                    closeWith: ['click', 'button'],
                    timeout: 2000
                }).show();

                return;
            }
        }

        playerEntry.textContent = player;

        pl.appendChild(playerEntry);
    }

    fw.addEventListener('click', () => { fp.click(); });

    fp.addEventListener('change', async () => {
        try {
            if(fp.files.length === 0) {
                return;
            }

            fn.textContent = fp.files[0].name;

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

            pl.replaceChildren([]);
        
            const workbook = XLSX.read(data);
            const players = workbook.Sheets[workbook.SheetNames[0]];
            const range = XLSX.utils.decode_range(players['!ref']);

            if(range.s.c === 0 && range.e.c === 0 && range.s.r === 0) {
                for(var i = range.s.r; i <= range.e.r; i++) {
                    addPlayer(players[XLSX.utils.encode_cell({ c: 0, r: i })].v);
                }
            }

            new Noty({
                type: 'success',
                layout: 'topRight',
                theme: 'relax',
                text: 'Loaded players!',
                closeWith: ['click', 'button'],
                timeout: 3000
            }).show()
        } catch(error) {
            new Noty({
                type: 'error',
                layout: 'topRight',
                theme: 'relax',
                text: 'Could not load players!',
                closeWith: ['click', 'button'],
                timeout: 2000
            }).show();
        }
    });

    ef.addEventListener('submit', async (event) => {
        event.stopPropagation();
        event.preventDefault();

        if(event.submitter === fs) {
            const data = {
                name: document.querySelector('#name').value,
                type: document.querySelector('input[type="radio"]:checked').value,
                players: Array.from(pl.children).map((player) => player.textContent)
            };
        
            try {
                if(!searchParams.has('id') || !data.name || !data.type || !data.players || !data.players.length) {
                    throw 'Validation failed';
                }

                const result = await axios.post('/tournaments/' + searchParams.get('id') + '/addevent', data, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if(result.status !== 200) {
                    throw 'Could not send event!';
                }

                window.location.href = '/tournament.html?id=' + searchParams.get('id');
            } catch(error) {
                new Noty({
                    type: 'error',
                    layout: 'topRight',
                    theme: 'relax',
                    text: 'Error creating event!',
                    closeWith: ['click', 'button'],
                    timeout: 3000
                }).show();
            }
        }
    });
})();