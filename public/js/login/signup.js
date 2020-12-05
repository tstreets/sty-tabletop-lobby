initSignupForm();

function initSignupForm() {
    const signupForm = document.querySelector('#signup-form');
    if(signupForm) {
        signupForm.onsubmit = submitSignup;
    }
    initPasswordChanger();
}

/**
 * 
 * @param {event} e 
 */
function submitSignup(e) {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(this));
    if(validateSignupForm(formData)) {
        socket.emit('signup user', {
            username: formData.username,
            email: formData.email,
            password: formData.password
        });
    }
}

function validateSignupForm(formData) {
    const errors = [];
    if(!formData.email.trim() || !formData.email.split('@')[1]) {
        errors.push('email');
        document.querySelector('#feedback__email').innerHTML = ''
    }
    if(!formData.password.trim()) {
        errors.push('password');
    }
    if(!formData.username.trim()) {
        errors.push('username');
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
            case 'username':
                feedback.innerHTML = 'Please provide a username.';
                break;
        }
    }

    const signupForm = document.querySelector('#signup-form');
    for(let field of signupForm) {
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

socket.on('signup user', res=> {
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
            feedback.innerHTML = `Sorry that email is already taken.`;
        }
    }
})