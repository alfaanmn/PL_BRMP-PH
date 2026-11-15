const fs = require('fs');

const content = fs.readFileSync('lib/templates/email-templates.ts', 'utf8');
const lines = content.split('\n');

function printBlock(keyword) {
  console.log('=== KEYWORD: ' + keyword + ' ===');
  lines.forEach((l, i) => {
    if (l.includes(keyword)) {
      console.log('At line ' + (i+1) + ':');
      console.log(lines.slice(i, i + 25).join('\n'));
      console.log('-----------------------------------');
    }
  });
}

printBlock('pengajuan_completed');
printBlock('sertifikat_available');
