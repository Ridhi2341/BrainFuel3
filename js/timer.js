document.addEventListener('DOMContentLoaded', () => {
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const resetBtn = document.getElementById('timer-reset');

  if (!timerDisplay || !startBtn || !resetBtn) return;

  const TOTAL_TIME = 25 * 60; // 25 minutes in seconds
  let timerInterval = null;

  function getEndTime() {
    return parseInt(localStorage.getItem('bf_timer_end')) || null;
  }

  function setEndTime(val) {
    if (val) localStorage.setItem('bf_timer_end', val);
    else localStorage.removeItem('bf_timer_end');
  }

  function getPausedLeft() {
    const val = localStorage.getItem('bf_timer_paused_left');
    return val ? parseInt(val) : null;
  }

  function setPausedLeft(val) {
    if (val !== null) localStorage.setItem('bf_timer_paused_left', val);
    else localStorage.removeItem('bf_timer_paused_left');
  }

  function updateDisplay(timeLeft) {
    if (timeLeft < 0) timeLeft = 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function checkTimer() {
    const end = getEndTime();
    if (!end) return;

    const now = Date.now();
    let timeLeft = Math.round((end - now) / 1000);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      setEndTime(null);
      setPausedLeft(null);
      startBtn.textContent = '▶';
      updateDisplay(TOTAL_TIME);
      document.dispatchEvent(new CustomEvent('bf-timer-update', { detail: { isRunning: false } }));
    } else {
      updateDisplay(timeLeft);
    }
  }

  function toggleTimer() {
    let end = getEndTime();
    if (end) {
      // It's running -> Pause
      clearInterval(timerInterval);
      const timeLeft = Math.max(0, Math.round((end - Date.now()) / 1000));
      setPausedLeft(timeLeft);
      setEndTime(null);
      startBtn.textContent = '▶';
      document.dispatchEvent(new CustomEvent('bf-timer-update', { detail: { isRunning: false } }));
    } else {
      // It's paused or stopped -> Start
      let timeLeft = getPausedLeft();
      if (timeLeft === null) timeLeft = TOTAL_TIME;
      const newEnd = Date.now() + timeLeft * 1000;
      setEndTime(newEnd);
      setPausedLeft(null);
      startBtn.textContent = '⏸';
      timerInterval = setInterval(checkTimer, 1000);
      checkTimer();
      document.dispatchEvent(new CustomEvent('bf-timer-update', { detail: { isRunning: true } }));
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    setEndTime(null);
    setPausedLeft(null);
    startBtn.textContent = '▶';
    updateDisplay(TOTAL_TIME);
    document.dispatchEvent(new CustomEvent('bf-timer-update', { detail: { isRunning: false } }));
  }

  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Initialize
  const end = getEndTime();
  if (end) {
    startBtn.textContent = '⏸';
    timerInterval = setInterval(checkTimer, 1000);
    checkTimer();
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('bf-timer-update', { detail: { isRunning: true } }));
    }, 50);
  } else {
    const paused = getPausedLeft();
    if (paused !== null) {
      updateDisplay(paused);
    } else {
      updateDisplay(TOTAL_TIME);
    }
    startBtn.textContent = '▶';
  }
});
