/**
 * Section Detail Definitions and Tag Extractors.
 * Categorizes and identifies major distinctions across UIUC scheduled sections
 * based on section numbers, meeting types, and administrative notes.
 */

export const SECTION_DETAIL_TAGS = [
  // Levels
  {
    id: 'undergrad',
    label: 'Undergrad Section',
    category: 'Level',
    badgeText: 'UG',
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    match: (s, n, sec) =>
      /restricted to undergrad|undergraduate|undergrads|urbana undergraduates|\bundergrad\b/i.test(n) ||
      /(?:^|[A-Z])(U|QU|RU|AMU|UG|UN|U1|U2|U3|U4)$/i.test(sec)
  },
  {
    id: 'graduate',
    label: 'Grad Section',
    category: 'Level',
    badgeText: 'Grad',
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    match: (s, n, sec) =>
      /restricted to grad|graduate students|graduate standing|graduates|\bgrad\b/i.test(n) ||
      /(?:^|[A-Z])(G|QG|RG|AMG|GR|GD|G1|G2|G3|G4)$/i.test(sec)
  },
  {
    id: 'freshman',
    label: 'Freshman / First Year',
    category: 'Level',
    badgeText: 'Freshman',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    match: (s, n) => /first[- ]time freshman|freshman|first[- ]year/i.test(n)
  },
  {
    id: 'senior',
    label: 'Senior Standing',
    category: 'Level',
    badgeText: 'Senior',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    match: (s, n) => /senior standing|senior/i.test(n)
  },

  // Delivery, Programs & Cohorts
  {
    id: 'online',
    label: 'Online',
    category: 'Delivery',
    badgeText: 'Online',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    match: (s, n, sec) =>
      /online|netmath/i.test(n) ||
      (s.meetings || []).some(m => m.typeCode === 'ONL') ||
      sec.startsWith('ONL') ||
      sec.startsWith('O')
  },
  {
    id: 'online-mcs',
    label: 'Online MCS',
    category: 'Program',
    badgeText: 'Online MCS',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    match: (s, n, sec) =>
      /online mcs|mcs[- ]ds|chicago mcs|master of computer science online|computer science online mcs/i.test(n) ||
      /^DS[0-9]/.test(sec) ||
      /^MC[0-9]/.test(sec)
  },
  {
    id: 'chicago-scholars',
    label: 'City Scholars',
    category: 'Program',
    badgeText: 'City Scholars',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    match: (s, n, sec) => /chicago city scholars|chicago scholars/i.test(n) || sec === 'CSP'
  },
  {
    id: 'online-business',
    label: 'Online iMBA / MSM',
    badgeText: 'Online Business',
    category: 'Program',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    match: (s, n, sec) =>
      /\bonline\s+msm\b/i.test(n) ||
      /\bmsm\s+online\b/i.test(n) ||
      /\b(imba|imsm|imsa|ianalytics)\b/i.test(n) ||
      n.includes('gies online')
  },
  {
    id: 'coursera',
    label: 'Coursera',
    category: 'Program',
    badgeText: 'Coursera',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    match: (s, n) => /coursera/i.test(n)
  },
  {
    id: 'honors',
    label: 'Honors / James Scholar',
    category: 'Program',
    badgeText: 'Honors',
    color: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.12)',
    borderColor: 'rgba(202, 138, 4, 0.3)',
    match: (s, n, sec) => /honors|james scholar|chancellor.*scholar/i.test(n) || /^H[0-9A-Z]/.test(sec)
  },
  {
    id: 'study-abroad',
    label: 'Study Abroad / Off-Campus',
    category: 'Program',
    badgeText: 'Study Abroad',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    match: (s, n) => /study abroad|off[- ]campus|off campus/i.test(n)
  },
  {
    id: 'netmath',
    label: 'NetMath',
    category: 'Program',
    badgeText: 'NetMath',
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.12)',
    borderColor: 'rgba(8, 145, 178, 0.3)',
    match: (s, n) => /netmath/i.test(n)
  },

  // Restrictions & Requirements
  {
    id: 'majors-only',
    label: 'Majors Only',
    category: 'Restriction',
    badgeText: 'Majors Only',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
    match: (s, n) => /restricted to .*major|majors only|for .* majors only/i.test(n)
  },
  {
    id: 'non-majors',
    label: 'Non-Majors',
    category: 'Restriction',
    badgeText: 'Non-Majors',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    match: (s, n) => /non[- ]major|non[- ]majors|non cs majors|for non[- ]/i.test(n)
  },
  {
    id: 'approval-required',
    label: 'Approval Required',
    category: 'Restriction',
    badgeText: 'Approval Req',
    color: '#475569',
    bgColor: 'rgba(71, 85, 105, 0.12)',
    borderColor: 'rgba(71, 85, 105, 0.3)',
    match: (s, n) => /consent of instructor|instructor approval|departmental (?:approval|consent|permission)|authorization required|by permit only|departmental authorization/i.test(n)
  },

  // Delivery & Fees
  {
    id: 'asynchronous',
    label: 'Async',
    category: 'Delivery',
    badgeText: 'Async',
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.12)',
    borderColor: 'rgba(79, 70, 229, 0.3)',
    match: (s, n) => /asynchronous/i.test(n)
  },
  {
    id: 'synchronous',
    label: 'Synchronous',
    category: 'Delivery',
    badgeText: 'Sync',
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.12)',
    borderColor: 'rgba(79, 70, 229, 0.3)',
    match: (s, n) => /synchronous/i.test(n)
  },
  {
    id: 'additional-fee',
    label: 'Course Fee',
    category: 'Details',
    badgeText: 'Course Fee',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.12)',
    borderColor: 'rgba(180, 83, 9, 0.3)',
    match: (s, n) => /course fee|lab fee|additional .* fee|differential/i.test(n)
  }
];

const TAG_MAP = new Map(SECTION_DETAIL_TAGS.map(t => [t.id, t]));

/**
 * Extracts all matching detail tags for a given section.
 */
export function getSectionTags(section) {
  const notes = (section.notes || '').trim();
  const notesLower = notes.toLowerCase();
  const secNum = (section.sectionNumber || '').trim().toUpperCase();

  const matched = [];
  for (const tag of SECTION_DETAIL_TAGS) {
    if (tag.match(section, notesLower, secNum)) {
      matched.push(tag);
    }
  }
  return matched;
}

export function getTagById(tagId) {
  return TAG_MAP.get(tagId);
}
