/* Canonical application facts and project preparation guidance.
 * Calendar rechecked 2026-10-21 on the official LAUSD enrollment calendar.
 * Only calendar dates are verified, not deadline hours, late closing dates,
 * available seats, admission decisions, or submission status.
 */
function freezeApplicationData(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeApplicationData);
    Object.freeze(value);
  }
  return value;
}
const APPLICATION_GUIDANCE_DATA = freezeApplicationData({
  schemaVersion: 1, cycleId: 'choices-2027-28', schoolYear: '2027–28',
  timeZone: 'America/Los_Angeles', dateGranularity: 'calendar_day',
  opens: '2026-10-01', closes: '2026-11-06', lateOpens: '2026-12-01',
  deadlineTime: null, lateCloses: null,
  checkedAt: '2026-10-21', reviewBy: '2027-01-01',
  sourceId: 'application:choices:2027-28',
  sourceUrl: 'https://www.lausd.org/apps/pages/index.jsp?uREC_ID=4432585&type=d&pREC_ID=2724498',
  sourceTitle: 'LAUSD enrollment calendar', sourceTitleEs: 'Calendario de inscripción de LAUSD',
  applyUrl: 'https://apply.lausd.net', applySourceId: 'application:portal:choices-2027-28',
  applySourceTitle: 'Official LAUSD application portal', applySourceTitleEs: 'Portal oficial de solicitudes de LAUSD',
  checklistStorageKey: 'stem_checklist_2027_28',
  checklist: [
    { id: 1, key: 'program_requirements', text: 'Confirm the program’s entry grade and admission requirements.', textEs: 'Confirmar el grado de ingreso y los requisitos del programa.' },
    { id: 2, key: 'school_questions', text: 'Ask the school about the program, a visit, and transportation.', textEs: 'Preguntar a la escuela sobre el programa, las visitas y el transporte.' },
    { id: 3, key: 'official_application', text: 'Complete and submit the application in LAUSD’s official portal.', textEs: 'Completar y enviar la solicitud en el portal oficial de LAUSD.' },
    { id: 4, key: 'confirmation', text: 'Save LAUSD’s confirmation and check portal messages for next steps.', textEs: 'Guardar la confirmación de LAUSD y revisar los mensajes del portal.' }
  ],
  eligibility: [
    { key: 'confirm_program', text: 'Confirm each program’s entry grade and any admission or assessment requirements with the school.', textEs: 'Confirme con la escuela el grado de ingreso y cualquier requisito de admisión o evaluación de cada programa.' },
    { key: 'calendar_scope', text: 'The application calendar does not establish a student’s eligibility, available seats, or admission.', textEs: 'El calendario de solicitudes no determina la elegibilidad del estudiante, las plazas disponibles ni la admisión.' }
  ],
  limitations: [
    { key: 'published_dates', text: 'These are published calendar dates, not a live check of the portal or seat availability.', textEs: 'Estas son fechas publicadas en el calendario, no una consulta en vivo del portal ni de las plazas disponibles.' },
    { key: 'deadline_time', text: 'The reviewed calendar does not specify a deadline time or a closing date for late applications. Confirm these details with LAUSD.', textEs: 'El calendario consultado no especifica la hora límite ni una fecha de cierre para las solicitudes tardías. Confirme esos detalles con LAUSD.' },
    { key: 'no_submission', text: 'Checklist marks and this chat do not submit an application or confirm admission.', textEs: 'Las marcas de la lista y este chat no envían una solicitud ni confirman la admisión.' }
  ]
});

