const socket = io();

initLobby();

function initLobby() {
    socket.emit('game list', {name: 'tic-tac-toe'});
    const refreshListBtn = document.querySelector('#refresh-list');
    refreshListBtn.onclick = function() {
        socket.emit('game list', {name: 'tic-tac-toe'});
    };
    const createMatchBtn = document.querySelector('#create-match');
    createMatchBtn.onclick = function() {
        socket.emit('create match', {
            name: 'tic-tac-toe',
            user: getUser()
        })
    }
}

function getUser() {
    const localData = !!(localStorage.getItem('com.tabletoplobby.sty'))
    ? JSON.parse(localStorage.getItem('com.tabletoplobby.sty'))
    : {username: 'Anon', id: getRndCode()};
    localData.user = !!localData.user ? localData.user : {username: 'Anon', id: getRndCode()};
    return localData.user;
}

function getRndCode() {
    let rndCode = ``;
    for(let i = 0; i < 10; i++) {
        rndCode += `${Math.floor(Math.random() * 10)}`;
    }
    return rndCode;
}

function refreshList(matches) {
    const matchList = document.querySelector('#match-list');
    matchList.innerHTML = '';
    for(let match of matches) {
        matchList.innerHTML += `   
        <div class='d-flex justify-content-between match'>
            <h3>
                ${match.playerA?.username || 'Waiting'}
                <span>vs</span>
                ${match.playerB?.username || 'Waiting'}
            </h3>
            <div>
                <button data-id='${match.id}' class='btn btn-primary join-match'>Join</button>
                <button data-id='${match.id}' class='btn btn-primary'>Watch</button>
            </div>
        </div>
        `;
    }
    const joinMatchBtns = document.querySelectorAll('.join-match');
    for(let btn of joinMatchBtns) {
        btn.onclick = function() {
            socket.emit('join match', {
                id: this.dataset.id,
                game: 'tic-tac-toe',
                user: getUser()
            })
        }
    }
}

socket.on('game list', res=> {
    if(!!res.status) {
        if(res.game.name == 'tic-tac-toe') {
            refreshList(res.matches);
        }
    }
})

socket.on('create match', res=> {
    if(!!res.status) {
        if(res.game == 'tic-tac-toe') {
            location.href = `match.html?id=${res.match}=${res.user}`;
        }
    }
})

socket.on('join match', res=> {
    if(res.game == 'tic-tac-toe') {
        location.href = `match.html?id=${res.match}=${res.user}`;
    }
})