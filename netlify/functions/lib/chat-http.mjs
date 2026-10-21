import { createChatService, parseChatInput } from './chat-core.mjs';
import { ChatLimitError } from './chat-limit.mjs';

const MAX_BYTES = 16_384;
function json(status, payload, retryAfterSeconds) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (retryAfterSeconds) headers['Retry-After'] = String(retryAfterSeconds);
  if (status === 405) headers.Allow = 'POST';
  return new Response(JSON.stringify(payload), { status, headers });
}
const failure = (status, code, message, retryAfterSeconds) => json(status, { error: { code, message }, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) }, retryAfterSeconds);

const envValue = (env, key) => typeof env?.get === 'function' ? env.get(key) : env?.[key];
export function providerOptions(env = globalThis.Netlify?.env ?? process.env) {
  const apiKey = envValue(env, 'OPENAI_API_KEY');
  let baseURL = envValue(env, 'OPENAI_BASE_URL');
  if (baseURL) {
    const parsed = new URL(baseURL);
    if (parsed.protocol !== 'https:') throw new Error('Provider URL requires HTTPS');
    baseURL = baseURL.replace(/\/+$/, '');
    if (!baseURL.endsWith('/v1')) baseURL += '/v1';
  }
  return { apiKey, baseURL, modelId: envValue(env, 'CHAT_MODEL') || 'gpt-5.4-mini' };
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BYTES) throw new Error('Body too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) { await reader.cancel(); throw new Error('Body too large'); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createChatHandler({ reserve, service, env } = {}) {
  return async function handle(request, { ip } = {}) {
    if (request.method !== 'POST') return failure(405, 'BAD_REQUEST', 'Use POST for chat.');
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return failure(403, 'BAD_REQUEST', 'Use chat from STEM Pathfinder.');
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return failure(415, 'BAD_REQUEST', 'Send JSON.');
    let body;
    try { body = parseChatInput(await readBody(request)); }
    catch { return failure(400, 'BAD_REQUEST', 'Send a valid question and comparison.'); }
    let chat = service;
    if (!chat) {
      try {
        // Resolve runtime configuration when it is used, after reading the body.
        // Netlify's runtime accessor also prefers request-scoped Netlify.env.
        const environment = env ?? globalThis.Netlify?.env ?? process.env;
        const options = providerOptions(environment);
        if (!options.apiKey || envValue(environment, 'CHAT_ENABLED') === 'false') return failure(503, 'NOT_CONFIGURED', 'Hosted AI is not configured.');
        chat = createChatService(options);
      } catch { return failure(503, 'NOT_CONFIGURED', 'Hosted AI is not configured.'); }
    }
    try { await reserve(ip || 'unknown'); }
    catch (error) {
      if (error instanceof ChatLimitError) return failure(429, 'RATE_LIMITED', 'Chat has reached its usage limit. Please try later.', error.retryAfterSeconds);
      return failure(503, 'UNAVAILABLE', 'Chat is temporarily unavailable. Please try later.');
    }
    try { return json(200, await chat(body)); }
    catch (error) {
      // Never return provider details, keys, request bodies, or prompt text.
      if (error.status === 400) return failure(400, 'BAD_REQUEST', 'Send a valid question and comparison.');
      if (error.status === 503) return failure(503, 'NOT_CONFIGURED', 'Hosted AI is not configured.');
      if (error.name === 'TimeoutError' || error.name === 'AbortError' || error.code === 'TIMEOUT') return failure(504, 'TIMEOUT', 'The AI took too long. Please try again.');
      return failure(502, 'UPSTREAM_ERROR', 'The AI could not answer. Please try again.');
    }
  };
}
