/* Two-step finder. Grade eligibility and interests use sourced facts. */
const QUIZ = [
  { id: 'grade', qKey: 'q1', hintKey: 'q1hint', multi: false, opts:
    ['K', ...Array.from({ length: 12 }, (_, index) => String(index + 1))].map(grade => ({ v: grade })) },
  { id: 'interest', qKey: 'q2', hintKey: 'q2hint', multi: true, opts: [
    { v: 'science', i: '🔬', lKey: 'q2optScience', sKey: 'q2subScience' },
    { v: 'tech', i: '💻', lKey: 'q2optTech', sKey: 'q2subTech' },
    { v: 'medical', i: '🏥', lKey: 'q2optMedical', sKey: 'q2subMedical' },
    { v: 'engineer', i: '⚙️', lKey: 'q2optEngineer', sKey: 'q2subEngineer' },
    { v: 'arts', i: '🎨', lKey: 'q2optArts', sKey: 'q2subArts' },
    { v: 'any', i: '🌟', lKey: 'q2optAny', sKey: 'q2subAny' },
  ] },
];
const INT_LABEL_KEYS = { science: 'intScience', tech: 'intTech', medical: 'intMedical', engineer: 'intEngineer', arts: 'intArts', any: 'intAny' };
const GRADE_LABEL_KEYS = { elem: 'gradeElem', mid: 'gradeMid', high: 'gradeHigh' };
let qStep = 0;
let qAns = { interest: [] };
let allResults = [];

