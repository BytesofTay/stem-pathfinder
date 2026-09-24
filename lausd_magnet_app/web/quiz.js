/* =========================================
   Quiz, Matching, and Results
   ========================================= */

/* Option labels resolve through t() at render time so language switches
   re-translate the quiz in place. */
const QUIZ = [
  { id:'grade', qKey:'q1', hintKey:'q1hint', multi:false, opts:[
    { v:'elem',  i:'🏫', lKey:'q1optElem', sKey:'q1subElem' },
    { v:'mid',   i:'📚', lKey:'q1optMid',  sKey:'q1subMid' },
    { v:'high',  i:'🎓', lKey:'q1optHigh', sKey:'q1subHigh' },
  ]},
  { id:'interest', qKey:'q2', hintKey:'q2hint', multi:true, opts:[
    { v:'science',  i:'🔬', lKey:'q2optScience',  sKey:'q2subScience' },
    { v:'tech',     i:'💻', lKey:'q2optTech',     sKey:'q2subTech' },
    { v:'medical',  i:'🏥', lKey:'q2optMedical',  sKey:'q2subMedical' },
    { v:'engineer', i:'⚙️', lKey:'q2optEngineer', sKey:'q2subEngineer' },
    { v:'arts',     i:'🎨', lKey:'q2optArts',     sKey:'q2subArts' },
    { v:'any',      i:'🌟', lKey:'q2optAny',      sKey:'q2subAny' },
  ]},
  { id:'priority', qKey:'q3', hintKey:'q3hint', multi:false, opts:[
    { v:'quality', i:'⭐',  lKey:'q3optQuality', sKey:'q3subQuality' },
    { v:'access',  i:'🏘️', lKey:'q3optAccess',  sKey:'q3subAccess' },
    { v:'equity',  i:'⚖️', lKey:'q3optEquity',  sKey:'q3subEquity' },
  ]},
];

const GRADE_MAP   = { elem:['K','1','4'], mid:['6','7'], high:['9'] };
const INT_KEYS    = {
  science: ['science','stem','environment','earth','ecology','museum'],
  tech:    ['stem','tech','engineering','aerospace','computer','math','digital','technology'],
  medical: ['medical','health','biotech','bio-tech'],
  engineer:['engineering','stem','tech','aerospace','math','polytechnic'],
  arts:    ['arts','performing','visual','film','theater','drama','music','journalism','media'],
};
const INT_LABEL_KEYS   = { science:'intScience', tech:'intTech', medical:'intMedical', engineer:'intEngineer', arts:'intArts', any:'intAny' };
const GRADE_LABEL_KEYS = { elem:'gradeElem', mid:'gradeMid', high:'gradeHigh' };

let qStep = 0;
let qAns  = { interest:[] };
let allResults = [];

/* ── Quiz flow ──────────────────────────── */
function startQuiz() {
  qStep = 0; qAns = { interest: [] };
  hide('hero-section'); hide('results-panel');
  document.getElementById('results-panel').classList.remove('active');
  document.getElementById('quiz-panel').classList.add('active');
  show('quiz-panel', 'block');
  renderStep(); scrollTop();
}

function renderStep() {
  const s   = QUIZ[qStep];
  const pct = Math.round((qStep + 1) / QUIZ.length * 100);
  document.getElementById('qpf').style.width = pct + '%';
  document.getElementById('step-label').textContent = t('stepOf', { n: qStep + 1, total: QUIZ.length });
  document.getElementById('step-pct').textContent   = pct + '%';
  document.getElementById('btn-back').style.visibility = qStep === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-back').textContent = t('back');
  document.getElementById('btn-next').textContent = qStep === QUIZ.length - 1 ? t('seeMatches') : t('next');

  const cur = s.multi ? (qAns.interest || []) : [qAns[s.id]];
  document.getElementById('quiz-body').innerHTML = `
    <h2>${t(s.qKey)}</h2>
    <p class="quiz-hint">${t(s.hintKey)}</p>
    <div class="option-grid" role="group" aria-label="${t(s.qKey)}">
      ${s.opts.map(o => `
        <div class="opt ${cur.includes(o.v) ? 'selected' : ''}"
             role="button" tabindex="0" aria-pressed="${cur.includes(o.v)}"
             onclick="pick('${s.id}','${o.v}',${s.multi})"
             onkeydown="if(event.key==='Enter'||event.key===' ')pick('${s.id}','${o.v}',${s.multi})"
             data-v="${o.v}">
          <div class="opt-icon" aria-hidden="true">${o.i}</div>
          <div class="opt-label">${t(o.lKey)}</div>
          <div class="opt-sub">${t(o.sKey)}</div>
        </div>`).join('')}
    </div>`;
  updateNext();
}

