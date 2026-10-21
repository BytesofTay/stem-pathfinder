# STEM Pathfinder

A bilingual school exploration prototype from **The STEM in Me**. Families choose an intended entry grade and interests, inspect sourced program descriptions, compare up to three schools, and find official LAUSD application guidance.

**Production:** https://stempathfinder.netlify.app — local changes are not live until separately deployed.

## What families can do

- Use a two-question finder with an exact K–12 entry grade. Grade matching uses the directory’s actual lower and upper grades.
- Explore 180 CDE school records flagged as LAUSD magnets. This school-level directory is **not a complete list of Choices programs**.
- Read 11 curated program descriptions in English or Spanish, with official sources, check dates, and relevant admission/location caveats. Unreviewed schools remain in Browse and in grade-only results.
- Save schools and compare up to three, with printing and a shareable shortlist. Shared links contain school names; they do not include checklist marks or private account data.
- Follow the sourced 2027–28 application dates and a browser-local preparation checklist. Marks do not establish submission to LAUSD.
- View campus locations on a map. Known off-campus programs do not link to misleading campus directions.

Interest matching uses the reviewed program metadata, never numerical school ratings or school-name keyword guesses. Campus grades do not establish the specific program’s entry grades, eligibility, current seats, or admission outcome. See [DATA_PROVENANCE.md](DATA_PROVENANCE.md) and [program evidence](docs/PROGRAM_EVIDENCE.md).

## Run locally

```sh
npm ci
npm start
# http://127.0.0.1:3000
```

The frontend is buildless HTML/CSS/JavaScript in `lausd_magnet_app/web/`. Local `server.js` serves it and provides `/api/favorites` with SQLite. Production uses `netlify/functions/favorites.mjs` and Netlify Blobs. A random HttpOnly cookie isolates each browser’s saved schools; there are no accounts or cross-device sign-in. Local storage provides an offline fallback. Comparison and checklist selections stay browser-local.

## Files to review

| File | Responsibility |
| --- | --- |
| `web/school-utils.js` | Pure grade, evidence, URL, and HTML rules |
| `web/app.js` | Directory, map, saved schools, comparison, and shortlist links |
| `web/quiz.js` | Exact entry grade, reviewed interests, and compatible result links |
| `web/program_evidence.js` | Human-reviewed official program facts and Spanish translations |
| `web/schools_data.js` | Dated CDE campus snapshot with CDS IDs and actual grades |
| `web/application-guide.js` | Year-specific official dates and local preparation checklist |
| `web/i18n.js`, `web/chat.js` | Bilingual copy and rule-based help |
| `update_schools.py` | Validated data refresh and review report; never deploys |

Paths beginning `web/` are under `lausd_magnet_app/`.

## Verification

```sh
npm run test:unit
npm run test:api
npm run test:e2e
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -v
```

Node unit checks cover real grade ranges, unknown-data abstention, metadata-only matching, safe rendering, share-link inputs, program joins/translations, location caveats, application-date boundaries, and help responses. The API test checks persistence across restart and guest isolation. Seven Playwright flows target the Node-backed app, including favorites, editable shared shortlists, reopened map-popup controls, current guide copy, and Spanish mobile keyboard use. Chromium must be installed separately for those browser tests.

The separate FastAPI scoring experiment remains isolated from the family-facing app. Its provider calls are mocked by tests; no paid API key is needed to use this website or run the tests.

## Data refresh and publishing

```sh
python3 update_schools.py
# Creates a validated schools_data.js and school-update-report.json; does not publish.
```

The scheduled GitHub workflow runs ingestion guard tests, fetches CDE data, and uploads the proposed snapshot, report, and diff for review. It does not commit or deploy. Review source year, roster differences, grade ranges, and linked websites before shipping. Program evidence is maintained separately and is never overwritten by a directory refresh.

The optional scoring service must not be used as a source of school quality, inclusion, or admission ratings. Never commit `.env` files, API keys, or local account credentials.
