/* =========================================
   Quiz, Matching, and Results
   ========================================= */

const QUIZ = [
  { id:'grade', q:"What grade is your child in?", hint:"We'll show schools they can still apply to.", multi:false, opts:[
    { v:'elem',  i:'🏫', l:'Elementary',    s:'Grades K – 5' },
    { v:'mid',   i:'📚', l:'Middle School',  s:'Grades 6 – 8' },
    { v:'high',  i:'🎓', l:'High School',    s:'Grades 9 – 12' },
  ]},
  { id:'interest', q:"What is your child most excited about?", hint:"Pick as many as you like.", multi:true, opts:[
    { v:'science',  i:'🔬', l:'Science & Nature',       s:'Biology, environment, earth science' },
    { v:'tech',     i:'💻', l:'Computers & Technology', s:'Coding, robotics, digital media' },
    { v:'medical',  i:'🏥', l:'Medicine & Health',      s:'Biotech, pre-med, health sciences' },
    { v:'engineer', i:'⚙️', l:'Engineering & Building', s:'Aerospace, architecture, math' },
    { v:'arts',     i:'🎨', l:'Art + STEM',             s:'Design, film, creative technology' },
    { v:'any',      i:'🌟', l:'Not sure yet',           s:'Show me the best STEM programs' },
  ]},
  { id:'priority', q:"What matters most to you?", hint:"We'll use this to rank your matches.", multi:false, opts:[
    { v:'quality', i:'⭐', l:'Best academic program',    s:'Highest-rated STEM curriculum' },
    { v:'access',  i:'🏘️', l:'Accessible to more kids',  s:'Accepts from earlier grade levels' },
    { v:'equity',  i:'⚖️', l:'Welcoming to all students', s:'Strong diversity & inclusion' },
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
const INT_LABELS  = { science:'Science & Nature',tech:'Computers & Technology',medical:'Medicine & Health',engineer:'Engineering & Building',arts:'Art + STEM',any:'All STEM programs' };
const GRADE_LABELS = { elem:'elementary schooler',mid:'middle schooler',high:'high schooler' };

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
  document.getElementById('step-label').textContent = `Step ${qStep + 1} of ${QUIZ.length}`;
  document.getElementById('step-pct').textContent   = pct + '%';
  document.getElementById('btn-back').style.visibility = qStep === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-next').textContent = qStep === QUIZ.length - 1 ? 'See my matches ✓' : 'Next →';

  const cur = s.multi ? (qAns.interest || []) : [qAns[s.id]];
  document.getElementById('quiz-body').innerHTML = `
    <h2>${s.q}</h2>
    <p class="quiz-hint">${s.hint}</p>
    <div class="option-grid" role="group" aria-label="${s.q}">
      ${s.opts.map(o => `
        <div class="opt ${cur.includes(o.v) ? 'selected' : ''}"
             role="button" tabindex="0" aria-pressed="${cur.includes(o.v)}"
             onclick="pick('${s.id}','${o.v}',${s.multi})"
             onkeydown="if(event.key==='Enter'||event.key===' ')pick('${s.id}','${o.v}',${s.multi})"
             data-v="${o.v}">
          <div class="opt-icon" aria-hidden="true">${o.i}</div>
          <div class="opt-label">${o.l}</div>
          <div class="opt-sub">${o.s}</div>
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
  if (topRatedIds.has(s.name))
    return `⭐ <strong>Top 10 school district-wide</strong> — one of the highest-rated magnet programs in LAUSD.`;
  const p = getProg(s.name);
  if (p?.label.includes('Medical') && s.quality >= 8)
    return `🏥 <strong>Top-rated medical magnet</strong> — specialized pre-med and biotech curriculum.`;
  if (p?.label.includes('STEM') && s.quality >= 9)
    return `🔬 <strong>One of LAUSD's highest-rated STEM programs</strong> — rigorous science and engineering curriculum.`;
  if (s.equity >= 9)
    return `⚖️ <strong>Strong community school</strong> — deeply committed to serving underserved neighborhoods in LA.`;
  if (s.access === 9)
    return `🏫 <strong>Starts in Kindergarten</strong> — your child can grow with this program from day one. Apply early!`;
  if (s.quality >= 8 && s.equity >= 7)
    return `✨ <strong>High quality & inclusive</strong> — strong academics in a diverse, welcoming environment.`;
  if (p)
    return `${p.label.split(' ')[0]} <strong>Strong ${p.label.replace(/^[^\s]+ /, '')} program</strong> — serving ${gradeLabel(s.low_grade)} with a specialized curriculum.`;
  return `🎓 <strong>Solid magnet program</strong> — serving ${gradeLabel(s.low_grade)} with an overall score of ${ov}/10.`;
}

/* ── Results ────────────────────────────── */
function showResults() {
  allResults = matchSchools(qAns.grade, qAns.interest || [], qAns.priority || 'overall');
  hide('quiz-panel');
  document.getElementById('quiz-panel').classList.remove('active');
  document.getElementById('results-panel').classList.add('active');
  show('results-panel', 'block');

  const gl = GRADE_LABELS[qAns.grade] || 'student';
  const il = (qAns.interest || []).map(i => INT_LABELS[i] || i).join(' · ') || 'STEM';
  document.getElementById('results-sub').textContent  = `For a ${gl} interested in ${il}`;
  document.getElementById('match-pill').textContent   = `${allResults.length} schools found`;

  renderResultCards(allResults.slice(0, 5), true);
  const rem = allResults.length - 5;
  const sw  = document.getElementById('see-more-wrap');
  if (rem > 0) {
    sw.style.display = '';
    document.getElementById('see-more-btn').textContent = `Show ${rem} more schools ↓`;
  } else {
    sw.style.display = 'none';
  }
  scrollTop();

  // Write shareable URL to address bar
  pushResultsURL();
}

function resultCardHtml(s, i) {
  const ov  = overall(s);
  const top = topRatedIds.has(s.name);
  const p   = getProg(s.name);
  const cls = ov != null ? scCls(ov) : 'mid';
  const badge = p
    ? `<span class="prog-badge" style="background:${p.bg};border-color:${p.bd};color:${p.tx}">${p.label}</span>`
    : '';
  const chips = s.quality != null ? `
    <span class="score-chip" style="background:var(--${scCls(s.quality)}-bg);border-color:var(--${scCls(s.quality)}-bd);color:var(--${scCls(s.quality)})">Quality ${s.quality}/10</span>
    <span class="score-chip" style="background:var(--${scCls(s.access)}-bg);border-color:var(--${scCls(s.access)}-bd);color:var(--${scCls(s.access)})">Access ${s.access}/10</span>
    <span class="score-chip" style="background:var(--${scCls(s.equity)}-bg);border-color:var(--${scCls(s.equity)}-bd);color:var(--${scCls(s.equity)})">Equity ${s.equity}/10</span>` : '';
  const favActive = favorites.has(s.name);
  return `<div class="rcard ${top ? 'top' : ''}" style="animation-delay:${i * 55}ms">
    <div class="rcard-inner">
      <div class="rcard-num ${top ? 'top' : ''}" aria-label="Rank ${i+1}">${i + 1}</div>
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
          <a class="btn-apply" href="${APPLY_URL}" target="_blank" rel="noopener noreferrer">Apply Now →</a>
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
    ? `<div class="no-results"><div class="icon">🔍</div><p>No schools matched. Try different interests or start over.</p><button class="btn-primary" onclick="startQuiz()">↺ Start over</button></div>`
    : schools.map((s, i) => resultCardHtml(s, i)).join('');
  const el = document.getElementById('results-list');
  if (replace) el.innerHTML = html; else el.insertAdjacentHTML('beforeend', html);
}

function showMore() {
  const shown = document.querySelectorAll('.rcard').length;
  const more  = allResults.slice(shown, shown + 10);
  renderResultCards(more, false);
  const rem = allResults.length - document.querySelectorAll('.rcard').length;
  if (rem > 0) document.getElementById('see-more-btn').textContent = `Show ${rem} more schools ↓`;
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
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link copied to clipboard!'));
  } else {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = url; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('🔗 Link copied!');
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
