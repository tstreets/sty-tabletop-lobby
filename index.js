require('dotenv');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const engine = require('consolidate');

const app = express();
app.engine('pug', engine.pug);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

const pages = [
    {route: '/', file: 'index'},
    {route: '/about', file: 'about/index', title: 'About'},
    {route: '/contact', file: 'contact/index', title: 'Contact'},
    {route: '/login', file: 'login/index', title: 'Login'},
    {route: '/login/signup', file: 'login/signup', title: 'Signup'},
    {route: '/account', file: 'account/index', title: 'Account'},
    {route: '/account/edit', file: 'account/edit', title: 'Edit Account'},
    {route: '/games', file: 'games/index', title: 'Games'},
    {route: '/games/:id', file: 'games/game', title: 'Game'},
    {route: '/blogs', file: 'blogs/index', title: 'Blogs'},
    {route: '/blogs/add', file: 'blogs/add', title: 'New Blog'},
    {route: '/blogs/:id', file: 'blogs/blog', title: 'Blog'},
    {route: '/logout', file: 'login/logout', title: 'Logout'},
    {route: '/error', file: 'error', title: 'Page Not Found'}
];
for(let page of pages) {
    app.get(`${page.route}`, function(req,res,next) {
        res.render(`${page.file}`, {
            title: `Tabletop ${(page.route == '/') ? '' : ` - ${page.title}`}`
        });
    })
}

app.get('**', function(req,res,next) {
    res.write(`<script>location.href='/error'</script>`);
    res.end();
})

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port);

const serverData = {
    "tic-tac-toe": {
        matches: [],
        chat: []
    }
}

const io = require('socket.io')(server);

