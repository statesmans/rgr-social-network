"use strict"
const db = require("../database");
const bcrypt = require('bcrypt')


class AuthRepository {
  constructor () {
    this.sqlPosts = "SELECT [ID],[Text],[Create_Date],[Owner_First_Name],[Owner_Last_Name] FROM Post WHERE User_ID=?",
    this.sqlCreateNewUser = "INSERT INTO User (Email, Password, Birth_Date, Last_Name, First_Name, Failed_Logins) VALUES(?,?,?,?,?,?)",
    this.sqlGetAllUserInfo = "SELECT * FROM User WHERE Email = ?",
    this.sqlGetFailedLogins = "SELECT Failed_Logins FROM User WHERE Email = ?",
    this.sqlUpdateFailedLoginsCount = "UPDATE User SET Failed_Logins = COALESCE(?, Failed_Logins) WHERE Email = ?"
  }

  createUser(req, res, hash) {
    let { first_Name, last_Name, birthday, email } = req.body;
    first_Name = first_Name.toLowerCase();
    last_Name = last_Name.toLowerCase();
    let data = [
      email,
      hash,
      birthday,
      last_Name,
      first_Name,
      0
    ];
    db.run(this.sqlCreateNewUser, data, function (err, result) {
      if (err) {

        console.log(err);
        res.render('register', {errorMessage: 'Data is you write are not valid or user with this email already exist'})
        return;
      }
      res.render('register_answer', {activePage: "register", formData: req.body})
    });
  }
  
  userLogin(req, res) {
    let email = [req.body.email];
    let error = "";
  
    db.get(this.sqlGetAllUserInfo, email, (err, userInfo) => {
      const sqlGetFailedLogins = this.sqlGetFailedLogins;
      const sqlUpdateFailedLoginsCount = this.sqlUpdateFailedLoginsCount;
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
  }
}

module.exports = {
  AuthRepository: AuthRepository
}