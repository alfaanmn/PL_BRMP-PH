import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';

const supabase = createClient(url, anonKey);

async function inspectRPCsAndPolicies() {
  console.log('=== INSPECTING FUNCTIONS / RPCs ===\n');

  // Check is_admin RPC
  const { data: isAdminData, error: isAdminErr } = await supabase.rpc('is_admin');
  console.log('RPC is_admin():', { data: isAdminData, error: isAdminErr ? isAdminErr.message : null });

  // Check batalkan_pengajuan RPC
  const { data: bData, error: bErr } = await supabase.rpc('batalkan_pengajuan', { p_pengajuan_id: 999999, p_alasan: 'test' });
  console.log('RPC batalkan_pengajuan():', { data: bData, error: bErr ? bErr.message : null });

  // Check submit_skm RPC
  const { data: skmData, error: skmErr } = await supabase.rpc('submit_skm', { p_pengajuan_id: 999999, p_jawaban: [] });
  console.log('RPC submit_skm():', { data: skmData, error: skmErr ? skmErr.message : null });
}

inspectRPCsAndPolicies();
