import { getSectionTags, parseNotesContext, getTagById, SECTION_DETAIL_TAGS } from '../sectionDetails.js';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
}

console.log('--- Testing parseNotesContext ---');

// Test URL stripping and exclusion segment separation
const rawNote1 = `For up-to-date information about CS course restrictions, please see the following link:   http://go.cs.illinois.edu/csregister

Restricted to Graduate - Urbana-Champaign. Not intended for MCS:Computer Sci Online -UIUC, MCS: Computer Sci OFF - UIUC, MCS:Computer Sci Online -UIUC, or NDEG:Computer Science Onl-UIUC.

Not intended for First Time Freshman students.`;

const parsed1 = parseNotesContext(rawNote1);
assert(!parsed1.positiveText.includes('http'), 'URLs should be stripped from positiveText');
assert(parsed1.positiveText.includes('restricted to graduate'), 'Positive clause should contain "restricted to graduate"');
assert(!parsed1.positiveText.includes('not intended for mcs'), 'Exclusion clauses should not be in positiveText');
assert(!parsed1.positiveText.includes('first time freshman'), 'Freshman exclusion should not be in positiveText');
assert(parsed1.negativeText.includes('not intended for first time freshman'), 'Freshman exclusion should be in negativeText');
console.log('✓ parseNotesContext correctly partitions positive and exclusion clauses');

console.log('\n--- Testing getSectionTags with tricky edge cases ---');

// Case 1: User's exact prompt example
const userExampleSection = {
  sectionNumber: 'A',
  notes: rawNote1,
  meetings: [{ typeCode: 'LEC', typeDescription: 'Lecture' }]
};
const userExampleTags = getSectionTags(userExampleSection).map(t => t.id);
assert(userExampleTags.includes('graduate'), 'Must tag graduate');
assert(!userExampleTags.includes('freshman'), 'Must NOT tag freshman');
assert(!userExampleTags.includes('online'), 'Must NOT tag online');
assert(!userExampleTags.includes('online-mcs'), 'Must NOT tag online-mcs');
console.log('✓ User example tags:', userExampleTags, '(graduate only)');

// Case 2: Undergrad on-campus section with freshman exclusion
const ugSection = {
  sectionNumber: 'AL1',
  notes: `Restricted to Undergrad - Urbana-Champaign. Not intended for First Time Freshman students.`,
  meetings: [{ typeCode: 'LEC', typeDescription: 'Lecture' }]
};
const ugTags = getSectionTags(ugSection).map(t => t.id);
assert(ugTags.includes('undergrad'), 'Must tag undergrad');
assert(!ugTags.includes('freshman'), 'Must NOT tag freshman');
assert(!ugTags.includes('graduate'), 'Must NOT tag graduate');
console.log('✓ Undergrad section tags:', ugTags, '(undergrad only)');

// Case 3: Online MCS DS section
const mcsSection = {
  sectionNumber: 'DS1',
  notes: `This section is only for students that are in the Computer Science Online MCS/MCS-DS Program. This course will be taught on the Coursera platform. Students in online programs may incur additional proctoring fees.
Restricted to Graduate - Urbana-Champaign. Restricted to MCS:Computer Sci Online -UIUC.
Not intended for First Time Freshman students.`,
  meetings: [{ typeCode: 'ONL', typeDescription: 'Online' }]
};
const mcsTags = getSectionTags(mcsSection).map(t => t.id);
assert(mcsTags.includes('online'), 'Must tag online');
assert(mcsTags.includes('online-mcs'), 'Must tag online-mcs');
assert(mcsTags.includes('coursera'), 'Must tag coursera');
assert(mcsTags.includes('graduate'), 'Must tag graduate');
assert(mcsTags.includes('additional-fee'), 'Must tag additional-fee');
assert(!mcsTags.includes('freshman'), 'Must NOT tag freshman');
console.log('✓ Online MCS section tags:', mcsTags);

// Case 4: Sync attendance NOT required
const asyncSection = {
  sectionNumber: 'ONL',
  notes: `Synchronous attendance not required. Scholar LMS.`,
  meetings: [{ typeCode: 'ONL', typeDescription: 'Online' }]
};
const asyncTags = getSectionTags(asyncSection).map(t => t.id);
assert(asyncTags.includes('asynchronous'), 'Must tag asynchronous');
assert(!asyncTags.includes('synchronous'), 'Must NOT tag synchronous');
console.log('✓ Async section with negative sync note tags:', asyncTags);

// Case 5: Honors section
const honorsSection = {
  sectionNumber: 'HA',
  notes: `Restricted to Chancellor's Scholar-CHPHonors students.`,
  meetings: [{ typeCode: 'DIS', typeDescription: 'Discussion' }]
};
const honorsTags = getSectionTags(honorsSection).map(t => t.id);
assert(honorsTags.includes('honors'), 'Must tag honors');
console.log('✓ Honors section tags:', honorsTags);

// Case 6: City Scholars section
const csSection = {
  sectionNumber: 'CSP',
  notes: `Course meets in Chicago. City Scholars Program.`,
  meetings: [{ typeCode: 'LEC', typeDescription: 'Lecture' }]
};
const csTags = getSectionTags(csSection).map(t => t.id);
assert(csTags.includes('chicago-scholars'), 'Must tag chicago-scholars');
console.log('✓ City scholars section tags:', csTags);

// Case 7: Non-majors section
const nonMajorSection = {
  sectionNumber: 'NM1',
  notes: `Open to non-majors. For non-majors only.`,
  meetings: [{ typeCode: 'LEC', typeDescription: 'Lecture' }]
};
const nmTags = getSectionTags(nonMajorSection).map(t => t.id);
assert(nmTags.includes('non-majors'), 'Must tag non-majors');
assert(!nmTags.includes('majors-only'), 'Must NOT tag majors-only');
console.log('✓ Non-majors section tags:', nmTags);

// Case 8: Majors only section
const majorSection = {
  sectionNumber: 'M1',
  notes: `Restricted to Computer Science major(s).`,
  meetings: [{ typeCode: 'LEC', typeDescription: 'Lecture' }]
};
const mTags = getSectionTags(majorSection).map(t => t.id);
assert(mTags.includes('majors-only'), 'Must tag majors-only');
assert(!mTags.includes('non-majors'), 'Must NOT tag non-majors');
console.log('✓ Majors only section tags:', mTags);

// Case 9: Approval required
const permitSection = {
  sectionNumber: 'IND',
  notes: `Departmental approval required. By permit only.`,
  meetings: [{ typeCode: 'IND', typeDescription: 'Independent Study' }]
};
const permitTags = getSectionTags(permitSection).map(t => t.id);
assert(permitTags.includes('approval-required'), 'Must tag approval-required');
console.log('✓ Approval required tags:', permitTags);

console.log('\n✅ All 9 comprehensive unit tests passed without errors!');
