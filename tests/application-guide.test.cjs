const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const web = path.join(__dirname, '../lausd_magnet_app/web');
function load({ language = 'en', saved = '[1,4]', changeSource = source => source } = {}) {
  const section = { innerHTML: '', querySelectorAll() { return []; } };
  const reads = [];
  const context = vm.createContext({
    LANG: language,
    // Date-bearing translation keys deliberately have no values. The guide
    // must format all dates/year/checklist text from canonical metadata.
    t: key => `copy:${key}`,
    escapeHtml: value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    document: { getElementById() { return section; } },
    localStorage: { getItem(key) { reads.push(key); return saved; }, setItem() {} }
  });
  vm.runInContext(changeSource(fs.readFileSync(path.join(web, 'application-data.js'), 'utf8')), context);
  vm.runInContext(fs.readFileSync(path.join(web, 'application-guide.js'), 'utf8'), context);
  return { context, section, reads };
}
for (const [date, key] of [['2026-09-30', 'guideUpcoming'], ['2026-10-01', 'guideOpen'], ['2026-11-06', 'guideOpen'], ['2026-11-07', 'guideClosed'], ['2026-11-30', 'guideClosed'], ['2026-12-01', 'guideLate'], ['2027-01-01', 'guideVerify']]) {
  test('application date boundary ' + date, () => {
    assert.equal(load().context.applicationStatusKey(date), key);
  });
}
test('guide renders canonical dates, year, checked date, and saved legacy checklist IDs', () => {
  const { context, section, reads } = load();
  context.renderApplicationGuide(new Date('2026-10-21T20:00:00Z'));
  assert.match(section.innerHTML, /2027–28 school year/u);
  assert.match(section.innerHTML, /October 1–November 6, 2026/u);
  assert.match(section.innerHTML, /December 1, 2026/u);
  assert.match(section.innerHTML, /Dates checked October 21, 2026/u);
  assert.match(section.innerHTML, /Confirm the program’s entry grade/u);
  assert.match(section.innerHTML, /data-checklist-step="1" checked/u);
  assert.match(section.innerHTML, /data-checklist-step="4" checked/u);
  assert.deepEqual(reads, ['stem_checklist_2027_28']);
  assert.ok(!/copy:guide(?:Dates|Checked|Eyebrow|Check[1-4])/u.test(section.innerHTML));
});
test('expired guide and compact summary hide old window dates and retain official navigation', () => {
  const { context, section } = load();
  const now = new Date('2027-01-01T08:00:00Z');
  context.renderApplicationGuide(now);
  const compact = context.applicationDatesSummaryHtml(now);
  for (const html of [section.innerHTML, compact]) {
    assert.match(html, /fresh review/u);
    assert.ok(!/October 1–|November 6|December 1|2026-10-01|2026-11-06|2026-12-01/u.test(html));
    assert.match(html, /www\.lausd\.org/u);
  }
  assert.match(section.innerHTML, /apply\.lausd\.net/u);
});
test('Spanish guide uses canonical Spanish date and checklist text', () => {
  const { context, section } = load({ language: 'es', saved: '{invalid' });
  context.renderApplicationGuide(new Date('2026-10-21T20:00:00Z'));
  assert.match(section.innerHTML, /Año escolar 2027–28/u);
  assert.match(section.innerHTML, /1 de octubre al 6 de noviembre de 2026/u);
  assert.match(section.innerHTML, /Confirmar el grado de ingreso/u);
  assert.match(section.innerHTML, /21 de octubre de 2026/u);
  assert.ok(!section.innerHTML.includes('checked>'));
});
test('a future cycle renders changed dates and year without date-bearing i18n edits', () => {
  const changes = [
    ['2027–28', '2028–29'], ['choices-2027-28', 'choices-2028-29'], ['application:choices:2027-28', 'application:choices:2028-29'],
    ['2026-10-01', '2027-10-01'], ['2026-11-06', '2027-11-06'], ['2026-12-01', '2027-12-01'],
    ['2026-10-21', '2027-10-21'], ['2027-01-01', '2028-01-01'], ['stem_checklist_2027_28', 'stem_checklist_2028_29']
  ];
  const { context, section, reads } = load({ changeSource: source => changes.reduce((text, [before, after]) => text.replaceAll(before, after), source) });
  context.renderApplicationGuide(new Date('2027-10-21T20:00:00Z'));
  assert.match(section.innerHTML, /2028–29 school year/u);
  assert.match(section.innerHTML, /October 1–November 6, 2027/u);
  assert.match(section.innerHTML, /Dates checked October 21, 2027/u);
  assert.deepEqual(reads, ['stem_checklist_2028_29']);
});
