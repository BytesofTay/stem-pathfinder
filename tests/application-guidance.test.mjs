import { test } from 'node:test';
import assert from 'node:assert/strict';
import applicationData from '../lausd_magnet_app/web/application-data.js';
import { APPLICATION_GUIDANCE } from '../netlify/functions/lib/verified-programs.mjs';
import { getApplicationGuidance } from '../netlify/functions/lib/application-guidance.mjs';
const { APPLICATION_GUIDANCE_DATA, ApplicationGuidanceUtils } = applicationData;

test('generated application data and browser data are identical and immutable', () => {
  assert.deepEqual(APPLICATION_GUIDANCE, APPLICATION_GUIDANCE_DATA);
  assert.equal(Object.isFrozen(APPLICATION_GUIDANCE), true);
  assert.equal(Object.isFrozen(APPLICATION_GUIDANCE.checklist[0]), true);
});
for (const [instant, localDate, status] of [
  ['2026-10-01T06:59:59.999Z', '2026-09-30', 'upcoming'],
  ['2026-10-01T07:00:00.000Z', '2026-10-01', 'on_time'],
  ['2026-11-07T07:59:59.999Z', '2026-11-06', 'on_time'],
  ['2026-11-07T08:00:00.000Z', '2026-11-07', 'between_windows'],
  ['2026-12-01T07:59:59.999Z', '2026-11-30', 'between_windows'],
  ['2026-12-01T08:00:00.000Z', '2026-12-01', 'late_started'],
  ['2027-01-01T07:59:59.999Z', '2026-12-31', 'late_started'],
  ['2027-01-01T08:00:00.000Z', '2027-01-01', 'needs_review']
]) {
  test('Los Angeles calendar boundary ' + instant, () => {
    const now = new Date(instant);
    const view = getApplicationGuidance({ now });
    assert.equal(view.asOfLocalDate, localDate);
    assert.equal(view.status, status);
    assert.deepEqual(view, ApplicationGuidanceUtils.localizedView(APPLICATION_GUIDANCE_DATA, { now }));
  });
}
test('closing-day guidance never invents a midnight cutoff or live portal availability', () => {
  const view = getApplicationGuidance({ topic: 'dates', now: new Date('2026-11-07T07:59:59Z') });
  assert.match(view.statusMessage, /deadline is today/u);
  assert.match(view.statusMessage, /exact cutoff time and portal status/u);
  assert.equal(view.dateGranularity, 'calendar_day');
  assert.equal(view.deadlineTime, null);
  assert.equal(view.lateCloses, null);
  assert.ok(!/until midnight|still open/u.test(view.summary));
});
test('stale guidance withholds window facts and canonical summaries cannot revive expired dates', () => {
  for (const language of ['en', 'es']) {
    const view = getApplicationGuidance({ language, now: new Date('2027-01-01T08:00:00Z') });
    assert.equal(view.status, 'needs_review');
    assert.equal(view.dates, null);
    assert.equal(view.datesSummary, null);
    assert.ok(!/\b(?:October 1|November 6|December 1|1 de octubre|6 de noviembre|1 de diciembre|2026-10-01|2026-11-06|2026-12-01)\b/u.test(view.summary));
    assert.equal(view.checklist.length, 4);
    assert.equal(view.sources[0].id, 'application:choices:2027-28');
  }
});
test('topics and Spanish copy remain canonical, bounded, and distinguish preparation from submission', () => {
  const now = new Date('2026-10-21T20:00:00Z');
  const checklist = getApplicationGuidance({ language: 'es', topic: 'checklist', now });
  assert.equal(checklist.checklist.length, 4);
  assert.equal(checklist.dates, null);
  assert.deepEqual(checklist.eligibility, []);
  assert.match(checklist.summary, /Confirmar el grado de ingreso/u);
  assert.match(checklist.summary, /no envían una solicitud ni confirman la admisión/u);
  assert.ok(!checklist.summary.includes('Checklist marks'));
  const eligibility = getApplicationGuidance({ topic: 'eligibility', now });
  assert.equal(eligibility.eligibility.length, 2);
  assert.deepEqual(eligibility.checklist, []);
  assert.equal(eligibility.dates, null);
  assert.match(eligibility.summary, /does not establish a student’s eligibility/u);
  for (const language of ['en', 'es']) for (const topic of ['all', 'dates', 'eligibility', 'checklist']) {
    const view = getApplicationGuidance({ language, topic, now });
    assert.ok(view.summary.length < 2200);
    assert.ok(!/https?:\/\/|<\/?[a-z]/iu.test(view.summary));
    assert.equal(view.applyUrl, 'https://apply.lausd.net');
    assert.equal(new URL(view.sources[0].url).hostname, 'www.lausd.org');
  }
});
test('invalid clocks and unsupported topics fail rather than making date claims', () => {
  assert.throws(() => getApplicationGuidance({ now: new Date('invalid') }), /valid application guidance date/u);
  assert.throws(() => getApplicationGuidance({ topic: 'guess_admission' }), /Unknown application guidance topic/u);
  assert.equal(ApplicationGuidanceUtils.statusForDate('2026-02-30'), 'needs_review');
});
