/* ================================================
   GLISSON TREE SERVICE — LIVE CRM
   ================================================ */

const SUPABASE_URL = 'https://mlpwadopeqisrgflqwbi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YQO_ZljWCubOqvMpHylkFw_hnnmPPsA';
const CRM_PASSWORD = 'Glisson2026';

const STAGES = [
  { key: 'new',       label: 'New Lead',       color: '#3b82f6' },
  { key: 'contacted', label: 'Contacted',      color: '#f59e0b' },
  { key: 'scheduled', label: 'Est. Scheduled', color: '#8b5cf6' },
  { key: 'quoted',    label: 'Quoted',         color: '#f97316' },
  { key: 'booked',    label: 'Booked',         color: '#1a3d28' },
  { key: 'completed', label: 'Completed',      color: '#10b981' },
];

const SVC_ICONS = {
  'tree removal':'🌳','removal':'🌳',
  'tree trimming':'✂️','trimming':'✂️',
  'emergency':'🚨',
  'stump':'🪵',
  'lot clearing':'🚜','clearing':'🚜',
  'storm':'⛈️',
};
function svcIcon(s) {
  if (!s) return '📋';
  const l = s.toLowerCase();
  for (const [k,v] of Object.entries(SVC_ICONS)) if (l.includes(k)) return v;
  return '📋';
}
function timeAgo(ts) {
  if (!ts) return '';
  const d = (Date.now() - new Date(ts)) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return Math.floor(d/60) + 'm ago';
  if (d < 86400) return Math.floor(d/3600) + 'h ago';
  return Math.floor(d/86400) + 'd ago';
}

// ── State ──────────────────────────────────────
let allLeads      = [];
let activeFilter  = 'all';
let searchQuery   = '';
let selectedLead  = null;
let dragId        = null;
let activeStage   = 'new'; // mobile stage tab

// ── Supabase ───────────────────────────────────
const SB = {
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  },
  async get() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?order=created_at.desc`, { headers: this.headers });
    return r.json();
  },
  async patch(id, data) {
    await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?id=eq.${id}`, {
      method: 'PATCH', headers: this.headers, body: JSON.stringify(data)
    });
  },
  async del(id) {
    await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads?id=eq.${id}`, {
      method: 'DELETE', headers: this.headers
    });
  },
  async insert(data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/glisson_leads`, {
      method: 'POST', headers: this.headers, body: JSON.stringify(data)
    });
    return r.json();
  }
};

// ══════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════
function initLogin() {
  const loginScreen = document.getElementById('loginScreen');
  const dashboard   = document.getElementById('dashboard');
  const pwInput     = document.getElementById('loginPassword');
  const loginBtn    = document.getElementById('loginBtn');
  const loginError  = document.getElementById('loginError');

  if (sessionStorage.getItem('crm_auth') === '1') {
    loginScreen.style.display = 'none';
    dashboard.classList.add('visible');
    initDashboard();
    return;
  }

  function attempt() {
    if (pwInput.value === CRM_PASSWORD) {
      sessionStorage.setItem('crm_auth', '1');
      loginScreen.style.display = 'none';
      dashboard.classList.add('visible');
      initDashboard();
    } else {
      loginError.classList.add('show');
      pwInput.value = '';
      pwInput.focus();
      setTimeout(() => loginError.classList.remove('show'), 3000);
    }
  }

  loginBtn.addEventListener('click', attempt);
  pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
function initDashboard() {
  buildBoard();
  buildStageTabs();
  loadLeads();
  bindSearch();
  bindFilters();
  bindAddLead();
  bindDetailPanel();
  bindRefresh();
  setInterval(loadLeads, 60000);
}

// ── Load ───────────────────────────────────────
async function loadLeads() {
  showLoading(true);
  try {
    const data = await SB.get();
    allLeads = Array.isArray(data) ? data : [];
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
    const svc = (l.service || '').toLowerCase();
    const matchFilter = activeFilter === 'all' || svc.includes(activeFilter.toLowerCase());
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (l.name||'').toLowerCase().includes(q) ||
      (l.phone||'').includes(q) ||
      svc.includes(q);
    return matchFilter && matchSearch;
  });
}

// ── Render ─────────────────────────────────────
function render() {
  renderStats();
  renderColumns();
  renderStageTabs();
  if (selectedLead) {
    const updated = allLeads.find(l => l.id === selectedLead.id);
    if (updated) populateDetail(updated);
  }
}

