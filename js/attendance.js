// ── State ────────────────────────────────────────────────────────
let subjects = [];
let editingId = null;

const COLOR_MAP = {
  mint:     { bg: 'linear-gradient(135deg, rgba(168,230,207,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#A8E6CF' },
  sky:      { bg: 'linear-gradient(135deg, rgba(161,196,253,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#A1C4FD' },
  lavender: { bg: 'linear-gradient(135deg, rgba(220,214,247,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#DCD6F7' },
  peach:    { bg: 'linear-gradient(135deg, rgba(255,211,182,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#FFD3B6' },
  rose:     { bg: 'linear-gradient(135deg, rgba(255,170,165,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#FFAAA5' }
};

let selectedColor = 'mint';

function uid() { return Math.random().toString(36).slice(2, 9); }

function saveSubjects() {
  localStorage.setItem('bf_attendance', JSON.stringify(subjects));
}

function loadSubjects() {
  try {
    const s = localStorage.getItem('bf_attendance');
    if (s) subjects = JSON.parse(s);
  } catch(e) { subjects = []; }
}

// ── Calculations ─────────────────────────────────────────────────
function calcPct(attended, total) {
  if (!total || total === 0) return null;
  return Math.round((attended / total) * 100);
}

function getStatus(pct) {
  if (pct === null) return { label: 'No data', color: 'var(--text-faint)', zone: 'none' };
  if (pct >= 75)   return { label: 'Safe',       color: '#22c55e', zone: 'green' };
  if (pct >= 60)   return { label: 'Borderline', color: '#f59e0b', zone: 'yellow' };
  return             { label: 'Danger',     color: '#ef4444', zone: 'red' };
}

function getBarColor(pct) {
  if (pct === null) return 'var(--text-faint)';
  if (pct >= 75) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function safeToSkip(attended, total) {
  // max missable = total - ceil(0.75 * total)
  const minAttend = Math.ceil(0.75 * total);
  const canMiss   = total - minAttend;
  const missed    = total - attended;
  return Math.max(0, canMiss - missed);
}

function needToAttend(attended, total) {
  // classes needed to reach 75%: solve (attended + x) / (total + x) >= 0.75
  // => attended + x >= 0.75 * total + 0.75x
  // => 0.25x >= 0.75*total - attended
  // => x >= (0.75*total - attended) / 0.25
  const needed = Math.ceil((0.75 * total - attended) / 0.25);
  return Math.max(0, needed);
}

// ── Render ───────────────────────────────────────────────────────
function renderAll() {
  renderOverall();
  renderSubjects();
  document.getElementById('empty-state').classList.toggle('hidden', subjects.length > 0);
  document.getElementById('overall-card').classList.toggle('hidden', subjects.length === 0);
}

function renderOverall() {
  const valid = subjects.filter(s => s.total > 0);
  if (!valid.length) return;

  const totalClasses   = valid.reduce((a, s) => a + s.total, 0);
  const totalAttended  = valid.reduce((a, s) => a + s.attended, 0);
  const pct = calcPct(totalAttended, totalClasses);
  const status = getStatus(pct);

  document.getElementById('overall-pct').textContent = pct + '%';
  document.getElementById('overall-pct').style.color = status.color;

  const bar = document.getElementById('overall-bar');
  bar.style.width = pct + '%';
  bar.style.background = getBarColor(pct);

  const statusEl = document.getElementById('overall-status');
  statusEl.textContent = status.label + ' — ' + totalAttended + ' of ' + totalClasses + ' classes attended';
  statusEl.style.color = status.color;
}

function renderSubjects() {
  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = '';

  subjects.forEach(s => {
    const pct    = calcPct(s.attended, s.total);
    const status = getStatus(pct);
    const barW   = pct !== null ? Math.min(pct, 100) : 0;

    let adviceText = '';
    if (pct !== null && s.total > 0) {
      if (pct >= 75) {
        const skip = safeToSkip(s.attended, s.total);
        adviceText = skip > 0
          ? `You can still skip <strong>${skip}</strong> class${skip !== 1 ? 'es' : ''}`
          : 'No more skips — you\'re right at the limit';
      } else {
        const need = needToAttend(s.attended, s.total);
        adviceText = `Attend next <strong>${need}</strong> class${need !== 1 ? 'es' : ''} to reach 75%`;
      }
    }

    const c = COLOR_MAP[s.color] || COLOR_MAP.mint;
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.style.background = c.bg;
    card.style.color = c.text;
    card.innerHTML = ` 
      <div class="sc-header">
        <div class="sc-name">${s.name}</div>
        <div class="sc-actions">
          <button class="sc-btn sc-edit" data-id="${s.id}" type="button" title="Edit">✏</button>
          <button class="sc-btn sc-del"  data-id="${s.id}" type="button" title="Delete">×</button>
        </div>
      </div>

      <div class="sc-inputs">
        <div class="sc-input-group">
          <label class="sc-input-label">Total classes</label>
          <input type="number" class="sc-input" data-id="${s.id}" data-field="total"
            value="${s.total || ''}" placeholder="0" min="0" />
        </div>
        <div class="sc-input-group">
          <label class="sc-input-label">Attended</label>
          <input type="number" class="sc-input" data-id="${s.id}" data-field="attended"
            value="${s.attended || ''}" placeholder="0" min="0" />
        </div>
        <div class="sc-pct-wrap">
          <div class="sc-pct" style="color:${status.color}">${pct !== null ? pct + '%' : '—'}</div>
          <div class="sc-status" style="color:${status.color}">${status.label}</div>
        </div>
      </div>

      <div class="sc-bar-wrap">
        <div class="bar-track">
          <div class="bar-fill" style="width:${barW}%; background:${getBarColor(pct)};"></div>
        </div>
        <div class="bar-marker"></div>
      </div>

      <div class="sc-advice">${adviceText}</div>
    `;

    grid.appendChild(card);
  });

  // Live input listeners
  grid.querySelectorAll('.sc-input').forEach(input => {
    input.addEventListener('input', () => {
      const id    = input.dataset.id;
      const field = input.dataset.field;
      const val   = parseInt(input.value) || 0;
      const subj  = subjects.find(s => s.id === id);
      if (subj) {
        subj[field] = val;
        saveSubjects();
        renderAll();
      }
    });
  });

  // Edit
  grid.querySelectorAll('.sc-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });

  // Delete
  grid.querySelectorAll('.sc-del').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Delete this subject?')) {
        subjects = subjects.filter(s => s.id !== btn.dataset.id);
        saveSubjects();
        renderAll();
      }
    });
  });
}