function pick(id, val, multi) {
  if (multi) {
    if (val === 'any') {
      qAns.interest = qAns.interest.includes('any') ? [] : ['any'];
    } else {
      qAns.interest = qAns.interest.filter(v => v !== 'any');
      qAns.interest.includes(val)
        ? (qAns.interest = qAns.interest.filter(v => v !== val))
        : qAns.interest.push(val);
    }
  } else {
    qAns[id] = val;
  }
  renderStep();
}

function updateNext() {
  const s = QUIZ[qStep];
  document.getElementById('btn-next').disabled = s.multi ? !qAns.interest.length : !qAns[s.id];
}

function quizNext() { qStep < QUIZ.length - 1 ? (qStep++, renderStep()) : showResults(); }
function quizBack() { if (qStep > 0) { qStep--; renderStep(); } }

/* ── Matching ───────────────────────────── */
function matchSchools(gradeKey, interests, sortKey) {
  const gv = GRADE_MAP[gradeKey] || [];
  let kw = [], matchAll = !interests.length || interests.includes('any');
  if (!matchAll) {
    interests.forEach(i => { if (INT_KEYS[i]) kw.push(...INT_KEYS[i]); });
    kw = [...new Set(kw)];
  }
  let m = allSchools.filter(s => {
    if (gv.length && !gv.includes(s.low_grade)) return false;
    if (!matchAll && !kw.some(k => s.name.toLowerCase().includes(k))) return false;
    return true;
  });
  if (!m.length && gv.length) {
    // Widen: include all grades if no matches in grade range
    m = allSchools.filter(s => !matchAll && kw.some(k => s.name.toLowerCase().includes(k)));
  }
  if (sortKey === 'quality') m.sort((a,b) => (b.quality||0) - (a.quality||0));
  else if (sortKey === 'access') m.sort((a,b) => (b.access||0) - (a.access||0));
  else if (sortKey === 'equity') m.sort((a,b) => (b.equity||0) - (a.equity||0));
  else m.sort((a,b) => (overall(b)||0) - (overall(a)||0));
  return m;
}

function whyBlurb(s) {
  const ov = overall(s);
  const p = getProg(s.name);
  if (p)
    return t('whyProgram', {
      icon: p.label.split(' ')[0],
      prog: p.label.replace(/^[^\s]+ /, ''),
      grades: gradeLabel(s.low_grade),
    });
  return t('whySolid', { grades: gradeLabel(s.low_grade), score: ov });
}

/* ── Results ────────────────────────────── */
function showResults() {
  allResults = matchSchools(qAns.grade, qAns.interest || [], qAns.priority || 'overall');
  hide('quiz-panel');
  document.getElementById('quiz-panel').classList.remove('active');
  document.getElementById('results-panel').classList.add('active');
  show('results-panel', 'block');

  const gl = GRADE_LABEL_KEYS[qAns.grade] ? t(GRADE_LABEL_KEYS[qAns.grade]) : 'student';
  const il = (qAns.interest || []).map(i => INT_LABEL_KEYS[i] ? t(INT_LABEL_KEYS[i]) : i).join(' · ') || 'STEM';
  document.getElementById('results-sub').textContent  = t('resultsFor', { grade: gl, interests: il });
  document.getElementById('match-pill').textContent   = t('schoolsFound', { n: allResults.length });

  renderResultCards(allResults.slice(0, 5), true);
  const rem = allResults.length - 5;
  const sw  = document.getElementById('see-more-wrap');
  if (rem > 0) {
    sw.style.display = '';
    document.getElementById('see-more-btn').textContent = t('showMore', { n: rem });
  } else {
    sw.style.display = 'none';
  }
  scrollTop();

  // Write shareable URL to address bar
  pushResultsURL();
}

