import { createHash } from 'node:crypto';

export class ChatLimitError extends Error {
  constructor(retryAfterSeconds) {
    super('Chat usage limit reached');
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// One bounded, shared record. Conditional writes keep the limits atomic across
// serverless instances; the previous day's counts and daily IP hashes are replaced.
export function createChatLimiter({ store, now = Date.now, dailyLimit = 100, ipDailyLimit = 20, minuteLimit = 6 }) {
  return async function reserve(ip = 'unknown') {
    const timestamp = now();
    const day = new Date(timestamp).toISOString().slice(0, 10);
    const minute = Math.floor(timestamp / 60_000);
    const dayRetry = Math.ceil((Date.parse(`${day}T00:00:00Z`) + 86_400_000 - timestamp) / 1000);
    const client = createHash('sha256').update(`${day}:${ip}`).digest('hex');
    for (let attempt = 0; attempt < 8; attempt++) {
      const current = await store.getWithMetadata('usage-v1', { type: 'json', consistency: 'strong' });
      const usage = current?.data?.day === day ? current.data : { day, total: 0, clients: {} };
      if (!Number.isSafeInteger(usage.total) || usage.total < 0 || !usage.clients || typeof usage.clients !== 'object' || Array.isArray(usage.clients)) {
        throw new Error('Invalid usage record');
      }
      const previous = usage.clients[client] || { count: 0, minute, minuteCount: 0 };
      if (![previous.count, previous.minute, previous.minuteCount].every(Number.isSafeInteger) || previous.count < 0 || previous.minuteCount < 0) {
        throw new Error('Invalid client usage record');
      }
      const minuteCount = previous.minute === minute ? previous.minuteCount : 0;
      if (usage.total >= dailyLimit || previous.count >= ipDailyLimit) throw new ChatLimitError(dayRetry);
      if (minuteCount >= minuteLimit) throw new ChatLimitError(60 - Math.floor(timestamp / 1000) % 60);
      const next = {
        day, total: usage.total + 1,
        clients: { ...usage.clients, [client]: { count: previous.count + 1, minute, minuteCount: minuteCount + 1 } },
      };
      const condition = current ? { onlyIfMatch: current.etag } : { onlyIfNew: true };
      if (current && !current.etag) throw new Error('Missing usage version');
      if ((await store.setJSON('usage-v1', next, condition)).modified) return;
    }
    throw new Error('Usage reservation contention');
  };
}

// Used only by the single-process local development server, never hosted functions.
export function createLocalUsageStore() {
  let value = null;
  let version = 0;
  return {
    async getWithMetadata() {
      return value === null ? null : { data: structuredClone(value), etag: String(version) };
    },
    async setJSON(key, next, condition) {
      if ((condition.onlyIfNew && value !== null) || (condition.onlyIfMatch !== undefined && condition.onlyIfMatch !== String(version))) return { modified: false };
      value = structuredClone(next);
      return { modified: true, etag: String(++version) };
    },
  };
}
