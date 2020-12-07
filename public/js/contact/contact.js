initContactForm();

function initContactForm() {
    const contactForm = document.querySelector('#contact-form');
    contactForm.onsubmit = submitContact;
}

function submitContact(e) {
    e.preventDefault();
    const contactInfo = getFormData(this);
    contactInfo.form = this;
    if(validateContactInfo(contactInfo)) {
        this.reset();
        for(let field of contactInfo.form) {
            if(!!field.name) {
                field.classList.value = 'form-control border-accent';
            }
        }
        socket.emit('contact', contactInfo);
    }
}

function getFormData(form) {
    return Object.fromEntries(new FormData(form));
}

function validateContactInfo(contactInfo) {
    const errs = [];
    if(!contactInfo.fullname.trim()) errs.push('fullname');
    if(!contactInfo.email.trim() 
    || !contactInfo.email.split('@')[1]
    || !contactInfo.email.split('.')[1])
    {
        errs.push('email');
    }
    if(!contactInfo.comment.trim()) errs.push('comment');

    for(let field of contactInfo.form) {
        if(!!field.name) {
            field.classList.value = 'form-control';
            if(errs.includes(field.name)) {
                field.classList.value += ' is-invalid';
            }
            else {
                field.classList.value += ' is-valid';
            }
        }
    }

    return !errs.length;
}