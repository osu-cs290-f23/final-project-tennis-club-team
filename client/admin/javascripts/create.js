(async () => {    
    const axios = require('axios/dist/browser/axios.cjs');

    const nameField = document.querySelector('#name-box');
    const submitButton = document.querySelector('#right-button');

    submitButton.addEventListener('click', async () => {
        if(nameField.value) {
            try {
                const result = await axios.post('/tournaments/create', { name: nameField.value }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                window.location.href = '/tournament.html?id=' + result.data;

                return;
            } catch(error) {
                console.log(error);
            }
        }

        new Noty({
            type: 'error',
            layout: 'topRight',
            theme: 'relax',
            text: 'Error creating tournament!',
            closeWith: ['click', 'button'],
            timeout: 3000
        }).show();
    });
})();