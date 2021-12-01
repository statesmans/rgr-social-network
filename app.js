'use strict'
const express = require('express');
const db = require('./database');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads/images'});
const { ProfileRepository } = require('./repositories/profile-repository');
const { AuthRepository } = require('./repositories/auth-repository');
const { UserRepository } = require('./repositories/user-repository')

const userRepository = new UserRepository();
const authRepository = new AuthRepository();
const profileRepository = new ProfileRepository();
const app = express();

app.set('view engine', 'ejs');
app.use('/',express.static(path.join(__dirname, '/')));
app.use('/bootstrap', express.static(path.join(__dirname + '/node_modules/bootstrap/dist')));
app.use('/jquery', express.static(path.join(__dirname + '/node_modules/jquery/dist/')));
app.use(express.urlencoded({extended: true}));
app.use('/styles',express.static(path.join(__dirname + '/public/css/')));
app.use('/assets',express.static(path.join(__dirname + '/public/assets')));
app.use(session({
  secret: 'randomly generated secret',
}));
app.use(setCurrentUser);

function setCurrentUser(req, res, next) {
  if (req.session.loggedIn) {
    let sql = userRepository.sqlAllUserInfo;
    db.get(sql, [req.session.userId], (err, row) => {
      if(err) {
        console.log(err)
      } else {
        if (row !== undefined) {
          
          res.app.locals.currentUser = row;
        }
      }
      next();
    });
  } else {
    res.app.locals.currentUser = null;
    next();
  }
}

function checkAuth(req, res, next) {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

app.get('/register', function (req, res) {
  res.render('register', {activePage: "register", errorMessage: ''});
})

app.post('/register', function (req, res) {
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if(err) {
      console.log(err)
    } else {
      authRepository.createUser(req, res, hash)
    }
  });
})

app.get('/login', function (req, res) {
  res.render('login', {activePage: "login", error: ""})
})

app.post('/login', function (req, res) {
  authRepository.userLogin(req, res);
});

app.get('/logout', function (req, res) {
  req.session.userId = null
  req.session.loggedIn = false
  req.app.locals.currentUser = null;
  res.redirect("/login")
})

app.get('/user', checkAuth, (req, res) => {
    profileRepository.getPosts(req, res)
});


app.get('/profile/edit', (req, res ) => {
  userRepository.getAllUserInfo(req, res, 'profile_edit', 'userProfile')
})

app.post('/profile/edit', (req, res ) => {
  userRepository.updateUserData(req, res)
})

app.post('/profile/image', upload.single('photo'), function (req, res) {
    if(req.file) {
      profileRepository.setUserImage(req, res)
    }
})


app.post('/profile/status', function (req, res) {
  userRepository.updateProfileStatus(req, res);
})

app.post('/user/post', function (req, res) {
  profileRepository.createNewPost(req, res)
})

app.get('/profile/comment', function (req, res) {
  profileRepository.getPostComments(req, res)
})

app.post('/profile/comment', function (req, res) {
  profileRepository.setPostComment(req, res)
})

app.delete('/profile/comment/:id', function (req, res) {
  profileRepository.deletePostComment(req, res)
})

app.delete('/profile/post/:id', (req, res) => {
  profileRepository.deletePost(req, res)
})

// USER PAGE ROUTERS




// USERS PAGE ROUTERS
app.get('/users', checkAuth, (req, res) => {
  profileRepository.getUsers(req, res)
})



app.listen(3000)

module.exports = {app}