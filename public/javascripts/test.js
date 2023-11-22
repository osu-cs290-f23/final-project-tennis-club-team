const axios = require('axios/dist/browser/axios.cjs');
const bracketry = require('bracketry');

(async () => {
    const wrapper = document.querySelector('#bracket');
    const data = await axios('http://localhost:3000/tournaments/655aad5fc2bc1f4db1207ede/fetch');

    console.log(data);
    console.log(data.data);

    bracketry.createBracket(data.data, wrapper);
})();