function renderStats() {
  const now  = new Date();
  const month = allLeads.filter(l => {
    const d = new Date(l.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const active = allLeads.filter(l => l.stage !== 'completed');
  const closed = allLeads.filter(l => l.stage === 'booked' || l.stage === 'completed');
  const rate   = allLeads.length ? Math.round(closed.length / allLeads.length * 100) : 0;
  const vals   = closed.map(l => l.value||0).filter(v => v > 0);
  const avg    = vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0;

  set('statTotal',    month.length);
  set('statPipeline', '$' + active.reduce((s,l)=>s+(l.value||0),0).toLocaleString());
  set('statBookRate', rate + '%');
  set('statAvgJob',   avg ? '$' + avg.toLocaleString() : '—');
}

function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderColumns() {
  const leads = filtered();
  const isMobile = window.innerWidth <= 768;

  STAGES.forEach(stage => {
    const col = document.getElementById('col-' + stage.key);
    if (!col) return;

    const stageLeads = leads.filter(l => l.stage === stage.key);

    // Update badge + value
    const badge = col.querySelector('.stage-badge');
    const val   = col.querySelector('.stage-col-value');
    if (badge) badge.textContent = stageLeads.length;
    if (val) {
      const total = stageLeads.reduce((s,l)=>s+(l.value||0),0);
      val.textContent = total ? '$' + total.toLocaleString() : '';
    }

    // Mobile: show only active tab
    if (isMobile) {
      col.classList.toggle('mobile-active', stage.key === activeStage);
    } else {
      col.classList.remove('mobile-active');
    }

    const cards = col.querySelector('.stage-cards');
    if (!cards) return;
    cards.innerHTML = '';

    if (stageLeads.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-col';
      empty.textContent = 'No leads here yet';
      cards.appendChild(empty);
      return;
    }
    stageLeads.forEach(lead => cards.appendChild(buildCard(lead)));
  });
}

// ── Stage tabs (mobile) ────────────────────────
function buildStageTabs() {
  const wrap = document.getElementById('stageTabs');
  if (!wrap) return;
  wrap.innerHTML = '';
  STAGES.forEach(stage => {
    const btn = document.createElement('button');
    btn.className = 'stage-tab' + (stage.key === activeStage ? ' active' : '');
    btn.dataset.stage = stage.key;
    btn.style.borderTopColor = stage.color;
    btn.innerHTML = `${stage.label} <span class="tab-count" id="tab-count-${stage.key}">0</span>`;
    btn.addEventListener('click', () => {
      activeStage = stage.key;
      document.querySelectorAll('.stage-tab').forEach(t => t.classList.toggle('active', t.dataset.stage === stage.key));
      renderColumns();
    });
    wrap.appendChild(btn);
  });
}

function renderStageTabs() {
  const leads = filtered();
  STAGES.forEach(stage => {
    const el = document.getElementById('tab-count-' + stage.key);
    if (el) el.textContent = leads.filter(l => l.stage === stage.key).length;
  });
}

// ── Build board columns ────────────────────────
function buildBoard() {
  const board = document.getElementById('pipelineBoard');
  if (!board) return;
  board.innerHTML = '';
  STAGES.forEach(stage => {
    const col = document.createElement('div');
    col.className = 'stage-col';
    col.id = 'col-' + stage.key;
    col.innerHTML = `
      <div class="stage-col-header" style="border-top:3px solid ${stage.color}">
        <div class="stage-col-title-row">
          <span class="stage-col-label">${stage.label}</span>
          <span class="stage-badge">0</span>
        </div>
        <span class="stage-col-value"></span>
      </div>
      <div class="stage-cards"></div>
    `;
    const cards = col.querySelector('.stage-cards');
    cards.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('drag-over'); });
    cards.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    cards.addEventListener('drop', async e => {
      e.preventDefault(); col.classList.remove('drag-over');
      if (!dragId) return;
      const lead = allLeads.find(l => l.id === dragId);
      if (!lead || lead.stage === stage.key) return;
      lead.stage = stage.key;
      render();
      await SB.patch(dragId, { stage: stage.key });
      dragId = null;
    });
    board.appendChild(col);
  });
}

// ── Build card ─────────────────────────────────
function buildCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.dataset.id = lead.id;
  card.draggable = true;

  const dot  = lead.priority === 'urgent' ? '🔴' : lead.priority === 'high' ? '🟠' : '';
  const icon = svcIcon(lead.service);
  const ago  = timeAgo(lead.created_at);

  card.innerHTML = `
    <div class="card-top">
      <span class="card-icon">${icon}</span>
      <span class="card-name">${lead.name || 'Unknown'}</span>
      ${dot ? `<span class="card-priority">${dot}</span>` : ''}
    </div>
    <div class="card-service">${lead.service || 'General Inquiry'}</div>
    <div class="card-phone">${lead.phone || '—'}</div>
    <div class="card-meta">
      <span>${lead.source || 'Website'}</span>
      <span>${ago}</span>
    </div>
    ${lead.value ? `<div class="card-value">~$${lead.value.toLocaleString()}</div>` : ''}
  `;

  card.addEventListener('click', () => openDetail(lead));

  card.addEventListener('dragstart', e => {
    dragId = lead.id;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => card.classList.add('dragging'), 0);
  });
  card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragId = null; });

  return card;
}

// ── Detail panel ───────────────────────────────
function openDetail(lead) {
  selectedLead = lead;
  populateDetail(lead);
  document.getElementById('detailPanel').classList.add('open');
  document.getElementById('detailBackdrop').classList.add('show');
}

