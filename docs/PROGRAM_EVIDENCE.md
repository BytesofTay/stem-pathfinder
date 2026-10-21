# Program evidence seed

Checked on October 21, 2026. This file documents the manually reviewed program records in `lausd_magnet_app/web/program_evidence.js`.

This is a starter collection of 11 program records, not a complete LAUSD magnet program catalog. Campus records from CDE and program facts answer different questions. CDE supplies a campus identifier, name, address, and grade span; an official school or LAUSD program page supplies the program focus. A campus can host several programs, each with different application choices. The campus directory’s grade span is not a guarantee that every program accepts every grade.

## Data contract

`PROGRAM_EVIDENCE` is an array, so multiple program records may reference the same school. Each record has:

- `schoolId`: the campus’s 14-digit CDE CDS code, stored as a string.
- `schoolName`: the exact school name in the refreshed CDE campus directory, retained for readable reconciliation.
- `programName`: the program identity supported by the official source.
- `interests`: a conservative subset of `science`, `tech`, `medical`, `engineer`, and `arts` supported by program content.
- `description`: a short paraphrase of the reviewed source.
- `descriptionEs`: a plain-Spanish translation of the same facts. Official English program and institution names are retained.
- `sourceUrl`: the official school or LAUSD page supporting that paraphrase.
- `checkedAt`: the date the source was reviewed; it does not imply that an undated page was updated that day.
- `eligibilityNote` and `eligibilitySourceUrl` (optional): material application caveats, with a separate source when necessary.
- `eligibilityNoteEs` (present whenever `eligibilityNote` exists): the same application caveat in Spanish.
- `offCampus`, `locationNote`, and `locationNoteEs` (optional): a documented exception where the program operates away from its directory campus. An `offCampus: true` record must show this caveat and must not use the directory campus as its program Directions destination.

Read the source before adding or changing a tag. A word in a campus name, ordinary required science classes, devices issued to students, or a general extracurricular list alone must not be used to label every program at that campus. `tech` refers to technology learning, such as programming or digital citizenship; a medical-technology device alone does not make a computing program. This seed does not assign ratings, admission chances, commute times, transportation eligibility, or guarantees of seats, courses, certificates, internships, or college credit.

## Reviewed records

All sources below are operated by the school or LAUSD. Descriptions are paraphrases. Tags describe the particular documented program and do not rank schools.

