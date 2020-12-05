initBlogsList();

function initBlogsList() {
    if(!!localData.user) {
        socket.emit('check admin', localData.user);
    }
    socket.emit('all blogs');
}

socket.on('check admin', res=> {
    if(!!res.status) {
        document.querySelector('#blog-admin').removeAttribute('hidden');
    }
})

socket.on('all blogs', res=> {
    if(!!res.status) {
        const blogList = document.querySelector('#blogsList');
        blogList.innerHTML = '';
        let blogsList = res.blogs.sort(function(a, b) {
            return parseInt(b.created) - parseInt(a.created);
        });
        for(let blog of blogsList) {
            blogList.innerHTML += `
            <div class='d-flex mb-5 blogcard'>
                <div class='p-4 border border-accent bg-extra container'>
                    <h2>${blog.title}</h2>
                    <p>
                        <em>
                            <div>Written by: ${blog.author}</div>
                            <div>${blog.date}</div>
                        </em>
                    </p>
                    <p class='blogcard__overview'>${blog.overview}</p>
                    <a class='btn btn-accent' href='/blogs/${blog.id}'>Read More</a>
                </div>
                <div class='container blogcard__holder d-md-block d-none' style='background-image: url(${blog.hero.src});'>
                </div>
            </div>
            `;
        }
    }
})