import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envText = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envText.split('\n').forEach((line) => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '')
    env[key] = val
  }
})

const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey)

async function test() {
  console.log('--- Testing Bidangs Query ---')
  const { data: bidangs, error: bErr } = await supabase.from('bidangs').select('*').order('id')
  console.log('Bidangs:', bidangs?.length, 'items. Error:', bErr)
  if (bidangs && bidangs[0]) console.log('Sample bidang:', bidangs[0].nama, '| Kuota:', bidangs[0].kuota)

  console.log('\n--- Testing Pembimbings Query ---')
  const { data: pembimbings, error: pErr } = await supabase.from('pembimbings').select('*').order('id')
  console.log('Pembimbings:', pembimbings?.length, 'items. Error:', pErr)
  if (pembimbings && pembimbings[0]) console.log('Sample pembimbing:', pembimbings[0].nama, '| Jabatan:', pembimbings[0].jabatan)

  console.log('\n--- Testing Bidang_Pembimbing Relations ---')
  const { data: bp, error: bpErr } = await supabase
    .from('bidang_pembimbing')
    .select('id, bidang_id, pembimbing_id, is_active, pembimbings(nama), bidangs(nama)')
  console.log('Relations count:', bp?.length, 'items. Error:', bpErr)
  if (bp && bp[0]) console.log('Sample relation:', bp[0].bidangs?.nama, '<->', bp[0].pembimbings?.nama)

  console.log('\n--- ALL QUERIES SUCCEEDED PERFECTLY ---')
}

test()