io.on('connection', socket=> {

    socket.on('login user', userInfo=> {
        fb.signIn({
            socket: socket,
            info: userInfo
        })
    })

    socket.on('signup user', userInfo=> {
        fb.signUp({
            socket: socket,
            info: userInfo
        })
    })

    socket.on('check admin', userInfo=> {
        fb.checkAdmin({
            socket: socket,
            info: userInfo
        })
    })

    socket.on('user account', userInfo=> {
        fb.retrieveAccount({
            socket: socket,
            info: userInfo
        })
    })

    socket.on('save blog', blogInfo=> {
        fb.uploadBlog({
            info: blogInfo,
            userInfo: blogInfo.user,
            socket: socket
        })
    })

    socket.on('all blogs', ()=> {
        fb.retrieveAllBlogs(socket);
    })

    socket.on('get blog', blogInfo=> {
        fb.retrieveBlog({
            socket: socket,
            info: blogInfo
        });
    })

    socket.on('add comment', commentInfo=> {
        fb.addComment({
            socket: socket,
            userInfo: commentInfo.userInfo,
            info: commentInfo.info,
            blogInfo: commentInfo.blogInfo
        })
    })

    socket.on('all comments', blogInfo=> {
        fb.retrieveAllComments({
            socket: socket,
            userInfo: blogInfo.userInfo,
            info: blogInfo.info
        })
    })

    socket.on('game all message', gameInfo=> {
        const gameExists = !!serverData[gameInfo.info.name];
        if(gameExists) {
            if(!!gameInfo.msg && !!gameInfo.user) {
                serverData[gameInfo.info.name].chat.push({
                    user: gameInfo.user,
                    msg: gameInfo.msg
                })
            }
            io.emit('game all message', {
                status: gameExists,
                chatLog: serverData[gameInfo.info.name].chat,
                game: gameInfo.info
            })
        }
        else {            
            socket.emit('game all message', {
                status: gameExists,
                game: gameInfo.info
            })
        }
    })

    socket.on('game list', gameInfo=> {
        const gameRef = serverData[gameInfo.name];
        if(!!gameRef) {
            socket.emit('game list', {
                status: 1,
                game: gameInfo,
                matches: gameRef.matches
            })
        }
    })

    socket.on('ingame message', matchInfo=> {
        const gameRef = serverData[matchInfo.game];
        if(!!gameRef) {
            io.emit(`${matchInfo.game} message`, {
                msg: matchInfo.text,
                user: matchInfo.user,
                match: matchInfo.match
            })
        }
    })

    socket.on('log user', userInfo=> {
        socket.userInfo = userInfo.user;
        socket.userInfo.match = userInfo.match;
        const gameRef = serverData[userInfo.game];
        if(!!gameRef) {
            io.emit(`${userInfo.game} update`, {
                match: gameRef.matches.find(m=> m.id == userInfo.match)
            })
        }
    })

    socket.on('create match', async gameInfo=> {
        const gameRef = serverData[gameInfo.name];
        if(!!gameRef) {
            const newCode = await generateMatchCode(gameRef.matches);
            gameRef.matches.push({
                id: newCode,
                playerA: gameInfo.user,
                playerB: null,
                start: false,
                ready: false,
                game: gameInfo.name,
                turn: 0,
                players: []
            });
            socket.emit('create match', {
                status: 1,
                game: gameInfo.name,
                match: newCode,
                user: gameInfo.user.id
            })
        }
    })

    socket.on('join match', matchInfo=> {
        const gameRef = serverData[matchInfo.game];
        if(!!gameRef) {
            const index = gameRef.matches.findIndex(m=>m.id == matchInfo.id);
            if(index >= 0) {
                if(!gameRef.matches[index].playerA) {
                    gameRef.matches[index].playerA = matchInfo.user;
                }
                else if(!gameRef.matches[index].playerB) {
                    gameRef.matches[index].playerB = matchInfo.user;
                }
                if(!!gameRef.matches[index].playerA && !!gameRef.matches[index].playerB) {
                    gameRef.matches[index].ready = true;
                }
                socket.emit('join match', {
                    status: 1,
                    game: matchInfo.game,
                    match: matchInfo.id,
                    user: matchInfo.user.id
                })
            }
            else {
                if(!!gameRef) {
                    socket.emit('game list', {
                        status: 1,
                        game: {
                            name: matchInfo.game
                        },
                        matches: gameRef.matches
                    })
                }
            }
        }
    })

    socket.on('update match', matchInfo=> {
        const gameRef = serverData[matchInfo.game];
        if(!!gameRef) {
            const matchRef = gameRef.matches.findIndex(m=> m.id == matchInfo.id);
            if(matchRef >= 0) {
                gameRef.matches[matchRef] = matchInfo;
                io.emit(`${matchInfo.game} update`, {
                    match: matchInfo
                });
            }
        }
    })

    socket.on('disconnect', ()=> {
        const games = ['tic-tac-toe'];
        if(!!socket.userInfo) {
            for(let gameName of games) {
                const game = serverData[gameName];
                if(!!socket.userInfo.match) {
                    const gameRef = game.matches.find(m=> m.id == socket.userInfo.match);
                    if(!!gameRef) {
                        if(!!gameRef.playerA){
                            if(gameRef.playerA.id == socket.userInfo.id) {
                                gameRef.playerA = null;
                                io.emit(`${gameName} update`, {
                                    match: gameRef
                                });
                            }
                        }
                        if(!!gameRef.playerB){
                            if(gameRef.playerB.id == socket.userInfo.id) {
                                gameRef.playerB = null;
                                io.emit(`${gameName} update`, {
                                    match: gameRef
                                });
                            }
                        }
                        if(!gameRef.playerA && !gameRef.playerB) {
                            const index = game.matches.findIndex(m=> m.id == socket.userInfo.match);
                            game.matches.splice(index, 1);
                        }
                    }
                }
                game.matches.forEach(m=> {
                    if(!!m.playerA) {
                        if(m.playerA.id == socket.userInfo.id) {
                            m.playerA = null;
                            io.emit(`${gameName} update`, {
                                match: m
                            });
                        }
                    }
                    if(!!m.playerB) {
                        if(m.playerB.id == socket.userInfo.id) {
                            m.playerB = null;
                            io.emit(`${gameName} update`, {
                                match: m
                            });
                        }
                    }
                    if(!m.playerA && !m.playerB) {
                        const index = game.matches.findIndex(ma=> ma.id == socket.userInfo.match);
                        game.matches.splice(index, 1);
                    }
                })
            }
        }
    })
})

const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert('data/firebase-admin-sdk.json'),
    databaseURL: 'https://tabletop-lobby-9585.firebaseio.com',
    storageBucket: 'tabletop-lobby-9585.appspot.com'
});

const storage = admin.storage().bucket();
const db = admin.firestore();

