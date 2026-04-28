const fs = require('fs');

const missingMap = {
  'ARTJ': 'Art--Japanese',
  'ASRM': 'Actuarial Science and Risk Management',
  'AVI': 'Aviation',
  'BCS': 'Bosnian-Croatian-Serbian',
  'BIOC': 'Biochemistry',
  'BTW': 'Business and Technical Writing',
  'CINE': 'Cinema Studies',
  'CWL': 'Comparative and World Literature',
  'DTX': 'Human-Centered Design & Design Thinking',
  'ENVS': 'Environmental Studies',
  'EOL': 'Educational Organization and Leadership',
  'ETMA': 'Engineering Technology & Management for Agricultural Systems',
  'FR': 'French',
  'GCL': 'Grand Challenge Learning',
  'GE': 'General Engineering',
  'GGIS': 'Geography and Geographic Information Science',
  'GRKM': 'Modern Greek',
  'GSD': 'Game Studies and Design',
  'HK': 'Health and Kinesiology',
  'HRE': 'Human Resource Education',
  'IHLT': 'Interdisciplinary Health Sciences',
  'JS': 'Jewish Studies',
  'LIS': 'Library and Information Science',
  'MS': 'Medical Scholars',
  'MUSC': 'Music',
  'NE': 'Nuclear Engineering',
  'REHB': 'Rehabilitation Counseling',
  'REL': 'Religion',
  'RLST': 'Religious Studies',
  'RSOC': 'Rural Sociology',
  'SAME': 'South Asian and Middle Eastern Studies',
  'SCR': 'Serbo-Croatian',
  'SLCL': 'School of Literatures, Cultures and Linguistics',
  'SWAH': 'Swahili',
  'TAM': 'Theoretical and Applied Mechanics',
  'VB': 'Veterinary Biosciences'
};

const file = './src/utils/subjectMap.js';
let content = fs.readFileSync(file, 'utf8');

// Insert missing items into the object
let lines = content.split('\n');
const insertIndex = lines.findIndex(line => line.includes('};'));

if (insertIndex > -1) {
  // modify last line of object to add comma if needed
  if (!lines[insertIndex - 1].endsWith(',')) {
    lines[insertIndex - 1] += ',';
  }
  
  const newLines = Object.entries(missingMap).map(([k, v]) => `  "${k}": "${v}",`);
  // Remove last comma
  newLines[newLines.length - 1] = newLines[newLines.length - 1].slice(0, -1);
  
  lines.splice(insertIndex, 0, ...newLines);
  fs.writeFileSync(file, lines.join('\n'));
}
