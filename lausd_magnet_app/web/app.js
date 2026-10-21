/* LAUSD Magnet School Finder — sourced directory, map, and shortlist. */
const APPLY_URL = 'https://apply.lausd.net';
const FAV_KEY = 'lausd_favorites';
const FAV_MIGRATED_KEY = 'lausd_favorites_server_migrated';
const FAV_PENDING_KEY = 'lausd_favorites_pending_sync';
const COMPARE_KEY = 'stem_pathfinder_compare';

let allSchools = [];
let favorites = new Set();
let compared = new Set();
let mapInstance = null;
let currentTab = 'list';
let favoritesWriteQueue = Promise.resolve();

function tx(key, fallback, vars) {
  const value = typeof t === 'function' ? t(key, vars) : key;
  return value === key ? (fallback || key).replace(/\{(\w+)\}/g, (_, name) => vars && vars[name] != null ? vars[name] : '') : value;
}
function escapeHtml(value) { return SchoolUtils.escapeHtml(value); }
function getProgramEvidence(school) {
  return SchoolUtils.programEvidence(school, typeof PROGRAM_EVIDENCE === 'undefined' ? [] : PROGRAM_EVIDENCE);
}
function verifiedInterestsForSchool(school) {
  return SchoolUtils.verifiedInterests(school, typeof PROGRAM_EVIDENCE === 'undefined' ? [] : PROGRAM_EVIDENCE);
}
function gradeLabel(school) {
  const range = SchoolUtils.gradeRange(typeof school === 'object' ? school : { low_grade: school });
  const label = grade => grade === -1 ? 'TK' : grade === 0 ? 'K' : String(grade);
  if (range.known) return tx('gradesLabel', 'Grades {low}–{high}', { low: label(range.low), high: label(range.high) });
  if (range.low !== null) return tx('gradesFromUnknown', 'Starts at {low}; upper grade unconfirmed', { low: label(range.low) });
  return tx('gradesUnknown', 'Grade range unconfirmed');
}
function mapsUrl(address) { return 'https://maps.google.com/?q=' + encodeURIComponent(String(address || '')); }
function safeLink(url, label, className) {
  const safe = SchoolUtils.safeUrl(url);
  return safe ? '<a class="' + escapeHtml(className || 'source-link') + '" href="' + escapeHtml(safe) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + ' ↗</a>' : '';
}
function schoolLocationHtml(school, className) {
  const label = tx('campusAddress', 'Campus: {address}', {address:school.address});
  if (getProgramEvidence(school).some(record => record.offCampus)) return '<span class="location-note">' + escapeHtml(label) + '</span>';
  return safeLink(mapsUrl(school.address), label, className);
}
function interestLabel(interest) {
  const keys = { science: 'intScience', tech: 'intTech', medical: 'intMedical', engineer: 'intEngineer', arts: 'intArts' };
  return keys[interest] ? t(keys[interest]) : interest;
}
function schoolDetailsHtml(school, options) {
  const evidence = getProgramEvidence(school);
  const compact = options && options.compact;
  const website = SchoolUtils.safeUrl(school.website || school.website_url);
  const details = evidence.length ? evidence.map(record => {
    const labels = (record.interests || []).map(interestLabel).map(escapeHtml).join(' · ');
    const checked = record.checkedAt || record.verifiedAt;
    const description = LANG === 'es' ? record.descriptionEs || record.description : record.description;
    const eligibility = LANG === 'es' ? record.eligibilityNoteEs || record.eligibilityNote : record.eligibilityNote;
    const locationNote = LANG === 'es' ? record.locationNoteEs || record.locationNote : record.locationNote;
    return '<div class="program-evidence"><strong>' + escapeHtml(record.programName || tx('verifiedProgram', 'Reviewed program')) + '</strong>' +
      (labels ? '<p class="program-interests">' + labels + '</p>' : '') +
      (!compact && description ? '<p>' + escapeHtml(description) + '</p>' : '') +
      (eligibility ? '<p class="eligibility-note">' + escapeHtml(eligibility) + '</p>' : '') +
      (locationNote ? '<p class="location-note">' + escapeHtml(locationNote) + '</p>' : '') +
      (record.eligibilitySourceUrl ? '<p>' + safeLink(record.eligibilitySourceUrl, tx('eligibility', 'Admission requirements')) + '</p>' : '') +
      '<p class="source-meta">' + safeLink(record.sourceUrl, tx('sourceDetails', 'Official program source')) +
      (checked ? ' · ' + escapeHtml(tx('sourceChecked', 'Checked {date}', { date: checked })) : '') + '</p></div>';
  }).join('') : '<p class="program-unverified">' + escapeHtml(tx('programUnverified', 'Program interests and eligibility have not yet been reviewed. Check the official school page.')) + '</p>';
  return details + (website ? '<p>' + safeLink(website, tx('officialSchool', 'Official school website')) + '</p>' : '');
}

