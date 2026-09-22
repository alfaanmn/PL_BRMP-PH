import { createClient } from '@supabase/supabase-js';

const url = 'https://dlspskkmuuysmpmvklnp.supabase.co';
const anonKey = 'sb_publishable_UjBxYn0QIuHtLUSo01zL0A_IPosXADu';
const supabase = createClient(url, anonKey);

async function auditRegistration() {
  console.log('=== AUDIT DUPLIKASI REGISTRASI ===\n');

  // 1. Audit profiles table & columns
  const { data: profiles, error: pErr, count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: false });

  if (pErr) {
    console.log(`❌ Error profiles: ${pErr.message}`);
  } else {
    console.log(`✅ Table profiles total rows: ${count || profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      console.log('   Columns:', Object.keys(profiles[0]).join(', '));
      console.log('   Sample row:', profiles[0]);
    } else {
      console.log('   (Tabel profiles saat ini kosong atau RLS anon membatasi SELECT)');
    }
  }

  // 2. Check RPCs or functions if accessible
  console.log('\n=== CHECK DUPLICATE PHONE NUMBERS & EMAILS IN DB ===');
  // If profiles are selectable, let's analyze them
  if (profiles && profiles.length > 0) {
    const emails = profiles.map(p => p.email?.toLowerCase().trim()).filter(Boolean);
    const phones = profiles.map(p => p.no_hp?.trim()).filter(Boolean);

    const emailSet = new Set();
    const duplicateEmails = [];
    emails.forEach(e => {
      if (emailSet.has(e)) duplicateEmails.push(e);
      emailSet.add(e);
    });

    const phoneSet = new Set();
    const duplicatePhones = [];
    phones.forEach(p => {
      if (phoneSet.has(p)) duplicatePhones.push(p);
      phoneSet.add(p);
    });

    console.log(`Total emails: ${emails.length}, Duplicate emails found: ${duplicateEmails.length}`);
    console.log(`Total phones: ${phones.length}, Duplicate phones found: ${duplicatePhones.length}`);
  }

  console.log('\n=== AUDIT COMPLETED ===');
}

auditRegistration();
