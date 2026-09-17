import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

async function inspectSchema() {
  console.log('=== INSPECTING PENGAJUANS & SKM TABLES ===');
  
  // Try to inspect columns by selecting all
  const { data: pData, error: pErr } = await supabase.from('pengajuans').select('*').limit(1);
  if (pErr) {
    console.log('Error selecting pengajuans:', pErr.message);
  } else if (pData && pData.length > 0) {
    console.log('pengajuans columns:', Object.keys(pData[0]));
    console.log('Sample pengajuan:', pData[0]);
  } else {
    console.log('pengajuans is empty or RLS protected for anon. Let us test specific columns:');
    const candidateCols = [
      'id', 'public_id', 'user_id', 'bidang_id', 'pembimbing_id', 'nomor_surat', 'tanggal_surat',
      'jenjang', 'asal_instansi', 'jurusan', 'tanggal_mulai', 'tanggal_selesai', 'durasi_bulan',
      'jumlah_anggota', 'anggota', 'nama_lengkap', 'nim_nis', 'jenis_kelamin', 'no_hp', 'alamat',
      'foto_url', 'topik_magang', 'surat_pengantar_url', 'proposal_url', 'dokumen_tambahan_url',
      'surat_balasan_url', 'sertifikat_url', 'alasan_penolakan', 'status', 'created_at', 'updated_at'
    ];
    for (const col of candidateCols) {
      const { error: colErr } = await supabase.from('pengajuans').select(col).limit(1);
      if (colErr) {
        console.log(`❌ Column ${col} does NOT exist or error: ${colErr.message}`);
      } else {
        console.log(`✅ Column ${col} exists!`);
      }
    }
  }

  // Check Storage Buckets
  console.log('\n=== STORAGE BUCKETS ===');
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) {
    console.log('Buckets error:', bErr.message);
  } else {
    console.log('Buckets:', buckets);
  }
}

inspectSchema();