const fb = {};
fb.uploadImage = async function(image) {
    const newFile = storage.file(`${image.path}_${image.name}`);
    newFile.save(image.file);
}
fb.retrieveAllImages = function() {
    const images = [];
    storage.getFiles()
    .then(async snap=> {
        for(let image of snap[0]) {
            const [url] = await storage
            .file(image.name)
            .getSignedUrl({
                version: 'v4',
                action: 'read',
                expires: Date.now() + 6 * 60 * 60000, // 6 hour
            });
            images.push({
                name: image.name,
                href: url
            });
        }
    })
}
fb.retrieveImage = async function(imagename) {
    let newSrc;
    await storage.getFiles()
    .then(async snap=> {
        for(let image of snap[0]) {
            if(imagename == image.name) {
                const [url] = await storage
                .file(image.name)
                .getSignedUrl({
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 6 * 60 * 60000, // 6 hour
                });
                newSrc = url;
            }
        }
    });
    return newSrc;
}
fb.uploadBlog = function(blog) {
    db.collection('User').doc(blog.userInfo.id)
    .get().then(userDoc=> {
        if(!!userDoc.data().admin) {
            db.collection('Blog')
            .add({
                title: blog.info.title,
                hero: blog.info.hero.name,
                author: blog.info.author,
                date: blog.info.date,
                overview: blog.info.overview,
                text: blog.info.text
            })
            .then(blogDoc=> {
                fb.uploadImage({
                    file: blog.info.hero.src,
                    name: blog.info.hero.name,
                    path: 'Blogs'
                });
                blog.socket.emit('save blog', {
                    status: 1
                })
            })
            .catch(err=> {
                blog.socket.emit('save blog', {
                    status: 0
                })
            })
        }
        else {
            blog.socket.emit('save blog', {
                status: 0
            })
        }
    })
    .catch(err=> console.warn(err));
}
fb.retrieveAllBlogs = function(socket) {
    db.collection('Blog').get()
    .then(snap=> {
        const allBlogs = [];
        snap.forEach(async blogDoc=> {
            const newSrc = await fb.retrieveImage(`Blogs_${blogDoc.data().hero}`);
            allBlogs.push({
                id: blogDoc.id,
                title: blogDoc.data().title,
                overview: blogDoc.data().overview,
                hero: {
                    name: blogDoc.data().hero,
                    src: newSrc
                },
                header: blogDoc.data().header,
                author: blogDoc.data().author,
                date: blogDoc.data().date,
                created: blogDoc.data().created
            });
            if(snap.size == allBlogs.length) {
                socket.emit('all blogs', {
                    status: !!allBlogs.length,
                    blogs: allBlogs
                })
            }
        })
    })
}
fb.deleteBlog = function(blog) {
    db.collection('User').doc(blog.userInfo.id)
    .get().then(userDoc=> {
        if(!!userDoc.data().admin) {
            db.collection('Blog').doc(blog.info.id)
            .then(()=> {

            })
            .catch(err=> {

            })
        }
    })
    .catch(err=> console.warn(err));
}
fb.retrieveBlog = function(blog) {
    db.collection('Blog').doc(blog.info.id)
    .get().then(async blogDoc=> {
        if(!!blogDoc.data()) {
            const newSrc = await fb.retrieveImage(`Blogs_${blogDoc.data().hero}`);
            blog.socket.emit('get blog', {
                status: 1,
                blog: {
                    text: blogDoc.data().text,
                    title: blogDoc.data().title,
                    hero: {
                        name: blogDoc.data().hero,
                        src: newSrc
                    }
                }
            })
        }
        else {
            blog.socket.emit('get blog', {
                status: 0
            })
        }
    })
    .catch(err=> console.warn(err));
}
fb.checkAdmin = function(user) {
    db.collection('User').doc(user.info.id)
    .get().then(userDoc=> {
        user.socket.emit('check admin', {
            status: !!userDoc.data().admin
        })
    })
}
fb.signUp = async function(user) {
    user.info.password = await passwords.hash(user.info.password);
    let newCode = await generateCode();
    user.info.code = newCode;
    db.collection('User').where('email', '==', user.info.email)
    .get().then(snap=> {
        if(!!snap.empty) {
            db.collection('User').add(user.info)
            .then(userDoc=> {
                user.socket.emit('signup user', {
                    status: 1,
                    user: {
                        id: userDoc.id,
                        username: userDoc.data().username
                    }
                })
            })
            .catch(err=> console.warn(err));
        }
        else {
            user.socket.emit('signup user', {
                status: 0,
                fail: 'email'
            })
        }
    })
}
fb.signIn = function(user) {
    db.collection('User')
    .where('email', '==', user.info.email).get()
    .then(snap=> {
        if(!snap.empty) {
            snap.forEach(async userDoc=> {
                userData = userDoc.data();
                userData.id = userDoc.id;
                const check = await passwords.verify(user.info.password, userData.password);
                if(check) {
                    user.socket.emit('login user', {
                        user: {
                            id: userData.id,
                            username: userData.username
                        },
                        status: 1
                    })
                }
                else {
                    user.socket.emit('login user', {
                        status: 0,
                        fail: 'password'
                    })
                }
            })
        }
        else {
            user.socket.emit('login user', {
                status: 0,
                fail: 'email'
            })
        }
    })
    .catch(err=> console.warn(err))
}
fb.retrieveAccount = function(user) {
    db.collection('User').doc(user.info.id)
    .get().then(userDoc=> {
        const userData = userDoc.data();
        user.socket.emit('user account', {
            status: !!userData,
            user: {
                username: userData.username
            }
        })
    })
    .catch(err=> console.warn(err))
}
fb.addComment = function(comment) {
    db.collection('User').doc(comment.userInfo.id)
    .get().then(userDoc=> {
        if(!!userDoc.data()) {
            db.collection('Blog').doc(comment.blogInfo.id)
            .get().then(blogDoc=> {
                if(!!blogDoc.data()) {
                    db.collection('Blog').doc(comment.blogInfo.id)
                    .collection('Comment').add({
                        user: userDoc.data().username,
                        comment: comment.info.comment,
                        created: comment.info.created
                    })
                    .then(commentDoc=> {
                        comment.socket.emit('add comment', {
                            status: 1,
                        })
                    })
                }
                else {
                    comment.socket.emit('add comment', {
                        status: 0,
                    })
                }
            })
        }
        else {
            comment.socket.emit('add comment', {
                status: 0,
            })
        }
    })
    .catch(err=> console.warn(err));
}
fb.retrieveAllComments = function(blog) {
    const blogRef = db.collection('Blog').doc(blog.info.id);
    blogRef
    .get().then(blogDoc=> {
        if(!!blogDoc.data()) {
            const allComments = [];
            blogRef.collection('Comment').get()
            .then(snap=> {
                snap.forEach(commentDoc=> {
                    allComments.push({
                        comment: commentDoc.data().comment,
                        user: commentDoc.data().user,
                        created: commentDoc.data().created
                    });
                    if(snap.size == allComments.length) {
                        blog.socket.emit('all comments', {
                            status: 1,
                            comments: allComments
                        })
                    }
                })
            })
        }
    })
}

