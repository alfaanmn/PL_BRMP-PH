-- ====================================================================
-- MIGRATION: 20261023_create_sertifikats_table.sql
-- TUJUAN: Dokumentasi tabel sertifikats, bucket privat, dan RLS policies
-- STATUS: Dijalankan manual oleh user di Supabase Dashboard (DO NOT RUN AGAIN)
-- ====================================================================

-- 1. Buat Tabel sertifikats
CREATE TABLE IF NOT EXISTS public.sertifikats (
    id BIGSERIAL PRIMARY KEY,
    pengajuan_id BIGINT NOT NULL UNIQUE REFERENCES public.pengajuans(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notified_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks untuk performa query
CREATE INDEX IF NOT EXISTS idx_sertifikats_pengajuan_id ON public.sertifikats(pengajuan_id);
CREATE INDEX IF NOT EXISTS idx_sertifikats_notified_at ON public.sertifikats(notified_at);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.sertifikats ENABLE ROW LEVEL SECURITY;

-- Policy 1: Administrator dapat melakukan apa saja menggunakan is_admin()
CREATE POLICY "Admin dapat mengelola seluruh data sertifikat"
ON public.sertifikats
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 2: Pemohon hanya dapat melihat sertifikat miliknya sendiri
CREATE POLICY "Pemohon dapat melihat sertifikat miliknya"
ON public.sertifikats
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.pengajuans
        WHERE pengajuans.id = sertifikats.pengajuan_id
          AND pengajuans.user_id = auth.uid()
    )
);

-- 3. Konfigurasi Bucket Storage Privat 'sertifikat'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'sertifikat',
    'sertifikat',
    false,
    5242880, -- Batas 5MB (dalam bytes)
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/jpg'];

-- 4. RLS Storage Policies untuk Bucket 'sertifikat'
CREATE POLICY "Admin Full Access Sertifikat Bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'sertifikat' AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'sertifikat' AND public.is_admin()
);
