import { getNewPageSearch } from "./frontendHelpers.js";
const prevBtn = document.getElementById('prevPagBtn');
const nextBtn = document.getElementById('nextPagBtn');
const searchInput = document.getElementById('searchInput');
const findUserForm = document.forms['findUserForm'];
const inputPageItems = Array.from(document.getElementsByClassName('page-item'));

// pagination behavior
prevBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  getNewPageSearch('reduce');
})

nextBtn.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  getNewPageSearch('increase');
})

inputPageItems.map(inputItem => {
  inputItem.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    let pageSelectValue = inputItem.children[0].getAttribute('value')

    getNewPageSearch('', pageSelectValue);
  })
})

findUserForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let url = 'users?page=1';
  const searchValue = searchInput.value;
  
  const [ firstName, lastName ] = searchValue.split(' ')
  if(lastName !== '' && lastName !== undefined) {
    url = url.slice() + `&firstName=${firstName}&lastName=${lastName}`
  } else if (firstName !== '') {
    url = url.slice() + `&firstName=${firstName}`
  }
  history.replaceState(null, null, url)
  document.location.reload()
})