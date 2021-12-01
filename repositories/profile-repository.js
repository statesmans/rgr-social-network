"use strict"
const e = require("express");
const { getCurrentDate, setFullNamesToUpperCase } = require("../bin/backendHelpers");
const db = require("../database");
const { PAGE_LIMIT } = require('./constants.js')

class ProfileRepository {
  constructor () {
    this.sqlPosts = "SELECT Post.[ID], Post.[Text], Post.[Create_Date], User.[First_Name],User.[Last_Name] FROM Post INNER JOIN User ON Post.User_ID = User.ID WHERE User_ID=?",
    this.sqlGetUsers = "SELECT * FROM User EXCEPT SELECT * FROM User WHERE ID=? LIMIT ?,?",
    this.getUsersCount = "SELECT COUNT(*) AS UsersAmount FROM User WHERE ID!=?",
    this.sqlFullName = "SELECT [First_Name],[Last_Name] FROM User WHERE ID=?",
    this.sqlComments = "SELECT Comment.[ID], Comment.[CommentText], Comment.[Create_Date], User.[First_Name], User.[Last_Name], User.[Image_Code] FROM Comment INNER JOIN User ON Comment.Owner_ID = User.ID AND Comment.Post_ID = ?",
    this.sqlDeletePost = "DELETE FROM Post WHERE ID=?",
    this.sqlDeleteComment = "DELETE FROM Comment WHERE ID=?"
    this.sqlAllUserInfo = "SELECT * FROM User WHERE ID=?"
    this.sqlSetImage = "UPDATE User SET Image_code=? WHERE ID=?",
    this.sqlSetComment = "INSERT INTO Comment (User_ID, Owner_ID, Post_ID, CommentText, Create_Date) VALUES (?,?,?,?,?)",
    this.sqlCreateNewUser = "INSERT INTO User (Email, Password, Birth_Date, Last_Name, First_Name, Failed_Logins) VALUES (?,?,?,?,?,?)",
    this.sqlCreateNewPost = "INSERT INTO Post (Owner_First_Name, Owner_Last_Name, User_ID, Text, Create_Date) VALUES (?,?,?,?,?)",
    this.sqlSearchUsersByUnknownPartOfFullName = `SELECT User.*, (SELECT COUNT(*)  FROM User WHERE First_Name LIKE LOWER(?) OR Last_Name LIKE LOWER(?) AND ID!=?) AS usersLength 
                                                                  FROM User WHERE First_Name LIKE LOWER(?) 
                                                                  OR Last_Name LIKE LOWER(?) AND ID!=? LIMIT ?,?`
    this.sqlSearchUserByFullName = `SELECT User.*, (SELECT COUNT(*) FROM User WHERE First_Name LIKE LOWER(?) AND Last_Name LIKE LOWER(?) AND ID!=?) AS usersLength
                                                  FROM User WHERE First_Name LIKE LOWER(?) 
                                                  AND Last_Name LIKE LOWER(?) AND ID!=? LIMIT ?,?`
  }

  createUser(req, res, hash) {
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

  createNewPost(req, res) {
    const currentDate = getCurrentDate();
    const currentUserData = res.app.locals.currentUser;
    let data = [
      currentUserData.First_Name,
      currentUserData.Last_Name,
      req.session.userId,
      req.body.postArea,
      currentDate
    ];
  
    try {
      db.run(this.sqlCreateNewPost, data, (err, result) => {
        if (err) {
          return res.status(400).send("database error:" + err.message);
        }
        res.redirect(`/user?id=${req.session.userId}`)
      })
    } catch (err) {
      console.log(err)
    }
  }
  
  getPosts(req, res) {
    let data = [];
    let isOwnerPage = false;

    if(parseInt(req.query.id) === parseInt(req.session.userId)) {
      data.push(req.session.userId);
      isOwnerPage = true;
    } else {
      data.push(req.query.id)
    }
    db.all(this.sqlPosts, data, (err, posts) => {
      db.all(this.sqlAllUserInfo, data, (err, userInfo) => {
        const userData = setFullNamesToUpperCase(userInfo);
        const postsData = setFullNamesToUpperCase(posts);
        console.log(userData)
        return res.render('userProfile', {activePage: "userProfile", userData: userData[0], posts: postsData, isOwnerPage})
      })
    })
  }

  deletePost(req, res) {
    db.run(this.sqlDeletePost, [req.params.id], (err, row) => {
      if(err) {
        console.log(err) 
      } else {
        res.json(row)
      }
    })
  }

  getPostComments(req, res) {
    db.all(this.sqlComments, [req.query.postId], (err, comments) => {
      comments = setFullNamesToUpperCase(comments)
      const data = {
        comments,
        id: req.session.userId
      }

      res.json(data);
    })
  }

  getFullName(userId) {
    db.get(this.sqlFullName, [userId], (err, user) => {
      return user;
    })
  }


  setUserImage(req, res) {
    try {
      db.run(this.sqlSetImage, [req.file.filename , req.session.userId])
      res.redirect('back')
    } catch (err) {
      console.log(err)
    }
  }

  setPostComment(req, res) {
    let data = [
      req.session.userId,
      req.session.userId,
      req.body.postId,
      req.body.comment,
      getCurrentDate()
    ];
    try {
      db.run(this.sqlSetComment, data);
      res.redirect('back');
    } catch (err) {
      console.log(err)
    }
  }

  deletePostComment(req, res) {
    db.run(this.sqlDeleteComment, [req.params.id], (err, row) => {
      if(err) {
        console.log(err) 
      } else {
        res.json(row)
      }
    })
  }

  getUsers(req, res) {
    let searchValue = '';
    let query = this.sqlGetUsers;
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
      query = this.sqlSearchUsersByUnknownPartOfFullName;
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
      if(lastName ) {
        searchValue = firstName + ' ' + lastName;
        data[1] = lastName.toLowerCase() + '%';
        data[4] = lastName.toLowerCase() + '%';
        query = this.sqlSearchUserByFullName;
      } 

    }

    db.get(this.getUsersCount, [userExceptionId], (err, row) => {
      if(err) console.log(err);
      db.all(query, data, (err, usersData) => {
        if(err) console.log(err);
        const usersCount = query === this.sqlGetUsers ? row.UsersAmount : usersData[0].usersLength;
        const paginationArr = [];
        const pagesCount = Math.ceil(usersCount/pageLimit);
        for(let i=1; i<=pagesCount; i++) {
          paginationArr.push(i)
        }
        const users = setFullNamesToUpperCase(usersData)
        res.render('users', {users, pageLimit, paginationArr, pageNumber: page, activePage: 'users', searchValue })
      })
    })
  }

}

module.exports = {
  ProfileRepository: ProfileRepository
}