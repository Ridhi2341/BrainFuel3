document.addEventListener("DOMContentLoaded", () => {
  const loggedIn = localStorage.getItem('bf_logged_in') === 'true';
  const greetingEl = document.getElementById('sb-greeting');
  const logoutBtn = document.getElementById('btn-logout');

  function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = "Good evening ✦";
    if (hour < 12) {
      greeting = "Good morning ☀️";
    } else if (hour < 18) {
      greeting = "Good afternoon 🌤️";
    }
    if (greetingEl) greetingEl.textContent = greeting;
  }

  const userAvatar = localStorage.getItem('bf_user_avatar') || '🦉';
  const userName = localStorage.getItem('bf_user_name');

  // Add avatar next to the 'BrainFuel' title
  const logoText = document.querySelector('.sb-logo-text');
  if (loggedIn && logoText && !document.querySelector('.sb-logo-avatar')) {
    const avatarSpan = document.createElement('span');
    avatarSpan.className = 'sb-logo-avatar';
    avatarSpan.textContent = ` ${userAvatar}`;
    avatarSpan.style.marginLeft = '6px';
    avatarSpan.style.fontSize = '18px';
    logoText.parentNode.insertBefore(avatarSpan, logoText.nextSibling);
  }

  // Update bottom avatar
  const avatarImg = document.getElementById('sb-avatar');
  if (avatarImg && loggedIn) {
    const emojiDiv = document.createElement('div');
    emojiDiv.className = 'sb-avatar sb-emoji-avatar';
    emojiDiv.style.fontSize = '18px';
    emojiDiv.style.display = 'flex';
    emojiDiv.style.alignItems = 'center';
    emojiDiv.style.justifyContent = 'center';
    emojiDiv.style.background = 'var(--bg-soft2)';
    emojiDiv.textContent = userAvatar;
    avatarImg.parentNode.replaceChild(emojiDiv, avatarImg);
  }

  if (loggedIn) {
    if (greetingEl) {
      greetingEl.style.display = '';
      if (userName) {
        greetingEl.textContent = `Hello, ${userName}`;
      } else {
        updateGreeting();
      }
    }
    if (logoutBtn) {
      logoutBtn.textContent = 'Sign out';
      logoutBtn.onclick = () => {
        localStorage.removeItem('bf_logged_in');
        window.location.href = 'login.html';
      };
    }
  } else {
    if (greetingEl) greetingEl.style.display = 'none';
    if (logoutBtn) {
      logoutBtn.textContent = 'Sign in';
      logoutBtn.onclick = () => {
        window.location.href = 'login.html';
      };
    }
  }

  // Listen for timer updates to toggle focus mode
  document.addEventListener('bf-timer-update', (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    if (e.detail.isRunning) {
      sidebar.classList.add('focus-mode');
      if (greetingEl) greetingEl.textContent = 'Stay focused...';
    } else {
      sidebar.classList.remove('focus-mode');
      if (loggedIn) updateGreeting();
    }
  });
});
