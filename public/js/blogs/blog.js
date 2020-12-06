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
        <h2 class='bg-accent text-white p-3 mb-0'>Comments</h2>
        <div id='comments' class='bg-extra p-3 comments'>
        </div>
        <form id='new-comment' data-blog='${location.pathname.replace('/blogs/', '')}'>
            <div class='input-group'>
                <input class='form-control' type='text' name='comment' placeholder='Comment...'>
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

socket.on('all comments', async res=> {
    if(!!res.status) {
        comments.innerHTML = returnModal();
        let commentsList = res.comments.sort(function(a, b) {
            return parseInt(a.created) - parseInt(b.created);
        })

        const emojis = await fetch('/data/icon.json')
        .then(r=> r.json());
        for(let comment of commentsList) {
            let emojiHTML = ``;
            for(let emoji of emojis) {
                emojiHTML += `
                    <div class='text-secondary mx-1 emoji' data-name='${emoji.name}' data-active='${emoji.active}'>
                        ${emoji.src}
                    </div>
                `;
            }
            const date = formatDate(comment.created);
            comments.innerHTML += `
                <p class='border'>
                    <h3 class='d-flex'>
                        ${comment.user}
                        <span class='comments__date mt-auto mx-2'>${date}</span>
                        ${
                            (comment.userID == localData.user?.id)
                            ? `
                            <a data-id='${comment.id}' data-blog='${comment.blog}' data-toggle="modal" data-target="#exampleModal" class='edit-comment comments__option ml-auto mr-3'>Edit</a>
                            <a data-id='${comment.id}' data-blog='${comment.blog}' data-toggle="modal" data-target="#exampleModal" class='delete-comment comments__option text-danger'>Delete</a>
                            `
                            : ''
                        }
                        </h3>
                    <div data-id='${comment.id}' class='comments__text'>${comment.comment}</div>
                    <div class='d-flex'>
                        ${emojiHTML}
                    </div>
                </p>
            `;
            document.querySelectorAll('.emoji').forEach(e=> {
                e.onmouseover = function() {
                    e.classList.remove(`text-secondary`);
                    e.classList.add(`${this.dataset.active}`);
                }
                e.onmouseout = function() {
                    e.classList.add(`text-secondary`);
                    e.classList.remove(`${this.dataset.active}`);
                }
            })
            document.querySelectorAll('.edit-comment').forEach(ec=> {
                ec.onclick = editComment;
            })
            document.querySelectorAll('.delete-comment').forEach(dc=> {
                dc.onclick = deleteComment;
            })
        }
    }
})

function formatDate(datenum) {
    return `${new Date(parseInt(datenum)).getDate()}-${new Date(parseInt(datenum)).getMonth() + 1}-${new Date(parseInt(datenum)).getFullYear()}`;  
}

function editComment(e) {
    e.preventDefault();
    const commentInfo = {
        blog: this.dataset.blog,
        id: this.dataset.id
    };

    const modal = {
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        action: document.querySelector('.modal-action')
    }
    modal.title.innerHTML = 'Edit Comment';
    const allTexts = document.querySelectorAll('.comments__text');
    let curText = '';
    allTexts.forEach(t=> {
        if(t.dataset.id == commentInfo.id) curText = t.innerHTML;
    });

    modal.body.innerHTML = `
        <form id='edit-comment-form' class='d-flex flex-column'>
            <label>Comment</label>
            <input name='text' value='${curText.trim()}' type='text'>
        </form>
    `;
    const editCommentForm = document.querySelector('#edit-comment-form');
    editCommentForm.onsubmit = e=> {e.preventDefault();};
    modal.action.innerHTML = 'Confirm Changes';
    modal.action.onclick = function() {
        commentInfo.text = editCommentForm.text.value.trim();
        if(!!commentInfo.text) {
            socket.emit('edit comment', commentInfo);
        }
    }
}

function deleteComment(e) {
    e.preventDefault();
    const commentInfo = {
        blog: this.dataset.blog,
        id: this.dataset.id
    };

    const modal = {
        title: document.querySelector('.modal-title'),
        body: document.querySelector('.modal-body'),
        action: document.querySelector('.modal-action')
    }
    modal.title.innerHTML = 'Are you sure?';
    modal.body.innerHTML = `
        <h3>Permenantly delete this comment.</h3>
        <p>This comment will be deleted forever. Are you sure you want to do this?</p>
    `;
    modal.action.innerHTML = 'Delete';
    modal.action.onclick = function() {
        socket.emit('delete comment', commentInfo)
    }
}

function returnModal() {
    return `
    <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary modal-action" data-dismiss="modal">Save changes</button>
                </div>
            </div>
        </div>
    </div>
    `;
}