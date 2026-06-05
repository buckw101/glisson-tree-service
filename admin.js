/* ================================================
   GLISSON TREE SERVICE — LIVE CRM
   Supabase-backed: reads/writes glisson_leads table
   ================================================ */

const SUPABASE_URL  = 'https://mlpwadopeqisrgflqwbi.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1scHdhZG9wZXFpc3JnZmxxd2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk1OTk4NSwiZXhwIjoyMDg4NTM1OTg1fQ.D0cuBIyE5ez9IdPgSKPJEoMH35ZMaCILvbNZXY7Wfeo';
const CRM_PASSWORD  = 'Glisson2026';

// ── Auth gate ──────────────────────────────────
function checkAuth() {
  if (sessionStorage.getItem('crm_auth') === '1') return true;
  const pw = prompt('Enter CRM password:');
  if (pw === CRM_PASSWORD) {
    sessionStorage.setItem('crm_auth', '1');
    return true;
  }
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;font-size:1.1rem;color:#666">Access denied.</div>';
  return false;
}
if (!checkAuth()) throw new Error('Not authenticated');

// ── Supabase helpers ───────────────────────────
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': 'Bearer ' + SUPABASE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function sbGet(filter = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?order=created_at.desc${filter}`, { headers: SB_HEADERS });
  return res.json();
}
async function sbPatch(id, patch) {
  await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?id=eq.${id}`, {
    method: 'PATCH',
    headers: SB_HEADERS,
    body: JSON.stringify(patch)
  });
}
async function sbDelete(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?id=eq.${id}`, {
    method: 'DELETE',
    headers: SB_HEADERS
  });
}
async function sbInsert(lead) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(lead)
  });
  return res.json();
}

// ── Stage config ───────────────────────────────
const STAGES = [
  { key: 'new',       label: 'New Lead',           color: '#3b82f6' },
  { key: 'contacted', label: 'Contacted',          color: '#f59e0b' },
  { key: 'scheduled', label: 'Est. Scheduled',     color: '#8b5cf6' },
  { key: 'quoted',    label: 'Estimate Given',     color: '#f97316' },
  { key: 'booked',    label: 'Job Booked',         color: '#1a3d28' },
  { key: 'completed', label: 'Completed',          color: '#10b981' },
];

const SERVICE_ICONS = {
  'Tree Removal': '🌳', 'tree removal': '🌳',
  'Tree Trimming': '✂️', 'trimming': '✂️',
  'Emergency Service': '🚨', 'emergency': '🚨',
  'Stump Grinding': '🪵', 'stump': '🪵',
  'Lot Clearing': '🚜', 'clearing': '🚜',
  'Storm Cleanup': '⛈️', 'storm': '⛈️',
};
function svcIcon(s) {
  if (!s) return '📋';
  for (const [k, v] of Object.entries(SERVICE_ICONS)) {
    if (s.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '📋';
}

// ── State ──────────────────────────────────────
let allLeads = [];
let activeFilter = 'all';
let searchQuery = '';
let selectedLead = null;
let dragId = null;

// ── Boot ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderBoard();
  loadLeads();
  bindSearch();
  bindFilters();
  bindAddLead();
  bindDetailPanel();
  bindRefresh();
  setInterval(loadLeads, 60000); // auto-refresh every 60s
});

// ── Load leads ─────────────────────────────────
async function loadLeads() {
  showLoading(true);
  try {
    allLeads = await sbGet();
    if (!Array.isArray(allLeads)) allLeads = [];
  } catch { allLeads = []; }
  render();
  showLoading(false);
}

function showLoading(on) {
  const el = document.getElementById('loadingBar');
  if (el) el.style.display = on ? 'block' : 'none';
}

