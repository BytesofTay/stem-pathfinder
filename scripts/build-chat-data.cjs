#!/usr/bin/env node
'use strict';

// These JavaScript inputs are trusted, checked-in repository data. node:vm is
// used to read their existing const declarations; it is not an untrusted-code
// sandbox and must never evaluate user-provided files or requests.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const INPUT_PATHS = Object.freeze({
  campuses: 'lausd_magnet_app/web/schools_data.js',
  programs: 'lausd_magnet_app/web/program_evidence.js',
  application: 'lausd_magnet_app/web/application-data.js'
});
const OUTPUT_PATH = 'netlify/functions/lib/verified-programs.mjs';
const SUPPORTED_INTERESTS = Object.freeze(['science', 'tech', 'medical', 'engineer', 'arts']);
const GRADE_NOTE = 'This is the campus grade range. Confirm the program’s entry grades and available places with the school.';
const GRADE_NOTE_ES = 'Este es el rango de grados del campus. Confirme con la escuela los grados de ingreso y las plazas disponibles del programa.';
const GRADE_ORDER = Object.freeze({ PK: -2, TK: -1, K: 0,
  ...Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), index + 1]))
});

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function safeText(value, label, maxLength = 1500) {
  requireValue(typeof value === 'string' && value.trim().length > 0, `${label} must be nonempty text`);
  requireValue(value === value.trim() && value.length <= maxLength, `${label} has invalid length or surrounding whitespace`);
  requireValue(!/[<>\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value), `${label} must be plain text without markup or control characters`);
  return value;
}

function validDate(value, label) {
  requireValue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/u.test(value), `${label} must be an ISO calendar date`);
  const date = new Date(`${value}T00:00:00.000Z`);
  requireValue(!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value, `${label} is not a real calendar date`);
  return value;
}

