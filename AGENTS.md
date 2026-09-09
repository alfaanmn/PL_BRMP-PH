# AGENTS.md — Aturan Wajib Project SIM-MAGANG

Dokumen ini adalah aturan permanen dan WAJIB dibaca serta dipatuhi
oleh setiap AI agent sebelum melakukan perubahan apa pun pada project.

Project ini menggunakan Next.js + TypeScript + Supabase.

Agent TIDAK BOLEH mengandalkan asumsi dari percakapan, struktur lama,
atau implementasi sebelumnya apabila informasi tersebut dapat
diverifikasi langsung dari filesystem, source code, konfigurasi,
atau database.

PRINSIP UTAMA:

VERIFY → PLAN → USER APPROVAL → IMPLEMENT → VERIFY → REPORT

Tidak boleh:

USER MINTA FITUR → AGENT LANGSUNG CODING.


=================================================================
BAGIAN 1 — KONTEKS PROJECT
=================================================================

Nama project:
SIM-MAGANG

Tujuan:
Sistem Informasi Manajemen Magang.

Stack utama:

- Next.js
- TypeScript
- React
- Tailwind CSS
- Supabase
- PostgreSQL melalui Supabase
- Supabase Auth
- Supabase Storage
- Next.js Route Handlers untuk kebutuhan server/API

Deployment:

- Frontend: Vercel
- Backend/server-side logic: Next.js di Vercel
- Database: Supabase
- Authentication: Supabase Auth
- File storage: Supabase Storage

Project TIDAK menggunakan:

- Laravel
- PHP
- MySQL
- Express sebagai backend terpisah
- Flask sebagai backend terpisah
- server backend terpisah kecuali user secara eksplisit
  meminta perubahan arsitektur.


=================================================================
BAGIAN 2 — ARSITEKTUR APLIKASI
=================================================================

Arsitektur utama:

User
  ↓
Vercel
  ↓
