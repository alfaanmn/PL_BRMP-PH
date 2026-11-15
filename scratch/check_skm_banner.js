const fs = require('fs');

const page = fs.readFileSync('app/(pengguna)/pengguna/skm/page.tsx', 'utf8');
console.log('=== skm/page.tsx ===');
console.log(page);

const form = fs.readFileSync('components/pengguna/skm-form.tsx', 'utf8');
const lines = form.split('\n');
console.log('=== skm-form.tsx line matches ===');
lines.forEach((l, i) => {
  if (l.includes('SEDANG MENILAI') || l.includes('Sedang menilai') || l.includes('Pelayanan Pengajuan Magang')) {
    console.log('Line ' + (i+1) + ': ' + l.trim());
    console.log(lines.slice(Math.max(0, i-5), Math.min(lines.length, i+25)).join('\n'));
    console.log('-------------------------------------------');
  }
});
