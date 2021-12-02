const sqlUser = `CREATE TABLE IF NOT EXISTS User 
                (ID INTEGER PRIMARY KEY AUTOINCREMENT, 
                Email TEXT NOT NULL UNIQUE, 
                Password TEXT NOT NULL, 
                Birth_Date TEXT NOT NULL, 
                Last_Name TEXT NOT NULL, 
                First_Name TEXT NOT NULL, 
                Image_code TEXT,
                Failed_Logins INTEGER, 
                CONSTRAINT email_unique UNIQUE (email))`;

const sqlPost = `CREATE TABLE IF NOT EXISTS Post 
                (ID INTEGER PRIMARY KEY AUTOINCREMENT, 
                User_ID INTEGER, 
                Text TEXT NOT NULL, 
                Create_Date TEXT, 
                FOREIGN KEY([User_ID]) REFERENCES [User]([ID]))`;

const sqlComment = `CREATE TABLE IF NOT EXISTS Comment 
                    (ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    User_ID INTEGER, 
                    Post_ID INTEGER, 
                    CommentText TEXT NOT NULL, 
                    Create_Date TEXT, 
                    FOREIGN KEY([User_ID]) REFERENCES [User]([ID]) FOREIGN KEY([Post_ID]) REFERENCES [Post]([ID]))`;

const sqlite3 = require('sqlite3').verbose()
const DBSOURCE = "./db/db.sqlite"

const db = new sqlite3.Database(DBSOURCE, (err) => {
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

module.exports = db