# October 21, 2026 implementation and verification

This document records local verification for the release. Publishing evidence is recorded separately in GitHub and Netlify.

## Implemented

- Exact K–12 intended entry grade, true CDE campus ranges, and compatible legacy grade-group result links.
- Refreshed 180 campus records from the latest discovered official 2025–26 source; 178 directory websites, two unknown.
- Eleven reviewed official program descriptions with English/Spanish copy, source dates, and admission/location caveats.
- No unsupported numerical ratings in family-facing matching, directory, map, or chat.
- Three-school comparison, print controls, shared shortlist, and browser-local checklist.
- Source-linked 2027–28 Choices dates, with a review deadline for dynamic status wording.
- Escaped data rendering, safe external URLs, delegated school controls, and search debounce.
- Validated refresh artifacts for review; weekly production auto-deployment removed.

## Passed checks

- Python: 26 tests (nine scoring-service tests and 17 directory-ingestion tests).
- Node: 18 unit/integration checks for grades, evidence joins, translations, safe rendering/links, application-date boundaries, help responses, and shortlist serialization/restoration.
- Saved-school API: one test covering read/write, visitor isolation, validation, and persistence across restart. The sandbox initially denied localhost access; the test passed with approved local-network access.
- All frontend JavaScript syntax checks.
- All seven Playwright tests passed in an isolated Chromium browser, including shared results, fresh-browser shortlist restoration and edits, saved-school API persistence and isolation, grade filtering, application guidance, Spanish mobile keyboard use, and reopened map-popup state. A clean run completed in 5.5 seconds.

## Release-review regressions

- Reopened Leaflet popups now refresh favorite/comparison controls. The browser regression opens, saves, closes, and reopens a real marker.
- Editing a shared shortlist updates the existing shared URL. Recipient remove/reload and add/reload checks pass.
- An overlapping local test launch briefly collided with trace output. A clean suite run used a separate artifact directory and passed all seven tests.

## Interactive browser checks

Using the local Node/SQLite app in the in-app browser:

- Completed the exact-grade, two-question finder; grade 9 + technology showed three sourced campuses including Science Academy (campus grades 6–12).
- Confirmed Lake Balboa K–12 remains visible for grade 9. Search also matches city/address, so the UI correctly returned another school in Lake Balboa for the short query.
- Confirmed Sherman Oaks Center for Enriched Studies is absent for K and appears for grade 4 with campus grades 4–12.
- Saved a school, selected three for comparison, and confirmed a fourth is rejected with a clear message.
- Checked side-by-side comparison on desktop and stacked layout at 375 × 812; English/Spanish descriptions and requirement caveats were readable.
- Confirmed language switching preserves the comparison view and the language persists after reload.
- Opened the map and its normal zoom/attribution controls.
- Checked application help against the sourced October–November 2026 window and clicked a local preparation checkbox.
- Browser runtime error/warning log was empty at the checked point.

The share action displayed “Shortlist link copied.” A prior in-app browser attempt to open a clipboard-derived URL was blocked as an invalid URL. The isolated Playwright test now verifies a generated shortlist in a fresh browser context, including reload. Printing controls/styles were added; printed output was not visually verified.

## Remaining scope

Program-level entry-grade verification and full program coverage are still incomplete; the UI labels campus grades, shows review coverage, and asks families to confirm program requirements. Real-family usability testing, travel-time integration, and broader evidence review remain follow-ups. Production deployment is verified separately after local checks and GitHub CI.
