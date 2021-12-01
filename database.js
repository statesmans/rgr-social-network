const sqlUser = "CREATE TABLE IF NOT EXISTS User (ID INTEGER PRIMARY KEY AUTOINCREMENT, Email TEXT NOT NULL UNIQUE, Password TEXT NOT NULL, Birth_Date TEXT NOT NULL, Last_Name TEXT NOT NULL, First_Name TEXT NOT NULL, Image_code TEXT, Status TEXT, Failed_Logins INTEGER, CONSTRAINT email_unique UNIQUE (email));"
const sqlPost = "CREATE TABLE IF NOT EXISTS Post (ID INTEGER PRIMARY KEY AUTOINCREMENT, User_ID INTEGER, Text TEXT NOT NULL, Create_Date TEXT, FOREIGN KEY([User_ID]) REFERENCES [User]([ID]));"
const sqlComment = "CREATE TABLE IF NOT EXISTS Comment (ID INTEGER PRIMARY KEY AUTOINCREMENT, Owner_ID INTEGER,  User_ID INTEGER, Post_ID INTEGER, CommentText TEXT NOT NULL, Create_Date TEXT, FOREIGN KEY([User_ID]) REFERENCES [User]([ID]) FOREIGN KEY([Post_ID]) REFERENCES [Post]([ID]));"

var sqlite3 = require('sqlite3').verbose()

var DBSOURCE = "./db/db.sqlite"

var db = new sqlite3.Database(DBSOURCE, (err) => {
  console.log('create')
  if (err) {
    // Cannot open database
    console.error(err.message)
    throw err

  } else {
    console.log('Connected to the SQLite database.')
    db.run(sqlUser, (err) => {
        if (err) {
          console.log(err)
          return
        }
        console.log("Table users is created")
    });
    db.run(sqlPost, (err) => {
        if (err) {
          console.log(err)
          return
        }
        console.log("Table Post is created")
    });
    db.run(sqlComment, (err) => {
        if (err) {
          console.log(err)
          return
        }
        console.log("Table Comment is created")
    });

  }
});

/* `CREATE TABLE User (ID INTEGER, Email TEXT NOT NULL UNIQUE, Password TEXT NOT NULL, Birth_Date TEXT NOT NULL, Last_Name TEXT NOT NULL, First_Name TEXT NOT NULL, Status TEXT, FOREIGN KEY([ID]) REFERENCES [Post]([ID]))

CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name text, email text UNIQUE, password text, failed_logins INTEGER,
  CONSTRAINT email_unique UNIQUE (email))
` */

module.exports = db