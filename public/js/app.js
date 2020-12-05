document.body.onload = function() {
    updateNav();
}

function updateNav() {
    let pagename = location.pathname.split('/')[1];
    if(pagename == '') {
        pagename = 'home';
    }
    document.querySelector('.mainnav__link--active')?.classList.remove('mainnav__link--active');
    document.querySelector(`#${pagename}`)?.classList.add('mainnav__link--active');
    if(!!localData.user) {
        const nouser = document.querySelector('#mainnav__nouser');
        const user = document.querySelector('#mainnav__user');
        user.classList.add('d-flex');
        nouser.classList.remove('d-flex');
    }
}

function initPasswordChanger() {
    const passwordChangers = document.querySelectorAll('.password-changer');
    for(let changer of passwordChangers) {
        changer.onclick = changePasswordVisibilty;
    }
}

function changePasswordVisibilty() {
    const showPassword = document.querySelector('#show-password');
    const hidePassword = document.querySelector('#hide-password');
    const password = document.querySelector('#password');
    if(this == showPassword) {
        showPassword.setAttribute('hidden', 'true');
        hidePassword.removeAttribute('hidden');
        password.type = 'text';
    }
    else {
        hidePassword.setAttribute('hidden', 'true');
        showPassword.removeAttribute('hidden');
        password.type = 'password';
    }
}

localData = (!!localStorage.getItem('com.tabletoplobby.sty')) 
? JSON.parse(localStorage.getItem('com.tabletoplobby.sty')) : {};

function storeData() {
    localStorage.setItem('com.tabletoplobby.sty', JSON.stringify(localData));
}