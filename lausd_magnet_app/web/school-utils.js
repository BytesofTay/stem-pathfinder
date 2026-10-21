/* Shared directory facts. Unknown grades and unverified interests stay unknown. */
(function (root) {
  'use strict';
  const INTERESTS = ['science', 'tech', 'medical', 'engineer', 'arts'];
  const NAME_TERMS = {
    science: ['science', 'stem', 'environment', 'earth', 'ecology', 'museum'],
    tech: ['stem', 'tech', 'computer', 'digital', 'technology'],
    medical: ['medical', 'health', 'biotech', 'bio-tech'],
    engineer: ['engineering', 'aerospace', 'polytechnic'],
    arts: ['arts', 'performing', 'visual', 'film', 'theater', 'drama', 'music'],
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[ch]);
  }

  function safeUrl(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value.trim());
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
      return url.href;
    } catch { return null; }
  }

  function parseGrade(value) {
    if (value == null || String(value).trim() === '') return null;
    const grade = String(value).trim().toUpperCase();
    if (grade === 'TK') return -1;
    if (grade === 'K' || grade === 'KG' || grade === 'KINDERGARTEN') return 0;
    if (!/^\d{1,2}$/.test(grade)) return null;
    const number = Number(grade);
    return number >= 1 && number <= 12 ? number : null;
  }

  function gradeRange(school) {
    const low = parseGrade(school && school.low_grade);
    const high = parseGrade(school && school.high_grade);
    return { low, high, known: low !== null && high !== null && low <= high };
  }

  function servesGrade(school, grade) {
    const range = gradeRange(school);
    const target = parseGrade(grade);
    return range.known && target !== null && range.low <= target && target <= range.high;
  }

  function overlapsGrades(school, low, high) {
    const range = gradeRange(school);
    return range.known && range.low <= high && range.high >= low;
  }

  function schoolId(school) {
    return String(school.id || school.cds_code || school.cds || school.name || '');
  }

  function programEvidence(school, records) {
    if (!records) return [];
    const entries = Array.isArray(records)
      ? records
      : Object.entries(records).map(([key, entry]) => ({ schoolName: key, ...entry }));
    return entries.filter(entry => entry && (
      entry.schoolId ? String(entry.schoolId) === schoolId(school) : entry.schoolName === school.name
    ) && safeUrl(entry.sourceUrl));
  }

  function verifiedInterests(school, records) {
    return [...new Set(programEvidence(school, records).flatMap(record =>
      (Array.isArray(record.interests) ? record.interests : []).filter(value => INTERESTS.includes(value))
    ))];
  }

  /* Search-term evidence is deliberately separate from verified program facts. */
  function nameInterestMatches(name, interests) {
    const normalized = String(name || '').toLowerCase();
    return (interests || []).filter(interest =>
      (NAME_TERMS[interest] || []).some(term => normalized.includes(term))
    );
  }

  function interestMatch(school, interests, records) {
    const requested = (interests || []).filter(interest => INTERESTS.includes(interest));
    const verified = verifiedInterests(school, records).filter(interest => requested.includes(interest));
    return { verified, nameOnly: nameInterestMatches(school.name, requested).filter(interest => !verified.includes(interest)) };
  }

  function matchesForGrade(schools, group, interests, records) {
    const groups = { elem: [0, 5], mid: [6, 8], high: [9, 12] };
    const exactGrade = parseGrade(group);
    const interval = groups[group] || (exactGrade !== null ? [exactGrade, exactGrade] : null);
    if (!interval) return [];
    const matchAny = !interests || !interests.length || interests.includes('any');
    return schools.filter(school => overlapsGrades(school, ...interval) && (
      matchAny || interestMatch(school, interests, records).verified.length > 0
    )).sort((a, b) =>
      interestMatch(b, interests, records).verified.length - interestMatch(a, interests, records).verified.length ||
      String(a.name).localeCompare(String(b.name))
    );
  }

  root.SchoolUtils = { escapeHtml, safeUrl, parseGrade, gradeRange, servesGrade, overlapsGrades,
    schoolId, programEvidence, verifiedInterests, nameInterestMatches, interestMatch, matchesForGrade };
})(globalThis);
