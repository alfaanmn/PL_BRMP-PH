import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function testQuery() {
  console.log('Testing query from bidang.service.ts...');
  const { data, error } = await supabase
    .from('bidang_pembimbing')
    .select('pembimbing_id, pembimbings(id, nama, nip, jabatan, kuota, is_active)')
    .eq('bidang_id', 1);

  if (error) {
    console.log('❌ Error in bidang_pembimbing select with kuota:', error.message);
  } else {
    console.log('✅ Success:', data);
  }

  const { data: correctData, error: correctError } = await supabase
    .from('bidang_pembimbing')
    .select('pembimbing_id, pembimbings(id, nama, nip, jabatan, kuota_default, is_active)')
    .eq('bidang_id', 1);

  if (correctError) {
    console.log('❌ Error in correctData:', correctError.message);
  } else {
    console.log('✅ Success with kuota_default:', correctData);
  }
}

testQuery();