function startQuiz() {
  qStep = 0; qAns = { interest: [] };
  hide('hero-section'); hide('results-panel'); hide('browse-section');
  document.getElementById('results-panel').classList.remove('active');
  document.getElementById('quiz-panel').classList.add('active');
  show('quiz-panel');
  renderStep(); scrollTop();
}
function renderStep() {
  const step = QUIZ[qStep];
  const percent = Math.round((qStep + 1) / QUIZ.length * 100);
  document.getElementById('qpf').style.width = percent + '%';
  document.getElementById('quiz-progress-bar').setAttribute('aria-valuenow', String(percent));
  document.getElementById('step-label').textContent = t('stepOf', { n: qStep + 1, total: QUIZ.length });
  document.getElementById('step-pct').textContent = percent + '%';
  document.getElementById('btn-back').style.visibility = qStep === 0 ? 'hidden' : 'visible';
  document.getElementById('btn-back').textContent = t('back');
  const nextLabel = t(qStep === QUIZ.length - 1 ? 'seeMatches' : 'next');
  document.getElementById('btn-next').textContent = nextLabel;
  document.getElementById('btn-next').setAttribute('aria-label', nextLabel);
  const current = step.multi ? (qAns.interest || []) : [qAns[step.id]];
  document.getElementById('quiz-body').innerHTML = '<h2 tabindex="-1">' + escapeHtml(t(step.qKey)) + '</h2><p class="quiz-hint">' +
    escapeHtml(t(step.hintKey)) + '</p><div class="option-grid ' + (step.id === 'grade' ? 'grade-options' : '') + '" role="group" aria-label="' +
    escapeHtml(t(step.qKey)) + '">' + step.opts.map(option => {
      const label = step.id === 'grade' ? (option.v === 'K' ? tx('gradeKindergarten', 'Kindergarten') : tx('gradeValue', 'Grade {grade}', { grade: option.v })) : t(option.lKey);
      return '<button type="button" class="opt ' + (current.includes(option.v) ? 'selected' : '') + '" aria-pressed="' +
        current.includes(option.v) + '" data-v="' + escapeHtml(option.v) + '" data-quiz-field="' + step.id + '">' +
        (option.i ? '<span class="opt-icon" aria-hidden="true">' + option.i + '</span>' : '') +
        '<span class="opt-label">' + escapeHtml(label) + '</span>' +
        (option.sKey ? '<span class="opt-sub">' + escapeHtml(t(option.sKey)) + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  updateNext();
}
function pick(id, value, multi) {
  const step = QUIZ[qStep];
  if (!step || id !== step.id || !step.opts.some(option => option.v === value)) return;
  if (multi) {
    if (value === 'any') qAns.interest = qAns.interest.includes('any') ? [] : ['any'];
    else {
      qAns.interest = qAns.interest.filter(interest => interest !== 'any');
      if (qAns.interest.includes(value)) qAns.interest = qAns.interest.filter(interest => interest !== value);
      else qAns.interest.push(value);
    }
  } else qAns[id] = value;
  /* Preserve native-button focus when a selection rebuilds the options. */
  renderStep();
  document.querySelector('.opt[data-v="' + value + '"]')?.focus();
}
function updateNext() {
  const step = QUIZ[qStep];
  document.getElementById('btn-next').disabled = step.multi ? !qAns.interest.length : !qAns[step.id];
}
function quizNext() {
  if (document.getElementById('btn-next').disabled) return;
  if (qStep < QUIZ.length - 1) { qStep++; renderStep(); document.querySelector('#quiz-body h2')?.focus(); }
  else showResults();
}
function quizBack() { if (qStep > 0) { qStep--; renderStep(); document.querySelector('#quiz-body h2')?.focus(); } }
function editInterests() {
  qStep = 1;
  hide('results-panel'); hide('browse-section');
  document.getElementById('results-panel').classList.remove('active');
  document.getElementById('quiz-panel').classList.add('active');
  show('quiz-panel'); renderStep(); scrollTop();
}
function interestMatchesForName(name, interests) {
  return SchoolUtils.nameInterestMatches(name, interests);
}
function matchSchools(grade, interests) {
  return SchoolUtils.matchesForGrade(allSchools, grade, interests,
    typeof PROGRAM_EVIDENCE === 'undefined' ? [] : PROGRAM_EVIDENCE);
}
function whyBlurb(school) {
  const matching = SchoolUtils.interestMatch(school, qAns.interest,
    typeof PROGRAM_EVIDENCE === 'undefined' ? [] : PROGRAM_EVIDENCE).verified;
  if (matching.length) return tx('whyVerifiedMatch', '{grades}. An official program source lists: {interests}. Confirm entry requirements with the school.',
    { grades: gradeLabel(school), interests: matching.map(interestLabel).join(', ') });
  return tx('whyGradeMatch', '{grades}. Check the official school page for program and application details.', { grades: gradeLabel(school) });
}
function resultsNoticeHtml() {
  const unknownCount = allSchools.filter(school => !SchoolUtils.gradeRange(school).known).length;
  const hasInterest = (qAns.interest || []).some(interest => interest !== 'any');
  return (hasInterest ? '<p class="results-notice">' + escapeHtml(tx('reviewedMatchesNotice',
    'Interest results use reviewed official program information. Other schools may also offer these interests; browse the full directory to explore them.')) + '</p>' : '') +
    (unknownCount ? '<p class="results-notice">' + escapeHtml(tx('unknownGradeNotice',
      '{n} schools have unconfirmed grade ranges and are excluded from grade matches. They remain in the full directory.', { n: unknownCount })) + '</p>' : '');
}
function showResults() {
  allResults = matchSchools(qAns.grade, qAns.interest || []);
  hide('hero-section'); hide('quiz-panel'); hide('browse-section');
  document.getElementById('quiz-panel').classList.remove('active');
  document.getElementById('results-panel').classList.add('active');
  show('results-panel');
  const grade = GRADE_LABEL_KEYS[qAns.grade] ? t(GRADE_LABEL_KEYS[qAns.grade]) :
    qAns.grade === 'K' ? tx('gradeKindergarten', 'Kindergarten') : tx('gradeValue', 'Grade {grade}', { grade: qAns.grade });
  const interests = (qAns.interest || []).map(interest => INT_LABEL_KEYS[interest] ? t(INT_LABEL_KEYS[interest]) : interest).join(' · ');
  document.getElementById('results-sub').textContent = t('resultsFor', { grade, interests });
  document.getElementById('match-pill').textContent = t('schoolsFound', { n: allResults.length });
  renderResultCards(allResults.slice(0, 5), true, 0);
  updateShowMore();
  scrollTop();
  pushResultsURL();
}
function resultCardHtml(school, index) {
  return '<article class="rcard" role="listitem" data-school="' + escapeHtml(school.name) + '"><div class="rcard-inner">' +
    '<div class="rcard-num" aria-hidden="true">' + (index + 1) + '</div><div class="rcard-body"><h3 class="rcard-name">' +
    escapeHtml(school.name) + '</h3><div class="rcard-meta"><span class="meta-item meta-grade">' + escapeHtml(gradeLabel(school)) +
    '</span></div><p class="rcard-why">' + escapeHtml(whyBlurb(school)) + '</p>' + schoolDetailsHtml(school) +
    '<div class="rcard-actions">' + schoolLocationHtml(school, 'btn-map') + schoolActionButtons(school) +
    '</div></div></div></article>';
}
function renderResultCards(schools, replace, offset) {
  const html = !schools.length && replace ? '<div class="no-results"><p>' + escapeHtml(t('noMatches')) +
    '</p><button class="btn-primary" data-action="edit-interests">' + escapeHtml(t('changeInterests')) + '</button></div>' :
    schools.map((school, index) => resultCardHtml(school, (offset || 0) + index)).join('');
  const element = document.getElementById('results-list');
  if (replace) element.innerHTML = resultsNoticeHtml() + html;
  else element.insertAdjacentHTML('beforeend', html);
}
function updateShowMore() {
  const remaining = allResults.length - document.querySelectorAll('#results-list .rcard').length;
  document.getElementById('see-more-wrap').style.display = remaining > 0 ? '' : 'none';
  if (remaining > 0) document.getElementById('see-more-btn').textContent = t('showMore', { n: remaining });
}
function showMore() {
  const shown = document.querySelectorAll('#results-list .rcard').length;
  renderResultCards(allResults.slice(shown, shown + 10), false, shown);
  updateShowMore();
}
function pushResultsURL() {
  const interests = (qAns.interest || []).join(',') || 'any';
  history.replaceState(null, '', '#results/' + encodeURIComponent(qAns.grade || 'K') + '/' + interests + '/match');
}
function shareResults() { return copyLink(location.href, 'linkCopied'); }
function loadFromURL() {
  if (!location.hash.startsWith('#results/')) return false;
  const parts = location.hash.slice('#results/'.length).split('/');
  if (parts.length < 2) return false;
  let grade;
  try { grade = decodeURIComponent(parts[0]); } catch { return false; }
  const validGrade = ['K', ...Array.from({ length: 12 }, (_, index) => String(index + 1)), 'elem', 'mid', 'high'].includes(grade);
  const interests = parts[1].split(',').filter(value => Object.hasOwn(INT_LABEL_KEYS, value));
  if (!validGrade || !interests.length) return false;
  qAns = { grade, interest: interests.includes('any') ? ['any'] : [...new Set(interests)] };
  return true;
}
function initFromURL() { if (loadFromURL()) { showResults(); return true; } return false; }

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', event => {
    const option = event.target.closest('[data-quiz-field]');
    if (option) pick(option.dataset.quizField, option.dataset.v, QUIZ[qStep].multi);
    if (event.target.closest('[data-action="edit-interests"]')) editInterests();
  });
});
