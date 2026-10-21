'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { spawnSync } = require('node:child_process');
const {
  INPUT_PATHS, OUTPUT_PATH, readCatalogSources, buildCatalog, renderModule, generateCatalog
} = require('../scripts/build-chat-data.cjs');
const ROOT_DIR = path.resolve(__dirname, '..');
const clone = value => JSON.parse(JSON.stringify(value));
const sources = () => readCatalogSources(ROOT_DIR);

test('tracked server catalog exactly matches deterministic reviewed-program generation', () => {
  const input = sources();
  const first = buildCatalog(input);
  const second = buildCatalog({ ...clone(input), schools: [...input.schools].reverse(), evidence: [...input.evidence].reverse() });
  assert.deepEqual(first, second);
  assert.equal(first.programs.length, 11);
  assert.match(first.dataRevision, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(fs.readFileSync(path.join(ROOT_DIR, OUTPUT_PATH), 'utf8'), renderModule(first));
  const command = spawnSync(process.execPath, [path.join(ROOT_DIR, 'scripts/build-chat-data.cjs'), '--check'], { encoding: 'utf8' });
  assert.equal(command.status, 0, command.stderr);
});

test('server exports contain only reviewed records and explicitly label campus grade ranges', async () => {
  const catalog = await import(pathToFileURL(path.join(ROOT_DIR, OUTPUT_PATH)).href);
  const input = sources();
  const byId = new Map(input.schools.map(school => [school.id, school]));
  assert.equal(catalog.VERIFIED_PROGRAMS.length, input.evidence.length);
  assert.equal(catalog.SOURCE_INFO.programEvidence.reviewedProgramCount, 11);
  assert.equal(catalog.SOURCE_INFO.campusDirectory.checkedAt, '2026-10-21');
  assert.equal(catalog.SOURCE_INFO.gradeScope, 'campus');
  for (const program of catalog.VERIFIED_PROGRAMS) {
    const campus = byId.get(program.schoolId);
    assert.equal(program.schoolName, campus.name);
    assert.equal(program.lowGrade, campus.low_grade);
    assert.equal(program.highGrade, campus.high_grade);
    assert.equal(program.gradeScope, 'campus');
    assert.match(program.gradeNote, /campus grade range/u);
    assert.match(program.gradeNoteEs, /rango de grados del campus/u);
    assert.ok(program.descriptionEs);
    assert.equal(Object.isFrozen(program), true);
    assert.equal(Object.isFrozen(program.interests), true);
    assert.ok(!('quality' in program || 'access' in program || 'equity' in program));
  }
  assert.equal(Object.isFrozen(catalog.VERIFIED_PROGRAMS), true);
  const zoo = catalog.VERIFIED_PROGRAMS.find(program => program.schoolId === '19647331936350');
  assert.equal(zoo.offCampus, true);
  assert.ok(zoo.locationNote && zoo.locationNoteEs);
});

test('unreviewed campus names never create programs or imply interest tags', () => {
  const input = sources();
  const baseline = buildCatalog(input).programs;
  input.schools.push({ id: '19647339999999', cds_code: '19647339999999',
    name: 'Medical Science Technology Engineering Arts STEM Magnet', magnet: true, low_grade: 'K', high_grade: '12' });
  input.metadata.recordCount += 1;
  assert.deepEqual(buildCatalog(input).programs, baseline);
});

test('invalid campus joins, duplicate program IDs, tags, and grade ranges fail closed', () => {
  const cases = [
    [input => { input.evidence[0].schoolId = '00000000000000'; }, /matching campus CDS ID/u],
    [input => { input.evidence[0].schoolName = 'Obsolete name'; }, /name mismatch/u],
    [input => { input.evidence.push(clone(input.evidence[0])); }, /Duplicate program ID/u],
    [input => { input.evidence[0].interests.push('gifted'); }, /Unsupported program interest/u],
    [input => { input.evidence[0].interests.push(input.evidence[0].interests[0]); }, /Duplicate program interest/u],
    [input => { input.schools.find(school => school.id === input.evidence[0].schoolId).high_grade = '2'; }, /grade range/u]
  ];
  for (const [mutate, expected] of cases) {
    const input = sources();
    mutate(input);
    assert.throws(() => buildCatalog(input), expected);
  }
});

test('program sources must remain credential-free official HTTPS URLs', () => {
  const invalid = [
    'https://example.org/program',
    'https://school.lausd.org.evil.test/program',
    'javascript:alert(1)',
    'http://school.lausd.org/program',
    'https://user:password@school.lausd.org/program',
    'https://school.lausd.org:444/program',
    'https://sites.google.com/not-lausd.net/program',
    'https://sites.google.com/lausd.net.evil/program',
    'https://school.lausd.org/%3Cscript%3E'
  ];
  for (const sourceUrl of invalid) {
    const input = sources();
    input.evidence[0].sourceUrl = sourceUrl;
    assert.throws(() => buildCatalog(input), /sourceUrl/u, sourceUrl);
  }
});

test('invalid dates, unsafe text, and untranslated or missing caveats fail generation', () => {
  const cases = [
    [input => { input.evidence[0].checkedAt = '2026-02-30'; }, /calendar date/u],
    [input => { input.evidence[0].description = '<script>alert(1)</script>'; }, /plain text/u],
    [input => { input.evidence[0].descriptionEs = 'Texto\u0000oculto'; }, /plain text/u],
    [input => { delete input.evidence[0].descriptionEs; }, /descriptionEs/u],
    [input => { delete input.evidence.find(record => record.eligibilityNote).eligibilityNoteEs; }, /Spanish translation/u],
    [input => { delete input.evidence.find(record => record.offCampus).locationNoteEs; }, /Spanish translation/u],
    [input => { const zoo = input.evidence.find(record => record.offCampus); delete zoo.locationNote; delete zoo.locationNoteEs; }, /bilingual location notes/u]
  ];
  for (const [mutate, expected] of cases) {
    const input = sources();
    mutate(input);
    assert.throws(() => buildCatalog(input), expected);
  }
});

test('multiple programs may share a campus but slug collisions cannot share an ID', () => {
  const input = sources();
  input.evidence.push({ ...clone(input.evidence[0]), programName: 'Additional Reviewed Program' });
  const catalog = buildCatalog(input);
  assert.equal(catalog.programs.length, 12);
  assert.equal(new Set(catalog.programs.map(program => program.programId)).size, 12);
  input.evidence.push({ ...clone(input.evidence[0]), programName: 'Additional/Reviewed Program' });
  assert.throws(() => buildCatalog(input), /Duplicate program ID/u);
});

test('check mode detects changed source inputs and never silently repairs stale output', t => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stem-chat-catalog-'));
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  for (const relativePath of Object.values(INPUT_PATHS)) {
    const target = path.join(temporaryRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT_DIR, relativePath), target);
  }
  const initial = generateCatalog({ rootDir: temporaryRoot });
  assert.equal(initial.changed, true);
  assert.equal(generateCatalog({ rootDir: temporaryRoot, check: true }).changed, false);
  const outputPath = path.join(temporaryRoot, OUTPUT_PATH);
  const originalOutput = fs.readFileSync(outputPath, 'utf8');
  fs.appendFileSync(path.join(temporaryRoot, INPUT_PATHS.programs), '\n// Newly reviewed input change.\n');
  assert.throws(() => generateCatalog({ rootDir: temporaryRoot, check: true }), /missing or stale/u);
  assert.equal(fs.readFileSync(outputPath, 'utf8'), originalOutput);
  const regenerated = generateCatalog({ rootDir: temporaryRoot });
  assert.notEqual(regenerated.dataRevision, initial.dataRevision);
  assert.equal(generateCatalog({ rootDir: temporaryRoot, check: true }).changed, false);
});
