var XLSX = require("xlsx");

const fp = document.querySelector('#file-picker');

fp.addEventListener('change', async () => {
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
    const list = [];

    if(range.s.c === 0 && range.e.c === 0 && range.s.r === 0) {
        for(var i = range.s.r; i <= range.e.r; i++) {
            list.push(players[XLSX.utils.encode_cell({ c: 0, r: i })].v);
        }
    }

    console.log(list);
});