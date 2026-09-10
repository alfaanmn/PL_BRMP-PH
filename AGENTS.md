# AGENTS.md — ATURAN WAJIB PROJECT SIM-MAGANG

Dokumen ini adalah instruksi permanen dan WAJIB dibaca serta
dipatuhi oleh setiap AI agent sebelum melakukan perubahan apa pun
pada project.

Project ini menggunakan Next.js + TypeScript + Supabase.

Agent TIDAK BOLEH mengasumsikan struktur project, database,
authorization, workflow, atau business rule berdasarkan riwayat chat,
ingatan, atau pola project lain.

Jika terdapat perbedaan antara dokumentasi ini dan kondisi aktual
project/database, agent WAJIB melakukan verifikasi dan melaporkan
perbedaannya sebelum mengambil keputusan.

PRINSIP UTAMA:

PLAN DULU → VERIFIKASI → USER SETUJU → CODING → TEST → REPORT.

Tidak boleh:

USER MINTA FITUR → AGENT LANGSUNG NGODING.

=================================================================
BAGIAN 1 — IDENTITAS PROJECT
============================

Nama project:

SIM-Magang

Tujuan:

Sistem Informasi Manajemen Magang untuk mengelola proses pengajuan
magang, bidang, pembimbing, status pengajuan, SKM, notifikasi,
riwayat, dashboard, dan laporan.

Stack utama:

* Next.js
* TypeScript
* React
* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Tailwind CSS jika sudah digunakan project
* Vercel sebagai target deployment frontend

Arsitektur utama:

Next.js
↓
Supabase
├── PostgreSQL
├── Auth
├── Storage
├── RPC
└── Row Level Security (RLS)

Jangan memperkenalkan Laravel, MySQL, Prisma, atau backend framework
lain tanpa Implementation Plan dan persetujuan user.

=================================================================
BAGIAN 2 — SUMBER KEBENARAN
===========================

Urutan sumber kebenaran project:

1. Database Supabase aktual
2. Source code aktual
3. Supabase Auth / RLS / RPC / Trigger aktual
4. File konfigurasi project
5. AGENTS.md
6. Dokumentasi atau catatan lama
7. Riwayat percakapan

Jika AGENTS.md berbeda dengan database aktual:

DATABASE AKTUAL MENJADI SOURCE OF TRUTH.

Namun agent TIDAK BOLEH diam-diam mengubah AGENTS.md.

Agent wajib melaporkan:

DOCUMENTATION DRIFT DETECTED

lalu menjelaskan:

* aturan dokumentasi
* kondisi aktual
* perbedaan
* dampak
* rekomendasi

Jangan memilih salah satu secara sepihak jika perbedaan tersebut
mempengaruhi behavior aplikasi.

=================================================================
BAGIAN 3 — ATURAN IMPLEMENTATION PLAN
=====================================

SEBELUM melakukan coding atau mengubah file apa pun, agent WAJIB
memberikan Implementation Plan.

Implementation Plan minimal harus menjelaskan:

1. Tujuan perubahan
2. Fitur yang dikerjakan
3. File yang akan dibuat
4. File yang akan diubah
5. Bagian kode yang akan diubah
6. Database yang terdampak
7. RPC/trigger/RLS yang terdampak
8. Alur data
9. Authorization yang diperlukan
10. Risiko perubahan
11. Cara testing
12. Expected result

Agent WAJIB berhenti setelah Implementation Plan untuk menunggu
instruksi user menjalankan pekerjaan.

Untuk perubahan database, approval eksplisit WAJIB diberikan sebelum
SQL dijalankan.

Persetujuan terhadap fitur TIDAK otomatis berarti persetujuan terhadap
perubahan database.

=================================================================
BAGIAN 4 — ATURAN SETELAH CODING
================================

Setelah pekerjaan selesai, agent WAJIB memberikan Implementation Report.

Report WAJIB berisi:

1. Status pekerjaan
2. File yang dibuat
3. File yang diubah
4. Perubahan database
5. RPC/trigger/RLS yang digunakan
6. Perubahan UI
7. Perubahan business logic
8. Validasi yang ditambahkan
9. Testing yang dilakukan
10. Hasil testing
11. Error yang ditemukan
12. Error yang belum terselesaikan
13. Risiko/regresi yang mungkin terjadi
14. Langkah manual yang perlu dilakukan user

Agent DILARANG mengatakan "sudah selesai" jika testing belum
dilakukan atau hasil testing tidak diketahui.

Jika ada bagian yang belum diverifikasi, tulis:

NOT VERIFIED

Jangan mengarang hasil testing.

=================================================================
BAGIAN 5 — AUTHENTICATION & AUTHORIZATION
=========================================

Authentication menggunakan:

Supabase Auth.

Data profil aplikasi disimpan pada:

profiles

Role utama project:

* pengguna
* administrator

Role yang valid WAJIB mengikuti database aktual.

Nilai role:

pengguna
administrator

Agent DILARANG menggunakan:

admin
user

sebagai pengganti role project.

Contoh authorization:

profile.role === 'administrator'

atau:

profile.role === 'pengguna'

Authorization WAJIB diterapkan pada:

* halaman
* server action
* route handler
* service
* mutation
* RPC jika relevan
* RLS

Frontend authorization hanya untuk UX.

Frontend TIDAK boleh dianggap sebagai lapisan keamanan utama.

Keamanan database WAJIB tetap ditegakkan melalui RLS dan mekanisme
database yang relevan.

=================================================================
BAGIAN 6 — DATABASE SUPABASE
============================

Database utama project adalah PostgreSQL melalui Supabase.

Database bisnis saat ini terdiri dari 9 tabel utama dengan total
105 kolom berdasarkan schema final yang telah ditentukan:

