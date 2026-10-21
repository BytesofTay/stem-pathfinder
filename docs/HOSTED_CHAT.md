# Hosted program helper

The browser posts to the same-origin `POST /api/chat` Netlify Function. A bounded AI SDK `ToolLoopAgent` uses OpenAI Chat Completions through Netlify AI Gateway. The default model is `gpt-5.4-mini`. The server searches an exact, generated copy of the reviewed program catalog; it does not search the general web or treat all directory campuses as verified programs.

## Grounding and comparison

- `searchVerifiedPrograms` searches reviewed descriptions, canonical interest tags, and campus grade ranges. Missing grades are never guessed. Results are limited to six per search.
- `getProgramDetails` retrieves canonical facts, source IDs, check dates, entry requirements, and off-campus notes.
- `addToComparison` queues additive school IDs only after retrieval and an explicit comparison request. Unknown IDs, unreviewed schools, duplicates, and additions beyond three schools are rejected.
- Structured final output contains plain answer text and retrieved citation IDs. For factual answers the server rejects invented citation IDs, raw URLs/HTML, and uncited retrieved results. Comparison confirmations discard model prose/citations and use the validated tool state to construct their text and official sources. The server appends mandatory grade, eligibility, and location caveats.
- The browser renders model text with `textContent`, validates official HTTPS source URLs, and applies additions against its actual directory and current comparison. The browser reports which schools were added, already present, or rejected. Its three-school limit is authoritative.

Sources remain the dated, human-reviewed records in `web/program_evidence.js`. They do not prove current seat availability, program-specific grade eligibility, admission probability, or school quality. AI prose can still be mistaken; families can open the linked official sources. This release does not implement live web research or automatic source verification.

## Hosting configuration

Netlify AI Gateway can inject `OPENAI_API_KEY` and `OPENAI_BASE_URL` in hosted Functions on eligible credit-based plans with AI enabled. This project already has a production deployment. No browser key is used. The function resolves configuration when needed, preferring request-scoped `Netlify.env` when available, and explicitly supplies the gateway base URL (with `/v1`) to the provider SDK. Gateway charges use the site's Netlify credits.

If gateway injection is unavailable, configure a server-only `OPENAI_API_KEY` in Netlify's **Functions** environment scope; `OPENAI_BASE_URL` is optional for direct OpenAI. Never put keys into frontend files, repository commits, or `VITE_`/public environment variables. `CHAT_MODEL` overrides the default model. `CHAT_ENABLED=false` disables model requests and returns a clear unavailable state. Redeploy after configuration changes.

Local `npm start` serves the same route. Without server environment credentials it returns `503 NOT_CONFIGURED`; it does not impersonate a working model. To use Netlify's injected gateway in development, use the linked project's `netlify dev`. Deterministic tests need no provider key.

## Bounds and privacy

- Eight transcript messages maximum, 1,200 characters each, 6,000 total; last message must be from the user. HTTP request bodies are limited to 16 KiB, including chunked requests.
- Four model steps, eight tool executions maximum, 1,000 output tokens per model step, zero provider retries, explicit reasoning effort `none`, and a hard 20-second request deadline. The browser cancels after 30 seconds.
- Netlify's function rule limits each domain/IP pair to six requests per minute. A separate, strongly consistent Netlify Blobs record uses conditional writes to atomically reserve **100 requests per UTC day for the entire site**, **20 per IP per day**, and **six per IP per minute**, across function instances. Failed provider calls still consume a reservation. These are request limits, not a dollar-denominated billing cap. They do not cap hosting/Blobs traffic charges.
- The limiter fails closed when storage is unavailable or contention cannot be resolved. One bounded record contains only the current day, counters, and daily SHA-256 IP hashes. It replaces the previous day's state and stores no questions or responses. The local development server uses a separate process-local limiter; it is never the production limiter.
- Chat history stays in browser memory and is sent with the current question to the hosted function/model. The app does not persist prompts/responses or log their contents. Failure logs contain only fixed reason codes and numeric execution metadata, with privacy regression tests. AI SDK telemetry is disabled and provider `store` is false. Ordinary hosting/provider request metadata follows those services' policies. No child name, address, birth date, or other personal detail is needed.
- Foreign browser origins are rejected. This is additional browser isolation, not authentication; public API callers remain subject to the shared limits.

## Catalog and verification

```sh
npm run build:chat-data   # after reviewing any source changes
npm run check:chat-data   # CI fails if the server catalog is stale
npm run test:unit
npm run test:api
npm run test:e2e
```

The generated module includes source hashes, exact CDS joins, stable program IDs, and bilingual caveats. Changes to either school or reviewed program inputs require regeneration and review.

Unit tests use injected AI models and cover tool grounding, input bounds, citation forgery, comparison constraints, provider errors, and deadlines. HTTP tests cover body/origin/configuration errors and atomic limiter races. Browser tests mock the HTTP response to verify source links, plain-text rendering, actual comparison state, Spanish copy, and retries. These checks are distinct from a real hosted gateway smoke test; record the latter in release validation before claiming the model works live.

Primary implementation references: [Netlify AI Gateway](https://docs.netlify.com/build/ai-gateway/overview/), [Netlify Function API](https://docs.netlify.com/build/functions/api/), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-5.4 Mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini). SDK API details were checked against the installed package documentation.
