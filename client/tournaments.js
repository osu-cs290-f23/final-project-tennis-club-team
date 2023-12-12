// Tournament list page

(async () => {    
    const axios = require('axios/dist/browser/axios.cjs');

    const tl = document.querySelector('#tournament-list');

    var data;

    const load = () => {
        tl.replaceChildren([]);

        for(const tourney of data.data) {
            const tElement = document.createElement('div');
            const tLink = document.createElement('a');
            const rBtn = document.createElement('button');

            const trash = document.createElement('i');
            trash.classList.add('fa');
            trash.classList.add('fa-trash-o');


            tElement.classList.add('tournament');
            tLink.href = '/tournament.html?id=' + tourney._id;    
            tLink.innerText = tourney.name;

            // rBtn.textContent = 'Delete';
            rBtn.addEventListener('click', async () => {
                swal({
                    title: 'Are you sure?',
                    text: 'Once deleted, you cannot recover this tournament!',
                    icon: 'warning',
                    buttons: true,
                    dangerMode: true,
                })
                .then(async (willDelete) => {
                    if (willDelete) {
                        try {
                            data = await axios({
                                method: 'delete',
                                url: '/tournaments?id=' + tourney._id
                            });

                            load();
                            
                            new Noty({
                                type: 'success',
                                layout: 'topRight',
                                theme: 'relax',
                                text: 'Done!',
                                closeWith: ['click', 'button'],
                                timeout: 3000
                            }).show();  
                        } catch(error) {
                            console.error('Error', error);

                            new Noty({
                                type: 'error',
                                layout: 'topRight',
                                theme: 'relax',
                                text: 'Could not delete!',
                                closeWith: ['click', 'button'],
                                timeout: 3000
                            }).show();  
                        }           
                    }
                });
            });

            tElement.appendChild(tLink);
            tElement.appendChild(rBtn);
            rBtn.appendChild(trash);
            tl.appendChild(tElement);
        }
    };

    data = await axios('/tournaments');

    load();
})();