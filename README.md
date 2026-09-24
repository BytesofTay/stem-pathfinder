# STEM Pathfinder

A prototype that helps families in Los Angeles browse and compare magnet schools with STEM-related interests. It is part of **The STEM in Me** project.

**Demo URL:** https://stempathfinder.netlify.app (deployment availability has not been verified in this repository)

---

## What it does

- **3-step quiz** — grade level → interests → priority → ranked matches
- **Experimental model scores** — the bundled dataset contains 180 schools with generated Quality, Access, and Equity scores; these are not verified school evaluations
- **Interactive map** — all 180 schools pinned on a map, color-coded by score
- **Saved schools** — save schools in the current browser's local storage
- **Share results** — quiz results encode into a URL for sharing with a partner or friend
- **Rule-based chatbot** — answers common questions and navigates parents around the site without any API calls

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS (no framework — runs as a static file) |
| Map | [Leaflet.js](https://leafletjs.com/) + OpenStreetMap tiles |
| Scoring API | FastAPI + [Claude claude-opus-4-6](https://anthropic.com) (async, semaphore-limited) |
| Geocoding | US Census Bureau Geocoder (free, no API key) |
| Deployment | Static files; the demo URL points to Netlify |

---

## File structure

```
lausd_magnet_app/web/
  index.html       — App shell (HTML structure, meta tags, ARIA)
  styles.css       — All styles (mobile-first, CSS custom properties)
  app.js           — Main app: browse, filters, favorites, map, data loading
  quiz.js          — Quiz flow, school matching algorithm, URL sharing
  chat.js          — Rule-based chatbot (no API calls)
  schools_data.js  — 180 schools with AI scores + geocoded lat/lng

scoring_engine.py  — FastAPI scoring backend (Claude API)
convert_magnets.py — TSV → JSON converter
geocode_schools.py — Geocodes school addresses (Census Bureau API)
```

---

## How to run locally

```bash
# Serve the frontend
cd lausd_magnet_app/web
python3 -m http.server 3000

# Optional: run the scoring API after installing requirements
cd ../..
python3 -m pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-key"
python3 scoring_engine.py
```

Open http://localhost:3000

---

## How scores work

Each school is scored by Claude claude-opus-4-6 on three dimensions:

- **Quality (1–10)** — Program rigor and STEM focus. Specialized medical, engineering, and science magnets score highest.
- **Access (1–10)** — How broadly students can enroll. Schools starting at Kindergarten score highest; high schools score lower.
- **Equity (1–10)** — Support for underserved communities. Schools in South LA, East LA, and Watts score highest.

The **Overall** score is the average of all three.

---

## Regenerating scores

```bash
export ANTHROPIC_API_KEY="your-key"
python3 scoring_engine.py
# Then hit: POST http://localhost:8000/score/file
```

## Adding geocoding (for map)

```bash
python3 geocode_schools.py
# Updates schools_data.js with lat/lng — takes ~2 minutes
```

---

## Built for

The project explores how to make a complex school-selection process easier to browse. Families should verify school details, eligibility, application dates, and program fit with LAUSD before making decisions.

## Screenshots and product notes

The interactive experience lives in `lausd_magnet_app/web/`. Screenshots have not yet been captured and verified. The quickest code review path is `quiz.js` for matching and share links, `app.js` for browsing and saved schools, and `scoring_engine.py` for the separate scoring API.

## Safety and configuration

Keep credentials in environment variables. Never commit `.env` files or API keys. The scoring service reads `ANTHROPIC_API_KEY` at runtime; use a local `.env` file or your deployment provider's secret store.

## Roadmap

- Add LLM orchestration around school evidence retrieval and score explanations.
- Auto-fetch and normalize source data on a scheduled job with provenance tracking.
- Move long-running scoring and geocoding work to async workers with retries and status updates.
- Add fixture-backed API tests and browser-level checks for the quiz, saved schools, and share links.

## CI

GitHub Actions compiles the Python code and runs the unit suite on every push and pull request.

## Architecture and evidence

The Python API accepts school records and calls a language model with at most five concurrent requests per batch. Responses are validated as integer scores from 1 through 10; malformed or out-of-range results return a per-school error. The client is initialized only when scoring is requested, so tests and health checks do not require API credentials.

Install dependencies with `pip install -r requirements.txt`, then run `python -m unittest discover -s tests -v`. Tests mock the provider and check successful responses, invalid JSON, out-of-range scores, batch order, per-school failures, and credential-free health checks. They do not measure model accuracy or test the browser flow.

**Limitations:** these scores are experimental model outputs, not verified measures of school quality or equity. School name, address, and magnet status alone do not substantiate those conclusions. Source-backed evidence and evaluation are prerequisites for treating these scores as recommendations.
