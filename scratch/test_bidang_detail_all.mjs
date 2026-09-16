import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testAllBidangDetail() {
  console.log('=== TESTING /bidang/[id] DATA FETCH FOR ALL BIDANGS ===\n');

  const { data: bidangs, error: bErr } = await supabase.from('bidangs').select('id, nama').order('id', { ascending: true });

  if (bErr || !bidangs) {
    console.error('Failed to get bidangs:', bErr);
    return;
  }

  for (const b of bidangs) {
    console.log(`Checking Bidang #${b.id}: "${b.nama}"...`);
    
    // Simulate bidangService.getBidangById
    const { data: bidang, error: bidangError } = await supabase
      .from('bidangs')
      .select('*')
      .eq('id', b.id)
      .single();

    if (bidangError) {
      console.log(`❌ Error fetching bidang ${b.id}:`, bidangError.message);
      continue;
    }

    const { data: bpData, error: bpError } = await supabase
      .from('bidang_pembimbing')
      .select('pembimbing_id, pembimbings(id, nama, nip, jabatan, kuota_default, is_active)')
      .eq('bidang_id', b.id);

    if (bpError) {
      console.log(`❌ Error fetching pembimbings for bidang ${b.id}:`, bpError.message);
      continue;
    }

    const pembimbings = (bpData || [])
      .map(item => item.pembimbings)
      .filter(p => p && p.is_active !== false);

    console.log(`✅ Bidang #${b.id} OK: Kuota = ${bidang.kuota}, Total Pembimbing = ${pembimbings.length}`);
    pembimbings.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.nama} (NIP: ${p.nip || '-'}, Jabatan: ${p.jabatan || '-'}, Kuota Default: ${p.kuota_default})`);
    });
    console.log('');
  }
}

testAllBidangDetail();
