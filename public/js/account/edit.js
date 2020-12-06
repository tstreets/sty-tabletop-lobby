initEditPage();

socket.on('get user info', res=> {
    if(!!res.status) {
        const user = res.user;
        if(!!user.email) {
            document.querySelector('#email').value = user.email;
        }
        if(!!user.username) {
            document.querySelector('#username').value = user.username;
        }
        if(!!user.profileImage) {
            document.querySelector('#image-name').innerHTML = user.profileImage.name;
        }
    }
})

socket.on('update user info', res=> {
    if(!!res.status) {
        localData.user = res.user;
        location.href = '/account';
    }
})

function initEditPage() {
    const editAccountForm = document.querySelector('#edit-account-form');
    editAccountForm.onsubmit = submitEditAccount;
    const imageFile = document.querySelector('#image-file');
    imageFile.onchange = updateProfileImage;
    socket.emit('get user info', {
        user: localData.user
    })
}

/**
 * 
 * @param {event} e 
 */
async function submitEditAccount(e) {
    e.preventDefault();
    const accountInfo = Object.fromEntries(new FormData(this));
    if(validateInfo(accountInfo)) {
        const imageData = await imageToData(accountInfo.image);
        accountInfo.profileImage = {
            name: accountInfo.image.name.replace(/ /g, '-'),
            file: imageData
        }
        accountInfo.user = localData.user;
        socket.emit('update user info', accountInfo);
    }
}

function validateInfo(accountInfo) {
    const errors = [];
    if(!accountInfo.username.trim()) {
        errors.push('username');
    }
    if(!accountInfo.email.trim() 
    || !accountInfo.email.split('@')[1]
    || !accountInfo.email.split('@')[1].split('.')[1]) {
        errors.push('email');
    }
    if(!!accountInfo.newpassword.trim() && !accountInfo.oldpassword.trim()) {
        errors.push('oldpassword');
    }

    for(let field of document.querySelector('#edit-account-form')) {
        if(!!field.name) {
            field.classList.remove('is-valid');
            field.classList.remove('is-invalid');
            field.classList.remove('border-accent');
            if(errors.includes(field.name)) {
                field.classList.add('is-invalid');
            }
            else {
                field.classList.add('is-valid');
            }
        }
    }

    return !errors.length;
}

function updateProfileImage() {
    const imageName = document.querySelector('#image-name');
    imageName.innerHTML = (!!this.files[0]) 
    ? this.files[0].name : 'Profile Picture';
}

async function imageToData(image) {
    let imageData = null;
    await new Promise((res, rej)=> {
        if(!!image) {
            if(image.type.includes('image')) {
                const fr = new FileReader();
                fr.onload = function() {
                    res(fr.result);
                }
                fr.readAsDataURL(image);
            }
            else {
                rej('Incorrect Format. Please select a valid Image format');
            }
        }
        else {
            rej('No image selected');
        }
    })
    .then(res=> {
        imageData = res;
    })
    .catch(err=> console.warn(err));
    return imageData;
}
