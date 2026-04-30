// Auth check
function checkAuth() {
  const loggedIn = localStorage.getItem('bf_logged_in') === 'true';
  const isLoginPage = window.location.pathname.endsWith('login.html');
  
  if (!loggedIn && !isLoginPage) {
    window.location.href = 'login.html';
  }
}
checkAuth();

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  if (!isLoginPage) return;

  if (window.location.hash === '#signup') {
    document.getElementById('tab-signup').checked = true;
  }

  function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = msg ? 'block' : 'none'; }
  }
  function clearErrors(...ids) { ids.forEach(id => showError(id, '')); }
  function markInvalid(inputId, errId, msg) {
    document.getElementById(inputId).classList.add('input-error');
    showError(errId, msg);
    return false;
  }
  function markValid(inputId) { document.getElementById(inputId).classList.remove('input-error'); }
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()); }

  const pwInput = document.getElementById('s-pw');
  const pwBar = document.getElementById('pw-bar');
  const pwLabel = document.getElementById('pw-label');
  if (pwInput) {
    pwInput.addEventListener('input', function() {
      const val = this.value;
      let score = 0;
      if (val.length >= 8) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      const colors = ['','#ef4444','#f59e0b','#84cc16','#22c55e'];
      const widths = ['0%','25%','50%','75%','100%'];
      const levels = ['','Weak','Fair','Good','Strong'];
      pwBar.style.width = val.length ? widths[score] : '0%';
      pwBar.style.background = colors[score];
      pwLabel.textContent = val.length ? levels[score] : '';
      pwLabel.style.color = colors[score];
    });
  }

  // Avatar Selection Logic
  const avatarGrid = document.getElementById('s-avatar-grid');
  let selectedAvatar = '🦉';
  if (avatarGrid) {
    const avatarBtns = avatarGrid.querySelectorAll('.avatar-btn');
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAvatar = btn.textContent.trim();
        document.getElementById('s-avatar').value = selectedAvatar;
      });
    });
  }

  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', function() {
      const email = document.getElementById('l-email').value.trim();
      const pw = document.getElementById('l-pw').value;
      clearErrors('l-email-err','l-pw-err');
      markValid('l-email'); markValid('l-pw');
      let valid = true;
      if (!email) { markInvalid('l-email','l-email-err','Email is required.'); valid = false; }
      else if (!isValidEmail(email)) { markInvalid('l-email','l-email-err','Enter a valid email.'); valid = false; }
      if (!pw) { markInvalid('l-pw','l-pw-err','Password is required.'); valid = false; }
      else if (pw.length < 8) { markInvalid('l-pw','l-pw-err','Minimum 8 characters.'); valid = false; }
      if (valid) {
        localStorage.setItem('bf_logged_in', 'true');
        if (!localStorage.getItem('bf_user_name')) localStorage.setItem('bf_user_name', 'Student');
        if (!localStorage.getItem('bf_user_avatar')) localStorage.setItem('bf_user_avatar', '🦉');
        window.location.href = 'index.html';
      }
    });
  }

  const btnSignup = document.getElementById('btn-signup');
  if (btnSignup) {
    btnSignup.addEventListener('click', function() {
      const name = document.getElementById('s-name').value.trim();
      const email = document.getElementById('s-email').value.trim();
      const uni = document.getElementById('s-uni').value.trim();
      const pw = document.getElementById('s-pw').value;
      const pw2 = document.getElementById('s-pw2').value;
      clearErrors('s-name-err','s-email-err','s-uni-err','s-pw-err','s-pw2-err');
      ['s-name','s-email','s-uni','s-pw','s-pw2'].forEach(markValid);
      let valid = true;
      if (!name) { markInvalid('s-name','s-name-err','Name is required.'); valid = false; }
      if (!email) { markInvalid('s-email','s-email-err','Email is required.'); valid = false; }
      else if (!isValidEmail(email)) { markInvalid('s-email','s-email-err','Enter a valid email.'); valid = false; }
      if (!uni) { markInvalid('s-uni','s-uni-err','Institution is required.'); valid = false; }
      if (!pw) { markInvalid('s-pw','s-pw-err','Password is required.'); valid = false; }
      else if (pw.length < 8) { markInvalid('s-pw','s-pw-err','Minimum 8 characters.'); valid = false; }
      if (!pw2) { markInvalid('s-pw2','s-pw2-err','Please confirm password.'); valid = false; }
      else if (pw && pw !== pw2) { markInvalid('s-pw2','s-pw2-err','Passwords do not match.'); valid = false; }
      if (valid) {
        localStorage.setItem('bf_logged_in', 'true');
        localStorage.setItem('bf_user_name', name);
        localStorage.setItem('bf_user_avatar', selectedAvatar);
        window.location.href = 'index.html';
      }
    });
  }

  document.querySelectorAll('.form-input').forEach(function(input) {
    input.addEventListener('input', function() {
      this.classList.remove('input-error');
      const errSpan = document.getElementById(this.id + '-err');
      if (errSpan) { errSpan.textContent = ''; errSpan.style.display = 'none'; }
    });
  });
});
