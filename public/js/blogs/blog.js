initBlog();

function initBlog() {
    const content = document.querySelector('#content');
    socket.emit('get blog', {
        id: location.pathname.replace('/blogs/', '')
    })
}

socket.on('get blog', res=> {
    if(!!res.status) {
        content.innerHTML = res.blog.text;
        for(let image of document.querySelectorAll('img')) {
            if(image.src == `${location.origin}/blogs/${res.blog.hero.name}`) {
                image.src = res.blog.hero.src;
            }
        }
        content.innerHTML += `
        <h2>Comments</h2>
        <div id='comments'>
        </div>
        <form id='new-comment' data-blog='${location.pathname.replace('/blogs/', '')}'>
            <div class='input-group'>
                <textarea style='resize: none;' class='form-control' name='comment' placeholder='Comment...'></textarea>
                <div class='form-group-prepend'>
                    <input class='btn btn-accent' type='submit' value='Post'>
                </div>
            </div>
        </form>`;
        const comments = document.querySelector('#comments');
        const newComment = document.querySelector('#new-comment');
        newComment.onsubmit = addComment;
        socket.emit('all comments', {
            info: {
                id: location.pathname.replace('/blogs/', '')
            },
            userInfo: localData.user
        })
    }
    else {
        location.href = '/blogs';
    }
})

/**
 * 
 * @param {event} e 
 */
function addComment(e) {
    e.preventDefault();
    if(!!localData.user) {
        const commentInfo = Object.fromEntries(new FormData(this));
        if(!!commentInfo.comment.trim()) {
            this.comment.classList.value = `form-control is-valid`;
            socket.emit('add comment', {
                userInfo: localData.user,
                info: {
                    comment: this.comment.value,
                    created: Date.now()
                },
                blogInfo: {
                    id: this.dataset.blog
                }
            });
        }
        else {
            this.comment.classList.value = `form-control is-invalid`;
        }
    }
    
}

socket.on('add comment', res=> {
    if(!!res.status) {
        socket.emit('all comments', {
            info: {
                id: location.pathname.replace('/blogs/', '')
            },
            userInfo: localData.user
        })
    }
    else {
        newComment.comment.classList.value = `form-control is-invalid`;
    }
});

socket.on('all comments', res=> {
    if(!!res.status) {
        comments.innerHTML = '';
        let commentsList = res.comments.sort(function(a, b) {
            return parseInt(a.created) - parseInt(b.created);
        })
        for(let comment of commentsList) {
            comments.innerHTML += `
                <p>
                    <h3>${comment.user}</h3>
                    <div>${comment.comment}</div>
                </p>
            `;
        }
    }
})