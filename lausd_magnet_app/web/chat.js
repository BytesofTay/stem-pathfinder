/* =========================================
   Chatbot
   ========================================= */

let chatOpen = false;
/* Quick replies send canonical English intent phrases regardless of display
   language, so handleMsg routing always works. Labels localize via t(). */
const quickReplies = () => [
  { l: t('qrFind'),   m: 'find a school for me' },
  { l: t('qrApply'),  m: 'how do I apply' },
  { l: t('qrScores'), m: 'what do scores mean' },
  { l: t('qrBrowse'), m: 'browse all schools' },
];

function toggleChat() {
  chatOpen = !chatOpen;
  const win = document.getElementById('chat-window');
  win.classList.toggle('hidden', !chatOpen);
  win.setAttribute('aria-hidden', String(!chatOpen));
  if (chatOpen) {
    if (document.getElementById('chat-messages').children.length === 0) {
      botSay(t('chatWelcome'), true);
    }
    setTimeout(() => document.getElementById('chat-input').focus(), 200);
  }
}

function botSay(text, showQR = true) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'msg bot';
  div.setAttribute('role', 'log');
  div.innerHTML = `<div class="msg-avatar" aria-hidden="true">🤖</div><div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  if (showQR) renderQR();
}

function userSay(text) {
  const msgs = document.getElementById('chat-messages');
  const div  = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `<div class="msg-bubble">${escapeHtml(text)}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  document.getElementById('chat-qr').innerHTML = '';
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderQR() {
  const qr = document.getElementById('chat-qr');
  qr.innerHTML = quickReplies()
    .map(r => `<button class="qr-btn" onclick="handleMsg('${r.m}')">${r.l}</button>`)
    .join('');
}

function sendMsg() {
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt) return;
  inp.value = '';
  userSay(txt);
  handleMsg(txt);
}

