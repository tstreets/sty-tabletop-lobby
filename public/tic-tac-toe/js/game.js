const socket = io();

document.querySelector('#game-id').innerHTML = location.href.split('=')[1];

let gm = {
    playerA : {},
    playerB : {},
    players : [
        {
            name: "Ty",
            id: -1,
            spaces: [],
            turn: 1
        },
        {
            name: "Op",
            id: -1,
            spaces: [],
            turn: 2
        }
    ],
    id: location.href.split('=')[1],
    game: 'tic-tac-toe',
    turn: 1,
    win: false,
    start: false
}

const newMsg = parent.document.querySelector('#new-msg');
newMsg.onsubmit = function(e) {
    e.preventDefault();
    const msgInfo = Object.fromEntries(new FormData(this));
    if(!!msgInfo.message) {
        socket.emit('ingame message', {
            text: msgInfo.message,
            user: getUser(),
            game: 'tic-tac-toe',
            match: location.href.split('=')[1]
        });
        this.reset();
    }
};

socket.emit('log user', {
    user: getUser(),
    match: location.href.split('=')[1],
    game: 'tic-tac-toe'
})

function updateMatch() {
    socket.emit('update match', gm);
}

socket.on('tic-tac-toe update', res=> {
    if(res.match.id == location.href.split('=')[1])
    {
        updateGame(res.match);
    }
})

socket.on('tic-tac-toe message', res=> {
    if(res.match == location.href.split('=')[1])
    {
        outputMessage(`
            <h2 class='game__user'>${res.user.username || 'Anonymous'}</h2>
            <p class='game__msg'>${res.msg}</p>
        `);
    }
})

function updateGame(match) {
    gm = match;
    console.log(gm);
    if(!!gm.ready) {
        if(!gm.playerA || !gm.playerB) {
            gm.ready = false;
            updateMatch();
        }
        else {
            console.log('you can start');
        }
    }
    else {
        if(!!gm.playerA && !!gm.playerB) {
            console.log('Both players')
        }
        else {
            console.log('Waiting on a player');
        }
    }
    updateScreen();
}

function getUser() {
    const localData = !!(localStorage.getItem('com.tabletoplobby.sty'))
    ? JSON.parse(localStorage.getItem('com.tabletoplobby.sty'))
    : {username: 'Anon', id: location.href.split('=')[2]};
    localData.user = !!localData.user ? localData.user : {username: 'Anon', id: location.href.split('=')[2]};
    return localData.user;
}

initGame();

function initGame() {
    const spacesDOM = document.querySelectorAll('.space');
    for(let space of spacesDOM) {
        space.onclick = spaceClicked;
    }
    const startGameBtn = document.querySelector('#start-game');
    startGameBtn.onclick = checkStartGame;
}

function spaceClicked() {
    const playerRef = gm.players.find(p=> p.id == getUser().id);
    if(!!playerRef) {
        if(this.dataset.marked != "true" && !gm.win 
        && gm.start && gm.turn % 2 == playerRef?.turn % 2) {
            this.dataset.marked = "true";
            playerRef.spaces.push({
                dataset: this.dataset,
                id: this.id
            });
            console.log(gm);
            // outputMessage({text: `<b>${gm.players[((gm.turn - 1) % 2)].name}</b> placed an ${((gm.turn - 1) % 2) ? "O" : "X"} on space ${this.dataset.row}${this.dataset.col}`});
            piecePlayed();
        }
    }
}

function checkStartGame() {
    if(gm.ready) {
        gm.start = true;
        gm.players = [
            {
                name: gm.playerA.username,
                id: gm.playerA.id,
                spaces: [],
                turn: 1
            },
            {
                name: gm.playerB.username,
                id: gm.playerB.id,
                spaces: [],
                turn: 2
            }
        ];
        gm.turn = 1;
        gm.win = false;
        updateMatch();
    }
}

function piecePlayed() {
    gm.turn += 1;
    updateMatch();
}

function markSpaces() {
    if(!!gm.start && !!gm.ready) {
        for(let player of gm.players) {
            console.log(player);
            for(let space of player.spaces) {
                const spaceRef = document.querySelector(`#${space.id}`);
                spaceRef.innerHTML = ((player.turn - 1) % 2) ? "O" : "X";
            }
        }
        // checkWin();
    }
}

function checkWin() {
    const win = {player: null, value: false};
    for(let player of gm.players) {
        for(let space of player.spaces) {
            for(let prop of Object.keys(space.dataset)) {
                if(prop != 'marked' && !win.value) {
                    const foundMatches = player.spaces.filter(cSpace=> cSpace.dataset[prop] == space.dataset[prop]).length;
                    if(foundMatches > 2) {
                        win.value = true;
                        win.player = player.name;
                    }
                }
            }
        }
    }
    if(win.value) {
        gm.win = true;
        outputMessage({text: `<h1>${win.player} won!</h1>`});
    }
}

function outputMessage(message) {
    const chatLog = parent.document.querySelector('#chat-log');
    chatLog.innerHTML += message;
    // document.querySelector('.output').innerHTML += `<div>${message.text}</div>`;
}

function updateScreen() {
    const matchUp = document.querySelector('#match-up');
    const userPlayerA = getUser().id == gm.playerA?.id;
    const userPlayerB = getUser().id == gm.playerB?.id;
    matchUp.innerHTML = `
        <h3>
        <span class='${userPlayerA ? 'user' : ''}'>
            ${gm.playerA?.username || 'Waiting'}
        </span>
        <div>vs</div>
        <span class='${userPlayerB ? 'user' : ''}'>
            ${gm.playerB?.username || 'Waiting'}
        </span>
        </h3>
    `;
    const matchWaiting = document.querySelector('#match-waiting');
    matchWaiting.classList.remove('d-none');
    matchWaiting.classList.remove('d-flex');
    if(gm.start) {
        matchWaiting.classList.add('d-none');
    }
    else {
        matchWaiting.classList.add('d-flex');
    }
    const matchActive = document.querySelector('#match-active');
    matchActive.classList.remove('d-none');
    if(!gm.start) matchActive.classList.add('d-none');

    markSpaces();
}