const bcrypt = require('bcrypt');

const passwords = {};
passwords.hash = async function(password) {
    let hashedPassword = await bcrypt.hash(password, 10)
    .then(hash=> hash)
    .catch(err=> console.warn(err));
    return hashedPassword;
}
passwords.verify = async function(password, hashedPassword) {
    let verified = await bcrypt.compare(password, hashedPassword)
    .then(verify=> verify)
    .catch(err=> false);
    return verified;
}

async function generateCode() {
    let newCode = ``;
    for(let i = 0; i < 4; i++) {
        const rndNum = parseInt(Math.random() * 10);
        newCode += `${rndNum}`;
    }
    const usedCode = await db.collection('User').get()
    .then(snap=> {
        let used = false;
        snap.forEach(userDoc=> {
            if(userDoc.data().code == newCode) {
                used = true;
            }
        })
        return used;
    })
    .catch(err=> console.warn(err));
    return (!!usedCode) ? generateCode() : newCode;
}

async function generateMatchCode(matches) {
    let newCode = ``;
    for(let i = 0; i < 8; i++) {
        const rndNum = Math.floor(Math.random() * 10);
        newCode += `${rndNum}`;
    }
    const unique = !(matches.find(m=> m.id == newCode));
    return (unique) ? newCode : generateMatchCode(matches);
}