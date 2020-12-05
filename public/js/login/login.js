initLoginForm();

function initLoginForm() {
    const loginForm = document.querySelector('#login-form');
    if(loginForm) {
        loginForm.onsubmit = submitLogin;
    }
    initPasswordChanger();
}

/**
 * 
 * @param {event} e 
 */
function submitLogin(e) {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(this));
    if(validateLoginForm(formData)) {
        socket.emit('login user', {
            email: formData.email,
            password: formData.password
        });
    }
}

function validateLoginForm(formData) {
    const errors = [];
    if(!formData.email.trim() || !formData.email.split('@')[1]) {
        errors.push('email');
        document.querySelector('#feedback__email').innerHTML = ''
    }
    if(!formData.password.trim()) {
        errors.push('password');
    }
    for(let error of errors) {
        const feedback = document.querySelector(`#feedback__${error}`);
        switch(error) {
            case 'email':
                feedback.innerHTML = 'Please provide your full email.  <em>email@domain.com</em>';
                break;
            case 'password':
                feedback.innerHTML = 'Please provide your password.';
                break;
        }
    }

    const loginForm = document.querySelector('#login-form');
    for(let field of loginForm) {
        if(!!field.name) {
            field.classList.value = 'form-control';
            if(errors.includes(field.name)) {
                field.classList.add('is-invalid');
            }
            else {
                field.classList.add('is-valid');
            }
        }
    }

    return !errors.length
}

socket.on('login user', res=> {
    if(!!res.status) {
        localData.user = res.user;
        storeData();
        location.href = '/';
    }
    else {
        const feedback = document.querySelector(`#feedback__${res.fail}`);
        const field = document.querySelector(`#${res.fail}`);
        field.classList.value = 'form-control is-invalid';
        if(res.fail == 'email') {
            feedback.innerHTML = `Sorry that email isn't linked to an account`;
        }
        if(res.fail == 'password') {
            feedback.innerHTML = `Sorry your password is inccorect.`;
        }
    }
})