const ApplicationGuidanceUtils = (() => {
  const locale = language => language === 'es' ? 'es-US' : 'en-US';
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }
  function localDate(now = new Date(), cycle = APPLICATION_GUIDANCE_DATA) {
    const instant = new Date(now);
    if (Number.isNaN(instant.valueOf())) throw new RangeError('A valid application guidance date is required.');
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: cycle.timeZone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(instant);
    const part = name => parts.find(value => value.type === name).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function statusForDate(today, cycle = APPLICATION_GUIDANCE_DATA) {
    if (!validDate(today) || !validDate(cycle.reviewBy) || today >= cycle.reviewBy) return 'needs_review';
    if (today < cycle.opens) return 'upcoming';
    if (today <= cycle.closes) return 'on_time';
    if (today < cycle.lateOpens) return 'between_windows';
    return 'late_started';
  }
  function formatDate(date, language = 'en', includeYear = true) {
    if (!validDate(date)) throw new RangeError('A valid calendar date is required.');
    return new Intl.DateTimeFormat(locale(language), {
      timeZone: 'UTC', month: 'long', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {})
    }).format(new Date(`${date}T12:00:00Z`));
  }
  function windowSummary(cycle, language = 'en') {
    const sameYear = cycle.opens.slice(0, 4) === cycle.closes.slice(0, 4);
    const start = formatDate(cycle.opens, language, !sameYear);
    const end = formatDate(cycle.closes, language);
    const late = formatDate(cycle.lateOpens, language);
    return language === 'es'
      ? `A tiempo: del ${start} al ${end}. Las solicitudes tardías abren el ${late}.`
      : `On-time: ${start}–${end}. Late applications open ${late}.`;
  }
  function statusMessage(status, cycle = APPLICATION_GUIDANCE_DATA, language = 'en', today) {
    if (status === 'on_time' && today === cycle.closes) return language === 'es'
      ? 'La fecha límite publicada de solicitudes a tiempo es hoy. Confirme con LAUSD la hora exacta de cierre y el estado del portal.'
      : 'The published on-time deadline is today. Confirm the exact cutoff time and portal status with LAUSD.';
    if (language === 'es') return ({
      upcoming: `Las solicitudes a tiempo abren el ${formatDate(cycle.opens, language)}.`,
      on_time: 'El calendario indica que estamos en el plazo de solicitudes a tiempo. Confirme la hora límite con LAUSD.',
      between_windows: 'El plazo publicado de solicitudes a tiempo ha terminado.',
      late_started: `La fecha publicada de apertura de solicitudes tardías fue el ${formatDate(cycle.lateOpens, language)}; confirme la disponibilidad con LAUSD.`,
      needs_review: 'Estas fechas necesitan una nueva revisión. Confirme las fechas actuales con LAUSD.'
    })[status];
    return ({
      upcoming: `On-time applications open ${formatDate(cycle.opens, language)}.`,
      on_time: 'The calendar indicates the on-time application window. Confirm the deadline time with LAUSD.',
      between_windows: 'The published on-time application window has closed.',
      late_started: `The published late-application opening date was ${formatDate(cycle.lateOpens, language)}; confirm availability with LAUSD.`,
      needs_review: 'These dates need a fresh review. Check the current application dates with LAUSD.'
    })[status];
  }
  function localizedView(cycle, { language = 'en', topic = 'all', now = new Date() } = {}) {
    if (!['all', 'dates', 'eligibility', 'checklist'].includes(topic)) throw new RangeError('Unknown application guidance topic.');
    const selectedLanguage = language === 'es' ? 'es' : 'en';
    const asOfLocalDate = localDate(now, cycle);
    const status = statusForDate(asOfLocalDate, cycle);
    const text = item => selectedLanguage === 'es' ? item.textEs : item.text;
    const includeDates = (topic === 'all' || topic === 'dates') && status !== 'needs_review';
    const view = {
      cycleId: cycle.cycleId, schoolYear: cycle.schoolYear, timeZone: cycle.timeZone,
      asOfLocalDate, status, topic, checkedAt: cycle.checkedAt, reviewBy: cycle.reviewBy,
      dateGranularity: cycle.dateGranularity, deadlineTime: null, lateCloses: null,
      statusMessage: statusMessage(status, cycle, selectedLanguage, asOfLocalDate),
      dates: includeDates ? { opens: cycle.opens, closes: cycle.closes, lateOpens: cycle.lateOpens } : null,
      datesSummary: includeDates ? windowSummary(cycle, selectedLanguage) : null,
      checklist: topic === 'all' || topic === 'checklist' ? cycle.checklist.map(item => ({ id: item.key, text: text(item) })) : [],
      eligibility: topic === 'all' || topic === 'eligibility' ? cycle.eligibility.map(item => ({ id: item.key, text: text(item) })) : [],
      limitations: cycle.limitations.map(text),
      sources: [
        { id: cycle.sourceId, url: cycle.sourceUrl, title: selectedLanguage === 'es' ? cycle.sourceTitleEs : cycle.sourceTitle, checkedAt: cycle.checkedAt },
        { id: cycle.applySourceId, url: cycle.applyUrl, title: selectedLanguage === 'es' ? cycle.applySourceTitleEs : cycle.applySourceTitle, checkedAt: cycle.checkedAt }
      ],
      applyUrl: cycle.applyUrl
    };
    const lines = [selectedLanguage === 'es' ? `Año escolar ${cycle.schoolYear}. ${view.statusMessage}` : `${cycle.schoolYear} school year. ${view.statusMessage}`];
    if (view.datesSummary) lines.push(view.datesSummary);
    if (view.checklist.length) lines.push((selectedLanguage === 'es' ? 'Lista de preparación de STEM Pathfinder:' : 'STEM Pathfinder preparation checklist:') + '\n' + view.checklist.map((item, index) => `${index + 1}. ${item.text}`).join('\n'));
    if (view.eligibility.length) lines.push(view.eligibility.map(item => item.text).join('\n'));
    lines.push(view.limitations.join('\n'));
    lines.push(selectedLanguage === 'es' ? `Fechas consultadas el ${formatDate(cycle.checkedAt, selectedLanguage)}.` : `Dates checked ${formatDate(cycle.checkedAt, selectedLanguage)}.`);
    view.summary = lines.join('\n\n');
    return view;
  }
  return Object.freeze({ localDate, statusForDate, formatDate, windowSummary, statusMessage, localizedView });
})();

// Pure shared logic, without DOM, storage access, network requests or evaluation.
// Server consumers pass the generated APPLICATION_GUIDANCE record to the helpers.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APPLICATION_GUIDANCE_DATA, ApplicationGuidanceUtils };
}
