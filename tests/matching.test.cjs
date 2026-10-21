const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ URL });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../lausd_magnet_app/web/school-utils.js'), 'utf8'), context);
const utils = context.SchoolUtils;
const plain = value => JSON.parse(JSON.stringify(value));

test('actual K–12 and 4–12 ranges overlap every applicable grade group', () => {
  const schools = [
    { id: 'k12', name: 'K–12 Campus', low_grade: 'K', high_grade: '12' },
    { id: '4to12', name: 'Grades 4–12 Campus', low_grade: '4', high_grade: '12' },
    { id: 'middle', name: 'Middle Campus', low_grade: '6', high_grade: '8' },
  ];
  assert.equal(utils.servesGrade(schools[0], '9'), true);
  assert.equal(utils.servesGrade(schools[1], '3'), false);
  assert.deepEqual(plain(utils.matchesForGrade(schools, 'high', ['any'], []).map(school => school.id)), ['4to12', 'k12']);
  assert.equal(utils.matchesForGrade(schools, 'mid', ['any'], []).length, 3);
  assert.deepEqual(plain(utils.matchesForGrade(schools, 'K', ['any'], []).map(school => school.id)), ['k12']);
  assert.deepEqual(plain(utils.matchesForGrade(schools, '4', ['any'], []).map(school => school.id)), ['4to12', 'k12']);
});

test('missing, reversed, and invalid grade ranges never become eligibility claims', () => {
  for (const school of [
    { low_grade: 'K' }, { low_grade: '6', high_grade: null },
    { low_grade: '9', high_grade: '6' }, { low_grade: 'K', high_grade: 'unknown' },
  ]) {
    assert.equal(utils.gradeRange(school).known, false);
    assert.equal(utils.overlapsGrades(school, 0, 12), false);
  }
  assert.equal(utils.parseGrade('KG'), 0);
  assert.equal(utils.parseGrade('09'), 9);
  assert.equal(utils.parseGrade('13'), null);
  assert.equal(utils.matchesForGrade([], 'invalid', ['any'], []).length, 0);
});

test('school-name terms do not substitute for sourced program interests', () => {
  const school = { id: '123', name: 'Science and Technology Campus', low_grade: '6', high_grade: '12' };
  assert.deepEqual(plain(utils.interestMatch(school, ['science'], [])), { verified: [], nameOnly: ['science'] });
  assert.equal(utils.matchesForGrade([school], 'high', ['science'], []).length, 0);
  const evidence = [{ schoolName: school.name, interests: ['arts'], sourceUrl: 'https://school.lausd.org/program' }];
  assert.equal(utils.matchesForGrade([school], 'high', ['science'], evidence).length, 0);
  assert.equal(utils.matchesForGrade([school], 'high', ['arts'], evidence).length, 1);
});

test('verified evidence supports several programs and stable IDs without invalid URLs', () => {
  const school = { id: '123', name: 'Renamed Campus', low_grade: '6', high_grade: '12' };
  const evidence = [
    { schoolId: '123', interests: ['science', 'medical'], sourceUrl: 'https://school.lausd.org/science' },
    { schoolName: 'Renamed Campus', interests: ['arts'], sourceUrl: 'https://school.lausd.org/arts' },
    { schoolId: '123', interests: ['engineer'], sourceUrl: 'javascript:alert(1)' },
    { schoolName: 'Other Campus', interests: ['tech'], sourceUrl: 'https://school.lausd.org' },
  ];
  assert.deepEqual(plain(utils.verifiedInterests(school, evidence)), ['science', 'medical', 'arts']);
});

test('HTML and data attributes escape markup, quotes, and ampersands', () => {
  const malicious = `O'Brien "Magnet" <img src=x onerror=alert(1)> & school`;
  const escaped = utils.escapeHtml(malicious);
  assert.equal(escaped, 'O&#39;Brien &quot;Magnet&quot; &lt;img src=x onerror=alert(1)&gt; &amp; school');
  assert.equal(utils.escapeHtml(null), '');
  assert.equal(utils.safeUrl('javascript:alert(1)'), null);
  assert.equal(utils.safeUrl('data:text/html,evil'), null);
  assert.equal(utils.safeUrl('https://user:password@example.com'), null);
  assert.equal(utils.safeUrl('https://school.lausd.org/path?q=a&b=2'), 'https://school.lausd.org/path?q=a&b=2');
});

test('rendered directory and result cards escape school data and delegate actions', () => {
  const browser = vm.createContext({ URL, document: { addEventListener() {} }, t: key => key });
  for (const file of ['school-utils.js', 'app.js', 'quiz.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../lausd_magnet_app/web', file), 'utf8'), browser);
  }
  browser.record = { name: 'A\" onmouseover=\"alert(1)<script>evil</script>', address: '<img src=x onerror=alert(1)>',
    low_grade: 'K', high_grade: '12', website: 'javascript:alert(1)' };
  for (const render of ['renderCard(record, 0)', 'resultCardHtml(record, 0)']) {
    const html = vm.runInContext(render, browser);
    assert.ok(!html.includes('<script>'));
    assert.ok(!html.includes('<img'));
    assert.ok(!html.includes('onclick='));
    assert.ok(!html.includes('href="javascript:'));
    assert.ok(html.includes('data-school-name="A&quot; onmouseover=&quot;alert(1)&lt;script&gt;'));
    assert.ok(html.includes('data-action="compare"'));
  }
});

test('result URLs accept exact and legacy grades, reject invalid grade and interests', () => {
  const browser = vm.createContext({ URL, document: { addEventListener() {} }, location: { hash: '' } });
  for (const file of ['school-utils.js', 'quiz.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../lausd_magnet_app/web', file), 'utf8'), browser);
  }
  for (const hash of ['#results/K/tech/match', '#results/12/any/match', '#results/high/arts/quality']) {
    browser.location.hash = hash;
    assert.equal(vm.runInContext('loadFromURL()', browser), true);
  }
  for (const hash of ['#results/13/tech/match', '#results/K/unknown/match', '#results/%XX/arts/match']) {
    browser.location.hash = hash;
    assert.equal(vm.runInContext('loadFromURL()', browser), false);
  }
});
