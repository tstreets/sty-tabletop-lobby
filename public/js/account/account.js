generateAccountInfo();

function generateAccountInfo() {
    if(!!localData.user) {
        socket.emit('user account', localData.user);
    }
    else {
        location.href = '/login';
    }
}

socket.on('user account', res=> {
    if(!!res.status) {
        document.querySelector('#username').innerHTML = res.user.username;
    }
    else {
        localData.user = null;
        storeData();
        location.href = '/login';
    }
})