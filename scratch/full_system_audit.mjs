import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

async function runAudit() {
  console.log('=== FULL SYSTEM AUDIT ===\n');

  // 1. Audit tables & counts
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
    const { data, error, count } = await supabase.from(t).select('*', { count: 'exact', head: false }).limit(2);
    if (error) {
      console.log(`❌ Table [${t}]: Error - ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Table [${t}]: Accessible, sample row count: ${data.length}, total count: ${count}`);
      if (data.length > 0) {
        console.log(`   Columns detected: ${Object.keys(data[0]).join(', ')}`);
      }
    }
  }

  // 2. Audit Storage Buckets
  console.log('\n=== STORAGE BUCKETS AUDIT ===');
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.log(`❌ Storage: Error listing buckets - ${bucketErr.message}`);
  } else {
    console.log(`✅ Storage: Buckets found (${buckets.length}):`, buckets.map(b => `${b.name} (public: ${b.public})`));
  }

  // 3. Audit SKM Pertanyaan
  console.log('\n=== SKM PERTANYAAN AUDIT ===');
  const { data: skmQ, error: skmQErr } = await supabase.from('skm_pertanyaan').select('*').order('urutan', { ascending: true });
  if (skmQErr) {
    console.log(`❌ SKM Q: Error - ${skmQErr.message}`);
  } else {
    console.log(`✅ SKM Q count: ${skmQ.length}`);
    skmQ.forEach(q => {
      console.log(`   Q${q.urutan} [id: ${q.id}]: tipe="${q.tipe}", unsur="${q.unsur}", active=${q.is_active}, opsi=${q.opsi ? `Array(${q.opsi.length})` : 'null'}`);
    });
  }

  // 4. Audit Bidang & Pembimbing
  console.log('\n=== BIDANG & PEMBIMBING AUDIT ===');
  const { data: bidangs } = await supabase.from('bidangs').select('*');
  console.log(`✅ Bidangs count: ${bidangs?.length || 0}`);
  const { data: pembimbings } = await supabase.from('pembimbings').select('*');
  console.log(`✅ Pembimbings count: ${pembimbings?.length || 0}`);
  const { data: relasi } = await supabase.from('bidang_pembimbing').select('*');
  console.log(`✅ Bidang_Pembimbing relations count: ${relasi?.length || 0}`);

  // 5. Audit Pengajuan Statuses in DB
  console.log('\n=== PENGAJUAN STATUSES AUDIT ===');
  const { data: pengajuans } = await supabase.from('pengajuans').select('id, public_id, status, user_id, bidang_id, pembimbing_id');
  console.log(`✅ Pengajuans count: ${pengajuans?.length || 0}`);
  if (pengajuans && pengajuans.length > 0) {
    const statuses = [...new Set(pengajuans.map(p => p.status))];
    console.log(`   Distinct statuses in DB:`, statuses);
  }

  // 6. Audit Profiles Roles in DB
  console.log('\n=== PROFILES ROLES AUDIT ===');
  const { data: profiles } = await supabase.from('profiles').select('id, role, name, email, is_active');
  console.log(`✅ Profiles count: ${profiles?.length || 0}`);
  if (profiles && profiles.length > 0) {
    const roles = [...new Set(profiles.map(p => p.role))];
    console.log(`   Distinct roles in DB:`, roles);
    console.log(`   Active/inactive:`, profiles.map(p => ({ role: p.role, email: p.email, active: p.is_active })));
  }

  console.log('\n=== AUDIT FINISHED ===');
}

runAudit();
