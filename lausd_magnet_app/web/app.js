/* =========================================
   LAUSD Magnet School Finder — Main App
   ========================================= */

const API_URL   = 'http://localhost:8000/schools';
const APPLY_URL = 'https://www.lausd.net/Page/460';
const HIGH_GRADE = { K:'5','1':'5','4':'5','6':'8','7':'8','9':'12' };
const FAV_KEY    = 'lausd_favorites';

let allSchools   = [];
let topRatedIds  = new Set();
let topEquityIds = new Set();
let favorites    = new Set();
let mapInstance  = null;
let currentTab   = 'list';

const PROG_TYPES = [
  { keys:['medical','health','biotech','bio-tech'],                           label:'🏥 Medical',     bg:'#FCE4EC',bd:'#F48FB1',tx:'#880E4F' },
  { keys:['stem','science','math','engineering','tech','aerospace','technology','museum science'], label:'🔬 STEM',      bg:'#E3F2FD',bd:'#90CAF9',tx:'#0D47A1' },
  { keys:['arts','performing','music','film','theater','drama','visual'],     label:'🎨 Arts',        bg:'#F3E5F5',bd:'#CE93D8',tx:'#6A1B9A' },
  { keys:['journalism','media','communications'],                             label:'📰 Journalism',  bg:'#FFF8E1',bd:'#FFD54F',tx:'#E65100' },
  { keys:['law','justice','social'],                                          label:'⚖️ Law',         bg:'#FBE9E7',bd:'#FFAB91',tx:'#BF360C' },
  { keys:['environment','earth','ecology'],                                   label:'🌿 Environment', bg:'#E8F5E9',bd:'#A5D6A7',tx:'#1B5E20' },
  { keys:['humanit','global','multicultural','world','awareness'],            label:'🌍 Humanities',  bg:'#E0F7FA',bd:'#80DEEA',tx:'#006064' },
  { keys:['enriched','enrichment','gifted','magnet','preparatory'],           label:'★ Enriched',    bg:'#FFF9C4',bd:'#FFF176',tx:'#827717' },
];

/* ── Helpers ────────────────────────────── */
const getProg     = n => { const l = n.toLowerCase(); for (const p of PROG_TYPES) if (p.keys.some(k => l.includes(k))) return p; return null; };
const overall     = s => s.quality == null ? null : Math.round((s.quality + s.access + s.equity) / 3 * 10) / 10;
const scCls       = n => n >= 8 ? 'high' : n >= 5 ? 'mid' : 'low';
const fillCls     = n => 'fill-' + scCls(n);
const gradeLabel  = l => `Grades ${l}–${HIGH_GRADE[l] || '12'}`;
const mapsUrl     = a => 'https://maps.google.com/?q=' + encodeURIComponent(a + ', Los Angeles, CA');

function scoreRow(label, score) {
  const pct = (score / 10 * 100).toFixed(0);
  return `<div class="score-row">
    <span class="score-lbl">${label}</span>
    <div class="score-track"><div class="score-fill ${fillCls(score)}" style="width:${pct}%"></div></div>
    <span class="score-num" style="color:var(--${scCls(score)})">${score}/10</span>
  </div>`;
}

function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

