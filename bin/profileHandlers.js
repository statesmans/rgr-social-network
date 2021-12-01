const infoStatus = document.getElementById('infoStatus');

infoStatus.addEventListener('click', (e) => {
  if (infoStatus.classList.contains('info__status--disable')) {
    infoStatus.focus();
    toggleActiveEl(infoStatus, 'info__status');
  }
});

let addStatusListener = () => {
  infoStatus.addEventListener('blur', (e) => {
    document.forms['statusForm'].submit();
    toggleActiveEl(infoStatus, 'info__status');
  });

  infoStatus.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      infoStatus.blur();
    }
  });
};

addStatusListener();