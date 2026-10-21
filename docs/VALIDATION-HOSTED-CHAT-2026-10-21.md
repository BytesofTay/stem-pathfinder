## Verification — hosted program helper (2026-10-21)

Automated checks in an isolated copy of the current repository:

- 73 Node unit checks passed, including the installed AI SDK tool loop and OpenAI-compatible transport with mock models, exact source IDs, canonical action confirmations, privacy-safe diagnostics, input bounds, shared CAS limits, and existing matching/source rules.
- 2 API integration checks passed, including a real local Node route, validation, disabled-provider behavior, favorites persistence across restart, and browser-cookie isolation.
- 13 Playwright flows passed: six hosted-chat client flows with mocked HTTP responses and seven existing finder/favorites/comparison/map/guide/Spanish mobile flows.
- 26 Python ingestion/scoring checks passed. The isolated scoring experiment remains unused by the family-facing app.
- Generated catalog freshness check passed for 11 reviewed programs; revision `sha256:a1f9d882e9a6b9f4bb5cf59d4273a8b22ad80a3055263c385236feec601d4f20`.

These are 114 automated checks. Mocked checks do not establish live provider operation.

Real hosted preview checks:

- First preview `6ad94347ebb5672f4929813e`: real Netlify AI Gateway/OpenAI medical search returned HTTP 200 in 5.56 s with five canonical official citations. Spanish grade 6 / Science Academy assessment query returned HTTP 200 in 4.18 s with the translated mandatory assessment note. Elementary medical search returned HTTP 200 in 4.80 s with the reviewed Dr. Sammy Lee program. Application preparation question returned HTTP 200 in 4.78 s with official program citations and caveats.
- The preview exposed a real comparison failure. A runtime trace on corrected preview `6ad94415fc23ff7d5763b2a5` showed a successful search/details/comparison sequence followed by an HTTP 400 from the provider on the fourth, final model request. The final-step configuration removed tool definitions while sending `tool_choice: none`. This was corrected to retain the definitions and forbid further tool calls. A separate regression audit also found that a valid action could be rejected if its final prose omitted citation IDs; comparison confirmations now derive their text and sources entirely from validated tool state. Factual answers still require retrieved citations. Provider errors remain generic to the browser.
- A corrected-preview invocation initially reported missing configuration; subsequent invocations used the gateway successfully. Configuration is now resolved at use time and prefers request-scoped Netlify.env where the runtime supplies it. The final preview and production checks below verify the shipped configuration.

Limits: reviewed catalog search is not live general-web search. Campus grades do not establish program eligibility or seats. Public chat defaults to100 site-wide requests per UTC day,20 per IP/day,6 per IP/minute; requests are bounded and limiter storage failures fail closed. This is not a dollar cap or a guarantee against all model errors. Provider/hosting billing and ordinary request metadata remain subject to those services.

Final preview `6ad9454869fd0f120c31c945`: the first API request returned HTTP 200 in 6.57 s for the exact Bravo comparison prompt. It returned one validated additive action for CDS `19647331995448`, the canonical official Bravo citation, and the mandatory eligibility/campus-grade caveats. No provider key was added to the repository or browser.

Manual browser verification against the final preview showed the real hosted Bravo response, its official source/check date, and “Added to your comparison.” Opening Saved & compare showed the actual Bravo comparison card. This verifies the model → HTTP → browser action → comparison state flow, independently of mocked Playwright responses. Starter suggestions now hide once a conversation starts to leave more room for answers and sources.