/* ── Favorites ──────────────────────────── */
function loadFavorites() {
  try { favorites = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
  catch { favorites = new Set(); }
  updateFavBadge();
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
  updateFavBadge();
}

function updateFavBadge() {
  const badge = document.getElementById('fav-badge');
  if (!badge) return;
  badge.textContent = favorites.size || '';
  badge.className   = 'tab-badge' + (favorites.size ? '' : ' empty');
  badge.style.display = favorites.size ? '' : 'none';
}

function toggleFavorite(name, btnEl) {
  if (favorites.has(name)) {
    favorites.delete(name);
    if (btnEl) { btnEl.classList.remove('active'); btnEl.textContent = '🤍'; btnEl.setAttribute('aria-label','Save school'); }
    showToast('Removed from saved schools');
  } else {
    favorites.add(name);
    if (btnEl) { btnEl.classList.add('active'); btnEl.textContent = '❤️'; btnEl.setAttribute('aria-label','Remove from saved'); }
    showToast('❤️ Saved! Find it in the Saved tab.');
  }
  // Sync all other fav buttons for the same school
  document.querySelectorAll(`.fav-btn`).forEach(b => {
    if (b !== btnEl && b.closest('[data-school]')?.dataset.school === name) {
      b.classList.toggle('active', favorites.has(name));
      b.textContent = favorites.has(name) ? '❤️' : '🤍';
    }
  });
  saveFavorites();
  if (currentTab === 'saved') renderSaved();
}

function renderSaved() {
  const panel = document.getElementById('saved-panel');
  if (!panel) return;
  const saved = allSchools.filter(s => favorites.has(s.name));
  if (saved.length === 0) {
    panel.innerHTML = `<div class="saved-empty">
      <div class="icon">🤍</div>
      <h3>No saved schools yet</h3>
      <p>Tap the heart icon on any school to save it here for easy comparison later.</p>
    </div>`;
    return;
  }
  panel.innerHTML = `<div class="list">
    ${saved.map((s, i) => renderCard(s, i)).join('')}
  </div>`;
}

/* ── Tabs ───────────────────────────────── */
function switchTab(tab) {
  currentTab = tab;
  show('browse-section');
  ['list','map','saved'].forEach(t => {
    const btn   = document.getElementById('tab-' + t);
    const panel = document.getElementById(t === 'list' ? 'list-panel' : t + '-panel');
    if (btn)   btn.classList.toggle('active', t === tab);
    if (panel) panel.classList.toggle('active', t === tab);
  });
  const filterBar = document.getElementById('filter-bar');
  const countBar  = document.getElementById('count-bar');
  if (filterBar) filterBar.style.display = tab === 'list' ? '' : 'none';
  if (countBar)  countBar.style.display  = tab === 'list' ? '' : 'none';
  if (tab === 'map')   initMap();
  if (tab === 'saved') renderSaved();
  setTimeout(() => document.getElementById('browse-divider').scrollIntoView({ behavior:'smooth', block:'start' }), 50);
}

/* ── Map ────────────────────────────────── */
function initMap() {
  if (!window.L) return;
  const mapEl = document.getElementById('school-map');
  if (!mapEl) return;

  // Check if schools have geocoded data
  const geocoded = allSchools.filter(s => s.lat && s.lng);
  const noDataEl = document.getElementById('map-no-data');

  if (geocoded.length === 0) {
    if (noDataEl) noDataEl.style.display = 'flex';
    return;
  }
  if (noDataEl) noDataEl.style.display = 'none';

  if (mapInstance) {
    mapInstance.invalidateSize();
    return;
  }

  mapInstance = L.map('school-map').setView([34.05, -118.25], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(mapInstance);

  const colorFor = ov => {
    if (ov == null) return '#78909c';
    if (ov >= 8)   return '#2E7D32';
    if (ov >= 5)   return '#E65100';
    return '#C62828';
  };

  geocoded.forEach(s => {
    const ov = overall(s);
    const color = colorFor(ov);
    const marker = L.circleMarker([s.lat, s.lng], {
      radius: 7, fillColor: color, color: '#fff',
      weight: 1.5, opacity: 1, fillOpacity: 0.85,
    }).addTo(mapInstance);

    const p = getProg(s.name);
    marker.bindPopup(`
      <div class="map-popup-name">${s.name}</div>
      <div class="map-popup-grade">${gradeLabel(s.low_grade)}${p ? ' · ' + p.label : ''}</div>
      <div class="map-popup-scores">
        ⭐ Overall: <strong>${ov || '?'}/10</strong><br>
        🎓 Quality: ${s.quality || '?'}/10 &nbsp;
        🚪 Access: ${s.access || '?'}/10 &nbsp;
        ⚖️ Equity: ${s.equity || '?'}/10
      </div>
      <a class="map-popup-link" href="${APPLY_URL}" target="_blank" rel="noopener">Apply Now →</a>
      &nbsp;
      <a class="map-popup-link" href="${mapsUrl(s.address)}" target="_blank" rel="noopener" style="background:#546E7A">📍 Directions</a>
    `, { maxWidth: 260 });
  });

  // Legend
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', '');
    div.style.cssText = 'background:#fff;padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.8;box-shadow:0 2px 8px rgba(0,0,0,.15)';
    div.innerHTML = `<strong style="display:block;margin-bottom:4px">Score</strong>
      <span style="color:#2E7D32">●</span> 8–10 High<br>
      <span style="color:#E65100">●</span> 5–7 Mid<br>
      <span style="color:#C62828">●</span> 1–4 Low`;
    return div;
  };
  legend.addTo(mapInstance);

  setTimeout(() => mapInstance.invalidateSize(), 200);
}

/* ── Browse ─────────────────────────────── */
function renderCard(s, idx) {
  const ov  = overall(s);
  const p   = getProg(s.name);
  const ribbons = [];
  if (topRatedIds.has(s.name))  ribbons.push(`<div class="ribbon" aria-label="Top Rated">⭐ Top Rated</div>`);
  if (topEquityIds.has(s.name)) ribbons.push(`<div class="ribbon eq" aria-label="High Equity">🏅 High Equity</div>`);
  const badge = p ? `<span class="prog-badge" style="background:${p.bg};border-color:${p.bd};color:${p.tx}">${p.label}</span>` : '';
  const oc    = ov != null ? scCls(ov) : '';
  const circ  = ov != null
    ? `<div class="overall ${oc}" aria-label="Overall score ${ov} out of 10"><span class="overall-n">${ov}</span><span class="overall-d">/10</span></div>`
    : '';
  const sc = s.quality != null
    ? `<div class="scores">${scoreRow('Quality',s.quality)}${scoreRow('Access',s.access)}${scoreRow('Equity',s.equity)}</div>`
    : `<span style="font-size:12px;color:var(--text-sub)">Not yet scored</span>`;
  const favActive = favorites.has(s.name);

  return `<div class="card" style="animation-delay:${Math.min(idx,20)*28}ms" data-school="${s.name.replace(/"/g,'&quot;')}">
    ${ribbons.join('')}
    <div class="card-header">
      <div class="card-main">
        <div class="card-name">${s.name}</div>
        <div class="card-meta">
          <span class="meta-item meta-grade">🎓 ${gradeLabel(s.low_grade)}</span>
          <span class="meta-item">📍 <a class="map-link" href="${mapsUrl(s.address)}" target="_blank" rel="noopener noreferrer">${s.address}</a></span>
          ${badge}
        </div>
        ${sc}
      </div>
      <div class="card-right">
        ${circ}
        <button class="fav-btn ${favActive ? 'active' : ''}"
                onclick="toggleFavorite('${s.name.replace(/'/g,"\\'")}',this)"
                aria-label="${favActive ? 'Remove from saved' : 'Save school'}"
                title="${favActive ? 'Saved' : 'Save for later'}">
          ${favActive ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  </div>`;
}

let statsOpen = false;
function toggleStats() {
  statsOpen = !statsOpen;
  document.getElementById('stats-bar').classList.toggle('collapsed', !statsOpen);
  const btn = document.getElementById('stats-toggle-btn');
  btn.textContent = statsOpen ? '▾ Hide district averages' : '▸ Show district averages';
  btn.setAttribute('aria-expanded', String(statsOpen));
}

function updateStats(schools) {
  const sc = schools.filter(s => s.quality != null);
  if (!sc.length) return;
  const avg   = k => (sc.reduce((a,s) => a + s[k], 0) / sc.length).toFixed(1);
  const avgOv = (sc.reduce((a,s) => a + overall(s), 0) / sc.length).toFixed(1);
  ['quality','access','equity'].forEach(k => document.getElementById('avg-' + k).textContent = avg(k));
  document.getElementById('avg-overall').textContent = avgOv;
}

function computeRibbons(schools) {
  const sc = [...schools].filter(s => s.quality != null);
  topRatedIds  = new Set(sc.sort((a,b) => overall(b) - overall(a)).slice(0, 10).map(s => s.name));
  topEquityIds = new Set(
    [...schools].filter(s => s.quality != null)
      .sort((a,b) => b.equity - a.equity).slice(0, 5)
      .map(s => s.name)
      .filter(n => !topRatedIds.has(n))
  );
}

function activeFC() {
  let n = 0;
  if (document.getElementById('search').value.trim()) n++;
  if (document.getElementById('grade-filter').value) n++;
  if (document.getElementById('sort').value !== 'name') n++;
  return n;
}

function applyFilters() {
  const q = document.getElementById('search').value.toLowerCase().trim();
  const g = document.getElementById('grade-filter').value;
  const s = document.getElementById('sort').value;
  let list = allSchools.filter(sc =>
    (!q || sc.name.toLowerCase().includes(q) || sc.address.toLowerCase().includes(q)) &&
    (!g || sc.low_grade === g)
  );
  if (s === 'name')    list.sort((a,b) => a.name.localeCompare(b.name));
  if (s === 'overall') list.sort((a,b) => (overall(b)||0) - (overall(a)||0));
  if (s === 'quality') list.sort((a,b) => (b.quality||0) - (a.quality||0));
  if (s === 'access')  list.sort((a,b) => (b.access||0)  - (a.access||0));
  if (s === 'equity')  list.sort((a,b) => (b.equity||0)  - (a.equity||0));

  document.getElementById('count-label').textContent = list.length === allSchools.length
    ? `Showing all ${allSchools.length} magnet schools`
    : `${list.length} of ${allSchools.length} schools`;

  const fc = activeFC();
  document.getElementById('clear-btn').classList.toggle('show', fc > 0);
  document.getElementById('fc-badge').textContent = fc;

  ['quality','access','equity','overall'].forEach(k =>
    document.getElementById('stat-' + k).classList.toggle('active', s === k)
  );

  document.getElementById('list-content').innerHTML = list.length === 0
    ? `<div class="no-results"><div class="icon">🔍</div><p>No schools match your filters.</p><button class="btn-primary" onclick="clearFilters()" style="margin:0 auto">✕ Clear filters</button></div>`
    : `<div class="list">${list.map((sc, i) => renderCard(sc, i)).join('')}</div>`;
}

function sortBy(k)     { document.getElementById('sort').value = k; applyFilters(); }
function clearFilters() {
  document.getElementById('search').value = '';
  document.getElementById('grade-filter').value = '';
  document.getElementById('sort').value = 'name';
  applyFilters();
}

/* ── View helpers ───────────────────────── */
function show(id, d = 'block') { const el = document.getElementById(id); if (el) el.style.display = d; }
function hide(id)               { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
function scrollTop()            { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function showHero() {
  show('hero-section');
  hide('quiz-panel');
  hide('results-panel');
  document.getElementById('quiz-panel').classList.remove('active');
  document.getElementById('results-panel').classList.remove('active');
  history.replaceState(null, '', location.pathname);
  scrollTop();
}

function scrollToBrowse() {
  show('browse-section');
  switchTab('list');
}

function openModal()  { document.getElementById('modal').classList.add('open'); }
function closeModal() { document.getElementById('modal').classList.remove('open'); }

/* ── Data loading ───────────────────────── */
async function loadSchools() {
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error('API error');
    allSchools = await res.json();
    hide('offline-pill');
  } catch {
    allSchools = SCHOOLS_DATA;
    show('offline-pill', 'flex');
  }
  computeRibbons(allSchools);
  updateStats(allSchools);
  applyFilters();
}

/* ── Init ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  loadSchools().then(() => {
    if (!initFromURL()) {
      // Normal load — show hero
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      if (chatOpen) toggleChat();
    }
  });
});