1. profiles
2. pembimbings
3. bidangs
4. bidang_pembimbing
5. pengajuans
6. pengajuan_status_logs
7. skm_pertanyaan
8. skm_jawaban
9. notifikasi

Jumlah tersebut TIDAK boleh dianggap permanen tanpa verifikasi.

Jika agent membutuhkan struktur tabel, WAJIB membaca schema aktual
Supabase terlebih dahulu.

Jangan membuat kolom berdasarkan asumsi dari dokumentasi.

=================================================================
BAGIAN 7 — VERIFIKASI DATABASE
==============================

SEBELUM membuat query yang menyentuh database, agent WAJIB mengetahui:

* nama tabel
* nama kolom
* tipe data
* nullable
* default
* primary key
* foreign key
* unique constraint
* check constraint
* index
* enum
* trigger
* function
* RPC
* RLS policy

Jika informasi tersebut belum diketahui:

JANGAN MENEBak.

Verifikasi schema terlebih dahulu.

=================================================================
BAGIAN 8 — LARANGAN PERUBAHAN DATABASE OTOMATIS
===============================================

Agent DILARANG melakukan perubahan schema database secara otomatis
hanya karena fitur membutuhkan perubahan tersebut.

Perubahan seperti:

* CREATE TABLE
* ALTER TABLE
* DROP TABLE
* ADD COLUMN
* DROP COLUMN
* ALTER COLUMN
* CREATE INDEX
* DROP INDEX
* CREATE TYPE
* ALTER TYPE
* CREATE FUNCTION
* ALTER FUNCTION
* CREATE TRIGGER
* ALTER TRIGGER
* CREATE POLICY
* ALTER POLICY
* DROP POLICY

WAJIB dijelaskan terlebih dahulu.

Agent harus menjelaskan:

TABLE:
...

CHANGE:
...

REASON:
...

IMPACT:
...

RISK:
...

Kemudian BERHENTI dan menunggu approval user.

=================================================================
BAGIAN 9 — SUPABASE MIGRATIONS
==============================

Supabase menggunakan PostgreSQL migration sebagai catatan perubahan
schema.

Folder:

supabase/migrations/

Migration WAJIB merepresentasikan perubahan schema secara jelas.

JANGAN menganggap folder migrations kosong berarti database kosong.

Database aktual dapat sudah dibuat melalui Supabase SQL Editor.

Jika database sudah berisi schema dan belum memiliki migration history
yang sesuai, agent DILARANG menjalankan migration init secara buta.

JANGAN menjalankan:

0001_init.sql

terhadap database existing hanya karena file tersebut tersedia.

Sebelum membuat baseline migration, agent WAJIB memastikan apakah
database existing sudah memiliki data dan schema.

Jika diperlukan baseline/snapshot:

1. Audit schema aktual
2. Buat snapshot
3. Tandai sebagai baseline
4. Jangan menjalankannya ulang pada database existing
5. Dokumentasikan statusnya

=================================================================
BAGIAN 10 — DATABASE MIGRATION POLICY
=====================================

Untuk perubahan schema:

PLAN
↓
VERIFIKASI
↓
USER APPROVAL
↓
SQL/MIGRATION
↓
VERIFY
↓
REPORT

Jangan:

PLAN
↓
LANGSUNG ALTER DATABASE

Database production atau database yang berisi data tidak boleh
diperlakukan sebagai database kosong.

=================================================================
BAGIAN 11 — RLS
===============

Row Level Security adalah bagian keamanan utama database.

Agent DILARANG mematikan RLS hanya untuk membuat fitur berjalan.

JANGAN menggunakan:

ALTER TABLE ... DISABLE ROW LEVEL SECURITY

sebagai solusi bug aplikasi tanpa approval eksplisit.

Setiap tabel yang berisi data user harus memiliki policy yang sesuai
dengan kebutuhan akses.

Agent WAJIB memahami:

* siapa yang boleh SELECT
* siapa yang boleh INSERT
* siapa yang boleh UPDATE
* siapa yang boleh DELETE

sebelum membuat mutation.

=================================================================
BAGIAN 12 — RLS BUKAN PENGGANTI AUTHORIZATION UI
================================================

RLS melindungi database.

Authorization frontend mengatur pengalaman pengguna.

Keduanya harus konsisten.

Jika administrator dapat melihat data tertentu tetapi pengguna biasa
tidak boleh melihatnya:

* UI harus menyembunyikan akses yang tidak relevan
* server harus memvalidasi akses
* RLS harus mencegah akses database yang tidak sah

Jangan hanya menyembunyikan tombol.

=================================================================
BAGIAN 13 — MUTATION LAYER
==========================

Tidak semua data boleh diubah melalui:

supabase.from(...).update(...)

Agent WAJIB memeriksa apakah tabel memiliki:

* trigger
* function
* RPC
* RLS policy
* kolom yang dilindungi

sebelum membuat mutation.

Jika database menyediakan RPC sebagai jalur resmi untuk mutation,
gunakan RPC tersebut.

Jangan bypass protection database melalui service layer.

=================================================================
BAGIAN 14 — PROTECTIVE TRIGGERS
===============================

Database project memiliki protection layer pada level trigger/function.

Minimal terdapat protection yang berkaitan dengan:

protect_pengajuan_fields()

dan:

protect_profile_fields()

Trigger tersebut merupakan bagian dari business rule dan security
database.

Agent DILARANG menghapus, melemahkan, atau bypass trigger hanya karena
UPDATE aplikasi gagal.

Jika UPDATE ditolak atau nilai kembali ke nilai sebelumnya:

1. Verifikasi trigger
2. Verifikasi RLS
3. Verifikasi RPC
4. Verifikasi authorization
5. Identifikasi jalur mutation yang benar

