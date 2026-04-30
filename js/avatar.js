const AVATARS = {
  bear:      'img/bear_3d.png',
  peacock:   'img/peacock_3d.png',
  alien:     'img/alien_3d.png',
  astronaut: 'img/astronaut_3d_default.png'
};

function loadNavAvatar() {
  const saved = localStorage.getItem('bf_avatar');
  const sbAvatar = document.getElementById('sb-avatar');
  if (saved && sbAvatar && AVATARS[saved]) {
    sbAvatar.src = AVATARS[saved];
    sbAvatar.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNavAvatar();

  // Avatar picker (only on index.html)
  const overlay  = document.getElementById('avatar-overlay');
  const opts     = document.querySelectorAll('.avatar-opt');
  const preview  = document.getElementById('avatar-preview');
  const confirmBtn = document.getElementById('avatar-confirm');

  if (overlay) {
    const saved = localStorage.getItem('bf_avatar');
    if (!saved) setTimeout(() => overlay.classList.remove('hidden'), 400);

    let selectedKey = 'bear';
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        selectedKey = opt.dataset.key;
        if (preview) {
          preview.src = opt.dataset.src;
          preview.style.transform = 'scale(1.15)';
          setTimeout(() => { preview.style.transform = 'scale(1)'; }, 200);
        }
      });
    });

    confirmBtn?.addEventListener('click', () => {
      localStorage.setItem('bf_avatar', selectedKey);
      overlay.classList.add('hidden');
      loadNavAvatar();
    });
  }

  // Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('bf_avatar');
      localStorage.removeItem('bf_timetable');
      localStorage.removeItem('bf_attendance');
      localStorage.removeItem('bf_notebook');
      localStorage.removeItem('bf_theme');
      window.location.href = 'login.html';
    });
  }
});