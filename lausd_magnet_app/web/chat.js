/* Hosted, source-grounded chat. Transcript and retry state remain in memory. */
let chatOpen = false;
let chatBusy = false;
let chatHasStarted = false;
let chatHistory = [];
let chatRetryRequest = null;
let chatErrorState = null;
let chatController = null;
let chatRequestSequence = 0;
let chatRetryTimer = null;
let chatFocusedSchoolIds = [];
let chatLastProgramIds = [];
let chatDataRevision = null;
let chatUseQuizContext = true;
let chatPendingAnswer = null;
const CHAT_USER_LIMIT = 1200;
const CHAT_HISTORY_LIMIT = 8;
const CHAT_HISTORY_CHAR_LIMIT = 6000;

const quickReplies = () => [
  { l: t('chatPromptMedical'), m: t('chatPromptMedical') },
  { l: t('chatPromptEngineering'), m: t('chatPromptEngineering') },
  { l: t('chatPromptApply'), m: t('chatPromptApply') },
];
function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chat-window');
  panel.classList.toggle('hidden', !chatOpen);
  panel.setAttribute('aria-hidden', String(!chatOpen));
  document.getElementById('chat-fab').setAttribute('aria-expanded', String(chatOpen));
  if (chatOpen) {
    if (!document.getElementById('chat-messages').children.length) botSay(t('chatWelcome'));
    refreshChatI18n();
    if (chatPendingAnswer) { anchorChatAnswer(chatPendingAnswer); chatPendingAnswer = null; }
    if (!chatBusy) document.getElementById('chat-input').focus();
  } else document.getElementById('chat-fab').focus();
}
function appendChatMessage(role, text) {
  const messages = document.getElementById('chat-messages');
  const row = document.createElement('article');
  row.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  if (role !== 'user') {
    const avatar = document.createElement('span');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '✦';
    row.appendChild(avatar);
  }
  const body = document.createElement('div');
  body.className = 'msg-bubble';
  const paragraph = document.createElement('p');
  paragraph.className = 'chat-answer';
  paragraph.textContent = text;
  body.appendChild(paragraph);
  row.appendChild(body);
  messages.appendChild(row);
  if (role === 'user') scrollChatToEnd();
  return body;
}
function botSay(text) { return appendChatMessage('assistant', String(text)); }
function userSay(text) { return appendChatMessage('user', String(text)); }
function scrollChatToEnd() {
  const messages = document.getElementById('chat-messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}
function anchorChatAnswer(body) {
  const messages = document.getElementById('chat-messages');
  if (!messages || !body || !chatOpen) return;
  messages.scrollTop += body.parentElement.getBoundingClientRect().top - messages.getBoundingClientRect().top - 8;
}
function getChatContext() {
  const validGrades = ['K', ...Array.from({ length: 12 }, (_, index) => String(index + 1))];
  const quiz = chatUseQuizContext && typeof qAns !== 'undefined' ? qAns : {};
  return {
    focusedSchoolIds: chatFocusedSchoolIds.filter(id => allSchools.some(school => SchoolUtils.schoolId(school) === id && getProgramEvidence(school).length)).slice(0, 3),
    lastProgramIds: chatLastProgramIds.slice(0, 6),
    ...(chatDataRevision ? { dataRevision: chatDataRevision } : {}),
    grade: validGrades.includes(quiz.grade) ? quiz.grade : null,
    interests: [...new Set((Array.isArray(quiz.interest) ? quiz.interest : []).filter(value => ['science', 'tech', 'medical', 'engineer', 'arts'].includes(value)))],
  };
}
function openChatForSchool(id) {
  const school = allSchools.find(record => SchoolUtils.schoolId(record) === id);
  if (!school || !getProgramEvidence(school).length) return false;
  if (!chatOpen) toggleChat();
  if (chatBusy) {
    document.getElementById('chat-context-status').textContent = t('chatContextBusy');
    return false;
  }
  chatFocusedSchoolIds = [id];
  chatLastProgramIds = [];
  chatUseQuizContext = true;
  chatRetryRequest = null; chatErrorState = null; renderChatError();
  const context = getChatContext();
  const question = t('chatSchoolQuestion', { school: school.name }) + (context.grade ? ' ' + t('chatQuestionGrade', { grade: context.grade }) : '');
  document.getElementById('chat-input').value = question;
  document.getElementById('chat-context-status').textContent = '';
  renderChatContext();
  renderQR();
  updateChatInputState();
  document.getElementById('chat-input').focus();
  return true;
}
function clearChatContext() {
  if (chatBusy) return;
  chatFocusedSchoolIds = [];
  chatLastProgramIds = [];
  chatDataRevision = null;
  chatUseQuizContext = false;
  renderChatContext();
  renderQR();
}
function renderChatContext() {
  const panel = document.getElementById('chat-context');
  if (!panel) return;
  const context = getChatContext();
  const parts = context.focusedSchoolIds.map(id => allSchools.find(school => SchoolUtils.schoolId(school) === id).name);
  if (context.grade) parts.push(t('chatContextGrade', { grade: context.grade }));
  if (context.interests.length) parts.push(context.interests.map(interestLabel).join(', '));
  panel.hidden = !parts.length;
  document.getElementById('chat-context-label').textContent = t('chatContextLabel', { context: parts.join(' · ') });
  const clear = document.getElementById('chat-clear-context');
  clear.textContent = t('chatClearContext');
  clear.disabled = chatBusy;
}
function rememberChatContext(data) {
  const revision = typeof data.dataRevision === 'string' && data.dataRevision.length <= 100 ? data.dataRevision : null;
  if (revision && chatDataRevision && revision !== chatDataRevision) chatLastProgramIds = [];
  const ids = Array.isArray(data.programs) ? data.programs.filter(program => program && officialChatUrl(program.sourceUrl) && typeof program.programId === 'string' && program.programId.trim() && program.programId.length <= 180).map(program => program.programId) : [];
  if (ids.length) chatLastProgramIds = [...new Set(ids)].slice(0, 6);
  if (revision) chatDataRevision = revision;
}
function viewChatComparison() {
  if (chatOpen) toggleChat();
  switchTab('saved');
  document.getElementById('comparison-title')?.focus({ preventScroll: true });
}
function syncChatComparisonUI() {
  if (typeof document.getElementById !== 'function') return;
  const count = getComparisonSchoolIds().length;
  const label = document.getElementById('chat-comparison-count');
  if (label) label.textContent = t('chatComparisonCount', { n: count });
  document.querySelectorAll('[data-chat-view-comparison]').forEach(button => { button.textContent = t('chatViewComparison'); });
  document.querySelectorAll('.chat-add-school[data-chat-school-id]').forEach(button => {
    const school = allSchools.find(record => SchoolUtils.schoolId(record) === button.dataset.chatSchoolId);
    const added = !!school && compared.has(school.name);
    button.disabled = !school || added || count >= 3;
    button.setAttribute('aria-pressed', String(added));
    button.textContent = t(added ? 'chatSchoolAdded' : count >= 3 ? 'chatComparisonFull' : 'chatAddComparison');
  });
}
function renderQR() {
  const panel = document.getElementById('chat-qr');
  if (!panel) return;
  panel.hidden = chatHasStarted || chatFocusedSchoolIds.length > 0;
  panel.replaceChildren();
  quickReplies().forEach(reply => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'qr-btn';
    button.textContent = reply.l;
    button.disabled = chatBusy;
    button.addEventListener('click', () => handleMsg(reply.m));
    panel.appendChild(button);
  });
}
function updateChatInputState() {
  const input = document.getElementById('chat-input');
  const counter = document.getElementById('chat-counter');
  if (counter) counter.textContent = (input ? input.value.length : 0) + '/' + CHAT_USER_LIMIT;
  const send = document.getElementById('chat-send');
  if (send) send.disabled = chatBusy || !input || !input.value.trim();
}
function refreshChatI18n() {
  const labels = {
    'chat-privacy': 'chatPrivacy', 'chat-new': 'chatNew', 'chat-loading-text': 'chatLoading',
    'chat-input-label': 'chatInputLabel', 'chat-citation-hint': 'chatSourceHint',
  };
  Object.entries(labels).forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = t(key);
  });
  const input = document.getElementById('chat-input');
  if (input) { input.placeholder = t('chatPlaceholder'); input.setAttribute('aria-label', t('chatInputLabel')); }
  const panel = document.getElementById('chat-window');
  if (panel) panel.setAttribute('aria-label', t('chatName'));
  const send = document.getElementById('chat-send');
  if (send) send.setAttribute('aria-label', t('chatSend'));
  document.querySelectorAll('[data-chat-close]').forEach(button =>
    button.setAttribute('aria-label', t(button.dataset.chatClose === 'minimize' ? 'chatMinimize' : 'closeChat')));
  renderQR();
  renderChatError();
  renderChatContext();
  syncChatComparisonUI();
  updateChatInputState();
}
function setChatBusy(busy) {
  chatBusy = busy;
  document.getElementById('chat-messages').setAttribute('aria-busy', String(busy));
  document.getElementById('chat-input').disabled = busy;
  document.getElementById('chat-loading').hidden = !busy;
  document.getElementById('chat-new').disabled = busy;
  renderChatContext();
  renderQR();
  updateChatInputState();
}
function handleChatKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    sendMsg();
  }
}
function sendMsg() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || chatBusy) return;
  if (text.length > CHAT_USER_LIMIT) {
    chatErrorState = { key: 'chatTooLong', retryable: false };
    renderChatError();
    return;
  }
  input.value = '';
  return handleMsg(text);
}
function handleMsg(text) {
  if (chatBusy || typeof text !== 'string' || !text.trim()) return;
  text = text.trim();
  if (text.length > CHAT_USER_LIMIT) {
    chatErrorState = { key: 'chatTooLong', retryable: false }; renderChatError(); return;
  }
  const messages = buildChatMessages(text);
  const request = { messages, language: LANG === 'es' ? 'es' : 'en', comparisonSchoolIds: getComparisonSchoolIds(), context: getChatContext() };
  chatHasStarted = true;
  userSay(text);
  return requestChat(request);
}
function buildChatMessages(text) {
  const recent = chatHistory.slice(-(CHAT_HISTORY_LIMIT - 2)).map(message => ({
    role: message.role, content: String(message.content).slice(0, CHAT_USER_LIMIT),
  }));
  while (recent.length && recent[0].role !== 'user') recent.shift();
  const messages = [...recent, { role: 'user', content: text }];
  while (messages.length > 1 && messages.reduce((sum, message) => sum + message.content.length, 0) > CHAT_HISTORY_CHAR_LIMIT) {
    messages.splice(0, Math.min(2, messages.length - 1));
  }
  return messages;
}
function chatErrorKey(status, data) {
  const code = String(data && (data.code || data.error && data.error.code || data.error) || '').toUpperCase();
  if (status === 429 || code === 'RATE_LIMITED' || code === 'RATE_LIMIT') return 'chatLimit';
  if (code === 'NOT_CONFIGURED' || code === 'CHAT_NOT_CONFIGURED' || code === 'SERVICE_NOT_CONFIGURED' || code === 'AI_NOT_CONFIGURED') return 'chatNotConfigured';
  if (status === 400 || status === 413 || code === 'BAD_REQUEST' || code === 'INVALID_REQUEST') return 'chatRequestInvalid';
  if (status === 504 || code === 'TIMEOUT') return 'chatTimeout';
  return 'chatUnavailable';
}
async function requestChat(request) {
  const activeAtStart = document.activeElement;
  const sequence = ++chatRequestSequence;
  chatRetryRequest = request;
  chatErrorState = null;
  renderChatError();
  let focusMoved = false;
  const trackFocus = event => {
    if (event.target !== document.body && event.target !== document.documentElement && event.target !== document.getElementById('chat-input')) focusMoved = true;
  };
  setChatBusy(true);
  document.addEventListener('focusin', trackFocus, true);
  chatController = new AbortController();
  const timer = setTimeout(() => chatController && chatController.abort(), 30000);
  try {
    const response = await fetch('/api/chat', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal: chatController.signal,
    });
    let data;
    try { data = await response.json(); }
    catch {
      if (response.ok) throw new Error('invalid-response');
      data = {};
    }
    if (sequence !== chatRequestSequence) return;
    if (!response.ok) {
      const key = chatErrorKey(response.status, data);
      const retryAfter = Number(response.headers.get('Retry-After') || data && data.retryAfterSeconds || 0);
      chatErrorState = { key, retryable: key !== 'chatNotConfigured' && key !== 'chatRequestInvalid',
        retryAt: key === 'chatLimit' ? Date.now() + (Number.isFinite(retryAfter) ? Math.min(Math.max(retryAfter, 1), 86400) : 60) * 1000 : 0 };
      renderChatError();
      return;
    }
    if (data.mode !== 'hosted-ai' || typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 24000) throw new Error('invalid-response');
    const body = botSay(data.answer);
    renderChatCitations(body, data.citations);
    renderChatPrograms(body, data.programs);
    runChatActions(body, data.actions);
    rememberChatContext(data);
    chatHistory = [...request.messages, { role: 'assistant', content: data.answer.slice(0, CHAT_USER_LIMIT) }].slice(-CHAT_HISTORY_LIMIT);
    chatRetryRequest = null;
    if (chatOpen) anchorChatAnswer(body); else chatPendingAnswer = body;
  } catch (error) {
    if (sequence !== chatRequestSequence) return;
    chatErrorState = { key: error && error.name === 'AbortError' ? 'chatTimeout' : 'chatUnavailable', retryable: true };
    renderChatError();
  } finally {
    clearTimeout(timer);
    document.removeEventListener('focusin', trackFocus, true);
    if (sequence === chatRequestSequence) {
      chatController = null; setChatBusy(false); renderChatError();
      document.getElementById('chat-context-status').textContent = '';
      if (chatOpen && !focusMoved && document.getElementById('chat-window').contains(activeAtStart)) document.getElementById('chat-input').focus({ preventScroll: true });
    }
  }
}
function renderChatError() {
  const panel = document.getElementById('chat-error');
  if (!panel) return;
  clearTimeout(chatRetryTimer);
  panel.replaceChildren();
  panel.hidden = !chatErrorState;
  if (!chatErrorState) return;
  const message = document.createElement('p');
  message.textContent = t(chatErrorState.key);
  panel.appendChild(message);
  if (chatErrorState.retryable && chatRetryRequest) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.id = 'chat-retry';
    retry.textContent = t('chatRetry');
    retry.disabled = chatBusy || Number(chatErrorState.retryAt || 0) > Date.now();
    retry.addEventListener('click', () => {
      if (!chatBusy && chatRetryRequest) requestChat({ ...chatRetryRequest, language: LANG === 'es' ? 'es' : 'en', comparisonSchoolIds: getComparisonSchoolIds(), context: getChatContext() });
    });
    panel.appendChild(retry);
    if (Number(chatErrorState.retryAt || 0) > Date.now()) chatRetryTimer = setTimeout(renderChatError, chatErrorState.retryAt - Date.now() + 20);
  }
}
function resetChat() {
  ++chatRequestSequence;
  if (chatController) chatController.abort();
  chatController = null;
  chatHistory = [];
  chatHasStarted = false;
  chatFocusedSchoolIds = []; chatLastProgramIds = []; chatDataRevision = null; chatUseQuizContext = false; chatPendingAnswer = null;
  chatRetryRequest = null;
  chatErrorState = null;
  clearTimeout(chatRetryTimer);
  document.getElementById('chat-messages').replaceChildren();
  document.getElementById('chat-input').value = '';
  botSay(t('chatWelcome'));
  setChatBusy(false);
  renderChatError();
  renderChatContext();
  document.getElementById('chat-context-status').textContent = '';
  document.getElementById('chat-input').focus();
}
function officialChatUrl(value) {
  const normalized = SchoolUtils.safeUrl(value);
  if (!normalized) return null;
  const url = new URL(normalized);
  const host = url.hostname.toLowerCase();
  const official = ['lausd.org', 'lausd.net', 'cde.ca.gov', 'data.ca.gov'].some(domain => host === domain || host.endsWith('.' + domain)) ||
    host === 'sites.google.com' && url.pathname.startsWith('/lausd.net/');
  return url.protocol === 'https:' && official ? url.href : null;
}
function appendChatSource(parent, source) {
  const url = officialChatUrl(source && (source.url || source.sourceUrl));
  if (!url) return false;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = String(source.title || t('sourceDetails')).slice(0, 240);
  parent.appendChild(link);
  if (/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt || '')) {
    const date = document.createElement('time');
    date.dateTime = source.checkedAt;
    date.textContent = t('sourceChecked', { date: source.checkedAt });
    parent.appendChild(date);
  } else {
    const unknown = document.createElement('span');
    unknown.textContent = t('chatDateUnknown');
    parent.appendChild(unknown);
  }
  return true;
}
function renderChatCitations(parent, citations) {
  if (!Array.isArray(citations)) return;
  const section = document.createElement('section');
  section.className = 'chat-sources';
  const heading = document.createElement('h3');
  heading.textContent = t('chatSources');
  section.appendChild(heading);
  const list = document.createElement('ol');
  const seen = new Set();
  citations.slice(0, 12).forEach(source => {
    if (!source || typeof source !== 'object') return;
    const normalized = officialChatUrl(source.url || source.sourceUrl);
    if (!normalized) return;
    const canonical = new URL(normalized); canonical.hash = '';
    if (seen.has(canonical.href)) return;
    seen.add(canonical.href);
    const item = document.createElement('li');
    if (appendChatSource(item, source)) {
      list.appendChild(item);
    }
  });
  if (list.children.length) { section.appendChild(list); parent.appendChild(section); }
}
function renderChatPrograms(parent, programs) {
  if (!Array.isArray(programs)) return;
  const container = document.createElement('div');
  container.className = 'chat-programs';
  programs.slice(0, 6).forEach(program => {
    if (!program || typeof program !== 'object' || !officialChatUrl(program.sourceUrl)) return;
    const card = document.createElement('article');
    card.className = 'chat-program-card';
    const heading = document.createElement('h3');
    heading.textContent = String(program.programName || program.schoolName || t('verifiedProgram'));
    card.appendChild(heading);
    const school = allSchools.find(record => SchoolUtils.schoolId(record) === program.schoolId);
    const campus = document.createElement('p');
    campus.className = 'chat-program-campus';
    campus.textContent = school ? school.name : String(program.schoolName || '');
    card.appendChild(campus);
    const description = document.createElement('p');
    description.textContent = String(LANG === 'es' ? program.descriptionEs || program.description || '' : program.description || '').slice(0, 4000);
    card.appendChild(description);
    if (school) {
      const grades = document.createElement('p');
      grades.textContent = gradeLabel(school);
      card.appendChild(grades);
    }
    const eligibility = LANG === 'es' ? program.eligibilityNoteEs || program.eligibilityNote : program.eligibilityNote;
    const locationNote = LANG === 'es' ? program.locationNoteEs || program.locationNote : program.locationNote;
    for (const value of [eligibility, locationNote]) {
      if (typeof value !== 'string' || !value.trim()) continue;
      const note = document.createElement('p');
      note.className = 'chat-program-note';
      note.textContent = value.slice(0, 2000);
      card.appendChild(note);
    }
    const source = document.createElement('p');
    source.className = 'chat-program-source';
    appendChatSource(source, { sourceUrl: program.sourceUrl, title: t('sourceDetails'), checkedAt: program.checkedAt });
    card.appendChild(source);
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'chat-add-school';
    add.dataset.chatSchoolId = String(program.schoolId || '');
    add.textContent = t('chatAddComparison');
    add.disabled = !school;
    const result = document.createElement('p');
    result.className = 'chat-action-result';
    result.setAttribute('role', 'status');
    if (!school) result.textContent = t('chatUnknownSchool');
    add.addEventListener('click', () => showChatActionResult(result, [program.schoolId]));
    card.appendChild(add);
    card.appendChild(result);
    container.appendChild(card);
  });
  if (container.children.length) parent.appendChild(container);
  syncChatComparisonUI();
}
function showChatActionResult(target, ids) {
  let result;
  try { result = addSchoolIdsToComparison(ids); }
  catch { target.textContent = t('chatActionFailed'); return; }
  const parts = [];
  if (result.added.length) parts.push(t('chatActionAdded', { names: result.added.join(', ') }));
  if (result.existing.length) parts.push(t('chatActionExisting', { names: result.existing.join(', ') }));
  if (result.rejected.some(item => item.reason === 'limit')) parts.push(t('compareLimit'));
  if (result.rejected.some(item => item.reason !== 'limit')) parts.push(t('chatUnknownSchool'));
  if (!result.persisted) parts.push(t('chatLocalOnly'));
  if (!parts.length) parts.push(t('chatActionFailed'));
  target.textContent = parts.join(' ');
  if (result.total > 0) {
    const view = document.createElement('button');
    view.type = 'button'; view.className = 'chat-inline-comparison';
    view.dataset.chatViewComparison = 'true'; view.textContent = t('chatViewComparison');
    view.addEventListener('click', viewChatComparison);
    target.appendChild(document.createTextNode(' ')); target.appendChild(view);
  }
  syncChatComparisonUI();
}
function runChatActions(parent, actions) {
  if (!Array.isArray(actions)) return;
  actions.slice(0, 3).forEach(action => {
    if (!action || action.type !== 'add_to_comparison' || !Array.isArray(action.schoolIds)) return;
    const status = document.createElement('p');
    status.className = 'chat-action-result chat-model-action';
    status.setAttribute('role', 'status');
    parent.appendChild(status);
    showChatActionResult(status, action.schoolIds.slice(0, 12));
  });
}