Jangan langsung menyimpulkan database rusak.

Jika trigger perlu diubah:

WAJIB Implementation Plan + approval eksplisit.

=================================================================
BAGIAN 15 — RPC
===============

RPC merupakan bagian resmi dari mutation layer project.

RPC yang sudah tersedia antara lain:

batalkan_pengajuan()

submit_skm()

Agent WAJIB menggunakan RPC apabila business rule memang menentukan
RPC tersebut sebagai jalur resmi.

Jangan mengganti RPC dengan UPDATE langsung hanya karena lebih mudah.

Jika workflow baru membutuhkan transisi status yang belum tersedia:

1. Audit workflow
2. Audit RPC existing
3. Buat Implementation Plan
4. Jelaskan function/RPC baru
5. Tunggu approval database
6. Implementasikan
7. Test
8. Report

=================================================================
BAGIAN 16 — STATUS PENGAJUAN
============================

Status pengajuan adalah business state.

Status TIDAK boleh diubah sembarangan dari client.

Perubahan status harus mengikuti workflow resmi project.

Agent DILARANG membuat:

setStatus(...)
update({ status: ... })

tanpa memastikan mutation tersebut memang diizinkan.

Jika status dikunci oleh trigger:

WAJIB menggunakan jalur RPC yang sesuai.

=================================================================
BAGIAN 17 — STATUS HISTORY
==========================

pengajuan_status_logs merupakan audit trail.

Status log harus merepresentasikan perubahan status yang benar-benar
terjadi.

Jangan membuat log palsu hanya agar timeline terlihat lengkap.

Jangan menghapus history hanya karena UI tidak membutuhkannya.

Jika diperlukan penghapusan status history:

WAJIB Implementation Plan dan approval.

=================================================================
BAGIAN 18 — PENGAJUAN
=====================

pengajuans adalah entitas bisnis utama.

Agent WAJIB menjaga:

* public identifier
* relasi pengguna
* relasi bidang
* relasi pembimbing
* status
* timestamp
* dokumen
* nilai
* data SKM
* workflow

Jangan membuat duplicate record hanya karena halaman refresh,
redirect, atau retry request.

Mutation harus mempertimbangkan idempotency.

=================================================================
BAGIAN 19 — PUBLIC ID
=====================

Jika pengajuan menggunakan public_id:

Gunakan public_id untuk URL publik/aplikasi sesuai rancangan.

Jangan mengekspos primary key internal jika tidak diperlukan.

Jangan membuat public_id baru ketika record existing sedang diedit.

Jangan mengganti identifier existing hanya karena UI membutuhkan URL
baru.

=================================================================
BAGIAN 20 — MULTI-STEP FORM
===========================

Alur multi-step WAJIB mempertahankan identifier dan context penting.

Saat berpindah antar step:

* public_id
* user context
* pengajuan context
* field penting
* state workflow

tidak boleh hilang.

Jangan menggunakan query parameter sebagai workaround jika route
parameter yang benar tersedia.

Setiap step harus aman terhadap:

* refresh
* back
* forward
* duplicate submission
* direct URL access

=================================================================
BAGIAN 21 — CAREER / PENGAJUAN
==============================

Career flow harus mengikuti workflow yang sudah ditentukan.

Jangan membuat alur paralel untuk proses yang sama.

Jika Step 1 dan Step 2 adalah bagian dari satu pengajuan:

JANGAN membuat dua record pengajuan hanya karena user berpindah step.

Record harus dibuat atau diperbarui sesuai desain workflow.

=================================================================
BAGIAN 22 — KUOTA
=================

Jika sistem memiliki kuota bidang/pembimbing:

JANGAN melakukan:

SELECT quota
↓
cek di client
↓
INSERT

sebagai satu-satunya mekanisme.

Pola tersebut rawan race condition.

Dua pengguna dapat melakukan booking pada slot terakhir secara
bersamaan.

Pengecekan dan mutation kuota harus dilakukan secara atomic melalui
database/RPC/transaction sesuai kemampuan PostgreSQL.

Jika membutuhkan row lock:

gunakan mekanisme PostgreSQL yang sesuai.

Jangan mengandalkan JavaScript client untuk menjaga konsistensi kuota.

=================================================================
BAGIAN 23 — N+1 QUERY
=====================

Agent DILARANG membuat query berulang dalam loop jika data dapat
diambil dalam satu query.

Contoh yang dilarang:

for setiap tanggal:
query database

atau:

for setiap pengajuan:
query pembimbing

Gunakan:

* JOIN
* IN
* range query
* aggregate query
* batch query
* relasi yang sesuai

sesuai kebutuhan.

=================================================================
BAGIAN 24 — API / ROUTE HANDLER
===============================

API route harus memiliki tanggung jawab yang jelas.

Struktur:

app/api/

Endpoint WAJIB:

* melakukan authentication bila diperlukan
* melakukan authorization
* melakukan validation
* melakukan mutation melalui jalur yang benar
* menangani error
* mengembalikan response konsisten

Jangan menaruh business logic besar langsung di route handler.

Gunakan service layer untuk logic yang kompleks.

=================================================================
BAGIAN 25 — RESPONSE API
========================

Response API project menggunakan bentuk konsisten:

{
success: boolean,
data?: T,
error?: {
code: string,
message: string
}
}

Jangan membuat setiap endpoint memiliki format berbeda tanpa alasan.

Contoh sukses:

{
success: true,
data: {...}
}

Contoh error:

{
success: false,
error: {
code: "VALIDATION_ERROR",
message: "Data tidak valid"
}
}

Jangan mengirim stack trace atau informasi internal database kepada
client.

=================================================================
BAGIAN 26 — VALIDATION
======================

