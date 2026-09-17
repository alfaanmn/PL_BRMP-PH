import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

async function checkJenjangDB() {
  console.log('=== AUDITING JENJANG IN DATABASE ===');

  // Check profiles columns
  const { error: pErr } = await supabase.from('profiles').select('jenjang').limit(1);
  console.log('profiles.jenjang exists?:', !pErr, pErr ? pErr.message : 'YES');

  // Check pengajuans.jenjang
  const { error: pjErr, data: pjData } = await supabase.from('pengajuans').select('jenjang').limit(10);
  console.log('pengajuans.jenjang exists?:', !pjErr, pjErr ? pjErr.message : 'YES');

  // Check bidangs.jenjang
  const { error: bErr, data: bData } = await supabase.from('bidangs').select('id, nama, jenjang');
  console.log('bidangs.jenjang:', bData);

  // Check existing distinct values of jenjang in pengajuans
  const { data: distinctPj } = await supabase.from('pengajuans').select('jenjang');
  if (distinctPj) {
    const vals = [...new Set(distinctPj.map(p => p.jenjang))];
    console.log('Distinct jenjang values in pengajuans:', vals);
  }
}

checkJenjangDB();