function showToast(message) {
  document.querySelectorAll('.toast').forEach(element => element.remove());
  const element = document.createElement('div');
  element.className = 'toast';
  element.setAttribute('role', 'status');
  element.textContent = message;
  document.body.appendChild(element);
  setTimeout(() => element.remove(), 2800);
}

/* Browser storage remains usable when the optional persistence API is unavailable. */
async function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    favorites = new Set(Array.isArray(stored) ? stored.filter(name => typeof name === 'string') : []);
    const shortlist = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
    compared = new Set(Array.isArray(shortlist) ? shortlist.filter(name => typeof name === 'string').slice(0, 3) : []);
  } catch { favorites = new Set(); compared = new Set(); }
  updateFavBadge();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch('/api/favorites', { credentials: 'same-origin', signal: controller.signal });
    if (!response.ok) throw new Error('Favorites unavailable');
    const data = await response.json();
    if (Array.isArray(data.favorites)) {
      const pending = localStorage.getItem(FAV_PENDING_KEY) === '1';
      if (pending || (!data.favorites.length && favorites.size && !localStorage.getItem(FAV_MIGRATED_KEY))) {
        const migration = await fetch('/api/favorites', {
          method: 'PUT', credentials: 'same-origin', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ favorites: [...favorites] }),
        });
        if (!migration.ok) throw new Error('Favorites migration unavailable');
        localStorage.setItem(FAV_MIGRATED_KEY, '1');
        localStorage.removeItem(FAV_PENDING_KEY);
      } else {
        favorites = new Set(data.favorites.filter(name => typeof name === 'string'));
        localStorage.setItem(FAV_MIGRATED_KEY, '1');
      }
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    }
  } catch { /* Retain local favorites. */ }
  finally { clearTimeout(timer); }
  updateFavBadge();
  syncSchoolButtons();
  if (currentTab === 'saved') renderSaved();
}
function saveFavorites() {
  const snapshot = JSON.stringify([...favorites]);
  localStorage.setItem(FAV_KEY, snapshot);
  localStorage.setItem(FAV_PENDING_KEY, '1');
  updateFavBadge();
  favoritesWriteQueue = favoritesWriteQueue.catch(() => {}).then(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch('/api/favorites', {
        method: 'PUT', credentials: 'same-origin', keepalive: true, signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ favorites: JSON.parse(snapshot) }),
      });
      if (!response.ok) throw new Error('Favorites unavailable');
      localStorage.setItem(FAV_MIGRATED_KEY, '1');
      if (localStorage.getItem(FAV_KEY) === snapshot) localStorage.removeItem(FAV_PENDING_KEY);
    } catch { /* The pending flag retries the latest browser selection next visit. */ }
    finally { clearTimeout(timer); }
  });
}
function updateFavBadge() {
  const badge = document.getElementById('fav-badge');
  if (!badge) return;
  badge.textContent = favorites.size || '';
  badge.className = 'tab-badge' + (favorites.size ? '' : ' empty');
  badge.style.display = favorites.size ? '' : 'none';
}
function schoolActionButtons(school) {
  const saved = favorites.has(school.name);
  const selected = compared.has(school.name);
  return '<button class="fav-btn ' + (saved ? 'active' : '') + '" data-action="favorite" data-school-name="' + escapeHtml(school.name) +
    '" aria-pressed="' + saved + '" aria-label="' + escapeHtml(tx(saved ? 'removeSaved' : 'saveSchool', saved ? 'Remove from saved' : 'Save school')) + '">' + (saved ? '❤️' : '🤍') + '</button>' +
    '<button class="compare-btn ' + (selected ? 'active' : '') + '" data-action="compare" data-school-name="' + escapeHtml(school.name) + '" aria-pressed="' + selected + '">' +
    escapeHtml(tx(selected ? 'removeCompare' : 'compare', selected ? 'Remove from comparison' : 'Compare')) + '</button>';
}
function syncSchoolButtons() {
  document.querySelectorAll('[data-action="favorite"]').forEach(button => {
    const active = favorites.has(button.dataset.schoolName);
    button.classList.toggle('active', active);
    button.textContent = active ? '❤️' : '🤍';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', tx(active ? 'removeSaved' : 'saveSchool', active ? 'Remove from saved' : 'Save school'));
  });
  document.querySelectorAll('[data-action="compare"]').forEach(button => {
    const active = compared.has(button.dataset.schoolName);
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = tx(active ? 'removeCompare' : 'compare', active ? 'Remove from comparison' : 'Compare');
  });
}
function toggleFavorite(name) {
  if (!allSchools.some(school => school.name === name)) return;
  if (favorites.has(name)) { favorites.delete(name); showToast(t('removedToast')); }
  else { favorites.add(name); showToast(t('savedToast')); }
  saveFavorites();
  syncSchoolButtons();
  if (currentTab === 'saved') renderSaved();
}
function toggleCompare(name) {
  if (!allSchools.some(school => school.name === name)) return;
  if (compared.has(name)) { compared.delete(name); showToast(tx('compareRemoved', 'Removed from comparison.')); }
  else {
    if (compared.size >= 3) { showToast(tx('compareLimit', 'Compare up to three schools. Remove one first.')); return; }
    compared.add(name);
    showToast(tx('compareAdded', 'Added to comparison. Open Saved to compare.'));
  }
  localStorage.setItem(COMPARE_KEY, JSON.stringify([...compared]));
  if (location.hash.startsWith('#shortlist/')) {
    history.replaceState(null, '', '#shortlist/' + encodeURIComponent(JSON.stringify([...compared])));
  }
  syncSchoolButtons();
  if (currentTab === 'saved') renderSaved();
}
/* Hosted chat can add known schools, never toggle an existing choice off. */
function getComparisonSchoolIds() {
  return allSchools.filter(school => compared.has(school.name)).map(SchoolUtils.schoolId);
}
function addSchoolIdsToComparison(ids) {
  const result = { added: [], existing: [], rejected: [], total: compared.size, persisted: true };
  for (const id of [...new Set(Array.isArray(ids) ? ids : [])]) {
    if (typeof id !== 'string' || !/^\d{14}$/.test(id)) { result.rejected.push({ id: String(id), reason: 'invalid' }); continue; }
    const school = allSchools.find(record => SchoolUtils.schoolId(record) === id);
    if (!school) { result.rejected.push({ id, reason: 'not_found' }); continue; }
    if (compared.has(school.name)) { result.existing.push(school.name); continue; }
    if (compared.size >= 3) { result.rejected.push({ id, reason: 'limit' }); continue; }
    compared.add(school.name);
    result.added.push(school.name);
  }
  result.total = compared.size;
  if (result.added.length) {
    try { localStorage.setItem(COMPARE_KEY, JSON.stringify([...compared])); }
    catch { result.persisted = false; }
    if (location.hash.startsWith('#shortlist/')) history.replaceState(null, '', '#shortlist/' + encodeURIComponent(JSON.stringify([...compared])));
    syncSchoolButtons();
    if (currentTab === 'saved') renderSaved();
  }
  return result;
}
function comparisonHtml() {
  const schools = allSchools.filter(school => compared.has(school.name));
  return '<section class="comparison-panel" id="comparison-panel" aria-label="' + escapeHtml(tx('compareTitle', 'Compare your shortlist')) + '">' +
    '<div class="comparison-heading"><h2>' + escapeHtml(tx('compareTitle', 'Compare your shortlist')) + '</h2>' +
    '<p>' + escapeHtml(tx('compareHint', 'Choose up to three schools. Confirm the specific magnet program, grade eligibility, and transportation with LAUSD.')) + '</p></div>' +
    (schools.length ? '<div class="comparison-actions"><button data-action="print-shortlist">' + escapeHtml(tx('printShortlist', 'Print shortlist')) + '</button>' +
      '<button data-action="share-shortlist">' + escapeHtml(tx('shareShortlist', 'Share shortlist')) + '</button></div><div class="comparison-grid">' +
      schools.map(school => '<article class="comparison-card"><h3>' + escapeHtml(school.name) + '</h3><p>' + escapeHtml(gradeLabel(school)) +
        '</p><p>' + schoolLocationHtml(school, 'map-link') + '</p>' + schoolDetailsHtml(school) +
        '<button data-action="compare" data-school-name="' + escapeHtml(school.name) + '">' + escapeHtml(tx('removeCompare', 'Remove from comparison')) + '</button></article>').join('') + '</div>' :
      '<p>' + escapeHtml(tx('compareEmpty', 'Use Compare on a school card to build your shortlist.')) + '</p>') + '</section>';
}
function renderSaved() {
  const panel = document.getElementById('saved-panel');
  if (!panel) return;
  const saved = allSchools.filter(school => favorites.has(school.name));
  panel.innerHTML = comparisonHtml() + (saved.length ? '<h2>' + escapeHtml(t('savedSchoolsHeading')) + '</h2><div class="list">' +
    saved.map(renderCard).join('') + '</div>' : '<div class="saved-empty"><h3>' + escapeHtml(t('noSaved')) + '</h3><p>' + escapeHtml(t('noSavedHint')) + '</p></div>');
}
async function copyLink(url, successKey) {
  try {
    await navigator.clipboard.writeText(url);
    showToast(tx(successKey, 'Link copied.'));
  } catch {
    window.prompt(tx('copyLink', 'Copy this link:'), url);
  }
}
function shareShortlist() {
  const names = [...compared].filter(name => allSchools.some(school => school.name === name));
  const url = new URL(location.href);
  url.hash = '#shortlist/' + encodeURIComponent(JSON.stringify(names));
  return copyLink(url.href, 'shortlistCopied');
}
function printShortlist() {
  document.body.classList.add('print-shortlist');
  window.print();
  document.body.classList.remove('print-shortlist');
}
function initShortlistFromURL() {
  if (!location.hash.startsWith('#shortlist/')) return false;
  try {
    const names = JSON.parse(decodeURIComponent(location.hash.slice('#shortlist/'.length)));
    if (!Array.isArray(names)) return false;
    compared = new Set(names.filter(name => typeof name === 'string' && allSchools.some(school => school.name === name)).slice(0, 3));
    localStorage.setItem(COMPARE_KEY, JSON.stringify([...compared]));
    switchTab('saved');
    return true;
  } catch { return false; }
}

