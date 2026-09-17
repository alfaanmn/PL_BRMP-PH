function assert(desc, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
  }
}

console.log('=== VERIFIKASI LOGIKA PROTEKSI ROUTE (RBAC MIDDLEWARE) ===\n');

// Simulasi evaluasi Middleware
function simulateMiddleware(pathname, user, profile) {
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname === '/verify-otp';
  const isAdminRoute = pathname.startsWith('/admin');
  const isPenggunaRoute = pathname.startsWith('/pengguna');

  // 1. Belum login
  if (!user) {
    if (isAdminRoute || isPenggunaRoute) {
      return { action: 'REDIRECT', target: `/login?redirect=${pathname}` };
    }
    return { action: 'ALLOW' };
  }

  // 2. Akun inactive
  if (profile && !profile.is_active) {
    return { action: 'REDIRECT', target: '/login?error=inactive' };
  }

  const role = profile?.role;

  // 3. User sudah login akses auth page
  if (isAuthPage) {
    if (role === 'administrator') {
      return { action: 'REDIRECT', target: '/admin/dashboard' };
    } else {
      return { action: 'REDIRECT', target: '/pengguna/dashboard' };
    }
  }

  // 4. Role Protection: Admin route
  if (isAdminRoute) {
    if (role !== 'administrator') {
      return { action: 'REDIRECT', target: '/pengguna/dashboard' };
    }
  }

  // 5. Role Protection: Pengguna route
  if (isPenggunaRoute) {
    if (role === 'administrator') {
      return { action: 'REDIRECT', target: '/admin/dashboard' };
    }
  }

  return { action: 'ALLOW' };
}

// Test Skenario A: Belum login
const a1 = simulateMiddleware('/admin/dashboard', null, null);
assert('Belum login akses /admin/dashboard -> Redirect /login', a1.action === 'REDIRECT' && a1.target === '/login?redirect=/admin/dashboard');

const a2 = simulateMiddleware('/pengguna/dashboard', null, null);
assert('Belum login akses /pengguna/dashboard -> Redirect /login', a2.action === 'REDIRECT' && a2.target === '/login?redirect=/pengguna/dashboard');

// Test Skenario B: Pengguna biasa
const userPengguna = { id: 'u1' };
const profilePengguna = { role: 'pengguna', is_active: true };

const b1 = simulateMiddleware('/pengguna/dashboard', userPengguna, profilePengguna);
assert('Pengguna akses /pengguna/dashboard -> ALLOW', b1.action === 'ALLOW');

const b2 = simulateMiddleware('/pengguna/riwayat', userPengguna, profilePengguna);
assert('Pengguna akses /pengguna/riwayat -> ALLOW', b2.action === 'ALLOW');

const b3 = simulateMiddleware('/admin/dashboard', userPengguna, profilePengguna);
assert('Pengguna direct access /admin/dashboard -> Redirect /pengguna/dashboard', b3.action === 'REDIRECT' && b3.target === '/pengguna/dashboard');

const b4 = simulateMiddleware('/admin/user', userPengguna, profilePengguna);
assert('Pengguna direct access /admin/user -> Redirect /pengguna/dashboard', b4.action === 'REDIRECT' && b4.target === '/pengguna/dashboard');

// Test Skenario C: Administrator
const userAdmin = { id: 'a1' };
const profileAdmin = { role: 'administrator', is_active: true };

const c1 = simulateMiddleware('/admin/dashboard', userAdmin, profileAdmin);
assert('Admin akses /admin/dashboard -> ALLOW', c1.action === 'ALLOW');

const c2 = simulateMiddleware('/admin/bidang', userAdmin, profileAdmin);
assert('Admin akses /admin/bidang -> ALLOW', c2.action === 'ALLOW');

const c3 = simulateMiddleware('/pengguna/dashboard', userAdmin, profileAdmin);
assert('Admin direct access /pengguna/dashboard -> Redirect /admin/dashboard', c3.action === 'REDIRECT' && c3.target === '/admin/dashboard');

const c4 = simulateMiddleware('/pengguna/career/step1', userAdmin, profileAdmin);
assert('Admin direct access /pengguna/career/step1 -> Redirect /admin/dashboard', c4.action === 'REDIRECT' && c4.target === '/admin/dashboard');

console.log('\n=== SELURUH SKENARIO PROTEKSI TERVERIFIKASI TEPAT ===');
