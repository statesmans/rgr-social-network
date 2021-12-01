"use strict"
const db = require("../database");
const bcrypt = require('bcrypt');
const e = require("express");
const { setFullNamesToUpperCase } = require("../bin/backendHelpers");

class UserRepository {
  constructor () {
    this.sqlAllUserInfo = "SELECT * FROM User WHERE ID=?",
    this.sqlUpdateProfileStatus = "UPDATE User SET Status = COALESCE(?, Status) WHERE ID = ?",
    
    this.sqlUpdateUserData = `UPDATE User SET Email = COALESCE(?, Email),
                                              Password = COALESCE(?, Password),
                                              Birth_Date = COALESCE(?, Birth_Date),
                                              First_Name = COALESCE(LOWER(?), Last_Name),
                                              Last_Name = COALESCE(LOWER(?), Last_Name) WHERE ID = ?`
  }

  getAllUserInfo(req, res, sampleName, activePage) {
    db.all(this.sqlAllUserInfo, [req.session.userId], (err, user) => {
      if (err) {
        return res.status(400).send("database error:" + err.message);
      }
      const userData = setFullNamesToUpperCase(user);
      res.render(sampleName, {currentUser: userData[0], activePage })
    })
  }

  updateUserData(req, res) {
    const sqlUpdateUserData = this.sqlUpdateUserData;
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
        console.log(data, 'data')
        db.run(sqlUpdateUserData, data, (err, row) => {
          if(err) {
            console.log(err)
          } else {
            res.redirect(`/user?id=${req.session.userId}`)
          }
        })
      }
    });

  }
  
  updateProfileStatus(req, res) {
    let data = [
      req.body.status,
      req.session.userId
    ];
  
    db.run(this.sqlUpdateProfileStatus, data, (err, result) => {
      if (err) {
        return res.status(400).send("database error:" + err.message);
      }
      res.redirect(`/user?id=${req.session.userId}`)
    })
  }

}

module.exports = {
  UserRepository: UserRepository
}