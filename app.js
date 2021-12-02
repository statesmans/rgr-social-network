'use strict'
const express = require('express');
const db = require('./database');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const upload = multer({dest: __dirname + '/uploads/images'});
const { setFullNamesToUpperCase, getCurrentDate } = require('./bin/backendHelpers');
const { PAGE_LIMIT } = require('./constants/constants');

const app = express();

app.set('view engine', 'ejs');
app.use('/',express.static(path.join(__dirname, '/')));
app.use('/bootstrap', express.static(path.join(__dirname + '/node_modules/bootstrap/dist')));
app.use(express.urlencoded({extended: true}));
app.use('/styles',express.static(path.join(__dirname + '/public/css/')));
app.use('/assets',express.static(path.join(__dirname + '/public/assets')));
app.use('/images',express.static(path.join(__dirname + '/uploads/images')));
app.use(session({
  secret: 'randomly generated secret',
}));
app.use(setCurrentUser);

function setCurrentUser(req, res, next) {
  if (req.session.loggedIn) {
    let sql = "SELECT * FROM User WHERE ID=?";
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

app.get('/', function (req, res) {
  res.redirect('/login')
})

app.post('/register', function (req, res) {
  const sql = "INSERT INTO User (Email, Password, Birth_Date, Last_Name, First_Name, Failed_Logins) VALUES (?,?,?,?,?,?)"
  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if(err) {
      console.log(err)
    } else {
      let data = [
        req.body.email,
        hash,
        req.body.birthday,
        req.body.last_Name,
        req.body.first_Name,
        0
      ];
      db.run(sql, data, function (err, result) {
        if (err) {
          const errorMessage = errorHandler(err.errno)
          res.render('register', {errorMessage})
          return;
        }
        res.render('register_answer', {activePage: "register", formData: req.body})
      });
    }
  });
})

app.get('/login', function (req, res) {
  res.render('login', {activePage: "login", error: ""})
})

app.post('/login', function (req, res) {
  const sqlGetAllUserInfo = "SELECT * FROM User WHERE Email = ?";
  const sqlGetFailedLogins = "SELECT Failed_Logins FROM User WHERE Email = ?";
  const sqlUpdateFailedLoginsCount = "UPDATE User SET Failed_Logins = COALESCE(?, Failed_Logins) WHERE Email = ?";
  let email = [req.body.email];
  let error = "";

  db.get(sqlGetAllUserInfo, email, (err, userInfo) => {
    if (err) {
      error = err.message;
    }
    if (userInfo === undefined) {
      error = "Wrong email or password"
    }
    if (error !== "") {
      res.render('login', {activePage: "login", error: error})
      return
    }
    db.get(sqlGetFailedLogins, email, (err, row) => {

      if(err) {
        console.log('Error when get failed logins', err)
      } else {

        if(row.Failed_Logins < 3) {
          bcrypt.compare(req.body.password, userInfo["Password"], function(err, hashRes) {
            if (hashRes === false) {
              error = "Wrong email or password";
              db.get(sqlGetFailedLogins, email, (err, row) => {
                const params = [row.Failed_Logins + 1, ...email];
                db.run(sqlUpdateFailedLoginsCount, params)
                res.render('login', {activePage: "login", error: error})
              })        
              return
            }
            db.run(sqlUpdateFailedLoginsCount, [0, email])
            // Clear failed errors  
            req.session.userId = userInfo["ID"];
            req.session.loggedIn = true;
            res.app.locals.isLoggedIn = true;
            res.redirect(`user?id=${userInfo["ID"]}`)
          });
        } else if(row.Failed_Logins === 3) {
          error = "Your account is blocked";
          res.render('login', {activePage: "login", error: error})
        }
      }
    })
  })
});

app.get('/logout', function (req, res) {
  req.session.userId = null
  req.session.loggedIn = false
  req.app.locals.currentUser = null;
  res.redirect("/login")
})

