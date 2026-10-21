/* Browser rendering uses the same canonical facts and pure date helpers as AI. */
const APPLICATION_CYCLE = APPLICATION_GUIDANCE_DATA;
function applicationStatusKey(today) {
  return ({ upcoming: 'guideUpcoming', on_time: 'guideOpen', between_windows: 'guideClosed', late_started: 'guideLate', needs_review: 'guideVerify' })[
    ApplicationGuidanceUtils.statusForDate(today, APPLICATION_CYCLE)
  ];
}
function applicationGuideView(now = new Date()) {
  return ApplicationGuidanceUtils.localizedView(APPLICATION_CYCLE, { language: typeof LANG !== 'undefined' && LANG === 'es' ? 'es' : 'en', now });
}
function applicationCheckedLabel(language = 'en') {
  const date = ApplicationGuidanceUtils.formatDate(APPLICATION_CYCLE.checkedAt, language);
  return language === 'es' ? `Fechas consultadas el ${date}.` : `Dates checked ${date}.`;
}
function applicationYearLabel(language = 'en') {
  return language === 'es' ? `Año escolar ${APPLICATION_CYCLE.schoolYear}` : `${APPLICATION_CYCLE.schoolYear} school year`;
}
function applicationDatesSummaryHtml(now = new Date()) {
  const language = typeof LANG !== 'undefined' && LANG === 'es' ? 'es' : 'en';
  const view = applicationGuideView(now);
  return `${escapeHtml(applicationYearLabel(language))}: ${escapeHtml(view.datesSummary || view.statusMessage)}<br>` +
    `<a href="${escapeHtml(view.sources[0].url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(view.sources[0].title)}</a> · ${escapeHtml(applicationCheckedLabel(language))}`;
}
function renderApplicationGuide(now = new Date()) {
  const section = document.getElementById('application-guide');
  if (!section) return;
  const language = typeof LANG !== 'undefined' && LANG === 'es' ? 'es' : 'en';
  const view = applicationGuideView(now);
  let checked = [];
  try { checked = JSON.parse(localStorage.getItem(APPLICATION_CYCLE.checklistStorageKey) || '[]'); } catch {}
  if (!Array.isArray(checked)) checked = [];
  const source = view.sources[0];
  section.innerHTML = `<div class="guide-heading"><p class="section-eyebrow">${escapeHtml(applicationYearLabel(language))}</p>
    <h2 id="application-guide-title">${escapeHtml(t('guideTitle'))}</h2><p>${escapeHtml(t('guideIntro'))}</p></div>
    <div class="guide-grid"><div class="guide-dates"><p class="application-status">${escapeHtml(view.statusMessage)}</p>
      ${view.datesSummary ? `<p>${escapeHtml(view.datesSummary)}</p>` : ''}
      <p class="source-note"><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a><br>${escapeHtml(applicationCheckedLabel(language))}</p>
      <a class="btn-primary guide-apply" href="${escapeHtml(view.applyUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('guideApply'))}</a>
    </div><fieldset class="application-checklist"><legend>${escapeHtml(t('guideChecklistLabel'))}</legend>
      ${APPLICATION_CYCLE.checklist.map(item => `<label><input type="checkbox" data-checklist-step="${item.id}" ${checked.includes(item.id) ? 'checked' : ''}><span>${escapeHtml(language === 'es' ? item.textEs : item.text)}</span></label>`).join('')}
      <p class="source-note">${escapeHtml(t('guideLocal'))}</p></fieldset></div>`;
  section.querySelectorAll('[data-checklist-step]').forEach(input => input.addEventListener('change', () => {
    const selected = [...section.querySelectorAll('[data-checklist-step]:checked')].map(element => Number(element.dataset.checklistStep));
    try { localStorage.setItem(APPLICATION_CYCLE.checklistStorageKey, JSON.stringify(selected)); } catch {}
  }));
}
function scrollToApplicationGuide() {
  document.getElementById('application-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
