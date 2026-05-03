// ── State ────────────────────────────────────────────────────────
let state = { days: [], slots: [], subjects: [], grid: {} };

const COLOR_MAP = {
  mint:     { bg: 'linear-gradient(135deg, rgba(168,230,207,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#A8E6CF' },
  sky:      { bg: 'linear-gradient(135deg, rgba(161,196,253,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#A1C4FD' },
  lavender: { bg: 'linear-gradient(135deg, rgba(220,214,247,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#DCD6F7' },
  peach:    { bg: 'linear-gradient(135deg, rgba(255,211,182,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#FFD3B6' },
  rose:     { bg: 'linear-gradient(135deg, rgba(255,170,165,0.1), rgba(255,255,255,0.1))', text: 'var(--text)', solid: '#FFAAA5' }
};

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let selectedColor = 'mint';
let pendingSubject = null;
let clockInterval = null;

// ── Persistence ──────────────────────────────────────────────────
function saveState() { localStorage.setItem('bf_timetable', JSON.stringify(state)); }
function loadState() {
  try { const s = localStorage.getItem('bf_timetable'); if (s) { state = JSON.parse(s); return true; } } catch(e) {}
  return false;
}

// ── Helpers ──────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}
function setStep(n) {
  [1,2,3].forEach(i => {
    document.getElementById('panel-' + i).classList.toggle('hidden', i !== n);
    document.getElementById('wstep-' + i).classList.toggle('active', i <= n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Time parsing ─────────────────────────────────────────────────
// Accepts: "4:10–5:00 PM", "16:10 to 17:00", "4:10-5:00pm"
// Returns { startMins, endMins } in minutes since midnight, or null
function parseSlotTime(timeStr) {
  if (!timeStr) return null;
  timeStr = timeStr.trim();

  // Split on – or - or " to "
  const parts = timeStr.split(/\s*(?:–|-|to)\s*/i);
  if (parts.length < 2) return null;

  function toMins(t) {
    t = t.trim();
    // detect AM/PM
    const isPM = /pm/i.test(t);
    const isAM = /am/i.test(t);
    t = t.replace(/[apm]/gi, '').trim();
    let [h, m] = t.split(':').map(Number);
    if (isNaN(m)) m = 0;
    if (isPM && h !== 12) h += 12;
    if (isAM && h === 12) h = 0;
    return h * 60 + m;
  }

  // Handle trailing AM/PM applying to both parts
  const ampm = timeStr.match(/(am|pm)$/i);
  let startStr = parts[0];
  let endStr   = parts[1];

  // If only the end has AM/PM, infer for start too
  if (ampm && !/[apm]/i.test(startStr)) startStr += ampm[0];

  const startMins = toMins(startStr);
  const endMins   = toMins(endStr);
  if (isNaN(startMins) || isNaN(endMins)) return null;
  return { startMins, endMins };
}

function nowMins() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(mins) {
  if (mins < 60) return mins + ' min' + (mins !== 1 ? 's' : '');
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + m + 'm';
}

// ── Current period detection ─────────────────────────────────────
function detectCurrentPeriod() {
  const todayName = DAY_NAMES[new Date().getDay()];
  const dayIdx    = state.days.indexOf(todayName);
  const now       = nowMins();

  // Not a school day
  if (dayIdx === -1) return { type: 'off', reason: 'No classes today — enjoy your day off!' };

  for (let si = 0; si < state.slots.length; si++) {
    const parsed = parseSlotTime(state.slots[si].time);
    if (!parsed) continue;

    if (now >= parsed.startMins && now < parsed.endMins) {
      const key    = si + '-' + dayIdx;
      const subjId = state.grid[key];
      const subj   = subjId ? state.subjects.find(s => s.id === subjId) : null;
      const minsLeft = parsed.endMins - now;
      return {
        type: 'active',
        slot: state.slots[si],
        subj,
        minsLeft,
        color: subj ? COLOR_MAP[subj.color] : null
      };
    }

    // Between slots — next class coming up
    if (si < state.slots.length - 1) {
      const nextParsed = parseSlotTime(state.slots[si + 1].time);
      if (nextParsed && now >= parsed.endMins && now < nextParsed.startMins) {
        const key    = (si + 1) + '-' + dayIdx;
        const subjId = state.grid[key];
        const subj   = subjId ? state.subjects.find(s => s.id === subjId) : null;
        const minsUntil = nextParsed.startMins - now;
        return { type: 'break', nextSlot: state.slots[si + 1], nextSubj: subj, minsUntil };
      }
    }
  }

  // Before first class
  const first = parseSlotTime(state.slots[0]?.time);
  if (first && now < first.startMins) {
    const minsUntil = first.startMins - now;
    return { type: 'before', nextSlot: state.slots[0], minsUntil };
  }

  // After last class
  return { type: 'done', reason: 'All classes done for today.' };
}

function updateNowBanner() {
  const result = detectCurrentPeriod();
  const nowBanner = document.getElementById('now-banner');
  const offBanner = document.getElementById('off-banner');
  const nowSubject = document.getElementById('now-subject');
  const nowEnds    = document.getElementById('now-ends');
  const nowClock   = document.getElementById('now-clock');
  const offClock   = document.getElementById('off-clock');
  const offLabel   = document.getElementById('off-label');

  nowBanner.classList.add('hidden');
  offBanner.classList.add('hidden');

  const timeStr = fmtTime(new Date());

  if (result.type === 'active') {
    nowBanner.classList.remove('hidden');
    const c = result.color;
    const dot = nowBanner.querySelector('.now-dot');
    if (c) {
      nowBanner.style.borderColor = c.solid + '40';
      dot.style.background = c.solid;
    }
    const subjName = result.subj ? result.subj.name : 'Free period';
    const teacher  = result.subj?.teacher ? ' · ' + result.subj.teacher : '';
    nowSubject.textContent = subjName + teacher + ' — ' + result.slot.label;
    nowEnds.textContent = 'Ends in ' + formatDuration(result.minsLeft);
    nowClock.textContent = timeStr;

    // highlight active cell in table
    highlightActiveCell(result.slot, result.subj);

  } else if (result.type === 'break') {
    nowBanner.classList.remove('hidden');
    const dot = nowBanner.querySelector('.now-dot');
    dot.style.background = 'var(--accent)';
    nowBanner.style.borderColor = 'var(--border)';
    const nextName = result.nextSubj ? result.nextSubj.name : 'Free period';
    nowSubject.textContent = 'Break — ' + nextName + ' in ' + formatDuration(result.minsUntil);
    nowEnds.textContent = result.nextSlot.label + (result.nextSlot.time ? ' · ' + result.nextSlot.time : '');
    nowClock.textContent = timeStr;

  } else if (result.type === 'before') {
    nowBanner.classList.remove('hidden');
    const dot = nowBanner.querySelector('.now-dot');
    dot.style.background = 'var(--accent)';
    nowBanner.style.borderColor = 'var(--border)';
    nowSubject.textContent = 'First class in ' + formatDuration(result.minsUntil);
    nowEnds.textContent = result.nextSlot.label + (result.nextSlot.time ? ' · ' + result.nextSlot.time : '');
    nowClock.textContent = timeStr;

  } else {
    offBanner.classList.remove('hidden');
    offLabel.textContent = result.reason || 'No active classes right now.';
    offClock.textContent = timeStr;
  }
}

function highlightActiveCell(slot, subj) {
  // Remove previous highlights
  document.querySelectorAll('#tt-final .active-now').forEach(el => el.classList.remove('active-now'));
  const slotIdx = state.slots.indexOf(slot);
  const todayName = DAY_NAMES[new Date().getDay()];
  const dayIdx = state.days.indexOf(todayName);
  if (slotIdx === -1 || dayIdx === -1) return;

  // highlight row header
  const rows = document.querySelectorAll('#tt-final tbody tr');
  if (rows[slotIdx]) {
    const cells = rows[slotIdx].querySelectorAll('td');
    if (cells[dayIdx + 1]) cells[dayIdx + 1].classList.add('active-now');
    cells[0].classList.add('active-now-label');
  }
}

// ── STEP 1 ───────────────────────────────────────────────────────
function renderSlots() {
  const list = document.getElementById('slots-list');
  list.innerHTML = '';
  state.slots.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'slot-row';
    row.innerHTML = `<span class="slot-label-text"><strong>${s.label}</strong>${s.time ? ' — ' + s.time : ''}</span>
      <button class="slot-del" data-i="${i}" type="button">×</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll('.slot-del').forEach(btn => {
    btn.addEventListener('click', () => { state.slots.splice(+btn.dataset.i, 1); renderSlots(); });
  });
}

document.getElementById('btn-add-slot').addEventListener('click', () => {
  const label = document.getElementById('slot-label').value.trim();
  const time  = document.getElementById('slot-time').value.trim();
  if (!label) { showError('slot-err', 'Period label is required.'); return; }
  showError('slot-err', '');
  state.slots.push({ label, time });
  document.getElementById('slot-label').value = '';
  document.getElementById('slot-time').value = '';
  renderSlots();
});

document.getElementById('btn-step1-next').addEventListener('click', () => {
  state.days = Array.from(document.querySelectorAll('#days-check input:checked')).map(c => c.value);
  if (!state.days.length) { showError('slot-err', 'Select at least one day.'); return; }
  if (!state.slots.length) { showError('slot-err', 'Add at least one time slot.'); return; }
  showError('slot-err', '');
  setStep(2);
});

// ── STEP 2 ───────────────────────────────────────────────────────
document.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    selectedColor = sw.dataset.color;
  });
});

function renderSubjectPreview() {
  const container = document.getElementById('subj-preview');
  document.getElementById('subj-count').textContent = state.subjects.length;
  container.innerHTML = '';
  state.subjects.forEach((s, i) => {
    const c = COLOR_MAP[s.color] || COLOR_MAP.mint;
    const card = document.createElement('div');
    card.className = 'subj-chip';
    card.style.background = c.bg;
    card.style.color = c.text;
    card.innerHTML = `<span>${s.name}${s.teacher ? '<small> · ' + s.teacher + '</small>' : ''}</span>
      <button class="chip-del" data-i="${i}" type="button">×</button>`;
    container.appendChild(card);
  });
  container.querySelectorAll('.chip-del').forEach(btn => {
    btn.addEventListener('click', () => { state.subjects.splice(+btn.dataset.i, 1); renderSubjectPreview(); });
  });
}

document.getElementById('btn-add-subj').addEventListener('click', () => {
  const name    = document.getElementById('subj-name').value.trim();
  const teacher = document.getElementById('subj-teacher').value.trim();
  if (!name) { showError('subj-name-err', 'Subject name is required.'); return; }
  showError('subj-name-err', '');
  pendingSubject = { id: uid(), name, teacher, color: selectedColor };
  const c = COLOR_MAP[selectedColor];
  document.getElementById('modal-title').textContent = 'Confirm subject';
  document.getElementById('modal-body').innerHTML = `
    <div class="modal-preview" style="background:${c.bg}; color:${c.text}; border: 1px solid ${c.solid};">
      <strong>${name}</strong>${teacher ? '<br/><small>' + teacher + '</small>' : ''}
    </div>
    <p style="margin-top:10px; font-size:13px; color:var(--text-muted)">Does this look right?</p>`;
  document.getElementById('modal-overlay').classList.remove('hidden');
});

document.getElementById('modal-cancel').addEventListener('click', () => {
  document.getElementById('modal-overlay').classList.add('hidden'); pendingSubject = null;
});
document.getElementById('modal-confirm').addEventListener('click', () => {
  if (pendingSubject) {
    state.subjects.push(pendingSubject); pendingSubject = null;
    document.getElementById('subj-name').value = '';
    document.getElementById('subj-teacher').value = '';
    renderSubjectPreview();
  }
  document.getElementById('modal-overlay').classList.add('hidden');
});

document.getElementById('btn-step2-back').addEventListener('click', () => setStep(1));
document.getElementById('btn-step2-next').addEventListener('click', () => {
  if (!state.subjects.length) { showError('subj-list-err', 'Add at least one subject.'); return; }
  showError('subj-list-err', '');
  buildGrid(); setStep(3);
});

// ── STEP 3 ───────────────────────────────────────────────────────
function buildGrid() {
  const table = document.getElementById('tt-grid');
  table.innerHTML = '';
  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  const th0   = document.createElement('th'); th0.textContent = 'Period / Time'; hrow.appendChild(th0);
  state.days.forEach(d => { const th = document.createElement('th'); th.textContent = d; hrow.appendChild(th); });
  thead.appendChild(hrow); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.slots.forEach((slot, si) => {
    const tr  = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.className = 'time-cell';
    td0.innerHTML = `<strong>${slot.label}</strong>${slot.time ? '<br/><small>' + slot.time + '</small>' : ''}`;
    tr.appendChild(td0);

    state.days.forEach((day, di) => {
      const td  = document.createElement('td');
      td.className = 'tt-cell';
      const key = si + '-' + di;
      td.dataset.key = key;
      if (state.grid[key]) {
        const subj = state.subjects.find(s => s.id === state.grid[key]);
        if (subj) renderCellContent(td, subj, key);
      }
      td.addEventListener('dragover', e => { e.preventDefault(); td.classList.add('drag-over'); });
      td.addEventListener('dragleave', () => td.classList.remove('drag-over'));
      td.addEventListener('drop', e => {
        e.preventDefault(); td.classList.remove('drag-over');
        const subjId = e.dataTransfer.getData('text/plain');
        const subj   = state.subjects.find(s => s.id === subjId);
        if (subj) { state.grid[key] = subjId; saveState(); renderCellContent(td, subj, key); }
      });
      td.addEventListener('click', () => {
        if (state.grid[key]) { delete state.grid[key]; saveState(); td.innerHTML = ''; }
      });
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  buildPalette();
}

function renderCellContent(td, subj, key) {
  const c = COLOR_MAP[subj.color] || COLOR_MAP.mint;
  td.innerHTML = `<span class="subj" style="background:${c.bg}; color:${c.text}; border: 1px solid ${c.solid};">${subj.name}${subj.teacher ? '<br/><small>' + subj.teacher + '</small>' : ''}<button class="subj-delete-btn" data-key="${key || ''}" type="button">×</button></span>`;
}

function buildPalette() {
  const container = document.getElementById('palette-cards');
  container.innerHTML = '';
  state.subjects.forEach(s => {
    const c = COLOR_MAP[s.color] || COLOR_MAP.mint;
    const card = document.createElement('div');
    card.className = 'palette-card';
    card.draggable = true;
    card.style.background = c.bg;
    card.style.color = c.text;
    card.style.border = `1px solid ${c.solid}`;
    card.innerHTML = `<strong>${s.name}</strong>${s.teacher ? '<br/><small>' + s.teacher + '</small>' : ''}`;
    card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', s.id); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    container.appendChild(card);
  });
}

document.getElementById('btn-clear-all').addEventListener('click', () => {
  state.grid = {}; saveState();
  document.querySelectorAll('#tt-grid .tt-cell').forEach(td => { td.innerHTML = ''; });
});

document.getElementById('btn-save').addEventListener('click', () => {
  saveState();
  const btn = document.getElementById('btn-save');
  btn.textContent = '✓ Saved!';
  setTimeout(() => { btn.textContent = '💾 Save'; }, 1500);
});

document.getElementById('btn-step3-back').addEventListener('click', () => setStep(2));
document.getElementById('btn-done').addEventListener('click', () => { saveState(); showFinalView(); });

// ── Final view ───────────────────────────────────────────────────
function showFinalView() {
  document.getElementById('wizard').classList.add('hidden');
  document.getElementById('final-view').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.getElementById('final-sub').textContent =
    state.days.join(', ') + ' · ' + state.slots.length + ' periods';

  // Build final table
  const table = document.getElementById('tt-final');
  table.innerHTML = '';
  const todayName = DAY_NAMES[new Date().getDay()];
  const todayIdx  = state.days.indexOf(todayName);

  const thead = document.createElement('thead');
  const hrow  = document.createElement('tr');
  const th0   = document.createElement('th'); th0.textContent = 'Period / Time'; hrow.appendChild(th0);
  state.days.forEach((d, di) => {
    const th = document.createElement('th');
    th.textContent = d;
    if (di === todayIdx) th.classList.add('today-head');
    hrow.appendChild(th);
  });
  thead.appendChild(hrow); table.appendChild(thead);

  const tbody = document.createElement('tbody');
  state.slots.forEach((slot, si) => {
    const tr  = document.createElement('tr');
    const td0 = document.createElement('td');
    td0.className = 'time-cell';
    td0.innerHTML = `<strong>${slot.label}</strong>${slot.time ? '<br/><small>' + slot.time + '</small>' : ''}`;
    tr.appendChild(td0);

    state.days.forEach((day, di) => {
      const td  = document.createElement('td');
      const key = si + '-' + di;
      if (di === todayIdx) td.classList.add('today-col');
      if (state.grid[key]) {
        const subj = state.subjects.find(s => s.id === state.grid[key]);
        if (subj) renderCellContent(td, subj, key);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Legend + Year card side by side
  const legend = document.getElementById('tt-legend');
  legend.innerHTML = '';
  state.subjects.forEach(s => {
    const c = COLOR_MAP[s.color] || COLOR_MAP.mint;
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `<span class="legend-dot" style="background:${c.bg}; border:2px solid ${c.solid};"></span>
      <span>${s.name}${s.teacher ? ' <small style="opacity:0.6">· ' + s.teacher + '</small>' : ''}</span>`;
    legend.appendChild(item);
  });

  // Year progress card
  renderYearCard();

  // Start clock + banner, update every minute
  updateNowBanner();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateNowBanner, 60000);
}

// ── Year progress card ───────────────────────────────────────────
function renderYearCard() {
  const el = document.getElementById('year-card');
  if (!el) return;

  const now     = new Date();
  const year    = now.getFullYear();
  const start   = new Date(year, 0, 1);
  const end     = new Date(year + 1, 0, 1);
  const dayOfYear  = Math.floor((now - start) / 86400000) + 1;
  const totalDays  = Math.floor((end - start) / 86400000);
  const pct        = Math.round((dayOfYear / totalDays) * 100);

  const month = now.getMonth(); // 0-11
  let season, seasonEmoji, barColor;
  if (month <= 1 || month === 11) {
    season = 'Winter'; seasonEmoji = '❄️'; barColor = '#7dd3fc';
  } else if (month <= 4) {
    season = 'Spring'; seasonEmoji = '🌸'; barColor = '#86efac';
  } else if (month <= 7) {
    season = 'Summer'; seasonEmoji = '☀️'; barColor = '#fcd34d';
  } else {
    season = 'Monsoon'; seasonEmoji = '🌧️'; barColor = '#6ee7b7';
  }

  const avatarKey = localStorage.getItem('bf_avatar') || 'bear';
  const avatarMap = {
    bear: 'img/bear_3d.png',
    peacock: 'img/peacock_3d.png',
    alien: 'img/alien_3d.png',
    astronaut: 'img/astronaut_3d_default.png'
  };
  const avatarSrc = avatarMap[avatarKey] || '';

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  el.innerHTML = `
    <div class="yc-top">
      <div class="yc-avatar-wrap">
        ${avatarSrc ? `<img src="${avatarSrc}" alt="avatar" class="yc-avatar" />` : ''}
      </div>
      <div class="yc-date">
        <div class="yc-day-name">${days[now.getDay()]}</div>
        <div class="yc-date-num">${now.getDate()} ${months[now.getMonth()]} ${year}</div>
      </div>
      <div class="yc-season">${seasonEmoji} ${season}</div>
    </div>
    <div class="yc-label">
      <span>Day ${dayOfYear} of ${totalDays}</span>
      <span>${pct}% through ${year}</span>
    </div>
    <div class="yc-bar-track">
      <div class="yc-bar-fill" style="width:${pct}%; background:${barColor};"></div>
    </div>
    <div class="yc-sub">${totalDays - dayOfYear} days left this year</div>
  `;
}

// ── Edit / Reset ─────────────────────────────────────────────────
function editHandler() {
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  document.getElementById('final-view').classList.add('hidden');
  document.getElementById('wizard').classList.remove('hidden');
  document.querySelectorAll('#days-check input').forEach(cb => { cb.checked = state.days.includes(cb.value); });
  renderSlots(); renderSubjectPreview(); buildGrid(); setStep(1);
}

function resetHandler() {
  if (!confirm('Reset your entire timetable and start over?')) return;
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  localStorage.removeItem('bf_timetable');
  state = { days: [], slots: [], subjects: [], grid: {} };
  state.slots = [{ label: 'P1', time: '4:10–5:00 PM' }, { label: 'P2', time: '5:00–5:50 PM' }, { label: 'P3', time: '5:50–6:40 PM' }];
  document.querySelectorAll('#days-check input').forEach(cb => { cb.checked = ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(cb.value); });
  document.getElementById('final-view').classList.add('hidden');
  document.getElementById('wizard').classList.remove('hidden');
  renderSlots(); renderSubjectPreview(); setStep(1);
}

let isEditMode = false;
function toggleEditMode() {
  isEditMode = !isEditMode;
  const table = document.getElementById('tt-final');
  if (!table) return;
  if (isEditMode) {
    table.classList.add('edit-mode');
    document.getElementById('btn-edit-tt-on').innerHTML = '✅ Done';
    document.getElementById('btn-edit-tt-off').innerHTML = '✅ Done';
  } else {
    table.classList.remove('edit-mode');
    document.getElementById('btn-edit-tt-on').innerHTML = '✏️ Edit';
    document.getElementById('btn-edit-tt-off').innerHTML = '✏️ Edit';
  }
}

document.addEventListener('click', e => {
  if (e.target.id === 'btn-edit-tt-on' || e.target.id === 'btn-edit-tt-off') {
    if (isEditMode) {
      toggleEditMode();
    } else {
      document.getElementById('edit-modal-overlay').classList.remove('hidden');
    }
  }
  
  if (e.target.id === 'modal-edit-reset') {
    document.getElementById('edit-modal-overlay').classList.add('hidden');
    editHandler();
  }
  
  if (e.target.id === 'modal-edit-inline') {
    document.getElementById('edit-modal-overlay').classList.add('hidden');
    toggleEditMode();
  }
  
  if (e.target.classList.contains('subj-delete-btn')) {
    const key = e.target.dataset.key;
    if (state.grid[key]) {
      delete state.grid[key];
      saveState();
      const td = e.target.closest('td');
      if (td) td.innerHTML = '';
      updateNowBanner();
    }
  }
});

// ── Init ─────────────────────────────────────────────────────────
(function init() {
  const hasSaved = loadState();
  // If a complete timetable exists in localStorage → final view only, no wizard
  if (hasSaved && state.days.length > 0 && state.subjects.length > 0) {
    document.getElementById('wizard').classList.add('hidden');
    document.getElementById('final-view').classList.remove('hidden');
    renderSlots();
    renderSubjectPreview();
    showFinalView();
    return;
  }
  // Fresh start — show wizard at step 1 with default slots
  state.slots = [{ label: 'P1', time: '4:10–5:00 PM' }, { label: 'P2', time: '5:00–5:50 PM' }, { label: 'P3', time: '5:50–6:40 PM' }];
  renderSlots();
  document.getElementById('wizard').classList.remove('hidden');
  document.getElementById('final-view').classList.add('hidden');
})();