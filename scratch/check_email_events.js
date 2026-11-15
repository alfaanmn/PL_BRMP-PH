const fs = require('fs');

const tpl = fs.readFileSync('lib/templates/email-templates.ts', 'utf8');
console.log('=== TEMPLATES in email-templates.ts ===');
const lines = tpl.split('\n');
lines.forEach((l, i) => {
  if (l.includes('export function') || l.includes('export const')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});

const service = fs.readFileSync('lib/services/email.service.ts', 'utf8');
console.log('\n=== email.service.ts METHODS ===');
service.split('\n').forEach((l, i) => {
  if (l.includes('async ') || l.includes('send')) {
    console.log(`Line ${i+1}: ${l}`);
  }
});
