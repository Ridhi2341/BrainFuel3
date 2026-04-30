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

  if (loggedIn) {
    if (greetingEl) {
      greetingEl.style.display = '';
      updateGreeting();
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
