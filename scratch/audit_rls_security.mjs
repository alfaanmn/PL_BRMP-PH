import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

async function testAnonPermissions() {
  console.log('=== TEST ANONYMOUS (UNAUTHENTICATED) ACCESS ===\n');

  const tables = [
    'profiles',
    'bidangs',
    'pembimbings',
    'bidang_pembimbing',
    'pengajuans',
    'pengajuan_status_logs',
    'skm_pertanyaan',
    'skm_jawaban',
    'notifikasi'
  ];

  for (const t of tables) {
    console.log(`--- Table: ${t} ---`);
    // 1. Test SELECT
    const { data: selData, error: selErr } = await supabase.from(t).select('*').limit(1);
    if (selErr) {
      console.log(`  SELECT: ❌ Blocked/Error (${selErr.message})`);
    } else {
      console.log(`  SELECT: ⚠️ ALLOWED (Returned ${selData.length} rows)`);
    }

    // 2. Test INSERT (attempt with dummy/invalid to see if RLS blocks before or if policy permits)
    const { error: insErr } = await supabase.from(t).insert({}).select();
    if (insErr) {
      console.log(`  INSERT: 🛡️ Rejected (${insErr.message} - Code: ${insErr.code})`);
    } else {
      console.log(`  INSERT: 🚨 DANGER! ALLOWED FOR ANON!`);
    }

    // 3. Test UPDATE
    const { error: updErr } = await supabase.from(t).update({ updated_at: new Date().toISOString() }).eq('id', 999999);
    if (updErr) {
      console.log(`  UPDATE: 🛡️ Rejected (${updErr.message} - Code: ${updErr.code})`);
    } else {
      console.log(`  UPDATE: ⚠️ Policy allowed execution (filtered by RLS / 0 rows matched)`);
    }

    // 4. Test DELETE
    const { error: delErr } = await supabase.from(t).delete().eq('id', 999999);
    if (delErr) {
      console.log(`  DELETE: 🛡️ Rejected (${delErr.message} - Code: ${delErr.code})`);
    } else {
      console.log(`  DELETE: ⚠️ Policy allowed execution (filtered by RLS / 0 rows matched)`);
    }
  }
}

testAnonPermissions();