Validation wajib dilakukan pada boundary aplikasi.

Jangan mempercayai data dari:

* form
* query parameter
* route parameter
* request body
* client component

Validasi harus mencakup:

* required field
* tipe data
* panjang
* format
* enum
* range
* relasi
* business rule

Validation client adalah UX.

Validation server/database adalah security.

=================================================================
BAGIAN 27 — FILE UPLOAD
=======================

File upload menggunakan Supabase Storage.

Agent WAJIB memvalidasi:

* MIME type
* extension
* ukuran file
* nama file
* path storage
* authorization

Jangan menerima file apa pun hanya karena extension terlihat benar.

Jangan mempercayai MIME type dari client tanpa validasi yang sesuai.

Batas ukuran file harus mengikuti requirement bisnis aktual.

Jika batas ukuran atau format belum ditentukan:

JANGAN mengarang angka sebagai business rule.

Tandai:

NEED BUSINESS RULE

dan laporkan kebutuhan tersebut sebelum menetapkannya.

=================================================================
BAGIAN 28 — STORAGE SECURITY
============================

File privat tidak boleh disimpan pada bucket publik tanpa alasan.

User hanya boleh mengakses file yang memang menjadi hak aksesnya.

Administrator dapat memiliki akses lebih luas sesuai policy.

Jangan membocorkan:

* signed URL
* storage path sensitif
* credential
* service role key

ke browser jika tidak diperlukan.

=================================================================
BAGIAN 29 — SUPABASE KEYS
=========================

NEXT_PUBLIC_SUPABASE_ANON_KEY dapat digunakan pada environment yang
memang dirancang untuk client.

SUPABASE_SERVICE_ROLE_KEY adalah SECRET.

Service role key:

* tidak boleh dimasukkan ke client component
* tidak boleh menggunakan prefix NEXT_PUBLIC_
* tidak boleh dikomit
* tidak boleh ditampilkan di UI
* tidak boleh dikirim ke browser

Jika service role dibutuhkan, gunakan hanya pada server-side code.

=================================================================
BAGIAN 30 — ENVIRONMENT VARIABLES
=================================

Environment variable sensitif harus berada di:

.env.local

File:

.env.example

hanya boleh berisi placeholder.

Jangan commit:

.env.local

atau credential asli.

Jika credential bocor:

anggap credential compromised dan laporkan.

=================================================================
BAGIAN 31 — STRUKTUR FOLDER
===========================

Struktur project utama:

sim-magang/
│
├── app/
│   ├── (guest)/
│   ├── (auth)/
│   ├── (pengguna)/
│   ├── (admin)/
│   ├── api/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── services/
│   ├── validations/
│   ├── constants/
│   ├── helpers/
│   └── utils.ts
│
├── hooks/
│
├── types/
│
├── public/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
├── .env.local
├── .env.example
├── middleware.ts
├── components.json
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md

Agent DILARANG membuat struktur alternatif tanpa Implementation Plan.

=================================================================
BAGIAN 32 — APP ROUTER
======================

Project menggunakan Next.js App Router.

Route group seperti:

(auth)
(pengguna)
(admin)
(guest)

digunakan untuk organisasi route dan layout.

Jangan mengubah struktur route hanya demi preferensi pribadi.

Jika route baru dibutuhkan:

jelaskan:

URL:
...

FILE:
...

ACCESS:
...

AUTHORIZATION:
...

=================================================================
BAGIAN 33 — SERVER VS CLIENT COMPONENT
======================================

Gunakan Server Component secara default.

Gunakan Client Component hanya ketika membutuhkan:

* state interaktif
* event handler browser
* browser API
* hooks client
* interaksi UI yang memang membutuhkan client

Jangan menambahkan:

"use client"

ke seluruh halaman hanya karena satu komponen kecil interaktif.

Pisahkan komponen interaktif jika diperlukan.

=================================================================
BAGIAN 34 — SUPABASE CLIENT
===========================

Gunakan client Supabase sesuai konteks:

* browser/client
* server
* middleware

Jangan menggunakan client browser untuk operasi yang membutuhkan
secret/service role.

Jangan membuat instance Supabase baru secara sembarangan di banyak
tempat.

Ikuti helper pada:

lib/supabase/

=================================================================
BAGIAN 35 — SERVICES
====================

Business logic kompleks ditempatkan di:

lib/services/

Contoh:

auth.service.ts
bidang.service.ts
pembimbing.service.ts
pengajuan.service.ts
skm.service.ts
laporan.service.ts

Service harus memiliki tanggung jawab jelas.

Jangan membuat service god object yang mengurus seluruh project.

=================================================================
BAGIAN 36 — TYPES
=================

TypeScript harus digunakan untuk menjaga kontrak data.

Database types ditempatkan pada:

types/database.types.ts

Jangan menggunakan:

any

sebagai solusi cepat untuk error type.

Jika tipe database berubah:

database.types.ts harus diperbarui sesuai schema aktual.

Jangan mengarang type yang bertentangan dengan database.

=================================================================
BAGIAN 37 — BUSINESS RULE
=========================

Business rule tidak boleh ditebak.

Jika requirement tidak jelas:

NEED BUSINESS RULE

Agent harus menyebut:

RULE YANG BELUM JELAS:
...

DAMPAK:
...

JANGAN MENGARANG IMPLEMENTASI.

Contoh:

Jika tidak diketahui apakah status tertentu boleh dibatalkan:

jangan menebak.

Audit workflow terlebih dahulu.

=================================================================
BAGIAN 38 — NOTIFIKASI
======================

notifikasi adalah data aplikasi.

Jangan menganggap notifikasi sebagai bukti bahwa sebuah proses benar-
benar berhasil jika mutation utama gagal.

Urutan:

