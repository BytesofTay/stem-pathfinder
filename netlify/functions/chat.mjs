import { getStore } from '@netlify/blobs';
import { createChatHandler } from './lib/chat-http.mjs';
import { createChatLimiter } from './lib/chat-limit.mjs';

// getStore is resolved inside the request so the platform context is available.
export default async function chat(request, context) {
  const reserve = async ip => createChatLimiter({ store: getStore({ name: 'stem-pathfinder-chat-usage', consistency: 'strong' }) })(ip);
  return createChatHandler({ reserve })(request, { ip: context.ip });
}

export const config = {
  rateLimit: { action: 'rate_limit', aggregateBy: ['domain', 'ip'], windowSize: 60, windowLimit: 6 },
};
