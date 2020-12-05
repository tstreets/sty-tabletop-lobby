const gameInfo = {
    name: location.pathname.split('/')[2]
}

initGame();

function initGame() {
    initChatBox();
}

function initChatBox() {
    socket.emit('game all message', {
        info: gameInfo
    });
    const gameScreen = document.querySelector('#game-screen');
    gameScreen.src = `/${gameInfo.name}`;
    const newMsg = document.querySelector('#new-msg');
    newMsg.onsubmit = sendMessage;
}

/**
 * 
 * @param {event} e 
 */
function sendMessage(e) {
    e.preventDefault();
    const messageInfo = Object.fromEntries(new FormData(this));
    if(!!localData.user && !!messageInfo.message.trim()) {
        socket.emit('game all message', {
            info: gameInfo,
            user: localData.user,
            msg: {
                text: messageInfo.message
            }
        })
        this.reset();
    }
    else if(!!messageInfo.message.trim()) {
        socket.emit('game all message', {
            info: gameInfo,
            user: {
                username: "Anon"
            },
            msg: {
                text: messageInfo.message
            }
        })
        this.reset();
    }
}

socket.on('game all message', res=> {
    const gameIDRef = document.querySelector('#game-screen').contentWindow.document.querySelector('#game-id');
    let gameID = (!!gameIDRef) ? gameIDRef.innerHTML : null;
    if(!!res.status) {
        if(res.game.name == gameInfo.name) {
            if(!gameID) {
                displayChat(res.chatLog);
            }
        } 
    }
    else {
        location.href = '/error';
    }
})

function displayChat(chats) {
    const chatLog = document.querySelector('#chat-log');
    chatLog.innerHTML = ``;
    for(let chat of chats) {
        chatLog.innerHTML += `
        <h2 class='game__user'>${chat.user.username || 'Anonymous'}</h2>
        <p class='game__msg'>${chat.msg.text}</p>
        `
    }
    chatLog.scrollTo({
        top: chatLog.scrollHeight
    })
}