Business action berhasil
↓
notification dibuat/dikirim

bukan:

Notification dibuat
↓
business action mungkin berhasil

Notifikasi tidak boleh menggantikan audit trail.

=================================================================
BAGIAN 39 — SKM
===============

SKM menggunakan:

skm_pertanyaan
skm_jawaban

Pengiriman SKM mengikuti workflow resmi.

Jika submit_skm() merupakan jalur resmi:

JANGAN menggantinya dengan INSERT/UPDATE manual yang melewati business
rule.

SKM harus menjaga:

* pertanyaan
* jawaban
* pengajuan
* timestamp
* status submission

=================================================================
BAGIAN 40 — LARANGAN DUPLICATE WORKFLOW
=======================================

Jangan membuat dua implementasi untuk fitur yang sama.

Dilarang membuat:

* dua service dengan fungsi sama
* dua endpoint untuk mutation sama tanpa alasan
* dua komponen form yang menangani workflow sama
* dua skala SKM berbeda untuk workflow sama
* dua sumber status yang berbeda

Sebelum membuat fitur baru:

AUDIT IMPLEMENTASI EXISTING.

Jika sudah ada:

REUSE atau REFACTOR.

Jangan membuat duplikat.

=================================================================
BAGIAN 41 — LEGACY BUG PATTERNS
===============================

Bug dari sistem lama TIDAK boleh direplikasi.

Agent wajib menghindari pola:

1. Status diubah langsung dari client.
2. Business rule hanya berada di frontend.
3. Query database di dalam loop.
4. Duplicate record akibat multi-step form.
5. Parameter penting hilang saat redirect.
6. Dua controller/service untuk workflow yang sama.
7. Authorization hanya dilakukan di UI.
8. Endpoint sensitif tanpa authentication.
9. Kuota dicek di client sebelum INSERT.
10. File upload tanpa validasi.
11. Trigger/RPC dibypass karena mutation langsung lebih mudah.
12. Database diubah tanpa approval.
13. Schema ditebak dari dokumentasi lama.
14. Credential dimasukkan ke client.
15. Error database mentah dikirim ke user.

=================================================================
BAGIAN 42 — ERROR HANDLING
==========================

Error harus ditangani secara eksplisit.

Jangan menggunakan:

catch (error) {
console.log(error)
}

sebagai satu-satunya error handling.

User harus mendapatkan pesan yang relevan.

Developer harus mendapatkan informasi debugging yang aman.

Jangan membocorkan:

* SQL
* database credential
* service role key
* stack trace
* internal path
* informasi security-sensitive

kepada pengguna.

=================================================================
BAGIAN 43 — LOADING & ERROR STATE
=================================

Halaman async harus mempertimbangkan:

* loading
* empty
* error
* success

Jangan menampilkan halaman kosong ketika request gagal.

Gunakan komponen shared bila sesuai:

loading.tsx
empty-state.tsx
error-state.tsx

=================================================================
BAGIAN 44 — DELETE
==================

Delete adalah destructive operation.

Sebelum delete:

* validasi authorization
* cek relasi
* cek business rule
* cek dampak terhadap data lain

UI harus memberikan confirmation untuk destructive action.

Agent DILARANG melakukan bulk delete atau destructive SQL tanpa
approval eksplisit.

=================================================================
BAGIAN 45 — DATA INTEGRITY
==========================

Jangan mengorbankan integritas database demi membuat UI terlihat
berjalan.

Foreign key, unique constraint, check constraint, trigger, RPC,
transaction, dan RLS adalah bagian dari desain sistem.

Jika constraint menyebabkan mutation gagal:

audit penyebabnya.

Jangan menghapus constraint sebagai solusi pertama.

=================================================================
BAGIAN 46 — CONCURRENCY
=======================

Setiap fitur yang melibatkan:

* kuota
* booking
* nomor urut
* status
* pembayaran
* submission
* stok
* slot

harus mempertimbangkan concurrent request.

Jangan mengasumsikan dua request tidak akan datang bersamaan.

Client-side check bukan concurrency control.

=================================================================
BAGIAN 47 — IDEMPOTENCY
=======================

Mutation penting harus aman terhadap retry jika memungkinkan.

Contoh:

User klik submit dua kali.

Request timeout lalu browser melakukan retry.

Jangan menghasilkan dua pengajuan hanya karena request diulang.

Gunakan:

* unique constraint
* identifier
* transaction
* state validation
* RPC
* idempotency strategy

sesuai kebutuhan.

=================================================================
BAGIAN 48 — SECURITY
====================

Agent WAJIB menganggap semua input client sebagai untrusted.

Jangan percaya:

* role dari localStorage
* user_id dari request
* status dari hidden input
* public_id tanpa verifikasi
* permission dari frontend
* file metadata dari client

User identity harus berasal dari authenticated session.

Authorization harus diverifikasi di server/database.

=================================================================
BAGIAN 49 — PUBLIC ROUTES
=========================

Route publik boleh membaca data yang memang ditentukan untuk publik.

Route publik TIDAK boleh memberikan akses ke:

* data pribadi
* credential
* data internal
* data administrator
* data pengajuan sensitif
* operasi mutation

tanpa authorization yang sesuai.

Jangan membuat endpoint admin dapat dipanggil tanpa authentication.

=================================================================
BAGIAN 50 — MIDDLEWARE
======================

middleware digunakan untuk kebutuhan routing/authentication yang sesuai.

Jangan menaruh seluruh authorization system hanya di middleware.

Database RLS tetap wajib menjadi protection layer.

Jika middleware dan RLS memiliki behavior berbeda:

audit keduanya.

=================================================================
BAGIAN 51 — FASE PENGEMBANGAN
=============================

Pengembangan project dilakukan bertahap.

