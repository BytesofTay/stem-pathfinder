/* =========================================
   Internationalization — English / Español
   ========================================= */

const I18N = {
  en: {
    /* Appbar */
    home: '🏠 Home',
    browseAll: 'Browse all schools',
    cachedData: 'Using cached data',
    sourceSnapshotKnown: 'Directory snapshot: {date}.',
    sourceSnapshotUnknown: 'Directory snapshot date is not recorded.',

    /* Hero */
    heroEyebrow: 'A free tool from The STEM in Me',
    heroTitle: 'Find the right <em>STEM school</em><br>for your child',
    heroSub: "Answer 3 quick questions to explore LAUSD magnet programs that may fit your child's grade and interests.",
    getStarted: 'Get Started →',
    heroAlt: 'Already know what you want?',
    heroAltLink: 'Browse all 180 schools ↓',

    /* Quiz */
    stepOf: 'Step {n} of {total}',
    back: '← Back',
    next: 'Next →',
    seeMatches: 'See my matches ✓',
    q1: 'What grade is your child in?',
    q1hint: "We'll show schools they can still apply to.",
    q1optElem: 'Elementary', q1subElem: 'Grades K – 5',
    q1optMid: 'Middle School', q1subMid: 'Grades 6 – 8',
    q1optHigh: 'High School', q1subHigh: 'Grades 9 – 12',
    q2: 'What is your child most excited about?',
    q2hint: 'Pick as many as you like.',
    q2optScience: 'Science & Nature', q2subScience: 'Biology, environment, earth science',
    q2optTech: 'Computers & Technology', q2subTech: 'Coding, robotics, digital media',
    q2optMedical: 'Medicine & Health', q2subMedical: 'Biotech, pre-med, health sciences',
    q2optEngineer: 'Engineering & Building', q2subEngineer: 'Aerospace, architecture, math',
    q2optArts: 'Art + STEM', q2subArts: 'Design, film, creative technology',
    q2optAny: 'Not sure yet', q2subAny: 'Show me programs across STEM interests',
    q3: 'What matters most to you?',
    q3hint: "We'll use this to rank your matches.",
    q3optQuality: 'Program focus', q3subQuality: 'Sort by an experimental program estimate',
    q3optAccess: 'Listed grade range', q3subAccess: 'Sort by an estimate based on listed grades',
    q3optEquity: 'Community context', q3subEquity: 'Sort by an experimental demographic estimate',

    /* Results */
    topMatches: '🎯 Your top matches',
    resultsFor: 'For a {grade} interested in {interests}',
    schoolsFound: '{n} schools found',
    shareResults: '📤 Share results',
    showMore: 'Show {n} more schools ↓',
    startOver: '↺ Start over',
    browseAllArrow: 'Browse all 180 schools →',
    applyNow: 'Apply Now →',
    noMatches: 'No schools matched. Try different interests or start over.',
    linkCopied: '🔗 Link copied to clipboard!',
    gradeElem: 'elementary schooler', gradeMid: 'middle schooler', gradeHigh: 'high schooler',
    intScience: 'Science & Nature', intTech: 'Computers & Technology', intMedical: 'Medicine & Health',
    intEngineer: 'Engineering & Building', intArts: 'Art + STEM', intAny: 'All STEM programs',

    /* Why blurbs */
    whyProgram: '{icon} <strong>{prog} program</strong> — listed as serving {grades}. Confirm current details with the school.',
    whySolid: '🎓 Listed as serving {grades}. Experimental comparison estimate: {score}/10; not a verified quality rating.',

    /* Browse */
    browseSchools: 'Browse schools',
    showStats: '▸ Show district averages',
    hideStats: '▾ Hide district averages',
    avgQuality: 'Avg Quality', avgAccess: 'Avg Access', avgEquity: 'Avg Equity', avgOverall: 'Avg Overall',
    statQualitySub: 'Program rigor', statAccessSub: 'Enrollment reach', statEquitySub: 'Underserved pop.', statOverallSub: 'Combined',
    tabList: '📋 List', tabMap: '🗺️ Map', tabSaved: '❤️ Saved',
    search: 'Search', grade: 'Grade', sort: 'Sort',
    searchPlaceholder: 'School name or address…',
    allGrades: 'All grades',
    gradeK: 'K – Elementary', grade1: 'Grade 1', grade4: 'Grade 4',
    grade6: 'Grade 6 – Middle', grade7: 'Grade 7', grade9: 'Grade 9 – High School',
    sortName: 'Name A–Z', sortOverall: 'Overall ↓', sortQuality: 'Quality ↓', sortAccess: 'Access ↓', sortEquity: 'Equity ↓',
    clear: '✕ Clear',
    scoreGuide: 'ⓘ Score guide',
    showingAll: 'Showing all {n} magnet schools',
    showingSome: '{n} of {total} schools',
    noFilterResults: 'No schools match your filters.',
    clearFilters: '✕ Clear filters',
    notScored: 'Not yet scored',
    topRated: '⭐ Top Rated', highEquity: '🏅 High Equity',
    gradesLabel: 'Grades {low}–{high}',
    quality: 'Quality', access: 'Access', equity: 'Equity',

    /* Saved */
    noSaved: 'No saved schools yet',
    noSavedHint: 'Tap the heart icon on any school to save it here for easy comparison later.',
    savedToast: '❤️ Saved! Find it in the Saved tab.',
    removedToast: 'Removed from saved schools',

    /* Map */
    mapScore: 'Score', mapHigh: '8–10 High', mapMid: '5–7 Mid', mapLow: '1–4 Low',
    mapOverall: 'Overall', directions: '📍 Directions',

    /* Modal */
    modalTitle: '📊 How schools are scored',
    modalQuality: 'Quality (1–10)',
    modalQualityTxt: 'Experimental estimate based on available school-directory fields. It is not a verified measure of program quality.',
    modalAccess: 'Access (1–10)',
    modalAccessTxt: 'Experimental estimate based on listed grade ranges. Confirm eligibility and application details with the school.',
    modalEquity: 'Equity (1–10)',
    modalEquityTxt: 'Experimental estimate only. It does not measure inclusion, student support, or school-level equity outcomes.',
    gotIt: 'Got it',

    /* Chat */
    chatFab: 'Help',
    chatName: 'School Helper',
    chatStatus: 'Here to help LAUSD families',
    chatPlaceholder: 'Ask me anything…',
    chatWelcome: `Hi! 👋 I'm here to help you find the right STEM magnet school for your child.\n\nYou can ask me things like:<br>• "Find STEM schools for a 7th grader"<br>• "What are the top medical programs?"<br>• "How do I apply?"`,
    qrFind: '🔍 Find my school', qrApply: '📋 How to apply', qrScores: '❓ What do scores mean', qrBrowse: '🏫 Browse all schools',

    /* About / Footer */
    aboutTitle: 'About The STEM in Me',
    aboutP1: 'The LAUSD magnet lottery is one of the best paths into strong STEM programs for kids in Los Angeles — but the system is confusing, the deadlines are strict, and the families who would benefit most often have no one to help them navigate it.',
    aboutP2: '<strong>The STEM in Me</strong> exists to change that. <strong>STEM Pathfinder</strong>, our free finder tool, covers all 180 LAUSD magnet schools so any parent can search, compare, and find the right program for their child — no login, no cost, no catch. During application season (November–February) we also help families complete their applications in person.',
    aboutContact: '📧 Get in touch — workshops, volunteering, or questions',
    footerTagline: 'Helping LA kids find their path into STEM.',
    footerContact: 'Contact', footerApply: 'LAUSD Application', footerSource: 'CDE school data', footerScores: 'How scores work',
    footerDisclaimer: 'The STEM in Me is an independent community project and is not affiliated with or endorsed by the Los Angeles Unified School District. School directory data comes from the California Department of Education. Scores are experimental estimates, not verified ratings — always visit schools and verify details before applying.',
    footerCopy: '© 2026 The STEM in Me · Made with ❤️ in Los Angeles',
  },

  es: {
    /* Appbar */
    home: '🏠 Inicio',
    browseAll: 'Ver todas las escuelas',
    cachedData: 'Usando datos guardados',
    sourceSnapshotKnown: 'Copia del directorio: {date}.',
    sourceSnapshotUnknown: 'No se registró la fecha de la copia del directorio.',

    /* Hero */
    heroEyebrow: 'Una herramienta gratuita de The STEM in Me',
    heroTitle: 'Encuentre la <em>escuela STEM</em><br>ideal para su hijo',
    heroSub: 'Responda 3 preguntas para explorar programas magnet de LAUSD que podrían coincidir con el grado e intereses de su hijo.',
    getStarted: 'Comenzar →',
    heroAlt: '¿Ya sabe lo que busca?',
    heroAltLink: 'Ver las 180 escuelas ↓',

    /* Quiz */
    stepOf: 'Paso {n} de {total}',
    back: '← Atrás',
    next: 'Siguiente →',
    seeMatches: 'Ver resultados ✓',
    q1: '¿En qué grado está su hijo?',
    q1hint: 'Le mostraremos escuelas donde todavía puede aplicar.',
    q1optElem: 'Primaria', q1subElem: 'Grados K – 5',
    q1optMid: 'Secundaria', q1subMid: 'Grados 6 – 8',
    q1optHigh: 'Preparatoria', q1subHigh: 'Grados 9 – 12',
    q2: '¿Qué le emociona más a su hijo?',
    q2hint: 'Elija todas las que quiera.',
    q2optScience: 'Ciencia y Naturaleza', q2subScience: 'Biología, medio ambiente, ciencias de la tierra',
    q2optTech: 'Computadoras y Tecnología', q2subTech: 'Programación, robótica, medios digitales',
    q2optMedical: 'Medicina y Salud', q2subMedical: 'Biotecnología, pre-medicina, ciencias de la salud',
    q2optEngineer: 'Ingeniería y Construcción', q2subEngineer: 'Aeroespacial, arquitectura, matemáticas',
    q2optArts: 'Arte + STEM', q2subArts: 'Diseño, cine, tecnología creativa',
    q2optAny: 'Aún no sé', q2subAny: 'Muéstrame programas de distintas áreas STEM',
    q3: '¿Qué es lo más importante para usted?',
    q3hint: 'Lo usaremos para ordenar sus resultados.',
    q3optQuality: 'Enfoque del programa', q3subQuality: 'Ordenar por una estimación experimental del programa',
    q3optAccess: 'Grados publicados', q3subAccess: 'Ordenar según una estimación basada en los grados listados',
    q3optEquity: 'Contexto comunitario', q3subEquity: 'Ordenar por una estimación demográfica experimental',

    /* Results */
    topMatches: '🎯 Sus mejores opciones',
    resultsFor: 'Para un estudiante de {grade} interesado en {interests}',
    schoolsFound: '{n} escuelas encontradas',
    shareResults: '📤 Compartir resultados',
    showMore: 'Ver {n} escuelas más ↓',
    startOver: '↺ Empezar de nuevo',
    browseAllArrow: 'Ver las 180 escuelas →',
    applyNow: 'Aplicar Ahora →',
    noMatches: 'No se encontraron escuelas. Pruebe otros intereses o empiece de nuevo.',
    linkCopied: '🔗 ¡Enlace copiado!',
    gradeElem: 'primaria', gradeMid: 'secundaria', gradeHigh: 'preparatoria',
    intScience: 'Ciencia y Naturaleza', intTech: 'Computadoras y Tecnología', intMedical: 'Medicina y Salud',
    intEngineer: 'Ingeniería y Construcción', intArts: 'Arte + STEM', intAny: 'Todos los programas STEM',

    /* Why blurbs */
    whyProgram: '{icon} <strong>Programa de {prog}</strong> — figura para {grades}. Confirme los detalles actuales con la escuela.',
    whySolid: 'Figura para {grades}. Estimación experimental de comparación: {score}/10; no es una calificación de calidad verificada.',

    /* Browse */
    browseSchools: 'Explorar escuelas',
    showStats: '▸ Ver promedios del distrito',
    hideStats: '▾ Ocultar promedios del distrito',
    avgQuality: 'Calidad Prom.', avgAccess: 'Acceso Prom.', avgEquity: 'Equidad Prom.', avgOverall: 'General Prom.',
    statQualitySub: 'Rigor académico', statAccessSub: 'Alcance de inscripción', statEquitySub: 'Pob. menos favorecida', statOverallSub: 'Combinado',
    tabList: '📋 Lista', tabMap: '🗺️ Mapa', tabSaved: '❤️ Guardadas',
    search: 'Buscar', grade: 'Grado', sort: 'Ordenar',
    searchPlaceholder: 'Nombre de escuela o dirección…',
    allGrades: 'Todos los grados',
    gradeK: 'K – Primaria', grade1: 'Grado 1', grade4: 'Grado 4',
    grade6: 'Grado 6 – Secundaria', grade7: 'Grado 7', grade9: 'Grado 9 – Preparatoria',
    sortName: 'Nombre A–Z', sortOverall: 'General ↓', sortQuality: 'Calidad ↓', sortAccess: 'Acceso ↓', sortEquity: 'Equidad ↓',
    clear: '✕ Borrar',
    scoreGuide: 'ⓘ Guía de puntajes',
    showingAll: 'Mostrando las {n} escuelas magnet',
    showingSome: '{n} de {total} escuelas',
    noFilterResults: 'Ninguna escuela coincide con sus filtros.',
    clearFilters: '✕ Borrar filtros',
    notScored: 'Sin calificar aún',
    topRated: '⭐ Mejor Calificada', highEquity: '🏅 Alta Equidad',
    gradesLabel: 'Grados {low}–{high}',
    quality: 'Calidad', access: 'Acceso', equity: 'Equidad',

    /* Saved */
    noSaved: 'Aún no hay escuelas guardadas',
    noSavedHint: 'Toque el corazón en cualquier escuela para guardarla aquí y compararla después.',
    savedToast: '❤️ ¡Guardada! Encuéntrela en la pestaña Guardadas.',
    removedToast: 'Eliminada de escuelas guardadas',

    /* Map */
    mapScore: 'Puntaje', mapHigh: '8–10 Alto', mapMid: '5–7 Medio', mapLow: '1–4 Bajo',
    mapOverall: 'General', directions: '📍 Cómo llegar',

    /* Modal */
    modalTitle: '📊 Cómo se califican las escuelas',
    modalQuality: 'Calidad (1–10)',
    modalQualityTxt: 'Estimación experimental basada en campos disponibles del directorio escolar. No es una medida verificada de calidad.',
    modalAccess: 'Acceso (1–10)',
    modalAccessTxt: 'Estimación experimental basada en los grados publicados. Confirme la elegibilidad y los detalles de solicitud con la escuela.',
    modalEquity: 'Equidad (1–10)',
    modalEquityTxt: 'Solo es una estimación experimental. No mide inclusión, apoyo estudiantil ni resultados de equidad escolar.',
    gotIt: 'Entendido',

    /* Chat */
    chatFab: 'Ayuda',
    chatName: 'Asistente Escolar',
    chatStatus: 'Aquí para ayudar a las familias de LAUSD',
    chatPlaceholder: 'Pregúnteme lo que sea…',
    chatWelcome: `¡Hola! 👋 Estoy aquí para ayudarle a encontrar la escuela magnet STEM ideal para su hijo.\n\nPuede preguntarme cosas como:<br>• "Busca escuelas STEM para séptimo grado"<br>• "¿Cuáles son los mejores programas médicos?"<br>• "¿Cómo aplico?"`,
    qrFind: '🔍 Buscar mi escuela', qrApply: '📋 Cómo aplicar', qrScores: '❓ Qué significan los puntajes', qrBrowse: '🏫 Ver todas las escuelas',

    /* About / Footer */
    aboutTitle: 'Acerca de The STEM in Me',
    aboutP1: 'La lotería magnet de LAUSD es uno de los mejores caminos hacia programas STEM fuertes para los niños de Los Ángeles — pero el sistema es confuso, las fechas límite son estrictas, y las familias que más se beneficiarían muchas veces no tienen quién las ayude.',
    aboutP2: '<strong>The STEM in Me</strong> existe para cambiar eso. <strong>STEM Pathfinder</strong>, nuestra herramienta gratuita, cubre las 180 escuelas magnet de LAUSD para que cualquier padre pueda buscar, comparar y encontrar el programa ideal para su hijo — sin registro, sin costo, sin trucos. Durante la temporada de solicitudes (noviembre–febrero) también ayudamos a las familias a completar sus solicitudes en persona.',
    aboutContact: '📧 Contáctenos — talleres, voluntariado o preguntas',
    footerTagline: 'Ayudando a los niños de LA a encontrar su camino hacia STEM.',
    footerContact: 'Contacto', footerApply: 'Solicitud LAUSD', footerSource: 'Datos escolares del CDE', footerScores: 'Cómo funcionan los puntajes',
    footerDisclaimer: 'The STEM in Me es un proyecto comunitario independiente y no está afiliado ni respaldado por el Distrito Escolar Unificado de Los Ángeles. Los datos del directorio escolar provienen del Departamento de Educación de California. Los puntajes son estimaciones experimentales, no calificaciones verificadas — visite las escuelas y confirme los detalles antes de solicitar.',
    footerCopy: '© 2026 The STEM in Me · Hecho con ❤️ en Los Ángeles',
  }
};