Next.js
  ├── App Router
  ├── Server Components
  ├── Client Components
  ├── Server Actions jika diperlukan
  └── Route Handlers / app/api/*
          ↓
       Supabase
       ├── PostgreSQL
       ├── Auth
       ├── Storage
       └── Row Level Security

Supabase adalah sumber utama data bisnis.

Next.js bertanggung jawab terhadap:

- UI
- routing
- server rendering
- server-side logic
- API/Route Handlers
- validasi input
- integrasi Supabase

Supabase bertanggung jawab terhadap:

- database
- authentication
- authorization melalui RLS
- storage
- data persistence


=================================================================
BAGIAN 3 — ATURAN STRUKTUR FOLDER
=================================================================

Struktur folder project adalah bagian dari arsitektur.

Agent TIDAK BOLEH membuat folder baru secara sembarangan hanya karena
menurut agent struktur tersebut lebih rapi.

Struktur utama:

app/
components/
lib/
hooks/
types/
public/
supabase/

Routing menggunakan Next.js App Router.

Route Group:

- (guest)
- (auth)
- (pengguna)
- (admin)

Route group TIDAK mengubah URL publik.

Contoh:

app/(pengguna)/dashboard/page.tsx

menghasilkan:

/dashboard


=================================================================
BAGIAN 4 — STRUKTUR ROUTING WAJIB
=================================================================

## Guest

app/(guest)/

Digunakan untuk halaman yang dapat diakses tanpa login.

Halaman:

- /
- /bidang/[id]
- /kontak


## Authentication

app/(auth)/

Digunakan untuk:

- login
- register
- authentication callback

Halaman:

- /login
- /register
- /callback


## Pengguna

app/(pengguna)/

Digunakan untuk pengguna biasa.

Halaman:

- /dashboard
- /career/step1
- /career/step2
- /pengajuan/[publicId]
- /riwayat
- /gate/[publicId]/skm


## Admin

app/(admin)/

Digunakan untuk administrator.

Halaman:

- /admin/dashboard
- /admin/bidang
- /admin/bidang/[id]
- /admin/pembimbing
- /admin/pembimbing/[id]
- /admin/riwayat-pengajuan
- /admin/riwayat-pengajuan/[publicId]
- /admin/skm-pertanyaan
- /admin/rekap-skm
- /admin/laporan

Jika route aktual berbeda dari dokumentasi ini, agent WAJIB memeriksa
filesystem terlebih dahulu sebelum mengubah routing.


=================================================================
BAGIAN 5 — API / ROUTE HANDLERS
=================================================================

API berada di:

app/api/

Struktur:

app/api/bidang/route.ts
app/api/pembimbing/route.ts
app/api/pengajuan/route.ts
app/api/skm/route.ts
app/api/laporan/route.ts

Route Handler hanya digunakan jika memang diperlukan.

JANGAN membuat Route Handler hanya untuk membungkus query Supabase
yang dapat dilakukan secara aman melalui server component atau
service layer.

JANGAN membuat endpoint baru jika endpoint yang sudah ada masih dapat
digunakan tanpa membuat arsitektur menjadi lebih kompleks.

Semua endpoint WAJIB:

- memvalidasi input
- memeriksa authentication jika diperlukan
- memeriksa authorization jika diperlukan
- menangani error
- tidak membocorkan data sensitif
- menggunakan response yang konsisten


=================================================================
BAGIAN 6 — SERVICES
=================================================================

Logic akses data dan business logic utama diletakkan di:

lib/services/

Contoh:

lib/services/auth.service.ts
lib/services/bidang.service.ts
lib/services/pembimbing.service.ts
lib/services/pengajuan.service.ts
lib/services/skm.service.ts
lib/services/laporan.service.ts

Agent TIDAK BOLEH:

- menaruh business logic kompleks langsung di page.tsx
- menaruh query database besar secara berulang di banyak component
- menduplikasi logic yang sudah tersedia di service

Jika logic digunakan lebih dari satu tempat dan bersifat business
logic, pertimbangkan service/helper yang sesuai.

JANGAN membuat abstraction hanya untuk satu query sederhana.


=================================================================
BAGIAN 7 — SUPABASE CLIENT
=================================================================

Supabase client:

lib/supabase/client.ts

Digunakan untuk kebutuhan browser/client.

Supabase server:

lib/supabase/server.ts

Digunakan untuk kebutuhan server-side.

Supabase middleware helper:

lib/supabase/middleware.ts

Digunakan untuk kebutuhan session/auth middleware.

Agent WAJIB membedakan:

- browser client
- server client
- middleware/session handling

JANGAN menggunakan service-role key di client.


=================================================================
BAGIAN 8 — ENVIRONMENT VARIABLES
=================================================================

Environment variables WAJIB menggunakan:

.env.local

Template:

.env.example

JANGAN pernah:

- commit secret
- menulis service role key di source code
- menaruh secret di component client
- menaruh credential Supabase di repository

Variable public hanya boleh menggunakan prefix:

NEXT_PUBLIC_

Supabase service role key hanya boleh digunakan di server-side
dan hanya apabila benar-benar diperlukan.

Jika tidak diperlukan, JANGAN gunakan service role key.


=================================================================
BAGIAN 9 — DATABASE SUPABASE
=================================================================

Database bisnis menggunakan PostgreSQL melalui Supabase.

Database adalah SOURCE OF TRUTH untuk struktur data bisnis.

Struktur yang telah ditetapkan:

1. profiles
2. pembimbings
3. bidangs
4. bidang_pembimbing
5. pengajuans
6. pengajuan_status_logs
7. skm_pertanyaan
8. skm_jawaban
9. notifikasi

Total:

9 tabel
105 kolom

JANGAN menganggap tabel framework Laravel lama masih diperlukan.

Tabel Laravel seperti:

- users
- migrations
- cache
- sessions
- jobs
- password_reset_tokens

TIDAK dipindahkan sebagai tabel bisnis.

Authentication menggunakan:

Supabase Auth → auth.users

Data profile aplikasi menggunakan:

profiles


=================================================================
BAGIAN 10 — DATABASE: WAJIB VERIFIKASI
=================================================================

SEBELUM membuat query yang bergantung pada struktur database,
agent WAJIB memverifikasi struktur aktual apabila akses database
tersedia.

JANGAN menebak:

- nama tabel
- nama kolom
- tipe data
- primary key
- foreign key
- nullable
- enum/check constraint
- unique constraint
- relationship

Jika schema aktual berbeda dengan dokumentasi:

SCHEMA AKTUAL MENANG.

Agent WAJIB melaporkan perbedaan tersebut.


=================================================================
BAGIAN 11 — PERUBAHAN DATABASE
=================================================================

PERUBAHAN DATABASE ADALAH PERUBAHAN BERISIKO.

Agent DILARANG langsung:

- membuat tabel
- menghapus tabel
- menambah kolom
- menghapus kolom
- mengubah tipe data
- mengubah constraint
- mengubah foreign key
- mengubah RLS policy
- mengubah trigger
- mengubah function database
- mengubah index

tanpa Implementation Plan dan persetujuan eksplisit user.

Urutan WAJIB:

1. Verifikasi schema aktual.
2. Identifikasi kebutuhan perubahan.
3. Buat Implementation Plan.
4. Jelaskan perubahan database.
5. Jelaskan dampaknya.
6. Tunggu persetujuan eksplisit user.
7. Baru lakukan perubahan.
8. Verifikasi hasil perubahan.
9. Buat Final Implementation Report.

Persetujuan untuk mengerjakan fitur TIDAK otomatis berarti persetujuan
untuk mengubah database.

Jika fitur dapat dibuat tanpa perubahan database:

JANGAN mengubah database.


=================================================================
BAGIAN 12 — SUPABASE MIGRATIONS
=================================================================

Schema database harus dapat dilacak melalui:

supabase/migrations/

Migration WAJIB digunakan untuk perubahan schema yang memang
disetujui.

Agent TIDAK BOLEH:

- mengedit migration lama yang sudah diterapkan
- menghapus migration lama
- mengubah migration lama hanya agar history terlihat bersih

Untuk perubahan schema baru:

buat migration baru.

Migration harus:

- idempotent jika memungkinkan
- memiliki nama yang jelas
- hanya berisi perubahan yang diperlukan
- tidak membawa perubahan fitur lain

Jika perubahan dilakukan langsung melalui Supabase SQL Editor,
agent WAJIB memastikan perubahan tersebut tetap tercatat dalam
migration project jika workflow project memang menggunakan
migration sebagai source history.


=================================================================
BAGIAN 13 — ROW LEVEL SECURITY
=================================================================

RLS adalah bagian WAJIB dari keamanan database.

JANGAN mengandalkan middleware Next.js saja untuk keamanan data.

JANGAN menganggap:

"halaman tidak bisa dibuka"

berarti:

"data sudah aman".

Setiap tabel yang berisi data user harus dievaluasi terhadap:

- SELECT
- INSERT
- UPDATE
- DELETE

Policy harus mengikuti role dan ownership data.

Minimal role aplikasi:

- pengguna
- admin

Role disimpan pada:

profiles.role

Authentication berasal dari:

auth.users


=================================================================
BAGIAN 14 — AUTHORIZATION
=================================================================

Authentication:

"Siapa user?"

Authorization:

"Apa yang boleh user lakukan?"

Agent WAJIB membedakan keduanya.

Pengguna biasa tidak boleh mendapatkan akses admin hanya karena
mengetahui URL admin.

Authorization WAJIB diterapkan pada:

- middleware jika relevan
- server-side logic
- Route Handler jika digunakan
- database RLS

JANGAN hanya menyembunyikan tombol admin di frontend.


=================================================================
BAGIAN 15 — TYPESCRIPT
=================================================================

Project menggunakan TypeScript.

Agent DILARANG menggunakan:

any

kecuali benar-benar diperlukan dan alasan teknisnya dijelaskan.

Prioritaskan:

- type
- interface
- generics
- union types
- typed Supabase responses

Database types:

types/database.types.ts

Jika schema database berubah dan generated types digunakan,
types WAJIB diperbarui.

JANGAN membuat type database manual yang bertentangan dengan
schema aktual.


=================================================================
BAGIAN 16 — VALIDATION
=================================================================

Validation berada di:

lib/validations/

Gunakan schema validation yang konsisten.

Input dari user TIDAK BOLEH dipercaya langsung.

Validasi WAJIB dilakukan minimal untuk:

- form
- API request
- data yang masuk ke business logic
- data yang membutuhkan format tertentu

JANGAN hanya mengandalkan HTML validation.


=================================================================
BAGIAN 17 — COMPONENTS
=================================================================

components/ui/

Berisi komponen UI reusable.

components/forms/

Berisi form berdasarkan domain.

components/layout/

Berisi layout component.

components/shared/

Berisi komponen reusable lintas fitur.

Agent DILARANG membuat component baru jika component yang sudah ada
dapat digunakan tanpa memaksakan abstraction yang buruk.

JANGAN membuat satu component raksasa berisi seluruh halaman.

JANGAN membuat component kecil secara berlebihan hanya demi
memecah file.


=================================================================
BAGIAN 18 — CLIENT VS SERVER COMPONENT
=================================================================

Gunakan Server Component sebagai default.

Gunakan "use client" hanya jika diperlukan, misalnya:

- state interaktif
- event handler browser
- browser API
- hook client
- interaksi UI yang membutuhkan client state

JANGAN menjadikan seluruh halaman sebagai Client Component hanya
karena satu bagian kecil membutuhkan interaksi.


=================================================================
BAGIAN 19 — FILE STORAGE
=================================================================

Dokumen user TIDAK boleh disimpan di:

public/documents/

File private harus menggunakan:

Supabase Storage

Agent WAJIB mempertimbangkan:

- bucket
- path
- ownership
- access policy
- upload validation
- file type
- file size

JANGAN membuat file user dapat diakses publik tanpa alasan.


=================================================================
BAGIAN 20 — NOTIFIKASI
=================================================================

Tabel:

notifikasi

digunakan untuk menyimpan notifikasi aplikasi.

Notifikasi tidak boleh dianggap sebagai pengganti status utama.

Status bisnis harus berasal dari data utama.

JANGAN membuat notifikasi yang menyatakan suatu tindakan berhasil
jika transaksi database sebenarnya gagal.


=================================================================
BAGIAN 21 — PENGAJUAN
=================================================================

Tabel utama:

pengajuans

History status:

pengajuan_status_logs

Perubahan status harus memperhatikan history.

JANGAN menghapus history status hanya karena status terbaru berubah.

Jika workflow status membutuhkan aturan baru:

agent WAJIB menjelaskan state transition sebelum implementasi.


=================================================================
BAGIAN 22 — SKM
=================================================================

Tabel:

skm_pertanyaan
skm_jawaban

SKM harus memisahkan:

- master pertanyaan
- jawaban user

JANGAN menyimpan pertanyaan sebagai hardcoded data di component
jika data tersebut memang berasal dari database.

Perubahan pertanyaan tidak boleh secara otomatis menghapus jawaban
historis kecuali requirement secara eksplisit mengizinkannya.


=================================================================
BAGIAN 23 — DATA DAN IDENTIFIER
=================================================================

URL publik menggunakan:

publicId

JANGAN mengekspos identifier internal secara sembarangan jika
arsitektur menggunakan publicId.

Jika suatu route menggunakan:

[publicId]

agent WAJIB memastikan query menggunakan identifier yang benar.

JANGAN mengganti publicId menjadi numeric ID hanya karena lebih mudah.


=================================================================
BAGIAN 24 — IMPLEMENTATION PLAN WAJIB
=================================================================

SEBELUM coding atau mengubah file apapun, agent WAJIB membuat
Implementation Plan.

Implementation Plan minimal berisi:

1. Tujuan
2. Requirement yang dipenuhi
3. File yang akan dibuat
4. File yang akan diubah
5. Perubahan pada masing-masing file
6. Perubahan database jika ada
7. Alur data
8. Alur UI
9. Authorization/security impact
10. Dampak terhadap fitur lain
11. Testing yang akan dilakukan

Format:

IMPLEMENTATION PLAN

Tujuan:
...

Requirement:
...

File baru:
- ...

File diubah:
- ...

Database:
- NONE
atau
- ...

Alur:
1. ...
2. ...
3. ...

Security:
...

Testing:
...

Agent WAJIB berhenti setelah memberikan plan apabila perubahan
database diperlukan.

Untuk perubahan kode biasa, agent boleh melanjutkan setelah user
memberikan instruksi untuk mengerjakan plan.


=================================================================
BAGIAN 25 — DILARANG CODING SEBELUM PLAN
=================================================================

Agent DILARANG:

- membuat file
- menghapus file
- mengubah file
- menjalankan generator
- menginstall dependency
- mengubah konfigurasi

sebagai bagian dari implementasi fitur sebelum Implementation Plan
disampaikan.

Jika user memberikan requirement yang ambigu:

JANGAN langsung menebak implementasi.

Verifikasi terlebih dahulu atau jelaskan asumsi yang diperlukan.


=================================================================
BAGIAN 26 — DEPENDENCY
=================================================================

Agent TIDAK BOLEH menambahkan package npm baru hanya karena package
tersebut "lebih enak".

Sebelum menambahkan dependency:

1. Periksa package.json.
2. Periksa apakah fungsi sudah tersedia.
3. Jelaskan alasan package diperlukan.
4. Jelaskan dampaknya.
5. Tambahkan hanya jika memang diperlukan.

JANGAN menambahkan library untuk pekerjaan yang dapat dilakukan
dengan dependency yang sudah tersedia.


=================================================================
BAGIAN 27 — ERROR HANDLING
=================================================================

Error harus ditangani secara eksplisit.

JANGAN:

- silent failure
- catch kosong
- menampilkan stack trace kepada user
- membocorkan credential
- membocorkan query internal
- menganggap error sebagai success

Error UI harus informatif tetapi tidak membocorkan informasi sensitif.


=================================================================
BAGIAN 28 — TESTING
=================================================================

Setiap implementasi WAJIB diverifikasi.

Minimal:

- TypeScript check
- lint
- build jika relevan
- test logic terkait
- verifikasi route
- verifikasi authentication
- verifikasi authorization
- verifikasi database operation jika database disentuh

Jika ada command yang gagal:

JANGAN menyatakan implementasi berhasil.

Agent WAJIB memperbaiki atau melaporkan error tersebut.


=================================================================
BAGIAN 29 — BROWSER / VISUAL TESTING
=================================================================

Agent DILARANG membuka browser otomatis.

Dilarang menggunakan browser agent atau screenshot verification
secara otomatis.

Jika verifikasi browser diperlukan:

agent WAJIB menjelaskan langkah manual kepada user.

Contoh:

"Buka http://localhost:3000/login secara manual."

Jika task secara teknis benar-benar membutuhkan browser automation:

agent WAJIB meminta izin user terlebih dahulu.


=================================================================
BAGIAN 30 — GIT
=================================================================

Agent tidak boleh:

- reset repository
- force push
- menghapus branch
- menghapus commit
- menjalankan destructive git operation

tanpa instruksi eksplisit user.

JANGAN menghapus pekerjaan user.

Sebelum mengubah file:

perhatikan perubahan yang sudah ada.

JANGAN overwrite perubahan user yang tidak berkaitan.


=================================================================
BAGIAN 31 — JANGAN MENGHAPUS KODE SECARA SEMBARANGAN
=================================================================

Kode existing dianggap intentional sampai terbukti sebaliknya.

Sebelum menghapus:

- file
- function
- component
- route
- service
- database query

agent WAJIB memastikan tidak ada dependency terhadap bagian tersebut.

Jika tidak yakin:

JANGAN hapus.

Laporkan terlebih dahulu.


=================================================================
BAGIAN 32 — DILARANG OVERENGINEERING
=================================================================

JANGAN membuat:

- abstraction berlebihan
- service berlapis tanpa kebutuhan
- API endpoint duplikat
- hook untuk operasi satu baris
- component untuk markup trivial
- database table baru tanpa requirement
- dependency baru tanpa alasan

Gunakan struktur yang sudah tersedia.

Solusi paling sederhana yang memenuhi requirement adalah prioritas.


=================================================================
BAGIAN 33 — DILARANG MENGUBAH REQUIREMENT SENDIRI
=================================================================

Agent tidak boleh mengubah:

- nama field
- status
- role
- workflow
- business rule
- URL
- struktur database

hanya karena menurut agent desain tersebut lebih baik.

Jika ada desain yang dianggap bermasalah:

jelaskan masalahnya.

Jangan mengubahnya diam-diam.


=================================================================
BAGIAN 34 — DATABASE SCHEMA VS UI
=================================================================

UI harus mengikuti data model.

JANGAN membuat field UI yang tidak memiliki dasar pada database
hanya supaya tampilan terlihat lengkap.

Jika UI membutuhkan data yang belum tersedia:

laporkan:

FIELD YANG DIBUTUHKAN:
...

TABLE:
...

STATUS:
NOT AVAILABLE

JANGAN membuat kolom otomatis.


=================================================================
BAGIAN 35 — BUSINESS LOGIC
=================================================================

Business logic harus berada di tempat yang sesuai.

UI:

- menampilkan data
- menerima input
- mengelola interaction

Validation:

- memvalidasi input

Service:

- business logic
- database operation

Database:

- constraint
- RLS
- integrity

JANGAN memindahkan business rule ke frontend hanya karena lebih
mudah.


=================================================================
BAGIAN 36 — DATA INTEGRITY
=================================================================

Agent WAJIB menjaga:

- referential integrity
- ownership
- status consistency
- duplicate prevention
- valid foreign key
- valid identifier

Jika operasi melibatkan beberapa perubahan data yang harus berhasil
bersama-sama, pertimbangkan transaction atau database function sesuai
kebutuhan.

JANGAN menganggap dua query terpisah selalu atomic.


=================================================================
BAGIAN 37 — SECURITY
=================================================================

Prioritas keamanan:

1. RLS
2. authorization server-side
3. input validation
4. secure environment variables
5. secure storage access

JANGAN:

- expose service role key
- bypass RLS dari client
- percaya role dari request body
- percaya userId dari frontend
- mengizinkan user mengubah ownership data melalui request biasa


=================================================================
BAGIAN 38 — VERIFICATION SEBELUM IMPLEMENTASI
=================================================================

Sebelum coding, agent WAJIB memeriksa:

- struktur folder
- file terkait
- package.json
- konfigurasi yang relevan
- schema database jika diperlukan
- existing service
- existing component
- existing validation

JANGAN membuat file baru jika file yang diperlukan sudah tersedia.


=================================================================
BAGIAN 39 — FINAL IMPLEMENTATION REPORT WAJIB
=================================================================

SETELAH IMPLEMENTASI SELESAI, agent WAJIB memberikan:

FINAL IMPLEMENTATION REPORT

Isi minimal:

1. Status
2. Requirement yang selesai
3. File yang dibuat
4. File yang diubah
5. Database changes
6. Logic yang diimplementasikan
7. Security / RLS impact
8. Testing yang dilakukan
9. Hasil testing
10. Error yang ditemukan
11. Hal yang belum selesai
12. Manual verification steps jika diperlukan

Format:

FINAL IMPLEMENTATION REPORT

Status:
COMPLETED / PARTIALLY COMPLETED / BLOCKED

Requirement:
- [x] ...
- [x] ...

Files Created:
- ...

Files Modified:
- ...

Database:
NONE
atau
...

Implementation:
- ...

Security:
- ...

Testing:
- npm run lint
- npm run build
- ...

Result:
PASS / FAIL

Known Issues:
- ...

Manual Verification:
1. ...
2. ...


=================================================================
BAGIAN 40 — JIKA IMPLEMENTASI GAGAL
=================================================================

Agent TIDAK BOLEH mengatakan "selesai" jika:

- build gagal
- TypeScript error
- lint error yang relevan
- database operation gagal
- authentication gagal
- authorization gagal
- requirement utama belum terpenuhi

Status harus:

PARTIALLY COMPLETED

atau:

BLOCKED

Jelaskan penyebabnya.


=================================================================
BAGIAN 41 — JIKA TERDAPAT KONFLIK REQUIREMENT
=================================================================

Prioritas:

1. Requirement eksplisit user
2. Schema/database aktual
3. AGENTS.md
4. Existing architecture
5. Best practice

Jika requirement user bertentangan dengan keamanan atau integrity
database, agent WAJIB menjelaskan konflik tersebut sebelum
implementasi.


=================================================================
BAGIAN 42 — ATURAN COMMAND TERMINAL
=================================================================

Command terminal yang bersifat destructive harus diperlakukan
sebagai operasi berisiko.

Contoh:

- Remove-Item
- rm
- rmdir
- git reset
- git checkout -- file
- git clean
- DROP
- DELETE
- TRUNCATE

JANGAN menjalankan command destructive tanpa memastikan targetnya.

JANGAN menghapus seluruh project atau folder hanya untuk
"mengulang dari awal" tanpa instruksi eksplisit user.


=================================================================
BAGIAN 43 — ATURAN DEPLOYMENT
=================================================================

Deployment target:

Vercel.

Sebelum deployment:

- npm run lint
- npm run build
- environment variables harus tersedia
- Supabase URL harus benar
- Supabase anon/publishable key harus benar
- service role key tidak boleh masuk client
- authentication callback harus benar
- RLS harus aktif sesuai kebutuhan

Agent tidak boleh menyatakan deployment siap hanya berdasarkan
"kode terlihat benar".

Build harus berhasil.


=================================================================
BAGIAN 44 — PRINSIP DATA
=================================================================

JANGAN membuat data dummy hanya agar UI terlihat berjalan kecuali
user memang meminta seed/test data.

Seed data harus berada di:

supabase/seed.sql

Data production tidak boleh dibuat melalui hardcoded array
di component.

Master data harus berasal dari database jika memang merupakan
data aplikasi.


=================================================================
BAGIAN 45 — ATURAN FINAL
=================================================================

SETIAP PEKERJAAN WAJIB MENGIKUTI:

1. READ
2. VERIFY
3. PLAN
4. USER APPROVAL
5. IMPLEMENT
6. TEST
7. VERIFY
8. REPORT

Tidak boleh:

READ
→ CODING
→ "kayaknya bener".

Tidak boleh:

USER REQUEST
→ DIRECT CODING.

Tidak boleh:

DATABASE NEEDED
→ AUTO ALTER DATABASE.

Tidak boleh:

BUILD FAILED
→ "COMPLETED".

Tidak boleh:

RLS BELUM ADA
→ "SECURE".

Tidak boleh:

ASSUMPTION
→ IMPLEMENTATION.

Jika agent tidak mengetahui sesuatu yang penting:

VERIFY FIRST.

Jika schema tidak tersedia:

REPORT MISSING INFORMATION.

Jika requirement tidak jelas:

ASK BEFORE IMPLEMENTATION.

Jika database perlu diubah:

PLAN → USER APPROVAL → DATABASE CHANGE.

Jika coding selesai:

TEST → FINAL IMPLEMENTATION REPORT.


=================================================================
PRINSIP UTAMA PROJECT
=================================================================

SIM-MAGANG harus dibangun dengan prinsip:

- Database-first
- Type-safe
- Secure by default
- RLS enforced
- Server-side authorization
- Minimal abstraction
- No unnecessary dependencies
- No duplicated business logic
- No undocumented schema changes
- No destructive operation without approval
- No coding before Implementation Plan
- No completion claim without verification
- Final Implementation Report wajib setelah pekerjaan selesai

PLAN DULU.
USER SETUJU.
BARU CODING.
TEST.
REPORT.

END OF AGENTS.md