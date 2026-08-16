/**
 * Section Detail Definitions and Tag Extractors.
 * Categorizes and identifies major distinctions across UIUC scheduled sections
 * based on section numbers, meeting types, and administrative notes.
 */

/**
 * Preprocesses section notes to separate affirmative/positive restrictions from
 * negative exclusion statements ("Not intended for...", "Not open to...", etc.)
 * and strips URLs to avoid keyword collisions.
 */
export function parseNotesContext(rawNotes) {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { positiveText: '', negativeText: '', fullCleaned: '' };
  }

  // Remove URLs
  const cleaned = rawNotes.replace(/https?:\/\/[^\s)]+/gi, ' ');

  // Split into sentences and major clauses
  const rawSegments = cleaned.split(/(?:\r?\n)+|(?<=[.!?])\s+|;\s*/);

  const positiveSegments = [];
  const negativeSegments = [];

  const EXCLUSION_PATTERN = /^(?:\s*(?:restriction\s*:\s*)?)?(?:not\s+(?:intended\s+for|open\s+to|available\s+to|for|eligible)|excludes?|excluding|cannot\s+be\s+taken\s+by|may\s+not\s+be\s+taken\s+by|no\s+credit\s+for|not\s+for\b|will\s+not\s+allow)/i;

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    if (EXCLUSION_PATTERN.test(trimmed)) {
      negativeSegments.push(trimmed);
    } else {
      positiveSegments.push(trimmed);
    }
  }

  return {
    positiveText: positiveSegments.join('. ').toLowerCase(),
    negativeText: negativeSegments.join('. ').toLowerCase(),
    fullCleaned: cleaned.toLowerCase()
  };
}

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
    match: (s, ctx, sec) => {
      if (/(?:^|[A-Z])(U|QU|RU|AMU|UG|UN|U1|U2|U3|U4)$/i.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+(?:all\s+)?(?:urbana\s+)?undergrad(?:uate)?(?:s)?\b/i.test(pos) ||
        /\bundergrad(?:uate)?\s+section\b/i.test(pos) ||
        /\bfor\s+undergrad(?:uate)?s\s+only\b/i.test(pos) ||
        /\bundergrad(?:uate)?\s+standing\b/i.test(pos) ||
        /\bundergrads\s+only\b/i.test(pos) ||
        /\bopen\s+(?:only\s+)?to\s+undergrad(?:uate)?s\b/i.test(pos)
      );
    }
  },
  {
    id: 'graduate',
    label: 'Grad Section',
    category: 'Level',
    badgeText: 'Grad',
    color: '#7c3aed',
    bgColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    match: (s, ctx, sec) => {
      if (/(?:^|[A-Z])(G|QG|RG|AMG|GR|GD|G1|G2|G3|G4)$/i.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+(?:all\s+)?(?:urbana\s+)?grad(?:uate)?(?:s)?\b/i.test(pos) ||
        /\bgraduate\s+section\b/i.test(pos) ||
        /\bfor\s+grad(?:uate)?s\s+only\b/i.test(pos) ||
        /\bgraduate\s+students?\b/i.test(pos) ||
        /\bgraduate\s+standing\b/i.test(pos) ||
        /\bgraduates?\s+only\b/i.test(pos) ||
        /\bgrad\s+standing\b/i.test(pos)
      );
    }
  },
  {
    id: 'freshman',
    label: 'Freshman / First Year',
    category: 'Level',
    badgeText: 'Freshman',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*(?:freshman|freshmen|first[- ]year)/i.test(pos) ||
        /(?:freshman|freshmen|first[- ]year)\s+(?:only|discovery|seminar|students\s+only|cohort)/i.test(pos) ||
        /\bopen\s+(?:only\s+)?to\s+(?:incoming\s+)?(?:freshman|freshmen|first[- ]year)/i.test(pos)
      );
    }
  },
  {
    id: 'senior',
    label: 'Senior Standing',
    category: 'Level',
    badgeText: 'Senior',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*senior/i.test(pos) ||
        /\bsenior\s+standing\s+(?:required|only|preferred)\b/i.test(pos) ||
        /\bseniors\s+only\b/i.test(pos) ||
        /\bsenior\s+design\b/i.test(pos)
      );
    }
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
    match: (s, ctx, sec) => {
      if ((s.meetings || []).some(m => m.typeCode === 'ONL')) return true;
      if (sec.startsWith('ONL') || sec.startsWith('OL') || /^O[0-9]/.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*online/i.test(pos) ||
        /\b(?:taught|offered|delivered|conducted)\s+online\b/i.test(pos) ||
        /\b100%\s+online\b/i.test(pos) ||
        /\bonline\s+(?:section|course|program|instruction|degree|cohort)\b/i.test(pos) ||
        /\bnetmath\b/i.test(pos)
      );
    }
  },
  {
    id: 'online-mcs',
    label: 'Online MCS',
    category: 'Program',
    badgeText: 'Online MCS',
    color: '#ea580c',
    bgColor: 'rgba(234, 88, 12, 0.12)',
    borderColor: 'rgba(234, 88, 12, 0.3)',
    match: (s, ctx, sec) => {
      if (/^(?:DS|MC)[0-9]/.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*(?:computer\s+sci\s+online|mcs[- ]ds|online\s+mcs|master\s+of\s+computer\s+science\s+online)/i.test(pos) ||
        /\bonly\s+for\s+students\s+(?:that|who)\s+are\s+in\s+the\s+.*(?:online\s+mcs|mcs[- ]ds)/i.test(pos) ||
        /\bonline\s+mcs(?:\/mcs-ds)?\s+program\b/i.test(pos) ||
        /\bcomputer\s+science\s+online\s+mcs\b/i.test(pos)
      );
    }
  },
  {
    id: 'chicago-scholars',
    label: 'City Scholars',
    category: 'Program',
    badgeText: 'City Scholars',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    match: (s, ctx, sec) => {
      if (sec === 'CSP') return true;
      const pos = ctx.positiveText;
      return /\b(?:chicago\s+city\s+scholars|city\s+scholars\s+program|illinois\s+in\s+chicago)\b/i.test(pos);
    }
  },
  {
    id: 'online-business',
    label: 'Online iMBA / MSM',
    badgeText: 'Online Business',
    category: 'Program',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    match: (s, ctx, sec) => {
      if (/^OM[A-Z0-9]/.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*(?:imba|imsm|imsa|ianalytics|gies\s+online)/i.test(pos) ||
        /\bonline\s+msm\b/i.test(pos) ||
        /\bmsm\s+online\b/i.test(pos) ||
        /\b(imba|imsm|imsa|ianalytics)\b/i.test(pos) ||
        /\bgies\s+online\b/i.test(pos)
      );
    }
  },
  {
    id: 'coursera',
    label: 'Coursera',
    category: 'Program',
    badgeText: 'Coursera',
    color: '#0284c7',
    bgColor: 'rgba(2, 132, 199, 0.12)',
    borderColor: 'rgba(2, 132, 199, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return /\b(?:taught\s+on\s+(?:the\s+)?coursera|coursera\s+platform|via\s+coursera)\b/i.test(pos);
    }
  },
  {
    id: 'honors',
    label: 'Honors / James Scholar',
    category: 'Program',
    badgeText: 'Honors',
    color: '#ca8a04',
    bgColor: 'rgba(202, 138, 4, 0.12)',
    borderColor: 'rgba(202, 138, 4, 0.3)',
    match: (s, ctx, sec) => {
      if (/^H[0-9A-Z]/.test(sec)) return true;
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+.*(?:honors|james\s+scholar|chancellor'?s?\s+scholar)/i.test(pos) ||
        /\b(?:james\s+scholar|chancellor'?s?\s+scholar)\b/i.test(pos) ||
        /\bhonors\s+(?:section|only|students|cohort)\b/i.test(pos)
      );
    }
  },
  {
    id: 'study-abroad',
    label: 'Study Abroad / Off-Campus',
    category: 'Program',
    badgeText: 'Study Abroad',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: 'rgba(22, 163, 74, 0.3)',
    match: (s, ctx, sec) => {
      if (sec === 'SA') return true;
      const pos = ctx.positiveText;
      return /\b(?:study\s+abroad|off[- ]campus\s+program|in\s+washington\s+program|vienna\s+diplomatic\s+program)\b/i.test(pos);
    }
  },
  {
    id: 'netmath',
    label: 'NetMath',
    category: 'Program',
    badgeText: 'NetMath',
    color: '#0891b2',
    bgColor: 'rgba(8, 145, 178, 0.12)',
    borderColor: 'rgba(8, 145, 178, 0.3)',
    match: (s, ctx, sec) => {
      if (/^NET/.test(sec)) return true;
      const pos = ctx.positiveText;
      return /\bnetmath\b/i.test(pos);
    }
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
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      if (/\bnon[- ]majors?\b/i.test(pos) && !/\brestricted\s+to\s+(?:[^.]*,\s*)*(?:[A-Z0-9&+\s]+)\s+major/i.test(pos)) {
        return false;
      }
      return (
        /\brestricted\s+to\s+(?!non[- ]majors?)[^.]*major(?:s)?(?:\b|\.|\))/i.test(pos) ||
        /(?<!non[- ])\bmajors\s+only\b/i.test(pos) ||
        /\bfor\s+(?!non[- ]majors?)[^.]*majors\s+only\b/i.test(pos)
      );
    }
  },
  {
    id: 'non-majors',
    label: 'Non-Majors',
    category: 'Restriction',
    badgeText: 'Non-Majors',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return (
        /\brestricted\s+to\s+non[- ]majors?\b/i.test(pos) ||
        /\bnon[- ]majors?\s+only\b/i.test(pos) ||
        /\bfor\s+non[- ]majors?\b/i.test(pos) ||
        /\bnon\s+cs\s+majors\b/i.test(pos) ||
        /\bopen\s+to\s+non[- ]majors\b/i.test(pos)
      );
    }
  },
  {
    id: 'approval-required',
    label: 'Approval Required',
    category: 'Restriction',
    badgeText: 'Approval Req',
    color: '#475569',
    bgColor: 'rgba(71, 85, 105, 0.12)',
    borderColor: 'rgba(71, 85, 105, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return /\b(?:consent\s+of\s+instructor|instructor\s+approval|departmental\s+(?:approval|consent|permission|authorization)|authorization\s+required|by\s+permit\s+only|permission\s+of\s+department)\b/i.test(pos);
    }
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
    match: (s, ctx) => {
      if ((s.meetings || []).some(m => /async/i.test(m.typeDescription || ''))) return true;
      const pos = ctx.positiveText;
      return (
        /\b(?:asynchronous\s+(?:online|attendance|instruction|learning|mode)|taught\s+asynchronously|100%\s+asynchronous|async\s+online)\b/i.test(pos) ||
        /\bsynchronous\s+attendance\s+not\s+required\b/i.test(pos) ||
        /\bno\s+synchronous\s+meetings\b/i.test(pos)
      );
    }
  },
  {
    id: 'synchronous',
    label: 'Synchronous',
    category: 'Delivery',
    badgeText: 'Sync',
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.12)',
    borderColor: 'rgba(79, 70, 229, 0.3)',
    match: (s, ctx) => {
      if ((s.meetings || []).some(m => /sync/i.test(m.typeDescription || '') && !/async/i.test(m.typeDescription || ''))) return true;
      const pos = ctx.positiveText;
      if (/\bsynchronous\s+attendance\s+not\s+required\b/i.test(pos) || /\bnot\s+synchronous\b/i.test(pos)) return false;
      return /\b(?:synchronous\s+(?:online|attendance\s+required|instruction|learning|mode|sessions)|must\s+attend\s+synchronously)\b/i.test(pos);
    }
  },
  {
    id: 'additional-fee',
    label: 'Course Fee',
    category: 'Details',
    badgeText: 'Course Fee',
    color: '#b45309',
    bgColor: 'rgba(180, 83, 9, 0.12)',
    borderColor: 'rgba(180, 83, 9, 0.3)',
    match: (s, ctx) => {
      const pos = ctx.positiveText;
      return (
        /\b(?:additional\s+(?:course|lab|tuition|proctoring)\s+fee|differential\s+tuition|\blab\s+fee\b|incur\s+additional\s+(?:proctoring\s+)?fees?)\b/i.test(pos) &&
        !/\bno\s+additional\s+(?:course|lab|tuition|proctoring)?\s*fees?\b/i.test(pos)
      );
    }
  }
];

const TAG_MAP = new Map(SECTION_DETAIL_TAGS.map(t => [t.id, t]));

/**
 * Extracts all matching detail tags for a given section.
 */
export function getSectionTags(section) {
  const notes = (section.notes || '').trim();
  const ctx = parseNotesContext(notes);
  const secNum = (section.sectionNumber || '').trim().toUpperCase();

  const matched = [];
  for (const tag of SECTION_DETAIL_TAGS) {
    if (tag.match(section, ctx, secNum)) {
      matched.push(tag);
    }
  }
  return matched;
}

export function getTagById(tagId) {
  return TAG_MAP.get(tagId);
}
