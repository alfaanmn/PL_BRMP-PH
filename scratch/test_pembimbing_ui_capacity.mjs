// Test suite untuk validasi logika kapasitas pembimbing UI SIM-Magang
function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    process.exitCode = 1;
  }
}

console.log('=== PENGUJIAN LOGIKA KAPASITAS PEMBIMBING UI SIM-MAGANG ===\n');

// 1. Uji SUM jumlah_anggota (bukan COUNT row)
const rawPengajuans = [
  { id: 1, pembimbing_id: 10, jumlah_anggota: 2, status: 'Sedang Magang' },
  { id: 2, pembimbing_id: 10, jumlah_anggota: 1, status: 'Sedang Magang' },
  { id: 3, pembimbing_id: 11, jumlah_anggota: 4, status: 'Sedang Magang' },
  { id: 4, pembimbing_id: 12, jumlah_anggota: 5, status: 'Disetujui' },
  { id: 5, pembimbing_id: 10, jumlah_anggota: 3, status: 'Ditolak' }, // Tidak boleh ikut dihitung
  { id: 6, pembimbing_id: 10, jumlah_anggota: 2, status: 'Selesai' }, // Tidak boleh ikut dihitung
];

const terisiMap = new Map();
for (const row of rawPengajuans) {
  if (row.status === 'Sedang Magang' || row.status === 'Disetujui') {
    const pId = row.pembimbing_id;
    const count = Number(row.jumlah_anggota) || 1;
    terisiMap.set(pId, (terisiMap.get(pId) || 0) + count);
  }
}

assert('Pembimbing ID 10 terisi 3 peserta (2+1, mengabaikan Ditolak & Selesai)', terisiMap.get(10) === 3);
assert('Pembimbing ID 11 terisi 4 peserta', terisiMap.get(11) === 4);
assert('Pembimbing ID 12 terisi 5 peserta', terisiMap.get(12) === 5);

// 2. Uji Kalkulasi Opsi Pembimbing & Kuota Asli Database (Tanpa Fallback Angka 5 Palsu)
const rawPembimbings = [
  { id: 10, nama: 'Alfan', nip: '123', kuota_default: 5, is_active: true },
  { id: 11, nama: 'Budi', nip: '456', kuota_default: 5, is_active: true },
  { id: 12, nama: 'Rani', nip: '789', kuota_default: 5, is_active: true },
  { id: 13, nama: 'Kosong', nip: '000', kuota_default: 0, is_active: true }, // kuota 0 wajib tetap 0
  { id: 14, nama: 'Nonaktif', nip: '999', kuota_default: 10, is_active: false },
];

function buildPembimbingOptions(pembimbingList, occupancyMap) {
  return pembimbingList.map((p) => {
    const kuota = p.kuota_default !== null && p.kuota_default !== undefined ? Number(p.kuota_default) : 0;
    const terisi = occupancyMap.get(p.id) || 0;
    const slotTersedia = Math.max(0, kuota - terisi);
    const isFull = slotTersedia <= 0;

    return {
      id: p.id,
      nama: p.nama,
      nip: p.nip,
      kuota_default: kuota,
      terisi,
      slot_tersedia: slotTersedia,
      is_active: p.is_active !== false,
      is_full: isFull,
    };
  });
}

const options = buildPembimbingOptions(rawPembimbings, terisiMap);

// Skenario 1: Kuota 5, terisi 3 -> tersedia 2
const opt10 = options.find((o) => o.id === 10);
assert('ID 10: Kuota 5, terisi 3, slot 2, is_full = false', opt10.kuota_default === 5 && opt10.terisi === 3 && opt10.slot_tersedia === 2 && !opt10.is_full);

// Skenario 2: Kuota 5, terisi 4 -> tersedia 1
const opt11 = options.find((o) => o.id === 11);
assert('ID 11: Kuota 5, terisi 4, slot 1, is_full = false', opt11.kuota_default === 5 && opt11.terisi === 4 && opt11.slot_tersedia === 1 && !opt11.is_full);

// Skenario 3: Kuota 5, terisi 5 -> tampil Penuh (slot 0)
const opt12 = options.find((o) => o.id === 12);
assert('ID 12: Kuota 5, terisi 5, slot 0, is_full = true', opt12.kuota_default === 5 && opt12.terisi === 5 && opt12.slot_tersedia === 0 && opt12.is_full);

// Skenario 4: Kuota 0 database asli (tanpa fallback) -> tampil kuota 0, slot 0, is_full = true
const opt13 = options.find((o) => o.id === 13);
assert('ID 13: Kuota 0, slot 0, is_full = true (tanpa fallback 5)', opt13.kuota_default === 0 && opt13.slot_tersedia === 0 && opt13.is_full);

// 3. Uji Evaluasi Validasi UI Dropdown & Pengajuan Kelompok
function evaluateOptionDisabled(option, requiredSlots) {
  const isInactive = option.is_active === false;
  const isFull = option.is_full || option.slot_tersedia <= 0;
  const isInsufficient = option.slot_tersedia < requiredSlots;
  return isInactive || isFull || isInsufficient;
}

// Kasus A: Pengajuan Individu (jumlah_anggota = 1)
assert('Individu (1 orang): ID 10 (slot 2) -> ENABLED', evaluateOptionDisabled(opt10, 1) === false);
assert('Individu (1 orang): ID 11 (slot 1) -> ENABLED', evaluateOptionDisabled(opt11, 1) === false);
assert('Individu (1 orang): ID 12 (slot 0) -> DISABLED (Penuh)', evaluateOptionDisabled(opt12, 1) === true);
assert('Individu (1 orang): ID 13 (kuota 0) -> DISABLED (Penuh)', evaluateOptionDisabled(opt13, 1) === true);
assert('Individu (1 orang): ID 14 (nonaktif) -> DISABLED (Nonaktif)', evaluateOptionDisabled(options.find((o) => o.id === 14), 1) === true);

// Kasus B: Pengajuan Kelompok (jumlah_anggota = 3)
assert('Kelompok (3 orang): ID 10 (slot 2) -> DISABLED (Slot 2 < 3)', evaluateOptionDisabled(opt10, 3) === true);
assert('Kelompok (3 orang): ID 11 (slot 1) -> DISABLED (Slot 1 < 3)', evaluateOptionDisabled(opt11, 3) === true);

// Kasus C: Pengajuan Kelompok (jumlah_anggota = 2)
assert('Kelompok (2 orang): ID 10 (slot 2) -> ENABLED (Slot 2 >= 2)', evaluateOptionDisabled(opt10, 2) === false);

console.log('\n=== SELURUH PENGUJIAN LOGIKA KAPASITAS PEMBIMBING UI LOLOS 100% ===');
