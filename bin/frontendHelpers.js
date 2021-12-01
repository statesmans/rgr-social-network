"use strict"
const getURLParam = (paramName) => {
  const queryParams = new URLSearchParams(window.location.search);
  const paramValue = parseInt(queryParams.get(paramName));
  return paramValue;
} 

const getNewPageSearch = (command, pageNumber = null) => {
  const queryParams = new URLSearchParams(window.location.search);
  let paramValues = [];
  let paramKeys = [];
  for(let value of queryParams.values()) {
    paramValues.push(value)
  }
  for(let key of queryParams.keys()) {
    paramKeys.push(key)
  }
  paramValues.map( (value, i) => {
    queryParams.set(`${paramKeys[i]}`, `${value}`)

    if(paramKeys[i] === 'page') {
      if(command === 'increase') {
        const newValue = (parseInt(value) + 1).toString();
        queryParams.delete(`${paramKeys[i]}`);
        queryParams.append(`${paramKeys[i]}`, `${newValue}`);

      } else if('reduce' && parseInt(value) > 1) {
        const newValue = (parseInt(value) - 1).toString();
        queryParams.delete(`${paramKeys[i]}`);
        queryParams.append(`${paramKeys[i]}`, `${newValue}`);
      } else if(pageNumber !== null) {
        const newValue = pageNumber;
        queryParams.delete(`${paramKeys[i]}`);
        queryParams.append(`${paramKeys[i]}`, `${newValue}`);
      }
    } else {
      queryParams.delete(`${paramKeys[i]}`);
      queryParams.append(`${paramKeys[i]}`, `${value}`)
    }
  })
  console.log("?"+queryParams.toString(), location.search)
  history.pushState(null, null, "?"+queryParams.toString());
  document.location.reload()
}


export {
  getURLParam,
  getNewPageSearch
};