function handleMsg(txt) {
  const m  = txt.toLowerCase();
  const es = LANG === 'es';

  // Navigation — patterns cover English and Spanish phrasings
  if (/\b(start|quiz|match|help me find|find (a |me )?school|empezar|comenzar|cuestionario|ayuda a encontrar|busca(r)? (una )?escuela)/.test(m)) {
    botSay(es ? '¡Perfecto! Empecemos el cuestionario para encontrar su escuela. 🎯'
              : 'Great! Let me start the school finder quiz for you. 🎯');
    setTimeout(() => { toggleChat(); startQuiz(); }, 800);
    return;
  }
  if (/\b(browse|all schools|see all|show all|todas las escuelas|ver todas|explorar)\b/.test(m)) {
    botSay(es ? '¡Abriendo la lista completa de escuelas! 📋'
              : 'Opening the full school list for you! 📋');
    setTimeout(() => { toggleChat(); scrollToBrowse(); }, 600);
    return;
  }
  if (/\b(map|where|location|near|mapa|d[oó]nde|ubicaci[oó]n|cerca)\b/.test(m)) {
    botSay(es ? '¡Puedo mostrarle un mapa con las 180 escuelas! 🗺️'
              : 'I can show you a map of all 180 schools! 🗺️');
    setTimeout(() => { toggleChat(); scrollToBrowse(); setTimeout(() => switchTab('map'), 300); }, 600);
    return;
  }
  if (/\b(saved|favorite|heart|wishlist|guardad|favorit|coraz[oó]n)/.test(m)) {
    botSay(es ? '¡Aquí están sus escuelas guardadas! ❤️'
              : 'Here are your saved schools! ❤️');
    setTimeout(() => { toggleChat(); scrollToBrowse(); setTimeout(() => switchTab('saved'), 300); }, 600);
    return;
  }
  if (/\b(home|start over|restart|inicio|volver|empezar de nuevo)\b/.test(m)) {
    botSay(es ? 'Regresando a la pantalla de inicio. 🏠'
              : 'Taking you back to the home screen. 🏠');
    setTimeout(() => { toggleChat(); showHero(); }, 600);
    return;
  }

  // Apply FAQ
  if (/\b(apply|application|enroll|sign up|register|aplic|solicitud|inscribir|registr)/.test(m) || /c[oó]mo aplico/.test(m)) {
    botSay(es
      ? `Para aplicar a las escuelas magnet de LAUSD:\n\n` +
        `1️⃣ Visite la <a href="${APPLY_URL}" target="_blank">página de solicitudes Magnet de LAUSD</a>\n` +
        `2️⃣ Las solicitudes normalmente abren en <strong>noviembre</strong>\n` +
        `3️⃣ Puede aplicar a <strong>varias escuelas</strong> a la vez\n` +
        `4️⃣ La selección es por <strong>lotería</strong> — ¡es justa para todos!\n\n` +
        `¿Quiere ayuda para elegir a cuáles escuelas aplicar?`
      : `To apply to LAUSD magnet schools:\n\n` +
        `1️⃣ Visit the <a href="${APPLY_URL}" target="_blank">LAUSD Magnet Application page</a>\n` +
        `2️⃣ Applications typically open in <strong>November</strong> each year\n` +
        `3️⃣ You can apply to <strong>multiple schools</strong> at once\n` +
        `4️⃣ Selection is done by <strong>lottery</strong> — it's fair for everyone!\n\n` +
        `Want help finding which schools to apply to?`);
    return;
  }

  // Scores FAQ
  if (/\b(score|mean|explain|what is|rating|puntaje|calificaci[oó]n|significa|explica)/.test(m)) {
    botSay(es
      ? `Así se califican las escuelas:\n\n` +
        `🎓 <strong>Calidad (1–10)</strong> — Rigor del programa y enfoque STEM\n` +
        `🚪 <strong>Acceso (1–10)</strong> — Qué tan ampliamente pueden inscribirse los estudiantes\n` +
        `⚖️ <strong>Equidad (1–10)</strong> — Apoyo a comunidades menos favorecidas\n` +
        `⭐ <strong>General</strong> — El promedio de las tres\n\n` +
        `Verde = 8–10, Naranja = 5–7, Rojo = 1–4`
      : `Here's how schools are scored:\n\n` +
        `🎓 <strong>Quality (1–10)</strong> — Program rigor and STEM focus\n` +
        `🚪 <strong>Access (1–10)</strong> — How broadly students can enroll\n` +
        `⚖️ <strong>Equity (1–10)</strong> — Support for underserved communities\n` +
        `⭐ <strong>Overall</strong> — The average of all three\n\n` +
        `Green = 8–10, Orange = 5–7, Red = 1–4`);
    return;
  }

  // Deadlines FAQ
  if (/\b(deadline|when|date|open|close|window|fecha|cu[aá]ndo|plazo|l[ií]mite)/.test(m)) {
    botSay(es
      ? `📅 Las solicitudes magnet de LAUSD normalmente:\n\n` +
        `• <strong>Abren:</strong> noviembre de cada año\n` +
        `• <strong>Cierran:</strong> enero / febrero\n` +
        `• <strong>Resultados:</strong> primavera (marzo – abril)\n\n` +
        `¡Revise <a href="${APPLY_URL}" target="_blank">lausd.net</a> para las fechas exactas de este año!`
      : `📅 LAUSD magnet applications typically:\n\n` +
        `• <strong>Open:</strong> November each year\n` +
        `• <strong>Close:</strong> January / February\n` +
        `• <strong>Results:</strong> Spring (March – April)\n\n` +
        `Check <a href="${APPLY_URL}" target="_blank">lausd.net</a> for exact dates this year!`);
    return;
  }

  // Cost FAQ
  if (/\b(free|cost|tuition|pay|money|fee|price|gratis|costo|cuesta|pagar|dinero|precio|colegiatura)/.test(m)) {
    botSay(es
      ? `✅ <strong>¡Las escuelas magnet de LAUSD son completamente gratuitas!</strong>\n\n` +
        `No hay colegiatura ni cuota de solicitud. Son escuelas públicas financiadas por el distrito. ` +
        `También puede haber transporte disponible según su dirección.`
      : `✅ <strong>LAUSD magnet schools are completely free!</strong>\n\n` +
        `No tuition, no application fee. These are public schools funded by the district. ` +
        `Transportation may also be available depending on your address.`);
    return;
  }

  // School type + grade searches (bilingual keywords)
  const stemHit   = /\b(stem|science|engineering|tech|computer|math|ciencia|ingenier|tecnolog|matem[aá]tic|computaci[oó]n)/.test(m);
  const medHit    = /\b(medical|medicine|health|biotech|m[eé]dic|medicina|salud|biotecnolog)/.test(m);
  const artsHit   = /\b(arts|music|film|performing|visual|arte|m[uú]sica|cine|teatro)/.test(m);
  const elemHit   = /\b(elementary|kinder|kindergarten|k-?5|grades? k|primaria|k[ií]nder)/.test(m);
  const middleHit = /\b(middle|6th|7th|6-?8|grades? 6|secundaria|sexto|s[eé]ptimo)/.test(m);
  const highHit   = /\b(high school|9th|9-?12|grades? 9|preparatoria|noveno)/.test(m);

  if (stemHit || medHit || artsHit || elemHit || middleHit || highHit) {
    let keys = [], gradeFilter = null;
    if (medHit)       keys = ['medical','health','biotech'];
    else if (artsHit) keys = ['arts','performing','visual','film'];
    else if (stemHit) keys = ['stem','science','tech','engineering','math','aerospace','technology'];
    if (elemHit)      gradeFilter = ['K','1','4'];
    else if (middleHit) gradeFilter = ['6','7'];
    else if (highHit)   gradeFilter = ['9'];

    let matches = allSchools.filter(s => {
      if (gradeFilter && !gradeFilter.includes(s.low_grade)) return false;
      if (keys.length && !keys.some(k => s.name.toLowerCase().includes(k))) return false;
      return true;
    }).sort((a,b) => (overall(b)||0) - (overall(a)||0)).slice(0, 5);

    if (!matches.length) {
      botSay(es ? 'No encontré escuelas que coincidan exactamente. ¿Le gustaría probar el cuestionario para recomendaciones personalizadas?'
                : `I couldn't find schools matching that exactly. Would you like to try the quiz for personalized recommendations?`);
      return;
    }
    const label   = medHit ? (es?'médicas':'medical') : artsHit ? (es?'de artes':'arts') : stemHit ? 'STEM' : '';
    const grLabel = elemHit ? (es?'de primaria':'elementary') : middleHit ? (es?'de secundaria':'middle school') : highHit ? (es?'de preparatoria':'high school') : '';
    const list = matches.map((s,i) =>
      `<strong>${i+1}. ${s.name}</strong>\n${gradeLabel(s.low_grade)} · ${t('mapOverall')}: ${overall(s)||'?'}/10`
    ).join('\n\n');
    botSay(es
      ? `Estas son las mejores escuelas ${label} ${grLabel}:\n\n${list}\n\n¿Quiere más detalles? Pruebe el cuestionario completo para resultados personalizados.`
      : `Here are the top ${label} ${grLabel} schools:\n\n${list}\n\nWant more details? Try the full quiz for personalized matches.`);
    return;
  }

  // School name lookup
  const nameMatch = allSchools.filter(s => s.name.toLowerCase().includes(m)).slice(0, 3);
  if (nameMatch.length === 1) {
    const s  = nameMatch[0];
    const ov = overall(s);
    const p  = getProg(s.name);
    const details =
      `<strong>${s.name}</strong>\n` +
      `${gradeLabel(s.low_grade)}${p ? ' · ' + p.label : ''}\n` +
      `📍 ${s.address}\n\n` +
      `⭐ ${t('mapOverall')}: ${ov||'?'}/10\n` +
      `🎓 ${t('quality')}: ${s.quality||'?'}/10 · 🚪 ${t('access')}: ${s.access||'?'}/10 · ⚖️ ${t('equity')}: ${s.equity||'?'}/10\n\n` +
      `<a href="${APPLY_URL}" target="_blank">${t('applyNow')}</a> · <a href="${mapsUrl(s.address)}" target="_blank">${t('directions')}</a>`;
    botSay((es ? '¡La encontré! 🎓\n\n' : 'I found it! 🎓\n\n') + details);
    return;
  }
  if (nameMatch.length > 1) {
    const list = nameMatch.map(s => `• <strong>${s.name}</strong> (${gradeLabel(s.low_grade)})`).join('\n');
    botSay(es
      ? `Encontré ${nameMatch.length} escuelas que coinciden con "${escapeHtml(txt)}":\n\n${list}\n\n¿Puede ser más específico?`
      : `I found ${nameMatch.length} schools matching "${escapeHtml(txt)}":\n\n${list}\n\nCan you be more specific?`);
    return;
  }

  // Fallback
  botSay(es
    ? `No estoy seguro de eso, pero puedo ayudarle a:\n\n` +
      `• <strong>Encontrar la escuela ideal</strong> con nuestro cuestionario\n` +
      `• <strong>Aprender cómo aplicar</strong> a los programas magnet\n` +
      `• <strong>Ver las 180 escuelas</strong> en lista o mapa\n` +
      `• <strong>Entender los puntajes</strong> (Calidad, Acceso, Equidad)\n\n` +
      `¿Qué le gustaría hacer?`
    : `I'm not sure about that, but I can help you:\n\n` +
      `• <strong>Find the right school</strong> with our quiz\n` +
      `• <strong>Learn how to apply</strong> to magnet programs\n` +
      `• <strong>Browse all 180 schools</strong> or view on a map\n` +
      `• <strong>Understand scores</strong> (Quality, Access, Equity)\n\n` +
      `What would you like to do?`);
}