FASE 0 — SETUP

* Next.js
* TypeScript
* Supabase
* Auth
* konfigurasi environment
* struktur project

FASE 1 — AUTHENTICATION

* login
* register
* callback
* profile
* role
* protection route

FASE 2 — MASTER DATA

* bidang
* pembimbing
* relasi bidang-pembimbing

FASE 3 — PENGAJUAN

* career
* pengajuan
* multi-step flow
* status
* riwayat

FASE 4 — SKM

* pertanyaan
* jawaban
* submit
* workflow terkait

FASE 5 — NOTIFIKASI

* notification
* unread/read
* workflow notification

FASE 6 — ADMIN

* dashboard
* pengelolaan bidang
* pengelolaan pembimbing
* riwayat pengajuan
* SKM
* rekap
* laporan

FASE 7 — POLISHING & DEPLOYMENT

* security audit
* performance
* responsive UI
* error handling
* deployment
* production verification

Agent DILARANG lompat fase tanpa instruksi eksplisit user.

Jika user secara eksplisit meminta fitur lintas fase:

jelaskan dependency dan dampaknya terlebih dahulu.

=================================================================
BAGIAN 52 — TESTING
===================

Setiap fitur WAJIB diuji minimal pada:

1. Happy path
2. Invalid input
3. Unauthorized user
4. Unauthorized role
5. Empty data
6. Error database
7. Refresh
8. Duplicate submission jika relevan

Untuk workflow:

test setiap transition.

Untuk authorization:

test pengguna.

test administrator.

test unauthenticated user jika route relevan.

=================================================================
BAGIAN 53 — TESTING DATABASE
============================

Jika perubahan database dilakukan, agent WAJIB melakukan verifikasi
setelah perubahan.

Minimal:

* schema
* constraint
* foreign key
* RLS
* trigger
* RPC
* sample query

Jangan menyatakan migration/database berhasil hanya karena SQL
berhasil dieksekusi.

Database behavior harus diverifikasi.

=================================================================
BAGIAN 54 — BROWSER / VISUAL TESTING
====================================

Agent DILARANG membuka browser otomatis untuk preview atau visual
verification.

Jangan menjalankan browser agent atau screenshot verification otomatis
karena dapat menghabiskan resource laptop.

Jika browser verification diperlukan:

agent harus meminta izin user terlebih dahulu.

Jika tidak ada izin:

berikan langkah manual untuk user.

Contoh:

Buka:
http://localhost:3000/login

lalu lakukan langkah testing yang dijelaskan.

=================================================================
BAGIAN 55 — COMMAND YANG BERDAMPAK
==================================

Agent harus berhati-hati terhadap command yang:

* menghapus file
* overwrite file
* reset database
* reset migration
* drop schema
* truncate table
* delete data
* install dependency besar
* mengubah konfigurasi production

Untuk destructive command:

jelaskan dampak terlebih dahulu.

Jangan menjalankan command destructive tanpa approval.

=================================================================
BAGIAN 56 — DEPENDENCY
======================

Jangan menambahkan package hanya karena "lebih gampang".

Sebelum install dependency baru:

1. cek apakah fitur sudah bisa dibuat dengan dependency existing
2. jelaskan package
3. jelaskan alasan
4. jelaskan impact
5. jelaskan ukuran/kompleksitas jika relevan

Dependency baru harus punya alasan teknis yang jelas.

=================================================================
BAGIAN 57 — CODE QUALITY
========================

Kode harus:

* readable
* typed
* modular
* konsisten
* mudah dirawat
* tidak duplicate
* tidak memiliki dead code

Jangan membuat abstraction berlebihan untuk fitur kecil.

Jangan membuat function 500 baris jika dapat dipisah secara logis.

Jangan melakukan refactor besar yang tidak berhubungan dengan task.

=================================================================
BAGIAN 58 — SCOPE CONTROL
=========================

Agent hanya mengerjakan scope yang diminta.

Jika menemukan masalah lain:

jangan otomatis memperbaikinya.

Laporkan:

RELATED ISSUE FOUND

FILE:
...

PROBLEM:
...

IMPACT:
...

RECOMMENDATION:
...

Tunggu instruksi jika perubahan tersebut berada di luar scope.

=================================================================
BAGIAN 59 — NO ASSUMPTION POLICY
================================

Jika agent tidak tahu:

JANGAN MENEBak.

Gunakan:

NEED VERIFICATION

atau:

NEED BUSINESS RULE

atau:

DOCUMENTATION DRIFT DETECTED

sesuai situasi.

Contoh hal yang tidak boleh ditebak:

* nama kolom
* nama enum
* role
* status
* RPC
* parameter RPC
* relationship
* RLS policy
* storage bucket
* file size
* business rule
* workflow transition

=================================================================
BAGIAN 60 — AUDIT SEBELUM FITUR
===============================

Sebelum mengimplementasikan fitur baru, agent WAJIB melakukan audit
terhadap implementasi existing yang berkaitan.

Audit minimal:

* route
* component
* service
* validation
* types
* database
* RPC
* trigger
* RLS
* storage
* authorization

Tujuannya untuk mencegah duplicate implementation dan conflict.

=================================================================
BAGIAN 61 — DATABASE-FIRST DEVELOPMENT
======================================

Jika fitur bergantung pada database:

DATABASE
↓
TYPE
↓
SERVICE
↓
API/SERVER ACTION
↓
UI

Jangan membuat UI berdasarkan schema yang belum diverifikasi.

UI harus mengikuti data model aktual.

=================================================================
BAGIAN 62 — REPORT FORMAT
=========================

Setelah task selesai, report menggunakan format:

IMPLEMENTATION REPORT

STATUS:
DONE / PARTIAL / BLOCKED

TASK:
...