| CDE CDS code / campus | Program and supported interests | Evidence reviewed and limits |
| --- | --- | --- |
| `19647330133736` / Science Academy STEM Magnet | Science Academy; science, technology, engineering | The [2026–27 school profile page](https://scienceacademy.lausd.org/apps/pages/TSASchoolProfile) links the [current profile PDF](https://4.files.edl.io/eb22/10/01/26/202758-cfb14674-a810-4781-9ae4-9e7a4507756c.pdf). Page 1 explicitly describes integrating science, technology, engineering, and mathematics; page 2 lists programming/game design and robotics. The same profile states that academic prerequisites and a mandatory assessment precede the lottery. The [admissions FAQ](https://scienceacademy.lausd.org/apps/pages/index.jsp?uREC_ID=4366641&type=d&pREC_ID=2567965) confirms that gifted identification alone does not qualify an applicant. |
| `19647330128710` / Dr. Sammy Lee Medical and Health Science Magnet Elementary | Dr. Sammy Lee; science, medical | [Our Magnet Program](https://leemedes.lausd.org/apps/pages/index.jsp?uREC_ID=3794958&type=d&pREC_ID=2525857) describes human body systems, anatomy, physiology, inquiry, student projects, and classroom visits from CHLA doctors. No claim about gifted admission or a guaranteed medical career is inferred. |
| `19647330130997` / Sylmar Biotech Health and Engineering Magnet | Sylmar Biotech; science, medical, engineering | The [principal’s message](https://sbhem.lausd.org/apps/pages/index.jsp?uREC_ID=4388281&type=d&pREC_ID=2597472) describes biotechnology, health and engineering coursework; project-based learning; labs; and Mission College classes. Reported past internships and certificates are not promised to every student. |
| `19647330137083` / University Pathways Medical Magnet Academy | UMED; science, medical | The official [school home page’s About Us section](https://umedmag.lausd.org/) describes medical coursework, patient care, research, a virtual anatomy table, and simulation manikins. The [LAUSD CTE program page](https://ctelinkedlearning.lausd.org/apps/pages/index.jsp?uREC_ID=3803889&type=d&pREC_ID=2578780) independently lists health science/medical technologies and patient care. A medical device does not by itself justify a computing/technology-interest tag. |
| `19647336058382` / Orville Wright Engineering and Design Magnet | Wright Engineering and Design (STEAM); technology, engineering | The [CTE pathway page](https://wrightms.lausd.org/apps/pages/index.jsp?uREC_ID=4422382&type=d&pREC_ID=2657037) describes engineering design, robotics, building products, and programming. This is an elective pathway, not a guarantee of a particular elective placement. [Applying to Wright](https://wrightms.lausd.org/apps/pages/index.jsp?uREC_ID=4184457&type=d&pREC_ID=2504113) distinguishes Wright Eng/Des (STEAM) from Wright Gifted, which requires gifted identification or school verification. |
| `19647331939040` / Venice Senior High | STEMM Magnet; science, technology, medical, engineering | [About the STEMM Magnet](https://venicehs.lausd.org/apps/pages/STEMM) says admitted students choose Engineering or Biomedical Science and describes programming, 3-D modeling, human-body systems, and medical interventions. These are pathways within the STEMM magnet, not two independent magnet applications. Other Venice programs are not labeled STEMM. |
| `19647331995448` / Francisco Bravo Medical Magnet High | Bravo Medical Magnet; medical | [Magnet Office](https://bravomedhs.lausd.org/apps/pages/index.jsp?uREC_ID=3800696&type=d&pREC_ID=2460573) describes the medical magnet and health-institution partnerships. It explicitly says there are no screening procedures except LAUSD residency and that applicants go through Choices selection. No acceptance guarantee is inferred. Science is not separately tagged solely because this is a medical magnet. |
| `19647331936350` / North Hollywood Senior High | Biological Sciences/Zoo Magnet; science | The school’s [Biological Sciences/Zoo Magnet page](https://northhollywoodhs.lausd.org/apps/pages/index.jsp?uREC_ID=4192124&type=d&pREC_ID=2505670) specifies biological/animal studies and research near the Los Angeles Zoo. It states this program is away from the main campus and linked by shuttle. The general campus map marker must not be presented as this program’s instructional site or a reliable commute destination. Other North Hollywood magnets are not included in this record. |
| `19647331939305` / George Washington Preparatory High | STEAM Magnet; science, technology, engineering, arts | The [STEAM Magnet program description](https://washingtonprephs.lausd.org/apps/pages/index.jsp?uREC_ID=3755455&type=d&pREC_ID=2437110) explicitly names all four interests and says the magnet center shares the comprehensive high school’s campus and extracurricular activities. Community-college study is described as an opportunity, not guaranteed enrollment or credit. |
| `19647336017933` / Lomita Math/Science/Technology Magnet | Lomita STEAM Magnet; technology | [Magnet Information](https://lomitaes.lausd.org/apps/pages/index.jsp?uREC_ID=4239209&type=d&pREC_ID=2514817) specifically describes digital citizenship, project-based learning, and a one-to-one device program. Only technology is tagged. The campus/program name alone is insufficient to add science, engineering, or arts without more specific current evidence. |
| `19647330106997` / Orthopaedic Hospital | Orthopaedic Hospital Medical Magnet; science, medical | [Ortho High — About](https://sites.google.com/lausd.net/orthoprojects/about) describes biotechnology/public-health pathways, medical-themed projects, volunteer and internship opportunities, and Trade-Tech courses. This LAUSD Google Site is reached through the official [school home page](https://www.orthovipers.org/) → Linked Learning, CTE, and Project Based Learning. Availability is not guaranteed for each student. |

## Known scope gaps

- CDE’s campus-level `Magnet = Y` filter is not a complete directory of magnet centers. For example, the official [Roy Romer STEM Magnet](https://royromerms.lausd.org/apps/pages/index.jsp?uREC_ID=4151408&type=d&pREC_ID=2500520) and [Webster STEAM Magnet Center](https://websterms.lausd.org/apps/pages/index.jsp?uREC_ID=4373403&type=d&pREC_ID=2575525) have live program pages, while their campus rows are not in the current filtered seed. This file does not invent campus records to fill that gap.
- An unreviewed campus/program is **not** evidence that it lacks STEM opportunities. The product should say that program details have not been reviewed, and continue to offer the official school link.
- Program pages can retain old application dates. Annual Choices deadlines belong in separately verified district application guidance, not in these persistent program descriptions.
- Refresh the official program sources before each application season. Recheck any material eligibility, location, or curriculum claim when a source changes; remove unsupported claims rather than guessing.

## Reproducible validation

Run from the repository root after either the campus snapshot or program records change. This checks every record against the refreshed campus snapshot, validates source/date and bilingual field consistency, and rejects markup, control characters, non-official program URLs, and scoring fields. All program data is plain text; render it with `textContent` or escape it at the HTML boundary. These checks do not replace reading the linked sources or confirming future course and seat availability.

```sh
node --check lausd_magnet_app/web/program_evidence.js
node <<'NODE'
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({});
const web = 'lausd_magnet_app/web/';
vm.runInContext(fs.readFileSync(web + 'schools_data.js', 'utf8'), context, { timeout: 1000 });
vm.runInContext(fs.readFileSync(web + 'program_evidence.js', 'utf8'), context, { timeout: 1000 });
const { schools, programs, metadata } = vm.runInContext(
  '({schools: SCHOOLS_DATA, programs: PROGRAM_EVIDENCE, metadata: SCHOOL_DATA_SOURCE})',
  context
);
assert.equal(metadata.checkedAt, '2026-10-21');
assert.equal(new URL(metadata.sourceUrl).hostname, 'data.ca.gov');
const byId = new Map(schools.map(school => [school.id, school]));
const tags = new Set(['science', 'tech', 'medical', 'engineer', 'arts']);
const seen = new Set();
const officialProgramUrl = value => {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.username + url.password, '');
  assert(
    url.hostname === 'lausd.org' || url.hostname.endsWith('.lausd.org') ||
    (url.hostname === 'sites.google.com' && url.pathname.startsWith('/lausd.net/')),
    `Non-official program source: ${value}`
  );
  assert(!/[<>\u0000-\u001f\u007f]/u.test(decodeURIComponent(value)));
};
for (const program of programs) {
  const campus = byId.get(program.schoolId);
  assert(campus, `Unmatched program campus: ${program.schoolId}`);
  assert.equal(campus.name, program.schoolName);
  assert.equal(campus.cds_code, program.schoolId);
  assert.equal(campus.magnet, true);
  assert(/^\d{14}$/u.test(program.schoolId));
  const key = program.schoolId + ':' + program.programName;
  assert(!seen.has(key), `Duplicate program: ${key}`);
  seen.add(key);
  assert(program.interests.length > 0);
  assert.equal(new Set(program.interests).size, program.interests.length);
  program.interests.forEach(tag => assert(tags.has(tag)));
  for (const field of ['programName', 'description', 'descriptionEs']) {
    assert.equal(typeof program[field], 'string');
    assert(program[field].trim().length > 0);
  }
  assert.equal(program.checkedAt, '2026-10-21');
  officialProgramUrl(program.sourceUrl);
  if (program.eligibilitySourceUrl) officialProgramUrl(program.eligibilitySourceUrl);
  assert.equal(Boolean(program.eligibilityNote), Boolean(program.eligibilityNoteEs));
  if (program.offCampus) {
    assert(program.locationNote && program.locationNoteEs);
  }
  for (const [field, value] of Object.entries(program)) {
    assert(!['quality', 'access', 'equity', 'score', 'rating'].includes(field));
    if (typeof value === 'string') {
      assert(!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value), field);
      assert(value.length < 1000, field);
    }
  }
}
assert.equal(programs.length, 11);
const zoo = programs.find(program => program.schoolId === '19647331936350');
assert.equal(zoo.offCampus, true);
console.log(`${programs.length} program records: campus IDs, bilingual text, official URLs, dates, and location caveats passed.`);
NODE
```