app.get('/user', checkAuth, (req, res) => {
  const sqlAllUserInfo = "SELECT * FROM User WHERE ID=?";
  const sqlGetPosts = `SELECT Post.[ID], 
                              Post.[Text], 
                              Post.[Create_Date], 
                              User.[First_Name],
                              User.[Last_Name] FROM Post INNER JOIN User ON Post.User_ID = User.ID WHERE User_ID=?`;
  let data = [];
  let isOwnerPage = false;

  if(parseInt(req.query.id) === parseInt(req.session.userId)) {
    data.push(req.session.userId);
    isOwnerPage = true;
  } else {
    data.push(req.query.id)
  }
  db.all(sqlGetPosts, data, (err, posts) => {
    db.all(sqlAllUserInfo, data, (err, userInfo) => {
      const userData = setFullNamesToUpperCase(userInfo);
      const postsData = setFullNamesToUpperCase(posts);
      return res.render('userProfile', {activePage: "userProfile", userData: userData[0], posts: postsData, isOwnerPage})
    })
  })
});


app.get('/profile/edit', (req, res ) => {
  const sqlAllUserInfo = "SELECT * FROM User WHERE ID=?";
  db.all(sqlAllUserInfo, [req.session.userId], (err, user) => {
    if (err) {
      return res.status(400).send("database error:" + err.message);
    }
    const userData = setFullNamesToUpperCase(user);
    res.render("profile_edit", {currentUser: userData[0], activePage: "userProfile" })
  })
})

app.post('/profile/edit', (req, res ) => {
  const sqlUpdateUserData =  `UPDATE User SET Email = COALESCE(?, Email),
                                              Password = COALESCE(?, Password),
                                              Birth_Date = COALESCE(?, Birth_Date),
                                              First_Name = COALESCE(LOWER(?), Last_Name),
                                              Last_Name = COALESCE(LOWER(?), Last_Name) WHERE ID = ?`;

  bcrypt.hash(req.body.password, 10, function(err, hash) {
    if(err) {
      console.log(err)
    } else {
      const data = [
        req.body.email,
        hash,
        req.body.birthday,
        req.body.first_Name,
        req.body.last_Name,
        req.session.userId
      ];
      db.run(sqlUpdateUserData, data, (err, row) => {
        if(err) {
          console.log(err)
        } else {
          res.redirect(`/user?id=${req.session.userId}`)
        }
      })
    }
  });
})

app.post('/profile/image', upload.single('photo'), function (req, res) {
  const sqlSetImage = "UPDATE User SET Image_code=? WHERE ID=?";
    if(req.file) {
      try {
        db.run(sqlSetImage, [req.file.filename , req.session.userId])
        res.redirect('back')
      } catch (err) {
        console.log(err)
      }
    }
})

app.post('/user/post', function (req, res) {
  const sqlCreateNewPost = "INSERT INTO Post (User_ID, Text, Create_Date) VALUES (?,?,?)";
  const currentDate = getCurrentDate();
  let data = [
    req.session.userId,
    req.body.postArea,
    currentDate
  ];

  try {
    db.run(sqlCreateNewPost, data, (err, result) => {
      if (err) {
        return res.status(400).send("database error:" + err.message);
      }
      res.redirect(`/user?id=${req.session.userId}`)
    })
  } catch (err) {
    console.log(err)
  }
})

app.get('/profile/comment', function (req, res) {
  const sqlComments = "SELECT Comment.[ID], Comment.[CommentText], Comment.[Create_Date], User.[First_Name], User.[Last_Name], User.[Image_Code] FROM Comment INNER JOIN User ON Comment.User_ID = User.ID AND Comment.Post_ID = ?";
  db.all(sqlComments, [req.query.postId], (err, comments) => {
    comments = setFullNamesToUpperCase(comments)
    const data = {
      comments,
      id: req.session.userId
    }

    res.json(data);
  })
})

