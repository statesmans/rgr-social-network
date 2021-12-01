"use strict"

let profileEditImageInput = document.getElementById('editProfileImage');
let profileEditImageForm = document.getElementById('editProfileImageForm')

profileEditImageInput.addEventListener('change', () => {
  document.forms['editProfileImageForm'].submit();
})

profileEditImageForm.addEventListener('submit', (e) => e.preventDefault())