const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// read .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkSKM() {
  const { data: qData } = await supabase.from('skm_pertanyaan').select('id, urutan, pertanyaan, tipe, unsur').order('urutan');
  const { data: aData, count } = await supabase.from('skm_jawaban').select('*', { count: 'exact' });
  
  console.log('Total questions in DB:', qData ? qData.length : 0);
  console.log('Total answers in skm_jawaban:', aData ? aData.length : 0);
  
  if (aData && aData.length > 0) {
    const scores = aData.map(a => Number(a.jawaban)).filter(n => !isNaN(n) && n >= 1 && n <= 4);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = scores.length ? (sum / scores.length).toFixed(2) : 0;
    const ikm = (avg * 25).toFixed(2);
    console.log('Valid choice answers:', scores.length);
    console.log('Rata-rata Skor (skala 1-4):', avg);
    console.log('Indeks Kepuasan Masyarakat (IKM konversi x 25):', ikm);
  } else {
    console.log('Belum ada data responden nyata di tabel skm_jawaban.');
  }
}

checkSKM().catch(console.error);