function resultCardHtml(s, i) {
  const ov  = overall(s);
  const p   = getProg(s.name);
  const cls = ov != null ? scCls(ov) : 'mid';
  const badge = p
    ? `<span class="prog-badge" style="background:${p.bg};border-color:${p.bd};color:${p.tx}">${p.label}</span>`
    : '';
  const chips = s.quality != null ? `
    <span class="score-chip" style="background:var(--${scCls(s.quality)}-bg);border-color:var(--${scCls(s.quality)}-bd);color:var(--${scCls(s.quality)})">${t('quality')} ${s.quality}/10</span>
    <span class="score-chip" style="background:var(--${scCls(s.access)}-bg);border-color:var(--${scCls(s.access)}-bd);color:var(--${scCls(s.access)})">${t('access')} ${s.access}/10</span>
    <span class="score-chip" style="background:var(--${scCls(s.equity)}-bg);border-color:var(--${scCls(s.equity)}-bd);color:var(--${scCls(s.equity)})">${t('equity')} ${s.equity}/10</span>` : '';
  const favActive = favorites.has(s.name);
  return `<div class="rcard" style="animation-delay:${i * 55}ms">
    <div class="rcard-inner">
      <div class="rcard-num" aria-label="Result ${i+1}">${i + 1}</div>
      <div class="rcard-body">
        <div class="rcard-name">${s.name}</div>
        <div class="rcard-meta">
          <span class="meta-item meta-grade">🎓 ${gradeLabel(s.low_grade)}</span>
          ${badge}
          ${ov != null ? `<span class="meta-item" style="font-weight:700;color:var(--${cls})">★ ${ov}/10</span>` : ''}
        </div>
        <div class="rcard-why">${whyBlurb(s)}</div>
        <div class="rcard-chips">${chips}</div>
        <div class="rcard-actions">
          <a class="btn-apply" href="${APPLY_URL}" target="_blank" rel="noopener noreferrer">${t('applyNow')}</a>
          <a class="btn-map" href="${mapsUrl(s.address)}" target="_blank" rel="noopener noreferrer">📍 ${s.address}</a>
          <button class="fav-btn ${favActive ? 'active' : ''}"
                  onclick="toggleFavorite('${s.name.replace(/'/g,"\\'")}',this)"
                  aria-label="${favActive ? 'Remove from saved' : 'Save school'}"
                  title="${favActive ? 'Saved' : 'Save for later'}">
            ${favActive ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderResultCards(schools, replace) {
  const html = schools.length === 0
    ? `<div class="no-results"><div class="icon">🔍</div><p>${t('noMatches')}</p><button class="btn-primary" onclick="startQuiz()">${t('startOver')}</button></div>`
    : schools.map((s, i) => resultCardHtml(s, i)).join('');
  const el = document.getElementById('results-list');
  if (replace) el.innerHTML = html; else el.insertAdjacentHTML('beforeend', html);
}

function showMore() {
  const shown = document.querySelectorAll('.rcard').length;
  const more  = allResults.slice(shown, shown + 10);
  renderResultCards(more, false);
  const rem = allResults.length - document.querySelectorAll('.rcard').length;
  if (rem > 0) document.getElementById('see-more-btn').textContent = t('showMore', { n: rem });
  else document.getElementById('see-more-wrap').style.display = 'none';
}

/* ── URL Sharing ────────────────────────── */
function pushResultsURL() {
  const interests = (qAns.interest || []).join(',') || 'any';
  const hash = `#results/${qAns.grade || 'elem'}/${interests}/${qAns.priority || 'overall'}`;
  history.replaceState(null, '', hash);
}

function shareResults() {
  const url = location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast(t('linkCopied')));
  } else {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(t('linkCopied'));
  }
}

function loadFromURL() {
  const hash = location.hash;
  if (!hash.startsWith('#results/')) return false;
  const parts = hash.slice('#results/'.length).split('/');
  if (parts.length < 3) return false;
  const [grade, interestStr, priority] = parts;
  qAns = {
    grade,
    interest: interestStr === 'any' ? ['any'] : interestStr.split(',').filter(Boolean),
    priority
  };
  return true;
}

function initFromURL() {
  if (loadFromURL()) {
    showResults();
    return true;
  }
  return false;
}
