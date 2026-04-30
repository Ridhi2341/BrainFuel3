let nbState = { activeTab: 'notes', notes: '', tasks: [] };

function uid() { return Math.random().toString(36).slice(2, 9); }
function saveNB() { localStorage.setItem('bf_notebook', JSON.stringify(nbState)); }
function loadNB() {
  try { const s = localStorage.getItem('bf_notebook'); if (s) nbState = { ...nbState, ...JSON.parse(s) }; } catch(e) {}
}

function injectNotebook() {
  const overlay = document.createElement('div');
  overlay.id = 'nb-overlay';
  overlay.className = 'nb-overlay hidden';
  overlay.innerHTML = `
    <div class="nb-panel">
      <div class="nb-header">
        <div class="nb-tabs">
          <button class="nb-tab active" id="nb-tab-notes" type="button">📝 Notes</button>
          <button class="nb-tab" id="nb-tab-tasks" type="button">✅ Tasks</button>
        </div>
        <button class="nb-close" id="nb-close" type="button">×</button>
      </div>
      <div class="nb-body" id="nb-body-notes">
        <textarea class="nb-textarea" id="nb-textarea" placeholder="Dump your thoughts here — ideas, reminders, anything on your mind..."></textarea>
        <div class="nb-note-hint">Auto-saves as you type</div>
      </div>
      <div class="nb-body hidden" id="nb-body-tasks">
        <div class="nb-task-input-row">
          <input type="text" class="nb-task-input" id="nb-task-input" placeholder="Add something to do..." />
          <button class="nb-task-add" id="nb-task-add" type="button">+</button>
        </div>
        <div class="nb-tasks-list" id="nb-tasks-list"></div>
        <button class="nb-clear-done" id="nb-clear-done" type="button">Clear completed</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // nb-fab might already exist from tips.js fab-stack — attach click handler
  // Tips.js creates both FABs, so just find the nb-fab
  function attachNbFab() {
    const nbFab = document.getElementById('nb-fab');
    if (nbFab) {
      nbFab.addEventListener('click', openNotebook);
    }
  }

  // Try immediately, or after a tick if tips.js hasn't run yet
  if (document.getElementById('nb-fab')) {
    attachNbFab();
  } else {
    setTimeout(attachNbFab, 100);
  }

  document.getElementById('nb-close').addEventListener('click', closeNotebook);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeNotebook(); });

  document.getElementById('nb-tab-notes').addEventListener('click', () => switchTab('notes'));
  document.getElementById('nb-tab-tasks').addEventListener('click', () => switchTab('tasks'));

  document.getElementById('nb-textarea').addEventListener('input', function() {
    nbState.notes = this.value;
    saveNB();
  });

  document.getElementById('nb-task-add').addEventListener('click', addTask);
  document.getElementById('nb-task-input').addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  document.getElementById('nb-clear-done').addEventListener('click', () => {
    nbState.tasks = nbState.tasks.filter(t => !t.done);
    saveNB(); renderTasks();
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotebook(); });
}

function openNotebook() {
  const overlay = document.getElementById('nb-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('nb-textarea').value = nbState.notes;
  switchTab(nbState.activeTab);
  renderTasks();
  setTimeout(() => {
    if (nbState.activeTab === 'notes') document.getElementById('nb-textarea')?.focus();
    else document.getElementById('nb-task-input')?.focus();
  }, 100);
}

function closeNotebook() {
  document.getElementById('nb-overlay')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  nbState.activeTab = tab;
  saveNB();
  document.getElementById('nb-tab-notes').classList.toggle('active', tab === 'notes');
  document.getElementById('nb-tab-tasks').classList.toggle('active', tab === 'tasks');
  document.getElementById('nb-body-notes').classList.toggle('hidden', tab !== 'notes');
  document.getElementById('nb-body-tasks').classList.toggle('hidden', tab !== 'tasks');
  if (tab === 'tasks') renderTasks();
}

function addTask() {
  const input = document.getElementById('nb-task-input');
  const text = input.value.trim();
  if (!text) return;
  nbState.tasks.push({ id: uid(), text, done: false });
  input.value = '';
  saveNB(); renderTasks();
}

function renderTasks() {
  const list = document.getElementById('nb-tasks-list');
  if (!list) return;
  list.innerHTML = '';

  if (!nbState.tasks.length) {
    list.innerHTML = '<div class="nb-empty">No tasks yet. Add something above.</div>';
    return;
  }

  const sorted = [...nbState.tasks.filter(t => !t.done), ...nbState.tasks.filter(t => t.done)];
  sorted.forEach(task => {
    const item = document.createElement('div');
    item.className = 'nb-task-item' + (task.done ? ' done' : '');
    item.innerHTML = `
      <label class="nb-task-label">
        <input type="checkbox" class="nb-checkbox" data-id="${task.id}" ${task.done ? 'checked' : ''} />
        <span class="nb-task-text">${task.text}</span>
      </label>
      <button class="nb-task-del" data-id="${task.id}" type="button">×</button>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll('.nb-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const t = nbState.tasks.find(t => t.id === cb.dataset.id);
      if (t) { t.done = cb.checked; saveNB(); renderTasks(); }
    });
  });

  list.querySelectorAll('.nb-task-del').forEach(btn => {
    btn.addEventListener('click', () => {
      nbState.tasks = nbState.tasks.filter(t => t.id !== btn.dataset.id);
      saveNB(); renderTasks();
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadNB();
  injectNotebook();
});