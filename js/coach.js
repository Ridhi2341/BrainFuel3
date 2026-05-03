document.addEventListener('DOMContentLoaded', () => {
  const goalInput = document.getElementById('coach-target-input');
  const goalSaveBtn = document.getElementById('coach-target-save');
  const coachMessage = document.getElementById('coach-message');
  const motivateBtn = document.getElementById('coach-motivate-btn');
  const progressCircle = document.getElementById('coach-progress-circle');
  const goalDisplay = document.getElementById('coach-goal-display');

  if (!goalInput) return; // Not on the dashboard

  const MOTIVATIONS = [
    "Small steps every day lead to massive results.",
    "Focus on the process, not just the outcome.",
    "You don't have to be great to start, but you have to start to be great.",
    "A year from now, you'll wish you had started today.",
    "Every expert was once a beginner.",
    "Discipline is choosing between what you want now and what you want most."
  ];

  function updateCoachUI(target) {
    target = parseInt(target) || 0;
    if (target > 100) target = 100;
    if (target < 0) target = 0;
    
    // Update SVG progress ring
    // r=54 -> Circumference = 2 * Math.PI * 54 = 339.292
    const circumference = 339.292;
    const offset = circumference - (target / 100) * circumference;
    if (progressCircle) {
      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = offset;
    }

    if (goalDisplay) {
      goalDisplay.textContent = target + '%';
    }

    // Dynamic Feedback
    if (target > 80) {
      coachMessage.textContent = "High Ambition! Ensure your Focus Timer hits 2 hours daily.";
      coachMessage.className = "coach-msg coach-high";
    } else if (target > 0 && target < 50) {
      coachMessage.textContent = "Let's aim a bit higher! We can start with small study blocks.";
      coachMessage.className = "coach-msg coach-low";
    } else if (target >= 50 && target <= 80) {
      coachMessage.textContent = "Solid target! Stay consistent and you will crush it.";
      coachMessage.className = "coach-msg coach-mid";
    } else {
      coachMessage.textContent = "Set a target above to get started!";
      coachMessage.className = "coach-msg";
    }
  }

  function loadGoal() {
    const saved = localStorage.getItem('bf_target_grade');
    if (saved) {
      goalInput.value = saved;
      updateCoachUI(saved);
    } else {
      updateCoachUI(0);
    }
  }

  goalSaveBtn.addEventListener('click', () => {
    let val = parseInt(goalInput.value);
    if (isNaN(val)) val = 0;
    if (val > 100) val = 100;
    if (val < 0) val = 0;
    
    goalInput.value = val;
    localStorage.setItem('bf_target_grade', val);
    updateCoachUI(val);
  });

  motivateBtn.addEventListener('click', () => {
    const random = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    const originalText = coachMessage.textContent;
    const originalClass = coachMessage.className;
    
    coachMessage.textContent = "💡 " + random;
    coachMessage.className = "coach-msg coach-motivate fade-up";
    
    setTimeout(() => {
      coachMessage.textContent = originalText;
      coachMessage.className = originalClass + " fade-up";
    }, 5000);
  });

  loadGoal();
});