// ── Filtered leads ─────────────────────────────
function filtered() {
  return allLeads.filter(l => {
    const matchFilter = activeFilter === 'all' || (l.service || '').toLowerCase().includes(activeFilter.toLowerCase());
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (l.name||'').toLowerCase().includes(q) || (l.phone||'').includes(q) || (l.service||'').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
}

// ── Render ─────────────────────────────────────
function render() {
  renderStats();
  renderColumns();
  if (selectedLead) {
    const updated = allLeads.find(l => l.id === selectedLead.id);
    if (updated) showDetail(updated);
  }
}

function renderStats() {
  const leads = allLeads;
  const thisMonth = leads.filter(l => {
    const d = new Date(l.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const active = leads.filter(l => !['completed'].includes(l.stage));
  const booked = leads.filter(l => l.stage === 'booked' || l.stage === 'completed');
  const bookRate = leads.length ? Math.round((booked.length / leads.length) * 100) : 0;
  const bookedVals = booked.map(l => l.value || 0).filter(v => v > 0);
  const avgBooked = bookedVals.length ? Math.round(bookedVals.reduce((a,b) => a+b, 0) / bookedVals.length) : 0;

  setText('statTotal',    thisMonth.length);
  setText('statPipeline', '$' + active.reduce((s,l) => s + (l.value||0), 0).toLocaleString());
  setText('statBookRate', bookRate + '%');
  setText('statAvgJob',   avgBooked ? '$' + avgBooked.toLocaleString() : '—');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderColumns() {
  const leads = filtered();
  STAGES.forEach(stage => {
    const col = document.getElementById('col-' + stage.key);
    if (!col) return;
    const cards = col.querySelector('.stage-cards');
    if (!cards) return;
    const stageLeads = leads.filter(l => l.stage === stage.key);
    const countEl = col.querySelector('.stage-count');
    const valEl   = col.querySelector('.stage-value');
    if (countEl) countEl.textContent = stageLeads.length;
    if (valEl) {
      const total = stageLeads.reduce((s,l) => s + (l.value||0), 0);
      valEl.textContent = total ? '$' + total.toLocaleString() : '';
    }
    cards.innerHTML = '';
    stageLeads.forEach(lead => cards.appendChild(buildCard(lead)));
  });
}

function buildCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.dataset.id = lead.id;
  card.draggable = true;

  const priority = lead.priority || 'normal';
  const dot = priority === 'urgent' ? '🔴' : priority === 'high' ? '🟠' : '';
  const ago = timeAgo(lead.created_at);
  const icon = svcIcon(lead.service);

  card.innerHTML = `
    <div class="card-top">
      <span class="card-icon">${icon}</span>
      <span class="card-name">${lead.name || 'Unknown'}</span>
      ${dot ? `<span class="card-priority">${dot}</span>` : ''}
    </div>
    <div class="card-service">${lead.service || 'General Inquiry'}</div>
    <div class="card-phone"><a href="tel:${lead.phone}">${lead.phone || '—'}</a></div>
    <div class="card-meta">
      <span class="card-source">${lead.source || 'Website'}</span>
      <span class="card-ago">${ago}</span>
    </div>
    ${lead.value ? `<div class="card-value">~$${lead.value.toLocaleString()}</div>` : ''}
  `;

  card.addEventListener('click', () => showDetail(lead));
  card.addEventListener('dragstart', e => {
    dragId = lead.id;
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => card.classList.remove('dragging'));
  return card;
}

// ── Board (columns) ────────────────────────────
function renderBoard() {
  const board = document.getElementById('pipelineBoard');
  if (!board) return;
  board.innerHTML = '';
  STAGES.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'stage-col';
    col.id = 'col-' + stage.key;
    col.innerHTML = `
      <div class="stage-header" style="border-top:3px solid ${stage.color}">
        <div class="stage-title-row">
          <span class="stage-label">${stage.label}</span>
          <span class="stage-count badge">0</span>
        </div>
        <span class="stage-value"></span>
      </div>
      <div class="stage-cards" id="cards-${stage.key}"></div>
    `;
    const cards = col.querySelector('.stage-cards');
    cards.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    cards.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    cards.addEventListener('drop', async e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (!dragId) return;
      const lead = allLeads.find(l => l.id === dragId);
      if (!lead || lead.stage === stage.key) return;
      lead.stage = stage.key;
      render();
      await sbPatch(dragId, { stage: stage.key });
      dragId = null;
    });
    board.appendChild(col);
  });
}

// ── Detail panel ───────────────────────────────
function showDetail(lead) {
  selectedLead = lead;
  const panel = document.getElementById('detailPanel');
  if (!panel) return;
  panel.classList.add('open');

  document.getElementById('detailName').textContent    = lead.name || '—';
  document.getElementById('detailService').textContent = lead.service || '—';
  document.getElementById('detailPhone').textContent   = lead.phone || '—';
  document.getElementById('detailPhone').href          = 'tel:' + (lead.phone || '');
  document.getElementById('detailEmail').textContent   = lead.email || '—';
  document.getElementById('detailSource').textContent  = lead.source || '—';
  document.getElementById('detailDate').textContent    = lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : '—';
  document.getElementById('detailMessage').textContent = lead.message || '—';
  document.getElementById('detailNotes').value         = lead.notes || '';
  document.getElementById('detailValue').value         = lead.value || '';

  document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stage === lead.stage);
  });

  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.priority === (lead.priority || 'normal'));
  });
}

