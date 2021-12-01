"use strict"
const moment = require("moment")

const currentDate = (format = "YY.MM.DD HH:MM") => moment(new Date).format(format); 

const fullNameToUpperCase = (data) => {
  return data.map(user => {
    const firstSymbolOfFirstName = user.First_Name.slice(0, 1);
    const firstSymbolOfLastName = user.Last_Name.slice(0, 1);
    user.First_Name = user.First_Name.replace(firstSymbolOfFirstName, firstSymbolOfFirstName.toUpperCase());
    user.Last_Name = user.Last_Name.replace(firstSymbolOfLastName, firstSymbolOfLastName.toUpperCase());
    return user
  });
}

module.exports = {
  getCurrentDate: currentDate,
  setFullNamesToUpperCase: fullNameToUpperCase
}