FILES CREATED:
...

FILES MODIFIED:
...

DATABASE:
NONE / CHANGED

DATABASE CHANGES:
...

RPC:
...

TRIGGER:
...

RLS:
...

AUTHORIZATION:
...

UI:
...

VALIDATION:
...

TESTING:
...

TEST RESULT:
...

KNOWN ISSUES:
...

NOT VERIFIED:
...

MANUAL VERIFICATION:
...

REGRESSION RISK:
...

=================================================================
BAGIAN 63 — BLOCKED STATE
=========================

Jika agent menemukan blocker:

JANGAN membuat workaround berbahaya.

Gunakan:

BLOCKED

Kemudian jelaskan:

BLOCKER:
...

WHY:
...

REQUIRED DECISION:
...

OPTIONS:
...

RECOMMENDED OPTION:
...

Agent berhenti sampai blocker memiliki keputusan yang jelas.

=================================================================
BAGIAN 64 — DATABASE CHANGE REPORT
==================================

Setiap perubahan database wajib dilaporkan dengan format:

DATABASE CHANGE REPORT

TABLE:
...

OBJECT:
...

CHANGE:
...

BEFORE:
...

AFTER:
...

REASON:
...

IMPACT:
...

RLS IMPACT:
...

TRIGGER IMPACT:
...

RPC IMPACT:
...

ROLLBACK:
...

VERIFICATION:
...

Jangan menulis "database aman" tanpa verification.

=================================================================
BAGIAN 65 — DOKUMENTATION DRIFT
===============================

Jika ditemukan perbedaan antara:

AGENTS.md
vs
database
vs
source code

agent WAJIB melaporkan.

Contoh:

DOCUMENTATION DRIFT DETECTED

DOCUMENTATION:
role = admin

ACTUAL DATABASE:
role = administrator

IMPACT:
authorization check dapat gagal.

RECOMMENDATION:
sinkronisasi dokumentasi dan kode dengan schema aktual.

Agent tidak boleh menyembunyikan drift.

=================================================================
BAGIAN 66 — ATURAN MUTLAK
=========================

ATURAN 1

Jangan coding sebelum Implementation Plan.

ATURAN 2

Jangan mengubah database tanpa approval eksplisit.

ATURAN 3

Jangan menebak schema.

ATURAN 4

Jangan bypass RLS.

ATURAN 5

Jangan bypass trigger.

ATURAN 6

Jangan bypass RPC yang merupakan jalur resmi.

ATURAN 7

Jangan mempercayai authorization frontend.

ATURAN 8

Jangan membuat duplicate workflow.

ATURAN 9

Jangan membuat query N+1 yang sebenarnya dapat dihindari.

ATURAN 10

Jangan melakukan destructive operation tanpa approval.

ATURAN 11

Jangan membuka browser otomatis.

ATURAN 12

Jangan mengubah scope tanpa instruksi.

ATURAN 13

Jangan mengarang business rule.

ATURAN 14

Jangan mengarang hasil testing.

ATURAN 15

Setelah coding wajib memberikan Implementation Report.

=================================================================
BAGIAN 67 — WORKFLOW WAJIB AGENT
================================

Setiap task wajib mengikuti:

USER REQUEST
↓
AUDIT EXISTING CODE
↓
AUDIT DATABASE JIKA RELEVAN
↓
AUDIT RPC/TRIGGER/RLS JIKA RELEVAN
↓
IMPLEMENTATION PLAN
↓
USER APPROVAL / INSTRUCTION
↓
IMPLEMENTATION
↓
TESTING
↓
VERIFY
↓
IMPLEMENTATION REPORT

Untuk database:

IMPLEMENTATION PLAN
↓
DATABASE CHANGE PROPOSAL
↓
EXPLICIT DATABASE APPROVAL
↓
SQL/MIGRATION
↓
DATABASE VERIFICATION
↓
CODE
↓
TESTING
↓
REPORT

=================================================================
BAGIAN 68 — PRINSIP TERAKHIR
============================

Project ini harus diperlakukan sebagai sistem aplikasi nyata, bukan
sekadar demo UI.

Prioritas:

1. Data integrity
2. Security
3. Correct business workflow
4. Authorization
5. Maintainability
6. Performance
7. UI/UX

Jika UI terlihat benar tetapi data integrity rusak:

FITUR DIANGGAP GAGAL.

Jika fitur bekerja untuk administrator tetapi pengguna dapat
mengakses data yang tidak seharusnya:

FITUR DIANGGAP GAGAL.

Jika mutation bekerja dengan bypass trigger/RLS/RPC:

FITUR DIANGGAP GAGAL.

Jika schema diubah tanpa approval:

FITUR DIANGGAP GAGAL.

Jika agent tidak mengetahui kondisi aktual dan memilih untuk menebak:

FITUR DIANGGAP GAGAL.

PRINSIP FINAL:

VERIFY FIRST.

PLAN FIRST.

APPROVAL BEFORE DATABASE CHANGE.

SECURITY AT THE DATABASE LAYER.

BUSINESS RULES MUST BE EXPLICIT.

NO ASSUMPTIONS.

NO DUPLICATE WORKFLOW.

NO SILENT CHANGES.

NO UNREPORTED ERRORS.

PLAN → APPROVE → CODE → TEST → REPORT.

=================================================================
BAGIAN 69 — WEB ACCESS POLICY
=============================

Agent DILARANG membuka, mengakses, atau mencari informasi di internet
secara otomatis selama mengerjakan project ini.

JANGAN menggunakan:

* web search
* browser
* website eksternal
* dokumentasi online
* GitHub online
* Stack Overflow
* forum
* artikel
* sumber internet lainnya

sebagai langkah default untuk memahami atau menyelesaikan project.

