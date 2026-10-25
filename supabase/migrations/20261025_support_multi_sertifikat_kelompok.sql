-- ====================================================================
-- MIGRATION: 20261025_support_multi_sertifikat_kelompok.sql
-- TUJUAN: Mendukung 1 sertifikat per peserta (ketua + anggota)
-- STATUS: Dijalankan manual oleh user di Supabase Dashboard (DO NOT RUN AGAIN)
-- ====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.sertifikats_backup_20261025 AS
SELECT * FROM public.sertifikats;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.sertifikats'::regclass
      AND c.contype = 'u'
      AND array_length(c.conkey, 1) = 1
      AND c.conkey[1] = (
        SELECT a.attnum FROM pg_attribute a
        WHERE a.attrelid = 'public.sertifikats'::regclass
          AND a.attname = 'pengajuan_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.sertifikats DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.sertifikats
  ADD COLUMN IF NOT EXISTS peserta_nama TEXT,
  ADD COLUMN IF NOT EXISTS peserta_nim  TEXT,
  ADD COLUMN IF NOT EXISTS is_ketua     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anggota_id   BIGINT;

UPDATE public.sertifikats s
SET peserta_nama = COALESCE(NULLIF(trim(p.nama_lengkap), ''), 'Pemohon Magang'),
    peserta_nim  = COALESCE(p.nim_nis, ''),
    is_ketua     = true
FROM public.pengajuans p
WHERE s.pengajuan_id = p.id
  AND s.peserta_nama IS NULL;

UPDATE public.sertifikats SET peserta_nim = '' WHERE peserta_nim IS NULL;

ALTER TABLE public.sertifikats ALTER COLUMN peserta_nama SET NOT NULL;
ALTER TABLE public.sertifikats ALTER COLUMN peserta_nim  SET DEFAULT '';
ALTER TABLE public.sertifikats ALTER COLUMN peserta_nim  SET NOT NULL;

ALTER TABLE public.sertifikats
  ADD CONSTRAINT sertifikats_pengajuan_peserta_key
  UNIQUE (pengajuan_id, peserta_nama, peserta_nim);

COMMIT;
