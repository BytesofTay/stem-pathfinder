/* =========================================
   Chatbot
   ========================================= */

let chatOpen = false;
const QUICK_REPLIES = [
  { l: '🔍 Find my school',      m: 'find a school for me' },
  { l: '📋 How to apply',        m: 'how do I apply' },
  { l: '❓ What do scores mean',  m: 'what do scores mean' },
  { l: '🏫 Browse all schools',   m: 'browse all schools' },
];

function toggleChat() {
  chatOpen = !chatOpen;
  const win = document.getElementById('chat-window');
  win.classList.toggle('hidden', !chatOpen);
  win.setAttribute('aria-hidden', String(!chatOpen));
  if (chatOpen) {
    if (document.getElementById('chat-messages').children.length === 0) {
      botSay(
        `Hi! 👋 I'm here to help you find the right STEM magnet school for your child.\n\n` +
        `You can ask me things like:<br>` +
        `• "Find STEM schools for a 7th grader"<br>` +
        `• "What are the top medical programs?"<br>` +
        `• "How do I apply?"`,
        true
      );
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
  qr.innerHTML = QUICK_REPLIES
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
  const t = txt.toLowerCase();

  // Navigation
  if (/\b(start|find|quiz|match|help me find)\b/.test(t)) {
    botSay('Great! Let me start the school finder quiz for you. 🎯');
    setTimeout(() => { toggleChat(); startQuiz(); }, 800);
    return;
  }
  if (/\b(browse|all schools|see all|show all)\b/.test(t)) {
    botSay('Opening the full school list for you! 📋');
    setTimeout(() => { toggleChat(); scrollToBrowse(); }, 600);
    return;
  }
  if (/\b(map|where|location|near)\b/.test(t)) {
    botSay('I can show you a map of all 180 schools! 🗺️');
    setTimeout(() => { toggleChat(); scrollToBrowse(); setTimeout(() => switchTab('map'), 300); }, 600);
    return;
  }
  if (/\b(saved|favorite|heart|wishlist)\b/.test(t)) {
    botSay('Here are your saved schools! ❤️');
    setTimeout(() => { toggleChat(); scrollToBrowse(); setTimeout(() => switchTab('saved'), 300); }, 600);
    return;
  }
  if (/\b(home|start over|restart|back)\b/.test(t)) {
    botSay('Taking you back to the home screen. 🏠');
    setTimeout(() => { toggleChat(); showHero(); }, 600);
    return;
  }

  // Apply FAQ
  if (/\b(apply|application|enroll|sign up|register)\b/.test(t)) {
    botSay(
      `To apply to LAUSD magnet schools:\n\n` +
      `1️⃣ Visit the <a href="${APPLY_URL}" target="_blank">LAUSD Magnet Application page</a>\n` +
      `2️⃣ Applications typically open in <strong>November</strong> each year\n` +
      `3️⃣ You can apply to <strong>multiple schools</strong> at once\n` +
      `4️⃣ Selection is done by <strong>lottery</strong> — it's fair for everyone!\n\n` +
      `Want help finding which schools to apply to?`
    );
    return;
  }

  // Scores FAQ
  if (/\b(score|quality|access|equity|mean|explain|what is|rating)\b/.test(t)) {
    botSay(
      `Here's how schools are scored:\n\n` +
      `🎓 <strong>Quality (1–10)</strong> — Program rigor and STEM focus\n` +
      `🚪 <strong>Access (1–10)</strong> — How broadly students can enroll\n` +
      `⚖️ <strong>Equity (1–10)</strong> — Support for underserved communities\n` +
      `⭐ <strong>Overall</strong> — The average of all three\n\n` +
      `Green = 8–10, Orange = 5–7, Red = 1–4`
    );
    return;
  }

  // Deadlines FAQ
  if (/\b(deadline|when|date|open|close|window)\b/.test(t)) {
    botSay(
      `📅 LAUSD magnet applications typically:\n\n` +
      `• <strong>Open:</strong> November each year\n` +
      `• <strong>Close:</strong> January / February\n` +
      `• <strong>Results:</strong> Spring (March – April)\n\n` +
      `Check <a href="${APPLY_URL}" target="_blank">lausd.net</a> for exact dates this year!`
    );
    return;
  }

  // Cost FAQ
  if (/\b(free|cost|tuition|pay|money|fee|price)\b/.test(t)) {
    botSay(
      `✅ <strong>LAUSD magnet schools are completely free!</strong>\n\n` +
      `No tuition, no application fee. These are public schools funded by the district. ` +
      `Transportation may also be available depending on your address.`
    );
    return;
  }

  // School type + grade searches
  const stemHit   = /\b(stem|science|engineering|tech|computer|math)\b/.test(t);
  const medHit    = /\b(medical|medicine|health|biotech)\b/.test(t);
  const artsHit   = /\b(arts|music|film|performing|visual)\b/.test(t);
  const elemHit   = /\b(elementary|kinder|kindergarten|k-?5|grades? k)\b/.test(t);
  const middleHit = /\b(middle|6th|7th|6-?8|grades? 6)\b/.test(t);
  const highHit   = /\b(high school|9th|9-?12|grades? 9)\b/.test(t);

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
      botSay(`I couldn't find schools matching that exactly. Would you like to try the quiz for personalized recommendations?`);
      return;
    }
    const label   = medHit ? 'medical' : artsHit ? 'arts' : stemHit ? 'STEM' : '';
    const grLabel = elemHit ? 'elementary' : middleHit ? 'middle school' : highHit ? 'high school' : '';
    botSay(
      `Here are the top ${label} ${grLabel} schools:\n\n` +
      matches.map((s,i) =>
        `<strong>${i+1}. ${s.name}</strong>\n${gradeLabel(s.low_grade)} · Overall: ${overall(s)||'?'}/10`
      ).join('\n\n') +
      `\n\nWant more details? Try the full quiz for personalized matches.`
    );
    return;
  }

  // School name lookup
  const nameMatch = allSchools.filter(s => s.name.toLowerCase().includes(t)).slice(0, 3);
  if (nameMatch.length === 1) {
    const s  = nameMatch[0];
    const ov = overall(s);
    const p  = getProg(s.name);
    botSay(
      `I found it! 🎓\n\n` +
      `<strong>${s.name}</strong>\n` +
      `${gradeLabel(s.low_grade)}${p ? ' · ' + p.label : ''}\n` +
      `📍 ${s.address}\n\n` +
      `⭐ Overall: ${ov||'?'}/10\n` +
      `🎓 Quality: ${s.quality||'?'}/10 · 🚪 Access: ${s.access||'?'}/10 · ⚖️ Equity: ${s.equity||'?'}/10\n\n` +
      `<a href="${APPLY_URL}" target="_blank">Apply Now →</a> · <a href="${mapsUrl(s.address)}" target="_blank">Get Directions</a>`
    );
    return;
  }
  if (nameMatch.length > 1) {
    botSay(
      `I found ${nameMatch.length} schools matching "${escapeHtml(txt)}":\n\n` +
      nameMatch.map(s => `• <strong>${s.name}</strong> (${gradeLabel(s.low_grade)})`).join('\n') +
      `\n\nCan you be more specific?`
    );
    return;
  }

  // Fallback
  botSay(
    `I'm not sure about that, but I can help you:\n\n` +
    `• <strong>Find the right school</strong> with our quiz\n` +
    `• <strong>Learn how to apply</strong> to magnet programs\n` +
    `• <strong>Browse all 180 schools</strong> or view on a map\n` +
    `• <strong>Understand scores</strong> (Quality, Access, Equity)\n\n` +
    `What would you like to do?`
  );
}
