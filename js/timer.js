document.addEventListener('DOMContentLoaded', () => {
  const timerRing = document.getElementById('timer-ring');
  const timerDisplay = document.getElementById('timer-display');
  const startBtn = document.getElementById('timer-start');
  const resetBtn = document.getElementById('timer-reset');

  if (!timerRing || !timerDisplay || !startBtn || !resetBtn) return;

  const TOTAL_TIME = 25 * 60; // 25 minutes in seconds
  let timeLeft = TOTAL_TIME;
  let timerInterval = null;
  let isRunning = false;

  // The total length of the circle's path
  const circumference = 2 * Math.PI * 36;
  timerRing.style.strokeDasharray = `${circumference} ${circumference}`;

  function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Calculate offset: fills up as time passes
    const progress = (TOTAL_TIME - timeLeft) / TOTAL_TIME;
    const offset = circumference - (progress * circumference);
    timerRing.style.strokeDashoffset = offset;
  }

  function toggleTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      startBtn.textContent = 'Resume';
      isRunning = false;
    } else {
      if (timeLeft === 0) resetTimer(); // Restart if finished
      startBtn.textContent = 'Pause';
      isRunning = true;
      timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isRunning = false;
          startBtn.textContent = 'Start Focus';
        }
      }, 1000);
    }
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    timeLeft = TOTAL_TIME;
    startBtn.textContent = 'Start Focus';
    updateDisplay();
  }

  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Initialize
  resetTimer();
});
