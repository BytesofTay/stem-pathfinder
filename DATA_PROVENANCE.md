# School data and score provenance

## School directory

The scheduled updater discovers the newest `california-public-schools-YYYY-YY` CSV published through the [California Open Data Portal](https://data.ca.gov/api/3/action/package_search?q=california-public-schools). The portal record identifies the California Department of Education (CDE) school directory dataset. The updater normalizes school names, grade ranges, addresses, and coordinates into the static application data file.

The checked-in data is a snapshot. Its last refresh is shown in the application. The original July 6, 2026 snapshot did not record the CDE dataset school-year identifier; the updater now saves that identifier on each refreshed snapshot. Confirm a school's current magnet status, grades, eligibility, and application deadlines with LAUSD and the school before acting. A directory entry does not establish that a program is currently accepting applications. Program-focus badges in the interface are keyword matches against school names, not verified curriculum descriptions.

## Experimental estimates

The displayed Quality, Access, and Equity numbers are heuristic estimates in the generated school data, not official CDE/LAUSD ratings and not validated measures of outcomes. In particular, directory fields such as school name, address, or grade range do not establish instructional quality, accessibility, inclusion, or equitable student outcomes. Treat the numbers as experimental sorting aids only; do not interpret ranks, badges, or recommendations as evidence of school quality.

The separate scoring API produces language-model outputs and also has not been evaluated for accuracy. Its outputs must not be presented as verified school ratings.

## Refresh and verification

The refresh workflow records the selected school-year dataset in its log. Before publishing a refreshed snapshot, review its source year, field mapping, row count, and sample records. Report the snapshot date and source dataset year in the application so families can judge freshness.
