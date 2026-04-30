const TIPS = [
  {
    icon: '🫠',
    title: "You're Not Lazy. You're Overwhelmed.",
    short: 'Procrastination is usually fear, not laziness.',
    body: "When you're avoiding a subject it's almost never because you're lazy — it feels too big and you don't know where to start. Fix it by making the task embarrassingly small. Open the book and read one paragraph. That's it. Starting is the entire battle."
  },
  {
    icon: '📖',
    title: 'Re-reading is a Lie You Tell Yourself',
    short: 'Feeling familiar is not the same as knowing.',
    body: "Reading your notes and feeling like you understand is one of the biggest traps in studying. Close everything and write down what you actually remember — you'll be humbled. That discomfort is where real learning happens."
  },
  {
    icon: '⏰',
    title: "The Night Before Doesn't Work. Stop Trying.",
    short: 'Cramming fills short-term memory, not your answer sheet.',
    body: "Your brain moves information into long-term memory during sleep. Cramming the night before fills a bucket with holes — by morning most of it is gone. Study a little every day and sleep well the night before. Boring advice. Genuinely works."
  },
  {
    icon: '🧩',
    title: 'Stuck? Explain it to a Rubber Duck.',
    short: 'Sounds ridiculous. Terrifyingly effective.',
    body: "Pick up any object and explain the concept out loud to it like it's a confused student. The moment you fumble your words, you've found your gap. Works for any subject, any age, any level."
  },
  {
    icon: '🎮',
    title: 'Your Brain Needs Actual Rest. Not Scrolling.',
    short: 'Switching from studying to reels is not a break.',
    body: "A real break means your brain goes quiet — a walk, food, staring at nothing, a short nap. Scrolling keeps your brain stimulated and blocks recovery. After 45–60 minutes of studying, take 10 minutes of genuine rest."
  },
  {
    icon: '✏️',
    title: 'Write it by Hand Once. Then Never Again.',
    short: 'Handwriting a concept once embeds it differently.',
    body: "The slowness of handwriting forces your brain to process information instead of just copying it. Write your own summary of a topic once — in your own words. That one handwritten pass does more than three re-reads."
  },
  {
    icon: '🔁',
    title: 'Old Exam Papers are Your Best Study Material.',
    short: 'Patterns repeat more than most people realise.',
    body: "The last few years of exam papers show you almost exactly what matters. Solve old papers under timed conditions, mark yourself honestly, and go back to fix what you got wrong. This beats reading the textbook cover to cover."
  },
  {
    icon: '🌅',
    title: 'Your Quietest Hours Are Your Most Powerful.',
    short: 'Find when your brain is sharpest and protect that time.',
    body: "Everyone has a window in the day when focus is naturally stronger. Figure out yours and guard it. Don't use that window for easy tasks or entertainment. Save it for the hardest subject you're avoiding."
  },
  {
    icon: '💀',
    title: "The Syllabus is Not Your Enemy. Ignoring it is.",
    short: 'Most students never actually read it properly.',
    body: "Get your exact syllabus for each subject and tick off topics as you cover them. This shows you exactly what's left — reducing anxiety — and stops you wasting time on things that won't be tested."
  },
  {
    icon: '🤝',
    title: 'One Confused Friend Teaching Another Still Works.',
    short: "You don't need an expert. You need someone who just figured it out.",
    body: "Teaching a classmate what you just studied forces you to consolidate it. Getting taught by a classmate gives you a different angle. Both sides win. Find 2–3 people and take turns explaining topics to each other."
  }
];

let currentTip = 0;
let isFlipped = false;

function randomTip() {
  const idx = Math.floor(Math.random() * TIPS.length);
  return idx === currentTip ? (idx + 1) % TIPS.length : idx;
}

function renderCard() {
  const tip   = TIPS[currentTip];
  const card  = document.getElementById('tip-card');
  const front = document.getElementById('tip-front');
  const back  = document.getElementById('tip-back');
  if (!card) return;

  front.innerHTML = `
    <div class="tip-card-icon">${tip.icon}</div>
    <div class="tip-card-title">${tip.title}</div>
    <div class="tip-card-short">${tip.short}</div>
    <div class="tip-flip-hint">Tap to flip →</div>
  `;
  back.innerHTML = `
    <div class="tip-card-icon">${tip.icon}</div>
    <div class="tip-card-body">${tip.body}</div>
  `;

  isFlipped = false;
  card.classList.remove('flipped');
}

function injectUI() {
  // FAB
  const fabStack = document.createElement('div');
  fabStack.className = 'fab-stack';
  fabStack.innerHTML = `
    <button class="fab fab-notes" id="nb-fab" type="button" title="Notebook">📓</button>
    <button class="fab fab-tips" id="tip-fab" type="button" title="Study tip">💡</button>
  `;
  document.body.appendChild(fabStack);

  // Modal
  const modal = document.createElement('div');
  modal.id = 'tip-modal';
  modal.className = 'tip-modal-overlay hidden';
  modal.innerHTML = `
    <div class="tip-modal">
      <div class="tip-modal-header">
        <span class="tip-modal-label">💡 Study tip</span>
        <button class="tip-close" id="tip-close" type="button">×</button>
      </div>
      <div class="tip-card-wrap">
        <div class="tip-card" id="tip-card">
          <div class="tip-face tip-face-front" id="tip-front"></div>
          <div class="tip-face tip-face-back" id="tip-back"></div>
        </div>
      </div>
      <div class="tip-modal-footer">
        <button class="tip-btn-next" id="tip-next" type="button">Next tip →</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Events
  document.getElementById('tip-fab').addEventListener('click', () => {
    currentTip = randomTip();
    renderCard();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });

  document.getElementById('tip-close').addEventListener('click', closeTipModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeTipModal(); });

  document.getElementById('tip-card').addEventListener('click', () => {
    isFlipped = !isFlipped;
    document.getElementById('tip-card').classList.toggle('flipped', isFlipped);
  });

  document.getElementById('tip-next').addEventListener('click', () => {
    currentTip = (currentTip + 1) % TIPS.length;
    renderCard();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeTipModal(); }
    if (e.key === 'ArrowRight' && !modal.classList.contains('hidden')) {
      currentTip = (currentTip + 1) % TIPS.length;
      renderCard();
    }
  });
}

function closeTipModal() {
  const modal = document.getElementById('tip-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', injectUI);