function closeDetail() {
  document.getElementById('detailPanel').classList.remove('open');
  document.getElementById('detailBackdrop').classList.remove('show');
  selectedLead = null;
}

function populateDetail(lead) {
  document.getElementById('detailName').textContent    = lead.name || '—';
  document.getElementById('detailService').textContent = lead.service || '—';
  document.getElementById('detailPhone').textContent   = lead.phone || '—';
  document.getElementById('detailEmail').textContent   = lead.email || '—';
  document.getElementById('detailSource').textContent  = lead.source || '—';
  document.getElementById('detailDate').textContent    = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'}) : '—';
  document.getElementById('detailMessage').textContent = lead.message || '—';
  document.getElementById('detailNotes').value  = lead.notes || '';
  document.getElementById('detailValue').value  = lead.value || '';
  document.getElementById('detailCallBtn').href = 'tel:' + (lead.phone || '');

  document.querySelectorAll('.stage-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.stage === lead.stage));
  document.querySelectorAll('.priority-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.priority === (lead.priority || 'normal')));
}

function bindDetailPanel() {
  document.getElementById('closeDetail').addEventListener('click', closeDetail);
  document.getElementById('detailBackdrop').addEventListener('click', closeDetail);

  document.querySelectorAll('.stage-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedLead) return;
      const stage = btn.dataset.stage;
      selectedLead.stage = stage;
      const lead = allLeads.find(l => l.id === selectedLead.id);
      if (lead) lead.stage = stage;
      document.querySelectorAll('.stage-btn').forEach(b => b.classList.toggle('active', b.dataset.stage === stage));
      render();
      await SB.patch(selectedLead.id, { stage });
    });
  });

  document.querySelectorAll('.priority-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!selectedLead) return;
      const priority = btn.dataset.priority;
      selectedLead.priority = priority;
      const lead = allLeads.find(l => l.id === selectedLead.id);
      if (lead) lead.priority = priority;
      document.querySelectorAll('.priority-btn').forEach(b => b.classList.toggle('active', b.dataset.priority === priority));
      render();
      await SB.patch(selectedLead.id, { priority });
    });
  });

  document.getElementById('saveNotes').addEventListener('click', async () => {
    if (!selectedLead) return;
    const notes = document.getElementById('detailNotes').value;
    const value = parseInt(document.getElementById('detailValue').value) || 0;
    const lead = allLeads.find(l => l.id === selectedLead.id);
    if (lead) { lead.notes = notes; lead.value = value; }
    selectedLead.notes = notes; selectedLead.value = value;
    render();
    await SB.patch(selectedLead.id, { notes, value });
    const btn = document.getElementById('saveNotes');
    btn.textContent = '✓ Saved!';
    setTimeout(() => btn.textContent = 'Save Notes & Value', 1800);
  });

  document.getElementById('deleteLead').addEventListener('click', async () => {
    if (!selectedLead) return;
    if (!confirm(`Remove ${selectedLead.name} from the pipeline?`)) return;
    await SB.del(selectedLead.id);
    allLeads = allLeads.filter(l => l.id !== selectedLead.id);
    closeDetail();
    render();
  });
}

// ── Add Lead ───────────────────────────────────
function bindAddLead() {
  const modal  = document.getElementById('addLeadModal');
  const form   = document.getElementById('addLeadForm');
  const cancel = document.getElementById('cancelAddLead');

  document.getElementById('addLeadBtn').addEventListener('click', () => modal.classList.add('open'));
  cancel.addEventListener('click', () => { modal.classList.remove('open'); form.reset(); });
  modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('open'); form.reset(); } });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const lead = {
      name:    fd.get('name'),
      phone:   fd.get('phone'),
      email:   fd.get('email') || '',
      service: fd.get('service'),
      message: fd.get('message') || '',
      source:  fd.get('source') || 'Manual Entry',
      stage:   'new',
      priority:'normal',
      value:   parseInt(fd.get('value')) || 0,
    };
    const sub = form.querySelector('button[type="submit"]');
    sub.textContent = 'Adding…'; sub.disabled = true;
    const [newLead] = await SB.insert(lead);
    if (newLead) allLeads.unshift(newLead);
    render();
    modal.classList.remove('open'); form.reset();
    sub.textContent = 'Add to Pipeline →'; sub.disabled = false;
  });
}

// ── Search ─────────────────────────────────────
function bindSearch() {
  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value;
    render();
  });
}

// ── Filters ────────────────────────────────────
function bindFilters() {
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      // toggle active within same filter group
      const group = chip.closest('.service-filters, .mobile-filters');
      group?.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      render();
    });
  });
}

// ── Refresh ────────────────────────────────────
function bindRefresh() {
  document.getElementById('refreshBtn').addEventListener('click', loadLeads);
}

// ── Resize handler ─────────────────────────────
window.addEventListener('resize', () => renderColumns());

// ── Boot ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', initLogin);
