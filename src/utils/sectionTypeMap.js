// Friendly labels for section schedule-type codes, sourced from the type
// descriptions UIUC's Course Explorer itself returns (via the live section
// scrape). Codes not covered there (e.g. older codes only seen in historical
// grade data) fall back to showing the raw code.
const sectionTypeMap = {
  CNF: 'Conference',
  DIS: 'Discussion/Recitation',
  IND: 'Independent Study',
  INT: 'Internship',
  LAB: 'Laboratory',
  LBD: 'Laboratory-Discussion',
  LCD: 'Lecture-Discussion',
  LEC: 'Lecture',
  OD: 'Online Discussion',
  OLB: 'Online Lab',
  OLC: 'Online Lecture',
  ONL: 'Online',
  RES: 'Research',
  SEM: 'Seminar',
  STA: 'Study Abroad',
  TRV: 'Travel'
};

export function sectionTypeLabel(code) {
  if (!code) return code;
  return sectionTypeMap[code.toUpperCase()] || code;
}

export default sectionTypeMap;
