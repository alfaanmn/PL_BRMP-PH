-- ==============================================================================
-- Migration: 20261102_create_logbooks_and_storage.sql
-- Tujuan:
-- 1. Membuat tabel public.logbooks untuk pelaporan kegiatan mingguan magang.
-- 2. Mengaktifkan Row Level Security (RLS) pada public.logbooks.
-- 3. Membuat bucket privat 'logbook' pada Supabase Storage (maks 2MB per file).
-- 4. Mengatur policy RLS storage.objects untuk bucket 'logbook'.
-- 5. Membuat tabel public.logbook_reminder_log untuk idempotensi cron pengingat.
--
-- JANGAN JALANKAN SECARA OTOMATIS. Jalankan manual di Supabase SQL Editor.
-- ==============================================================================

-- 1. Tabel public.logbooks
CREATE TABLE IF NOT EXISTS public.logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id BIGINT NOT NULL REFERENCES public.pengajuans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  minggu_ke INT NOT NULL CHECK (minggu_ke > 0),
  periode_mulai DATE NOT NULL,
  periode_selesai DATE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT NOT NULL CHECK (file_size <= 2097152),
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  catatan TEXT CHECK (char_length(catatan) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_logbooks_pengajuan_minggu UNIQUE (pengajuan_id, minggu_ke)
);

-- Index pada pengajuan_id untuk performa query
CREATE INDEX IF NOT EXISTS idx_logbooks_pengajuan_id ON public.logbooks(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_user_id ON public.logbooks(user_id);

-- 2. Aktifkan RLS pada public.logbooks
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Administrator dapat melihat seluruh logbook
DROP POLICY IF EXISTS "Admin dapat melihat seluruh logbook" ON public.logbooks;
CREATE POLICY "Admin dapat melihat seluruh logbook"
ON public.logbooks
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy 2: Pemohon dapat melihat logbook miliknya sendiri
DROP POLICY IF EXISTS "Pemohon dapat melihat logbook miliknya" ON public.logbooks;
CREATE POLICY "Pemohon dapat melihat logbook miliknya"
ON public.logbooks
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Pemohon dapat mengunggah (INSERT) logbook miliknya hanya jika pengajuan berstatus 'Sedang Magang'
DROP POLICY IF EXISTS "Pemohon dapat insert logbook Sedang Magang" ON public.logbooks;
CREATE POLICY "Pemohon dapat insert logbook Sedang Magang"
ON public.logbooks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.pengajuans p
    WHERE p.id = logbooks.pengajuan_id
      AND p.user_id = auth.uid()
      AND p.status = 'Sedang Magang'
  )
);

-- Policy 4: Pemohon dapat memperbarui (UPDATE) logbook miliknya hanya jika pengajuan berstatus 'Sedang Magang'
DROP POLICY IF EXISTS "Pemohon dapat update logbook Sedang Magang" ON public.logbooks;
CREATE POLICY "Pemohon dapat update logbook Sedang Magang"
ON public.logbooks
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.pengajuans p
    WHERE p.id = logbooks.pengajuan_id
      AND p.user_id = auth.uid()
      AND p.status = 'Sedang Magang'
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.pengajuans p
    WHERE p.id = logbooks.pengajuan_id
      AND p.user_id = auth.uid()
      AND p.status = 'Sedang Magang'
  )
);

-- Catatan Keamanan: Tidak ada policy DELETE untuk pemohon pada tabel logbooks.
-- Penggantian berkas dan pembersihan file lama dilakukan di sisi server via service role.

-- 3. Konfigurasi Bucket Storage Privat 'logbook'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logbook',
  'logbook',
  false,
  2097152, -- Batas 2MB (dalam bytes)
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

-- 4. Policy RLS Storage objects untuk Bucket 'logbook'
-- Policy Storage 1: Administrator dapat membaca seluruh berkas di bucket logbook
DROP POLICY IF EXISTS "Admin dapat membaca seluruh berkas logbook" ON storage.objects;
CREATE POLICY "Admin dapat membaca seluruh berkas logbook"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'logbook' AND public.is_admin()
);

-- Policy Storage 2: Pemohon dapat membaca berkas pada foldernya sendiri: {user_id}/...
DROP POLICY IF EXISTS "Pemohon dapat membaca berkas logbook miliknya" ON storage.objects;
CREATE POLICY "Pemohon dapat membaca berkas logbook miliknya"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'logbook' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy Storage 3: Pemohon dapat mengunggah berkas ke foldernya sendiri: {user_id}/...
DROP POLICY IF EXISTS "Pemohon dapat upload berkas logbook ke folder miliknya" ON storage.objects;
CREATE POLICY "Pemohon dapat upload berkas logbook ke folder miliknya"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logbook' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy Storage 4: Pemohon dapat memperbarui berkas di foldernya sendiri
DROP POLICY IF EXISTS "Pemohon dapat update berkas logbook di folder miliknya" ON storage.objects;
CREATE POLICY "Pemohon dapat update berkas logbook di folder miliknya"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logbook' AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'logbook' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Catatan: Kebijakan DELETE storage untuk pemohon ditiadakan agar konsisten dengan tabel logbooks.
-- Penghapusan berkas lama saat replace dieksekusi secara aman oleh server (service role).

-- 5. Tabel Idempotensi Pengingat Logbook (public.logbook_reminder_log)
CREATE TABLE IF NOT EXISTS public.logbook_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id BIGINT NOT NULL REFERENCES public.pengajuans(id) ON DELETE CASCADE,
  minggu_ke INT NOT NULL CHECK (minggu_ke > 0),
  jenis TEXT NOT NULL CHECK (jenis IN ('kamis', 'jumat')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_reminder_pengajuan_minggu_jenis UNIQUE (pengajuan_id, minggu_ke, jenis)
);

CREATE INDEX IF NOT EXISTS idx_reminder_log_pengajuan_id ON public.logbook_reminder_log(pengajuan_id);

-- RLS aktif tanpa policy publik (hanya service role / admin backend yang mengakses)
ALTER TABLE public.logbook_reminder_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ROLLBACK SCRIPT (Jika Ingin Membatalkan Migrasi Ini):
--
-- DROP TABLE IF EXISTS public.logbook_reminder_log CASCADE;
-- DROP POLICY IF EXISTS "Admin dapat membaca seluruh berkas logbook" ON storage.objects;
-- DROP POLICY IF EXISTS "Pemohon dapat membaca berkas logbook miliknya" ON storage.objects;
-- DROP POLICY IF EXISTS "Pemohon dapat upload berkas logbook ke folder miliknya" ON storage.objects;
-- DROP POLICY IF EXISTS "Pemohon dapat update berkas logbook di folder miliknya" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'logbook';
-- DROP TABLE IF EXISTS public.logbooks CASCADE;
-- ==============================================================================