app.post('/profile/comment', function (req, res) {
  const sqlSetComment = "INSERT INTO Comment (User_ID, Post_ID, CommentText, Create_Date) VALUES (?,?,?,?)";
  let data = [
    req.session.userId,
    req.body.postId,
    req.body.comment,
    getCurrentDate()
  ];
  try {
    db.run(sqlSetComment, data);
    res.redirect('back');
  } catch (err) {
    console.log(err)
  }
})

app.delete('/profile/comment/:id', function (req, res) {
  const sqlDeleteComment = "DELETE FROM Comment WHERE ID=?";
  db.run(sqlDeleteComment, [req.params.id], (err, row) => {
    if(err) {
      console.log(err) 
    } else {
      res.json(row)
    }
  })
})

app.delete('/profile/post/:id', (req, res) => {
  const sqlDeletePost = "DELETE FROM Post WHERE ID=?";
  db.run(sqlDeletePost, [req.params.id], (err, row) => {
    if(err) {
      console.log(err) 
    } else {
      res.json(row)
    }
  })
})


// USERS PAGE ROUTERS
app.get('/users', checkAuth, (req, res) => {
  const sqlGetUsers = "SELECT * FROM User EXCEPT SELECT * FROM User WHERE ID=? LIMIT ?,?";
  const sqlGetUsersCount = "SELECT COUNT(*) AS UsersAmount FROM User WHERE ID!=?";
  const sqlSearchUserByFullName = `SELECT User.*, (SELECT COUNT(*) FROM User WHERE First_Name LIKE LOWER(?) AND Last_Name LIKE LOWER(?) AND ID!=?) AS usersLength
                                                  FROM User WHERE First_Name LIKE LOWER(?) 
                                                  AND Last_Name LIKE LOWER(?) AND ID!=? LIMIT ?,?`
  const sqlSearchUsersByUnknownPartOfFullName = `SELECT User.*, (SELECT COUNT(*)  FROM User WHERE First_Name LIKE LOWER(?) OR Last_Name LIKE LOWER(?) AND ID!=?) AS usersLength 
                                                                FROM User WHERE First_Name LIKE LOWER(?) 
                                                                OR Last_Name LIKE LOWER(?) AND ID!=? LIMIT ?,?`
  let searchValue = '';
  let query = sqlGetUsers;
  let { page = 1, pageLimit = PAGE_LIMIT, firstName, lastName} = req.query;
  page = parseInt(page);
  const userExceptionId = req.session.userId;
  // if page is 1 we reduce elems by pageLimit width for getting start starting index for this page
  const startIndex = (page * pageLimit) - pageLimit;
  let data = [
    userExceptionId, 
    startIndex, 
    pageLimit
  ];

  if(firstName) {
    searchValue = firstName
    query = sqlSearchUsersByUnknownPartOfFullName;
    data = [
      firstName.toLowerCase() + '%',
      firstName.toLowerCase() + '%',
      req.session.userId,
      firstName.toLowerCase() + '%',
      firstName.toLowerCase() + '%',
      req.session.userId,
      startIndex, 
      pageLimit
    ];
    if(lastName) {
      searchValue = firstName + ' ' + lastName;
      data[1] = lastName.toLowerCase() + '%';
      data[4] = lastName.toLowerCase() + '%';
      query = sqlSearchUserByFullName;
    } 
  }

  db.get(sqlGetUsersCount, [userExceptionId], (err, row) => {
    if(err) console.log(err);
    db.all(query, data, (err, usersData) => {
      if(err) console.log(err);
      const usersCount = query === sqlGetUsers ? row.UsersAmount : usersData[0].usersLength;
      const paginationArr = [];
      const pagesCount = Math.ceil(usersCount/pageLimit);
      for(let i=1; i<=pagesCount; i++) {
        paginationArr.push(i)
      }
      const users = setFullNamesToUpperCase(usersData)
      res.render('users', {users, pageLimit, paginationArr, pageNumber: page, activePage: 'users', searchValue })
    })
  })
})



app.listen(3000)

module.exports = {app}