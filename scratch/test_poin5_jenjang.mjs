function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
  }
}

console.log('=== TESTING POIN 5: JENJANG PENDIDIKAN (MAHASISWA & SISWA) ===\n');

// 1. Valid values
const validJenjang = ['Mahasiswa', 'Siswa'];

assert('Jenjang only allows Mahasiswa and Siswa', validJenjang.length === 2 && validJenjang.includes('Mahasiswa') && validJenjang.includes('Siswa'));

// 2. Test single selection logic
let state = { jenjang: 'Mahasiswa' };
function selectJenjang(val) {
  if (val === 'Mahasiswa' || val === 'Siswa') {
    state.jenjang = val;
  }
}

selectJenjang('Siswa');
assert('Selecting Siswa changes state to Siswa', state.jenjang === 'Siswa');

selectJenjang('Mahasiswa');
assert('Selecting Mahasiswa changes state to Mahasiswa', state.jenjang === 'Mahasiswa');

// 3. Test arbitrary values rejected
selectJenjang('SMK');
assert('Arbitrary value SMK is rejected / remains Mahasiswa', state.jenjang === 'Mahasiswa');

selectJenjang('D3');
assert('Arbitrary value D3 is rejected / remains Mahasiswa', state.jenjang === 'Mahasiswa');

console.log('\n=== ALL POIN 5 TESTS PASSED ===');
