/* A small, sourced help menu; no model calls or unsupported school ratings. */
let chatOpen=false;
const quickReplies=()=>[
  {l:t('qrFind'),m:'find a school'}, {l:t('qrApply'),m:'application dates'},
  {l:t('qrScores'),m:'about matches'}, {l:t('qrBrowse'),m:'browse all schools'}
];
function toggleChat() {
  chatOpen=!chatOpen;
  const panel=document.getElementById('chat-window');
  panel.classList.toggle('hidden',!chatOpen); panel.setAttribute('aria-hidden',String(!chatOpen));
  document.getElementById('chat-fab').setAttribute('aria-expanded',String(chatOpen));
  if(chatOpen) {
    if(!document.getElementById('chat-messages').children.length) botSay(escapeHtml(t('chatWelcome')));
    document.getElementById('chat-input').focus();
  }
}
function botSay(html,showQR=true) {
  const messages=document.getElementById('chat-messages');
  const bubble=document.createElement('div'); bubble.className='msg bot';
  bubble.innerHTML=`<div class="msg-avatar" aria-hidden="true">💬</div><div class="msg-bubble">${html.replace(/\n/g,'<br>')}</div>`;
  messages.appendChild(bubble); messages.scrollTop=messages.scrollHeight;
  if(showQR) renderQR();
}
function userSay(text) {
  const messages=document.getElementById('chat-messages');
  const bubble=document.createElement('div'); bubble.className='msg user';
  const content=document.createElement('div'); content.className='msg-bubble'; content.textContent=text;
  bubble.appendChild(content); messages.appendChild(bubble); messages.scrollTop=messages.scrollHeight;
  document.getElementById('chat-qr').replaceChildren();
}
function renderQR() {
  const panel=document.getElementById('chat-qr'); panel.replaceChildren();
  quickReplies().forEach(reply=>{
    const button=document.createElement('button'); button.className='qr-btn'; button.textContent=reply.l;
    button.addEventListener('click',()=>handleMsg(reply.m)); panel.appendChild(button);
  });
}
function sendMsg() {
  const input=document.getElementById('chat-input'); const text=input.value.trim();
  if(!text) return; input.value=''; userSay(text); handleMsg(text);
}
function handleMsg(text) {
  const m=text.toLowerCase(); const es=LANG==='es';
  if(/apply|application|enroll|deadline|when|date|open|close|fecha|cu[aá]ndo|plazo|l[ií]mite|solicit|aplic|inscrib/.test(m)) {
    botSay(applicationDatesSummaryHtml()+`<br><br><a href="#application-guide">${escapeHtml(t('guideLink'))}</a><br>`+escapeHtml(t('guideIntro'))); return;
  }
  if(/score|rating|quality|equity|about matches|mean|puntaje|calific|calidad|equidad|coincid|significa/.test(m)) {
    botSay(escapeHtml(t('modalAccessTxt'))+'<br><br>'+escapeHtml(t('modalEquityTxt'))); return;
  }
  if(/transport|\bbus\b/.test(m)) {
    botSay(es?'Confirme con LAUSD y con la escuela si hay transporte para su domicilio y el programa elegido.':'Check transportation availability for your address and chosen program with LAUSD and the school.');
    botSay(`<a href="https://transportation.lausd.org" target="_blank" rel="noopener noreferrer">${escapeHtml(t('transportation'))}</a>`); return;
  }
  if(/^(find a school|start|quiz|match)|help me find|empezar|comenzar|cuestionario|ayuda a encontrar/.test(m)) {
    toggleChat(); startQuiz(); return;
  }
  if(/browse|all schools|see all|show all|todas las escuelas|ver todas|explorar/.test(m)) { toggleChat(); scrollToBrowse(); return; }
  if(/\b(map|where|location|near|mapa)\b|d[oó]nde|ubicaci[oó]n|cerca/.test(m)) { toggleChat(); switchTab('map'); return; }
  if(/saved|favorite|heart|wishlist|guardad|favorit|coraz[oó]n|compar/.test(m)) { toggleChat(); switchTab('saved'); return; }
  if(/^(home|restart|inicio|volver)$|start over|empezar de nuevo/.test(m)) { toggleChat(); showHero(); return; }
  const named=allSchools.filter(s=>s.name.toLocaleLowerCase().includes(m)).slice(0,4);
  if(m.length>=3 && named.length && named.length<=3) {
    botSay(named.map(s=>`<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(gradeLabel(s))}<br>${schoolDetailsHtml(s,{compact:true})}`).join('<br><br>')); return;
  }
  const interests=[];
  if(/medical|medicine|health|biotech|m[eé]dic|medicina|salud|biotecnolog/.test(m)) interests.push('medical');
  if(/computer|coding|robot|technology|comput|tecnolog|programaci[oó]n/.test(m)) interests.push('tech');
  if(/engineer|aerospace|ingenier/.test(m)) interests.push('engineer');
  if(/science|nature|ciencia|naturaleza|stem/.test(m)) interests.push('science');
  if(/\barts|music|film|arte|m[uú]sica|cine|teatro/.test(m)) interests.push('arts');
  const number=m.match(/(?:grade|grado)\s*(1[0-2]|[1-9])\b/) || m.match(/\b(1[0-2]|[1-9])(?:st|nd|rd|th)?\s*(?:grade|grado)\b/);
  const grade=number?number[1]:/kinder|kindergarten|k[ií]nder/.test(m)?'K':/middle|secundaria/.test(m)?'mid':/high school|preparatoria/.test(m)?'high':/elementary|primaria/.test(m)?'elem':'';
  if(interests.length || grade) {
    const matches=(grade ? matchSchools(grade,interests.length?interests:['any']) : allSchools.filter(school=>interests.some(interest=>verifiedInterestsForSchool(school).includes(interest))).sort((a,b)=>a.name.localeCompare(b.name))).slice(0,5);
    if(!matches.length) { botSay(escapeHtml(t('noMatches'))); return; }
    const intro=es?'Estas opciones coinciden con los grados publicados y los intereses revisados. No están calificadas por calidad.':'These options match published grades and reviewed interests. They are not ranked by school quality.';
    botSay(escapeHtml(intro)+'<br><br>'+matches.map(s=>`<strong>${escapeHtml(s.name)}</strong><br>${escapeHtml(gradeLabel(s))}<br>${schoolDetailsHtml(s,{compact:true})}`).join('<br><br>')); return;
  }
  botSay(escapeHtml(es?'Puedo ayudarle a buscar programas, comparar escuelas guardadas o consultar fechas oficiales. Use una opción de abajo o busque el nombre de una escuela.':'I can help you find programs, compare saved schools, or check official application dates. Choose an option below or search for a school by name.'));
}