function safeUrl(value, label, allowed) {
  safeText(value, label, 2000);
  requireValue(!/\\/u.test(value), `${label} must not contain backslashes`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be an absolute URL`); }
  requireValue(url.protocol === 'https:' && !url.username && !url.password && !url.port, `${label} must be an HTTPS URL without credentials or a custom port`);
  let decoded;
  try { decoded = decodeURIComponent(value); } catch { throw new Error(`${label} has invalid URL encoding`); }
  requireValue(!/[<>\u0000-\u001f\u007f]/u.test(decoded), `${label} contains unsafe URL encoding`);
  requireValue(allowed(url), `${label} must use an approved official source`);
  return value;
}

function officialProgramUrl(value, label) {
  return safeUrl(value, label, url =>
    url.hostname === 'lausd.org' || url.hostname.endsWith('.lausd.org') ||
    (url.hostname === 'sites.google.com' && url.pathname.startsWith('/lausd.net/'))
  );
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function slug(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

function readCatalogSources(rootDir = ROOT_DIR) {
  const context = vm.createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } });
  const inputHashes = {};
  for (const relativePath of Object.values(INPUT_PATHS)) {
    const source = fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
    inputHashes[relativePath] = sha256(source);
    vm.runInContext(source, context, { filename: relativePath, timeout: 1000 });
  }
  // JSON copies avoid retaining cross-realm objects in validation and output.
  const data = JSON.parse(vm.runInContext(
    'JSON.stringify({schools:SCHOOLS_DATA,metadata:SCHOOL_DATA_SOURCE,evidence:PROGRAM_EVIDENCE,application:APPLICATION_GUIDANCE_DATA})',
    context, { timeout: 1000 }
  ));
  return { ...data, inputHashes };
}

function validateApplicationGuidance(application) {
  requireValue(application && typeof application === 'object', 'Canonical application guidance is required');
  requireValue(application.schemaVersion === 1, 'Unsupported application guidance schema');
  requireValue(/^choices-\d{4}-\d{2}$/u.test(application.cycleId || ''), 'Invalid application cycleId');
  requireValue(/^\d{4}–\d{2}$/u.test(application.schoolYear || ''), 'Application schoolYear must identify one cycle');
  requireValue(application.cycleId === `choices-${application.schoolYear.replace('–', '-')}`, 'Application cycle/year mismatch');
  requireValue(application.sourceId === `application:choices:${application.schoolYear.replace('–', '-')}`, 'Application source ID must match its cycle');
  requireValue(application.applySourceId === `application:portal:${application.cycleId}`, 'Application portal source ID must match its cycle');
  requireValue(application.timeZone === 'America/Los_Angeles', 'Application calendar must use Los Angeles dates');
  requireValue(application.dateGranularity === 'calendar_day' && application.deadlineTime === null && application.lateCloses === null,
    'Only reviewed application calendar dates may be published; unknown times/late closing dates must remain null');
  for (const field of ['opens', 'closes', 'lateOpens', 'checkedAt', 'reviewBy']) validDate(application[field], `application ${field}`);
  requireValue(application.opens <= application.closes && application.closes < application.lateOpens, 'Application date sequence is invalid');
  requireValue(application.checkedAt < application.reviewBy, 'Application review deadline must follow its checked date');
  officialProgramUrl(application.sourceUrl, 'application sourceUrl');
  safeUrl(application.applyUrl, 'application applyUrl', url => url.hostname === 'apply.lausd.net');
  for (const field of ['sourceTitle', 'sourceTitleEs', 'applySourceTitle', 'applySourceTitleEs']) safeText(application[field], `application ${field}`);
  requireValue(application.checklistStorageKey === `stem_checklist_${application.schoolYear.replace('–', '_')}`, 'Application checklist storage key must match the cycle');
  for (const field of ['checklist', 'eligibility', 'limitations']) {
    const items = application[field];
    requireValue(Array.isArray(items) && items.length > 0 && items.length <= 8, `Application ${field} must be a bounded list`);
    const keys = new Set();
    const numericIds = new Set();
    for (const item of items) {
      requireValue(item && /^[a-z][a-z0-9_]{1,60}$/u.test(item.key || '') && !keys.has(item.key), `Application ${field} needs unique stable keys`);
      keys.add(item.key);
      safeText(item.text, `application ${field} text`);
      safeText(item.textEs, `application ${field} Spanish text`);
      if (field === 'checklist') {
        requireValue(Number.isSafeInteger(item.id) && item.id > 0 && !numericIds.has(item.id), 'Application checklist needs unique positive IDs');
        numericIds.add(item.id);
      }
    }
  }
  // Select the published schema so unexpected input fields never reach tools.
  const result = Object.fromEntries(['schemaVersion', 'cycleId', 'schoolYear', 'timeZone', 'dateGranularity', 'opens', 'closes', 'lateOpens', 'deadlineTime', 'lateCloses', 'checkedAt', 'reviewBy', 'sourceId', 'sourceUrl', 'sourceTitle', 'sourceTitleEs', 'applyUrl', 'applySourceId', 'applySourceTitle', 'applySourceTitleEs', 'checklistStorageKey'].map(field => [field, application[field]]));
  for (const field of ['checklist', 'eligibility', 'limitations']) result[field] = application[field].map(item => ({
    ...(field === 'checklist' ? { id: item.id } : {}), key: item.key, text: item.text, textEs: item.textEs
  }));
  return result;
}

function buildCatalog({ schools, metadata, evidence, application, inputHashes }) {
  requireValue(Array.isArray(schools) && schools.length > 0, 'Campus directory must be a nonempty array');
  requireValue(Array.isArray(evidence) && evidence.length > 0, 'Reviewed program evidence must be a nonempty array');
  requireValue(metadata && typeof metadata === 'object', 'Campus source metadata is required');
  requireValue(metadata.recordCount === schools.length, 'Campus metadata recordCount must match the directory');
  const campuses = new Map();
  for (const campus of schools) {
    requireValue(typeof campus.id === 'string' && /^\d{14}$/u.test(campus.id), 'Every campus must have a 14-digit CDS ID');
    requireValue(campus.id === campus.cds_code, `Campus CDS ID mismatch: ${campus.id}`);
    requireValue(!campuses.has(campus.id), `Duplicate campus CDS ID: ${campus.id}`);
    campuses.set(campus.id, campus);
  }

  const seenPrograms = new Set();
  const programs = evidence.map(record => {
    requireValue(record && typeof record === 'object' && !Array.isArray(record), 'Every reviewed program must be an object');
    const campus = campuses.get(record.schoolId);
    requireValue(campus, `Reviewed program has no matching campus CDS ID: ${record.schoolId}`);
    requireValue(campus.name === record.schoolName, `Reviewed program campus name mismatch: ${record.schoolId}`);
    requireValue(campus.magnet === true, `Reviewed program campus is outside the magnet directory: ${record.schoolId}`);
    const schoolName = safeText(record.schoolName, 'schoolName', 300);
    const programName = safeText(record.programName, 'programName', 300);
    const programSlug = record.programSlug === undefined ? slug(programName) : record.programSlug;
    requireValue(typeof programSlug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(programSlug) && programSlug.length <= 160,
      `Program slug must be a lowercase URL-safe name: ${programName}`);
    const programId = `${record.schoolId}-${programSlug}`;
    requireValue(!seenPrograms.has(programId), `Duplicate program ID: ${programId}`);
    seenPrograms.add(programId);
    requireValue(Array.isArray(record.interests) && record.interests.length > 0, `Program must have reviewed interests: ${programId}`);
    requireValue(new Set(record.interests).size === record.interests.length, `Duplicate program interest: ${programId}`);
    requireValue(record.interests.every(interest => SUPPORTED_INTERESTS.includes(interest)), `Unsupported program interest: ${programId}`);
    const lowGrade = campus.low_grade;
    const highGrade = campus.high_grade;
    requireValue(Object.hasOwn(GRADE_ORDER, lowGrade) && Object.hasOwn(GRADE_ORDER, highGrade) &&
      GRADE_ORDER[lowGrade] <= GRADE_ORDER[highGrade], `Campus grade range is missing or invalid: ${record.schoolId}`);
    requireValue(typeof lowGrade === 'string' && typeof highGrade === 'string', `Campus grades must be strings: ${record.schoolId}`);
    const program = {
      programId,
      schoolId: record.schoolId,
      schoolName,
      programName,
      description: safeText(record.description, `description for ${programId}`),
      descriptionEs: safeText(record.descriptionEs, `descriptionEs for ${programId}`),
      lowGrade,
      highGrade,
      gradeScope: 'campus',
      gradeNote: GRADE_NOTE,
      gradeNoteEs: GRADE_NOTE_ES,
      interests: SUPPORTED_INTERESTS.filter(interest => record.interests.includes(interest)),
      sourceUrl: officialProgramUrl(record.sourceUrl, `sourceUrl for ${programId}`),
      checkedAt: validDate(record.checkedAt, `checkedAt for ${programId}`)
    };
    for (const [english, spanish] of [['eligibilityNote', 'eligibilityNoteEs'], ['locationNote', 'locationNoteEs']]) {
      const hasEnglish = record[english] !== undefined;
      const hasSpanish = record[spanish] !== undefined;
      requireValue(hasEnglish === hasSpanish, `${english} must have its Spanish translation: ${programId}`);
      if (hasEnglish) {
        program[english] = safeText(record[english], `${english} for ${programId}`);
        program[spanish] = safeText(record[spanish], `${spanish} for ${programId}`);
      }
    }
    if (record.eligibilitySourceUrl !== undefined) {
      requireValue(program.eligibilityNote, `eligibilitySourceUrl needs an eligibility note: ${programId}`);
      program.eligibilitySourceUrl = officialProgramUrl(record.eligibilitySourceUrl, `eligibilitySourceUrl for ${programId}`);
    }
    if (record.offCampus !== undefined) {
      requireValue(typeof record.offCampus === 'boolean', `offCampus must be boolean: ${programId}`);
      program.offCampus = record.offCampus;
    }
    requireValue(!program.offCampus || (program.locationNote && program.locationNoteEs), `Off-campus program must have bilingual location notes: ${programId}`);
    return program;
  }).sort((a, b) => a.programId < b.programId ? -1 : a.programId > b.programId ? 1 : 0);

  const campusDirectory = {};
  for (const field of ['source', 'dataset', 'schoolYear', 'scope']) {
    campusDirectory[field] = safeText(metadata[field], `campus metadata ${field}`);
  }
  campusDirectory.sourceUrl = safeUrl(metadata.sourceUrl, 'campus sourceUrl', url => url.hostname === 'data.ca.gov');
  campusDirectory.csvUrl = safeUrl(metadata.csvUrl, 'campus csvUrl', url => url.hostname === 'gis.data.ca.gov');
  campusDirectory.checkedAt = validDate(metadata.checkedAt, 'campus checkedAt');
  campusDirectory.recordCount = metadata.recordCount;
  requireValue(typeof metadata.sha256 === 'string' && /^[a-f0-9]{64}$/u.test(metadata.sha256), 'Campus CSV SHA-256 is required');
  campusDirectory.sha256 = metadata.sha256;
  const sourceInputHashes = {};
  for (const relativePath of Object.values(INPUT_PATHS)) {
    requireValue(inputHashes && /^[a-f0-9]{64}$/u.test(inputHashes[relativePath] || ''), `Source hash missing for ${relativePath}`);
    sourceInputHashes[relativePath] = inputHashes[relativePath];
  }
  const reviewedDates = programs.map(program => program.checkedAt).sort();
  const sourceInfo = {
    schemaVersion: 1,
    campusDirectory,
    programEvidence: {
      source: 'Official school and LAUSD program pages',
      checkedAt: reviewedDates[reviewedDates.length - 1],
      earliestCheckedAt: reviewedDates[0],
      reviewedProgramCount: programs.length,
      reviewedCampusCount: new Set(programs.map(program => program.schoolId)).size
    },
    gradeScope: 'campus',
    gradeNote: GRADE_NOTE,
    gradeNoteEs: GRADE_NOTE_ES,
    sourceInputHashes
  };
  const applicationGuidance = validateApplicationGuidance(application);
  sourceInfo.applicationGuidance = { cycleId: applicationGuidance.cycleId, checkedAt: applicationGuidance.checkedAt, reviewBy: applicationGuidance.reviewBy, sourceUrl: applicationGuidance.sourceUrl };
  const dataRevision = `sha256:${sha256(JSON.stringify({ sourceInfo, programs, applicationGuidance }))}`;
  return { programs, sourceInfo, applicationGuidance, dataRevision };
}

function renderModule({ programs, sourceInfo, applicationGuidance, dataRevision }) {
  const json = value => JSON.stringify(value, null, 2).replace(/\u2028/gu, '\\u2028').replace(/\u2029/gu, '\\u2029');
  return `// Generated by scripts/build-chat-data.cjs from trusted repository data.\n` +
    `// Do not edit this file. Regenerate: node scripts/build-chat-data.cjs\n` +
    `// Verify freshness: node scripts/build-chat-data.cjs --check\n` +
    `// Grades below describe campuses; program entry grades are not verified.\n\n` +
    `function deepFreeze(value) {\n` +
    `  if (value && typeof value === 'object') {\n` +
    `    Object.values(value).forEach(deepFreeze);\n` +
    `    Object.freeze(value);\n` +
    `  }\n` +
    `  return value;\n` +
    `}\n\n` +
    `export const DATA_REVISION = ${json(dataRevision)};\n\n` +
    `export const SOURCE_INFO = deepFreeze(${json(sourceInfo)});\n\n` +
    `export const VERIFIED_PROGRAMS = deepFreeze(${json(programs)});\n\n` +
    `export const APPLICATION_GUIDANCE = deepFreeze(${json(applicationGuidance)});\n`;
}

function generateCatalog({ rootDir = ROOT_DIR, check = false } = {}) {
  const catalog = buildCatalog(readCatalogSources(rootDir));
  const output = renderModule(catalog);
  const outputPath = path.join(rootDir, OUTPUT_PATH);
  let previous = null;
  try { previous = fs.readFileSync(outputPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const changed = previous !== output;
  if (check) {
    requireValue(!changed, 'Generated chat catalog is missing or stale. Run: node scripts/build-chat-data.cjs');
  } else if (changed) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const temporaryPath = `${outputPath}.tmp`;
    fs.writeFileSync(temporaryPath, output, 'utf8');
    fs.renameSync(temporaryPath, outputPath);
  }
  return { outputPath, changed, programCount: catalog.programs.length, dataRevision: catalog.dataRevision };
}

if (require.main === module) {
  try {
    requireValue(process.argv.slice(2).every(argument => argument === '--check') && process.argv.length <= 3,
      'Usage: node scripts/build-chat-data.cjs [--check]');
    const check = process.argv.includes('--check');
    const result = generateCatalog({ check });
    console.log(`${check ? 'Verified' : result.changed ? 'Generated' : 'Unchanged'} ${result.programCount} reviewed programs (${result.dataRevision}).`);
  } catch (error) {
    console.error(`Chat catalog: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { INPUT_PATHS, OUTPUT_PATH, SUPPORTED_INTERESTS, readCatalogSources, buildCatalog, renderModule, generateCatalog, validateApplicationGuidance };