let LANG = localStorage.getItem('stem_pathfinder_lang') || 'en';

function t(key, vars) {
  let s = (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('stem_pathfinder_lang', lang);
  document.documentElement.lang = lang;
  applyStaticI18n();
  refreshDynamicViews();
}

function toggleLang() { setLang(LANG === 'en' ? 'es' : 'en'); }

/* Re-translate every static element on the page. */
function applyStaticI18n() {
  const set = (sel, key, html = false) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (html) el.innerHTML = t(key); else el.textContent = t(key);
  };

  // Language toggle shows the language you'd switch TO
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = LANG === 'en' ? '🌐 Español' : '🌐 English';

  set('.home-btn', 'home');
  set('#offline-pill', 'cachedData');
  set('.nav-btn', 'browseAll');

  set('.hero-eyebrow', 'heroEyebrow');
  set('.hero h1', 'heroTitle', true);
  set('.hero-sub', 'heroSub');
  set('.btn-start', 'getStarted');
  const heroAlt = document.querySelector('.hero-alt');
  if (heroAlt) heroAlt.innerHTML =
    `${t('heroAlt')} <a onclick="scrollToBrowse()" role="button" tabindex="0" onkeydown="if(event.key==='Enter')scrollToBrowse()">${t('heroAltLink')}</a>`;

  set('#btn-back', 'back');

  set('.results-header h2', 'topMatches');
  set('.btn-share', 'shareResults');
  set('.btn-restart', 'startOver');
  set('.results-footer .link-btn', 'browseAllArrow');

  set('.section-divider span', 'browseSchools');
  set('#stats-toggle-btn', statsOpen ? 'hideStats' : 'showStats');
  set('#stat-quality .stat-label', 'avgQuality');
  set('#stat-access .stat-label', 'avgAccess');
  set('#stat-equity .stat-label', 'avgEquity');
  set('#stat-overall .stat-label', 'avgOverall');
  set('#stat-quality .stat-sub', 'statQualitySub');
  set('#stat-access .stat-sub', 'statAccessSub');
  set('#stat-equity .stat-sub', 'statEquitySub');
  set('#stat-overall .stat-sub', 'statOverallSub');

  const tabSavedBadge = document.getElementById('fav-badge')?.outerHTML || '';
  set('#tab-list', 'tabList'); set('#tab-map', 'tabMap');
  const tabSaved = document.getElementById('tab-saved');
  if (tabSaved) { tabSaved.innerHTML = `${t('tabSaved')} ${tabSavedBadge}`; updateFavBadge(); }

  const lbls = document.querySelectorAll('.filter-bar .filter-lbl');
  if (lbls.length >= 3) { lbls[0].textContent = t('search'); lbls[1].textContent = t('grade'); lbls[2].textContent = t('sort'); }
  const searchEl = document.getElementById('search');
  if (searchEl) searchEl.placeholder = t('searchPlaceholder');
  const gradeSel = document.getElementById('grade-filter');
  if (gradeSel) {
    const keys = ['allGrades','gradeK','grade1','grade4','grade6','grade7','grade9'];
    [...gradeSel.options].forEach((o, i) => { if (keys[i]) o.textContent = t(keys[i]); });
  }
  const sortSel = document.getElementById('sort');
  if (sortSel) {
    const keys = ['sortName','sortOverall','sortQuality','sortAccess','sortEquity'];
    [...sortSel.options].forEach((o, i) => { if (keys[i]) o.textContent = t(keys[i]); });
  }
  const clearBtn = document.getElementById('clear-btn');
  if (clearBtn) clearBtn.innerHTML = `${t('clear')} <span class="fc-badge" id="fc-badge"></span>`;
  set('.info-btn', 'scoreGuide');

  set('#modal-title', 'modalTitle');
  const modalRows = document.querySelectorAll('.modal-row');
  const modalKeys = [['modalQuality','modalQualityTxt'],['modalAccess','modalAccessTxt'],['modalEquity','modalEquityTxt']];
  modalRows.forEach((row, i) => {
    if (!modalKeys[i]) return;
    const s = row.querySelector('strong'), sp = row.querySelector('span');
    if (s) s.textContent = t(modalKeys[i][0]);
    if (sp) sp.textContent = t(modalKeys[i][1]);
  });
  set('.modal-close', 'gotIt');

  const fab = document.getElementById('chat-fab');
  if (fab) fab.innerHTML = `<span aria-hidden="true">💬</span> ${t('chatFab')} <span class="fab-dot" aria-hidden="true"></span>`;
  set('.chat-header-name', 'chatName');
  set('.chat-header-status', 'chatStatus');
  const chatInput = document.getElementById('chat-input');
  if (chatInput) chatInput.placeholder = t('chatPlaceholder');

  set('.about h2', 'aboutTitle');
  const aboutPs = document.querySelectorAll('.about-inner > p');
  if (aboutPs[0]) aboutPs[0].innerHTML = t('aboutP1');
  if (aboutPs[1]) aboutPs[1].innerHTML = t('aboutP2');
  set('.about-contact', 'aboutContact');

  set('.footer-brand span', 'footerTagline');
  const fLinks = document.querySelectorAll('.footer-links a');
  if (fLinks.length >= 4) {
    fLinks[0].textContent = t('footerContact');
    fLinks[1].textContent = t('footerApply');
    fLinks[2].textContent = t('footerSource');
    fLinks[3].textContent = t('footerScores');
  }
  set('#footer-disclaimer-text', 'footerDisclaimer');
  const sourceNote = document.getElementById('source-freshness');
  if (sourceNote) {
    // `schools_data.js` declares a top-level const, which is visible to later
    // classic scripts but is not attached to `window`.
    const refreshedAt = typeof SCHOOL_DATA_SOURCE !== 'undefined'
      ? SCHOOL_DATA_SOURCE.retrievedAt
      : null;
    sourceNote.textContent = refreshedAt
      ? ` ${t('sourceSnapshotKnown', { date: refreshedAt })}`
      : ` ${t('sourceSnapshotUnknown')}`;
  }
  set('.footer-copy', 'footerCopy');
}

/* Re-render anything built by JS in the old language. */
function refreshDynamicViews() {
  if (document.getElementById('quiz-panel').style.display === 'block') renderStep();
  if (document.getElementById('results-panel').style.display === 'block') showResults();
  if (typeof applyFilters === 'function' && allSchools.length) applyFilters();
  if (currentTab === 'saved') renderSaved();
  if (chatOpen) renderQR();
  // Map legend/popups are rebuilt on next open; force rebuild:
  if (mapInstance) { mapInstance.remove(); mapInstance = null; if (currentTab === 'map') initMap(); }
}
