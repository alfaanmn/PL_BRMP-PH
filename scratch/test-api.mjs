async function testEndpoints() {
  console.log('--- TEST API /api/auth/check-duplicate ---')
  
  // Test 1: Email existing + HP existing
  const r1 = await fetch('http://localhost:3000/api/auth/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '065123142@student.unpak.ac.id', no_hp: '085163720894' })
  }).then(res => res.json())
  console.log('Test 1 (Existing Email + Existing HP):', JSON.stringify(r1, null, 2))

  // Test 2: Email baru + HP existing
  const r2 = await fetch('http://localhost:3000/api/auth/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user.baru.999@test.com', no_hp: '085163720894' })
  }).then(res => res.json())
  console.log('Test 2 (New Email + Existing HP):', JSON.stringify(r2, null, 2))

  // Test 3: Email baru + HP existing with +62 format
  const r3 = await fetch('http://localhost:3000/api/auth/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user.baru.888@test.com', no_hp: '+6285163720894' })
  }).then(res => res.json())
  console.log('Test 3 (New Email + Existing HP +62 format):', JSON.stringify(r3, null, 2))

  // Test 4: Email baru + HP baru
  const r4 = await fetch('http://localhost:3000/api/auth/check-duplicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'fresh.user.12345@domain.com', no_hp: '089912345678' })
  }).then(res => res.json())
  console.log('Test 4 (Brand New Email + Brand New HP):', JSON.stringify(r4, null, 2))
}

testEndpoints().catch(console.error)
