/* Official application dates are year-specific and reviewed separately from school data. */
const APPLICATION_CYCLE = Object.freeze({
  schoolYear: '2027–28', opens: '2026-10-01', closes: '2026-11-06', lateOpens: '2026-12-01',
  checkedAt: '2026-10-21', reviewBy: '2027-01-01',
  sourceUrl: 'https://www.lausd.org/apps/pages/index.jsp?uREC_ID=4432585&type=d&pREC_ID=2724498',
  applyUrl: 'https://apply.lausd.net'
});
function applicationStatusKey(today) {
  if (today >= APPLICATION_CYCLE.reviewBy) return 'guideVerify';
  if (today < APPLICATION_CYCLE.opens) return 'guideUpcoming';
  if (today <= APPLICATION_CYCLE.closes) return 'guideOpen';
  if (today < APPLICATION_CYCLE.lateOpens) return 'guideClosed';
  return 'guideLate';
}
function applicationDatesSummaryHtml() {
  return `${escapeHtml(t('guideEyebrow'))}: ${escapeHtml(t('guideDates'))}<br>` +
    `<a href="${APPLICATION_CYCLE.sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('guideSource'))}</a> · ${escapeHtml(t('guideChecked'))}`;
}
function renderApplicationGuide() {
  const section = document.getElementById('application-guide');
  if (!section) return;
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  let checked=[];
  try { checked=JSON.parse(localStorage.getItem('stem_checklist_2027_28') || '[]'); } catch {}
  if (!Array.isArray(checked)) checked=[];
  section.innerHTML = `<div class="guide-heading"><p class="section-eyebrow">${escapeHtml(t('guideEyebrow'))}</p>
    <h2 id="application-guide-title">${escapeHtml(t('guideTitle'))}</h2><p>${escapeHtml(t('guideIntro'))}</p></div>
    <div class="guide-grid"><div class="guide-dates"><p class="application-status">${escapeHtml(t(applicationStatusKey(today)))}</p>
      <p>${escapeHtml(t('guideDates'))}</p>
      <p class="source-note"><a href="${APPLICATION_CYCLE.sourceUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('guideSource'))}</a><br>${escapeHtml(t('guideChecked'))}</p>
      <a class="btn-primary guide-apply" href="${APPLICATION_CYCLE.applyUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('guideApply'))}</a>
    </div><fieldset class="application-checklist"><legend>${escapeHtml(t('guideChecklistLabel'))}</legend>
      ${[1,2,3,4].map(i=>`<label><input type="checkbox" data-checklist-step="${i}" ${checked.includes(i)?'checked':''}><span>${escapeHtml(t('guideCheck'+i))}</span></label>`).join('')}
      <p class="source-note">${escapeHtml(t('guideLocal'))}</p></fieldset></div>`;
  section.querySelectorAll('[data-checklist-step]').forEach(input=>input.addEventListener('change',()=>{
    const selected=[...section.querySelectorAll('[data-checklist-step]:checked')].map(el=>Number(el.dataset.checklistStep));
    try { localStorage.setItem('stem_checklist_2027_28',JSON.stringify(selected)); } catch {}
  }));
}
function scrollToApplicationGuide() {
  document.getElementById('application-guide')?.scrollIntoView({behavior:'smooth',block:'start'});
}