SOURCE OF TRUTH UTAMA HARUS BERASAL DARI PROJECT LOKAL.

Prioritas investigasi:

1. Source code lokal
2. AGENTS.md
3. package.json
4. konfigurasi project
5. type definitions
6. file service
7. API / Server Action
8. middleware
9. schema/database yang tersedia secara lokal
10. migration
11. test
12. dokumentasi lokal
13. BARU web jika benar-benar diperlukan dan user memberikan izin

Jika informasi dapat diketahui dari source code atau file project:

JANGAN membuka web.

Jika agent menemukan error:

AUDIT LOCAL CODE FIRST.

Jangan langsung mencari error tersebut di Google.

Jika agent membutuhkan dokumentasi framework/library:

PERIKSA TERLEBIH DAHULU:

* package.json
* package-lock.json / pnpm-lock.yaml / yarn.lock
* source code dependency yang relevan jika tersedia
* konfigurasi project
* existing implementation
* dokumentasi lokal

Jangan mengubah versi dependency hanya karena menemukan solusi
berbeda di internet.

=================================================================
BAGIAN 70 — WEB ACCESS REQUIRES USER PERMISSION
================================================

Web hanya boleh digunakan jika:

1. User secara eksplisit meminta agent mencari informasi di web,
ATAU
2. User secara eksplisit memberikan izin untuk menggunakan web.

Tanpa izin tersebut:

DO NOT OPEN WEB.

Jika informasi yang dibutuhkan tidak tersedia secara lokal:

gunakan:

NEED EXTERNAL INFORMATION

lalu jelaskan:

INFORMATION NEEDED:
...

WHY LOCAL SOURCE IS INSUFFICIENT:
...

EXTERNAL SOURCE THAT MAY BE NEEDED:
...

Kemudian BERHENTI dan tunggu instruksi user.

Jangan diam-diam membuka web untuk mencari jawabannya.

=================================================================
BAGIAN 71 — LOCAL-FIRST DEBUGGING
=================================

Semua debugging wajib mengikuti urutan:

ERROR
↓
AUDIT SOURCE CODE LOKAL
↓
AUDIT CONFIGURATION
↓
AUDIT DEPENDENCY VERSION
↓
AUDIT DATABASE/RPC/RLS JIKA RELEVAN
↓
REPRODUCE ERROR
↓
IDENTIFY ROOT CAUSE
↓
IMPLEMENTATION PLAN
↓
USER APPROVAL / INSTRUCTION
↓
FIX
↓
TEST
↓
REPORT

Jangan melakukan:

ERROR
↓
GOOGLE
↓
COPY SOLUTION
↓
MODIFY PROJECT

Solusi dari internet tidak boleh dianggap cocok untuk project ini
tanpa verifikasi terhadap source code dan dependency version aktual.

=================================================================
BAGIAN 72 — NO UNAUTHORIZED EXTERNAL RESEARCH
================================================

Agent DILARANG melakukan external research hanya untuk:

* mencari contoh implementasi
* mencari template
* mencari tutorial
* mencari solusi error generik
* membandingkan framework
* mencari library alternatif
* mencari best practice yang tidak diperlukan
* mencari dokumentasi yang sebenarnya sudah tersedia secara lokal

Project harus diselesaikan berdasarkan kondisi aktual project,
bukan berdasarkan tutorial random dari internet.

Jika external research memang diperlukan:

WAJIB meminta izin user terlebih dahulu.

=================================================================
BAGIAN 73 — EXTERNAL INFORMATION VALIDATION
================================================

Jika user memberikan informasi atau solusi yang berasal dari web:

Agent TIDAK boleh langsung menganggapnya benar.

Agent harus memverifikasi apakah solusi tersebut kompatibel dengan:

* Next.js version
* React version
* TypeScript version
* Supabase version
* package dependency
* struktur folder
* middleware
* auth architecture
* database schema
* RLS
* RPC
* existing implementation

Jika tidak kompatibel:

jangan menerapkan solusi tersebut hanya karena terlihat benar.

=================================================================
BAGIAN 74 — NO WEB FOR PROJECT DISCOVERY
========================================

Agent DILARANG menggunakan web untuk mengetahui:

* struktur folder project
* nama file
* nama component
* nama service
* nama table
* nama column
* role
* status
* RPC
* trigger
* RLS policy
* route
* workflow
* business rule

Semua informasi tersebut WAJIB diperoleh dari project lokal atau
database aktual yang memang dapat diakses melalui tool project.

Jangan menggunakan informasi dari project lain sebagai pengganti
verifikasi project ini.

=================================================================
BAGIAN 75 — WEB USAGE REPORT
============================

Jika user memberikan izin dan agent menggunakan web, Implementation
Report WAJIB menyebutkan:

WEB USED:
YES

REASON:
...

SOURCE:
...

INFORMATION USED:
...

IMPACT ON IMPLEMENTATION:
...

Jika web tidak digunakan:

WEB USED:
NO

Tidak perlu melakukan external research hanya untuk mengisi bagian
tersebut.

=================================================================
BAGIAN 76 — FINAL WEB RULE
==========================

DEFAULT:

NO WEB.

LOCAL FIRST.

NO AUTOMATIC INTERNET ACCESS.

Jika informasi tersedia di project lokal:

USE LOCAL SOURCE.

Jika informasi tidak tersedia:

NEED EXTERNAL INFORMATION.

Jika external information diperlukan:

ASK USER PERMISSION FIRST.

Jangan membuka web secara diam-diam.

VERIFY FIRST.

PLAN FIRST.

APPROVAL BEFORE CHANGE.

CODE ONLY AFTER APPROVAL.

TEST AFTER IMPLEMENTATION.

REPORT EVERYTHING.
