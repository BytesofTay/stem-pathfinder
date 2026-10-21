# School data and program evidence

## Campus directory

The October 21, 2026 refresh uses the latest school-year dataset found in the official California Open Data catalog: [California Public Schools 2025–26](https://data.ca.gov/dataset/california-public-schools-2025-26). The dataset year remains visible in the app; a newer retrieval date does not turn it into a 2026–27 dataset.

The CSV is filtered to active LAUSD school records with `Magnet=Y`. The 180 resulting records describe **campuses, not every magnet program or center**. A campus flagged `Magnet=N` can host a magnet center; those centers can therefore be absent. Do not describe this directory as all LAUSD magnet programs. For full options and admission requirements, use LAUSD’s official program information.

Each record preserves its 14-digit CDS ID, official lower and upper grades, full address, coordinates, and source website when recorded. Two source records have no website; those values stay unknown. Grade labels explicitly refer to campus grades. A specific program may have narrower entry grades, screening requirements, a different site, or no available seats.

`SCHOOL_DATA_SOURCE` records the school year, catalog and CSV URLs, retrieval/check/change dates, CSV SHA-256, and record count. `checkedAt` means the source was fetched, not that a person verified each campus. `changedAt` records a change to directory content.

## Reviewed program evidence

[PROGRAM_EVIDENCE.md](docs/PROGRAM_EVIDENCE.md) documents 11 sourced program descriptions in `program_evidence.js`. Records include exact CDS associations, official source links, date checked, documented interests, English/Spanish descriptions, and relevant published caveats.

The finder uses those reviewed interests. A missing description means review coverage is incomplete; it does not mean the school lacks that subject. Unreviewed schools remain available in the full directory and grade-only exploration. Keyword matches in a school name do not establish program facts or quality.

The map plots CDE campus coordinates. The North Hollywood Zoo program explicitly meets away from its parent campus, so its cards and popups suppress parent-campus directions and show a location caveat. Families should confirm any program’s location before traveling.

## Applications

The [LAUSD enrollment calendar](https://www.lausd.org/apps/pages/index.jsp?uREC_ID=4432585&type=d&pREC_ID=2724498), checked October 21, 2026, lists the 2027–28 Choices on-time window as October 1–November 6, 2026 and late applications opening December 1, 2026. The application guide links to that source and the official portal. Its status automatically asks families to recheck current dates after the configured review deadline; it does not invent future annual dates.

The preparation checklist is browser-local. A checkmark is a user-entered reminder, never proof of submission or acceptance.

## Review before publishing

The updater rejects malformed schemas/IDs, invalid/reversed grades, incomplete addresses, implausible coordinates, unexpected source years, duplicate records, small or oversized rosters, and roster changes over its configured threshold. It emits a review report. The weekly workflow prepares artifacts; it does not auto-publish changes. Human-reviewed program descriptions are maintained separately.

## Experimental API

Legacy numerical Quality/Access/Equity values have been removed from the directory snapshot, family UI, matching, map, and help responses. The separate scoring API is an unevaluated experiment. Its model outputs must not be presented as verified school ratings or admission predictions.
