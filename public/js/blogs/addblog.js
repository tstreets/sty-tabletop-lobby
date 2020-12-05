initCreator();

function initCreator() {
    const creator = document.querySelector('#creator');
    creator.onsubmit = previewBlog;
    const heroFile = document.querySelector('#hero-file');
    heroFile.onchange = updateHeroInfo;
    const saveBlogBtn = document.querySelector('#save-blog');
    saveBlogBtn.onclick = saveBlog;
    const preview = document.querySelector('#preview');
}

/**
 * 
 * @param {event} e 
 */
function previewBlog(e) {
    e.preventDefault();
    const blogInfo = Object.fromEntries(new FormData(this));

    if(validateBlog(blogInfo)) {
        populatePreview();
    }
}

async function populatePreview(save = false) {
    preview.innerHTML = `<h1>${creator.title.value}</h1>`;
    preview.innerHTML += `
    <p>
        ${creator.title.value}
        <div><em>
            ${new Date().getDate()}
            -${new Date().getMonth()+1}
            -${new Date().getFullYear()}
        </em></div>
    </p>`;
    const imageData = (save) ? creator.hero.files[0].name : await imageToData(creator.hero.files[0]);
    preview.innerHTML += `
    <div class='preview__hero mb-3' style='height: ${creator.heroHeight.value}px;'>
        <img src='${imageData}' alt='${creator.hero.files[0].name.replace(' ', '_')}' style='margin-top: -${creator.heroPosition.value}px'>
    </div>
    `;
    preview.innerHTML += `<h2>Overview</h2>`;
    preview.innerHTML += `<p>${creator.overview.value}</p>`;
}

function validateBlog(blogInfo) {
    const validation = {
        result: true,
        errors: []
    };

    if(!blogInfo.title.trim()) {
        validation.errors.push('title');
    }
    if(!blogInfo.hero.name.trim()) {
        validation.errors.push('hero');
    }
    if(!blogInfo.overview.trim()) {
        validation.errors.push('overview');
    }

    if(!!validation.errors.length) {
        validation.result = false;
    }
    
    const creator = document.querySelector('#creator');
    for(let field of creator) {
        if(!!field.name) {
            field.classList.remove('is-invalid');
            field.classList.remove('is-valid');
            if(validation.errors.includes(field.name)) {
                field.classList.add('is-invalid');
            }
            else {
                field.classList.add('is-valid');
            }
        }
    }

    return validation.result;
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

async function updateHeroInfo() {
    const heroName = document.querySelector('#hero-name');
    heroName.innerHTML = this.files[0]?.name || 'Choose Hero Image...';
    const heroPosition = document.querySelector('#hero-position');
    if(!!this.files[0]) {
        const imageData = await imageToData(this.files[0]);
        const newImage = new Image;
        newImage.onload = function() {
            heroPosition.max = newImage.height / 2;
        }
        newImage.src = imageData;
    }
    else {
        heroPosition.max = 100;
        heroPosition.value = 0;
    }
}

async function saveBlog() {
    const blogData = Object.fromEntries(new FormData(creator));
    if(validateBlog(blogData)) {
        await populatePreview(true);
        const heroImage = await imageToData(creator.hero.files[0]);
        const blogInfo = {
            title: creator.title.value,
            author: 'Ty Streets',
            date: `${new Date().getDate()}-${new Date().getMonth()+1}-${new Date().getFullYear()}`,
            hero: {
                name: creator.hero.files[0].name.replace(' ', '_'),
                src: heroImage
            },
            overview: creator.overview.value,
            text: preview.innerHTML,
            user: localData.user
        };
        socket.emit('save blog', blogInfo);
    }
}

socket.on('save blog', res=> {
    if(!!res.status) {
        location.href = '/blogs';
    }
    else {
        console.log('There was an error');
    }
})