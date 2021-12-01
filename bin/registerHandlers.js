'use strict'

let iconImage = document.getElementById('iconImage');
iconImage.addEventListener('change', async (e) => {
  let data = new FormData();
  let file = document.forms['register'].elements['file'];
  data.append('file', file);
    fetch('/register/image', {
      method: 'POST',
      body: JSON.stringify(file)
    })
})