// ── Modal ────────────────────────────────────────────────────────
function openAddModal() {
  editingId = null;
  document.getElementById('modal-heading').textContent = 'Add subject';
  document.getElementById('input-name').value = '';
  document.getElementById('input-total').value = '';
  document.getElementById('input-attended').value = '';
  document.getElementById('name-err').style.display = 'none';
  selectedColor = 'mint';
  document.querySelectorAll('#add-modal .swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === 'mint');
  });
  document.getElementById('add-modal').classList.remove('hidden');
}

function openEditModal(id) {
  const s = subjects.find(s => s.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('modal-heading').textContent = 'Edit subject';
  document.getElementById('input-name').value = s.name;
  document.getElementById('input-total').value = s.total || '';
  document.getElementById('input-attended').value = s.attended || '';
  document.getElementById('name-err').style.display = 'none';
  selectedColor = s.color || 'mint';
  document.querySelectorAll('#add-modal .swatch').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === selectedColor);
  });
  document.getElementById('add-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('add-modal').classList.add('hidden');
  editingId = null;
}

document.getElementById('modal-cancel').addEventListener('click', closeModal);

document.getElementById('add-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('add-modal')) closeModal();
});

document.getElementById('modal-save').addEventListener('click', () => {
  const name     = document.getElementById('input-name').value.trim();
  const total    = parseInt(document.getElementById('input-total').value) || 0;
  const attended = parseInt(document.getElementById('input-attended').value) || 0;

  if (!name) {
    const err = document.getElementById('name-err');
    err.textContent = 'Subject name is required.';
    err.style.display = 'block';
    return;
  }

  if (editingId) {
    const s = subjects.find(s => s.id === editingId);
    if (s) { s.name = name; s.total = total; s.attended = attended; s.color = selectedColor; }
  } else {
    subjects.push({ id: uid(), name, total, attended, color: selectedColor });
  }

  saveSubjects();
  closeModal();
  renderAll();
});

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadSubjects();
  renderAll();
  document.getElementById('btn-add-subject').addEventListener('click', openAddModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('add-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
  document.querySelectorAll('#add-modal .swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      document.querySelectorAll('#add-modal .swatch').forEach(s => s.classList.remove('active'));
      sw.classList.add('active');
      selectedColor = sw.dataset.color;
    });
  });
});