function bindDetailPanel() {
  // Close
  document.getElementById('closeDetail')?.addEventListener('click', () => {
    document.getElementById('detailPanel')?.classList.remove('open');
    selectedLead = null;
  });

  // Stage buttons
  document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedLead) return;
      selectedLead.stage = btn.dataset.stage;
      const lead = allLeads.find(l => l.id === selectedLead.id);
      if (lead) lead.stage = btn.dataset.stage;
      document.querySelectorAll('.stage-btn').forEach(b => b.classList.toggle('active', b.dataset.stage === btn.dataset.stage));
      render();
      await sbPatch(selectedLead.id, { stage: btn.dataset.stage });
    });
  });

  // Priority buttons
  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedLead) return;
      selectedLead.priority = btn.dataset.priority;
      const lead = allLeads.find(l => l.id === selectedLead.id);
      if (lead) lead.priority = btn.dataset.priority;
      document.querySelectorAll('.priority-btn').forEach(b => b.classList.toggle('active', b.dataset.priority === btn.dataset.priority));
      render();
      await sbPatch(selectedLead.id, { priority: btn.dataset.priority });
    });
  });

  // Save notes
  document.getElementById('saveNotes')?.addEventListener('click', async () => {
    if (!selectedLead) return;
    const notes = document.getElementById('detailNotes').value;
    const value = parseInt(document.getElementById('detailValue').value) || 0;
    const lead = allLeads.find(l => l.id === selectedLead.id);
    if (lead) { lead.notes = notes; lead.value = value; }
    selectedLead.notes = notes; selectedLead.value = value;
    render();
    await sbPatch(selectedLead.id, { notes, value });
    const btn = document.getElementById('saveNotes');
    btn.textContent = '✓ Saved';
    setTimeout(() => btn.textContent = 'Save Notes & Value', 1500);
  });

  // Delete
  document.getElementById('deleteLead')?.addEventListener('click', async () => {
    if (!selectedLead) return;
    if (!confirm(`Delete lead for ${selectedLead.name}? This cannot be undone.`)) return;
    await sbDelete(selectedLead.id);
    allLeads = allLeads.filter(l => l.id !== selectedLead.id);
    selectedLead = null;
    document.getElementById('detailPanel')?.classList.remove('open');
    render();
  });
}

// ── Add lead manually ──────────────────────────
function bindAddLead() {
  const btn = document.getElementById('addLeadBtn');
  const modal = document.getElementById('addLeadModal');
  const cancel = document.getElementById('cancelAddLead');
  const form = document.getElementById('addLeadForm');

  btn?.addEventListener('click', () => modal?.classList.add('open'));
  cancel?.addEventListener('click', () => modal?.classList.remove('open'));
  modal?.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const lead = {
      name:     fd.get('name'),
      phone:    fd.get('phone'),
      email:    fd.get('email') || '',
      service:  fd.get('service'),
      message:  fd.get('message') || '',
      source:   'Phone Call',
      stage:    'new',
      priority: 'normal',
      value:    parseInt(fd.get('value')) || 0,
    };
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Adding…';
    submitBtn.disabled = true;
    const [newLead] = await sbInsert(lead);
    if (newLead) allLeads.unshift(newLead);
    render();
    modal.classList.remove('open');
    form.reset();
    submitBtn.textContent = 'Add Lead';
    submitBtn.disabled = false;
  });
}

// ── Search ─────────────────────────────────────
function bindSearch() {
  document.getElementById('searchInput')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderColumns();
  });
}

// ── Filters ────────────────────────────────────
function bindFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderColumns();
    });
  });
}

// ── Refresh ────────────────────────────────────
function bindRefresh() {
  document.getElementById('refreshBtn')?.addEventListener('click', loadLeads);
}

// ── Util ───────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}