function switchTab(tab) {
  if (!['list', 'map', 'saved'].includes(tab)) return;
  currentTab = tab;
  show('browse-section');
  ['list', 'map', 'saved'].forEach(name => {
    const button = document.getElementById('tab-' + name);
    const panel = document.getElementById(name + '-panel');
    if (button) { button.classList.toggle('active', name === tab); button.setAttribute('aria-selected', String(name === tab)); }
    if (panel) panel.classList.toggle('active', name === tab);
  });
  ['filter-bar', 'count-bar'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.style.display = tab === 'list' ? '' : 'none';
  });
  if (tab === 'map') initMap();
  if (tab === 'saved') renderSaved();
  document.getElementById('browse-divider')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function initMap() {
  const notice = document.getElementById('map-no-data');
  if (!window.L) {
    if (notice) { notice.style.display = 'flex'; notice.textContent = tx('mapUnavailable', 'The map could not load. Use the school list and directions links.'); }
    return;
  }
  const geocoded = allSchools.filter(school => Number.isFinite(school.lat) && Number.isFinite(school.lng));
  if (!geocoded.length) {
    if (notice) { notice.style.display = 'flex'; notice.textContent = tx('mapUnavailable', 'School locations are unavailable. Use the school list.'); }
    return;
  }
  if (notice) notice.style.display = 'none';
  if (mapInstance) { mapInstance.invalidateSize(); return; }
  mapInstance = L.map('school-map').setView([34.05, -118.25], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>', maxZoom: 18,
  }).addTo(mapInstance);
  const markers = [];
  geocoded.forEach(school => {
    const marker = L.circleMarker([school.lat, school.lng], {
      radius: 7, fillColor: '#1565C0', color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.85,
    }).addTo(mapInstance);
    marker.bindPopup('<div class="map-popup-name">' + escapeHtml(school.name) + '</div><p>' + escapeHtml(gradeLabel(school)) +
      '</p>' + schoolDetailsHtml(school, { compact: true }) + '<p>' + schoolLocationHtml(school) +
      '</p><p class="source-meta">' + escapeHtml(tx('mapCampusNotice', 'Campus location from the school directory. A magnet program may meet elsewhere; verify with the program.')) +
      '</p><div class="school-actions">' + schoolActionButtons(school) + '</div>', { maxWidth: 300 });
    marker.on('popupopen', syncSchoolButtons);
    markers.push([school.lat, school.lng]);
  });
  if (markers.length) mapInstance.fitBounds(markers, { padding: [24, 24] });
  setTimeout(() => mapInstance.invalidateSize(), 100);
}
function renderCard(school, index) {
  return '<article class="card" data-school="' + escapeHtml(school.name) + '"><div class="card-header"><div class="card-main">' +
    '<h3 class="card-name">' + escapeHtml(school.name) + '</h3><div class="card-meta"><span class="meta-item meta-grade">' +
    escapeHtml(gradeLabel(school)) + '</span><span class="meta-item">' + schoolLocationHtml(school, 'map-link') +
    '</span></div>' + schoolDetailsHtml(school) + '</div><div class="card-right">' + schoolActionButtons(school) + '</div></div></article>';
}
function activeFC() {
  return Number(Boolean(document.getElementById('search')?.value.trim())) + Number(Boolean(document.getElementById('grade-filter')?.value));
}
let filterTimer;
function queueFilters() { clearTimeout(filterTimer); filterTimer = setTimeout(applyFilters, 150); }
function applyFilters() {
  const query = (document.getElementById('search')?.value || '').toLowerCase().trim();
  const grade = document.getElementById('grade-filter')?.value || '';
  const list = allSchools.filter(school => {
    const evidenceText = getProgramEvidence(school).map(record => [record.programName, record.description, record.descriptionEs].join(' ')).join(' ');
    return (!query || [school.name, school.address, evidenceText].join(' ').toLowerCase().includes(query)) &&
      (!grade || SchoolUtils.servesGrade(school, grade));
  }).sort((a, b) => a.name.localeCompare(b.name));
  const countLabel = document.getElementById('count-label');
  if (countLabel) countLabel.textContent = list.length === allSchools.length ? t('showingAll', { n: allSchools.length }) : t('showingSome', { n: list.length, total: allSchools.length });
  const count = activeFC();
  document.getElementById('clear-btn')?.classList.toggle('show', count > 0);
  const badge = document.getElementById('fc-badge');
  if (badge) badge.textContent = count;
  const content = document.getElementById('list-content');
  if (content) content.innerHTML = list.length ? '<div class="list">' + list.map(renderCard).join('') + '</div>' :
    '<div class="no-results"><p>' + escapeHtml(t('noFilterResults')) + '</p><button class="btn-primary" data-action="clear-filters">' + escapeHtml(t('clearFilters')) + '</button></div>';
}
function clearFilters() {
  const search = document.getElementById('search');
  const grade = document.getElementById('grade-filter');
  if (search) search.value = '';
  if (grade) grade.value = '';
  applyFilters();
}
function show(id, display) { const element = document.getElementById(id); if (element) element.style.display = display || 'block'; }
function hide(id) { const element = document.getElementById(id); if (element) element.style.display = 'none'; }
function scrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showHero() {
  show('hero-section'); hide('quiz-panel'); hide('results-panel'); hide('browse-section');
  document.getElementById('quiz-panel')?.classList.remove('active');
  document.getElementById('results-panel')?.classList.remove('active');
  history.replaceState(null, '', location.pathname + location.search);
  scrollTop();
}
function scrollToBrowse() { switchTab('list'); }
function openModal() { document.getElementById('modal')?.classList.add('open'); }
function closeModal() { document.getElementById('modal')?.classList.remove('open'); }
async function loadSchools() {
  allSchools = typeof SCHOOLS_DATA === 'undefined' ? [] : SCHOOLS_DATA;
  hide('offline-pill');
  applyFilters();
}
document.addEventListener('DOMContentLoaded', async () => {
  document.documentElement.lang = LANG;
  applyStaticI18n();
  /* Data renders immediately; an unavailable optional API cannot hold the finder blank. */
  await loadSchools();
  const favoritesReady = loadFavorites();
  if (!initShortlistFromURL()) initFromURL();
  document.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'favorite') toggleFavorite(target.dataset.schoolName);
    if (action === 'compare') toggleCompare(target.dataset.schoolName);
    if (action === 'print-shortlist') printShortlist();
    if (action === 'share-shortlist') shareShortlist();
    if (action === 'clear-filters') clearFilters();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeModal(); if (typeof chatOpen !== 'undefined' && chatOpen) toggleChat(); }
  });
  await favoritesReady;
});
