-- ====================================================================
-- MIGRATION: 20261025_support_skm_per_peserta_kelompok.sql
-- TUJUAN: Mendukung 1 kuesioner SKM per peserta (ketua + tiap anggota)
-- STATUS: Dijalankan manual oleh user di Supabase Dashboard (DO NOT RUN AGAIN)
-- ====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.skm_jawaban_backup_20261025 AS
SELECT * FROM public.skm_jawaban;
ALTER TABLE public.skm_jawaban_backup_20261025 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.skm_jawaban'::regclass
      AND c.contype = 'u'
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE a.attname NOT IN ('pengajuan_id', 'skm_pertanyaan_id')
      )
  LOOP
    EXECUTE format('ALTER TABLE public.skm_jawaban DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.skm_jawaban
  ADD COLUMN IF NOT EXISTS peserta_nama TEXT,
  ADD COLUMN IF NOT EXISTS peserta_nim  TEXT,
  ADD COLUMN IF NOT EXISTS is_ketua     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anggota_id   BIGINT,
  ADD COLUMN IF NOT EXISTS is_legacy    BOOLEAN NOT NULL DEFAULT false;

UPDATE public.skm_jawaban
SET is_legacy = true
WHERE peserta_nama IS NULL OR peserta_nama = '';

UPDATE public.skm_jawaban sj
SET peserta_nama = COALESCE(NULLIF(trim(p.nama_lengkap), ''), 'Pemohon Magang'),
    peserta_nim  = COALESCE(p.nim_nis, ''),
    is_ketua     = true
FROM public.pengajuans p
WHERE sj.pengajuan_id = p.id
  AND (sj.peserta_nama IS NULL OR sj.peserta_nama = '');

UPDATE public.skm_jawaban
SET peserta_nama = 'Pemohon Magang'
WHERE peserta_nama IS NULL OR peserta_nama = '';

UPDATE public.skm_jawaban
SET peserta_nim = ''
WHERE peserta_nim IS NULL;

ALTER TABLE public.skm_jawaban ALTER COLUMN peserta_nama SET NOT NULL;
ALTER TABLE public.skm_jawaban ALTER COLUMN peserta_nim  SET DEFAULT '';
ALTER TABLE public.skm_jawaban ALTER COLUMN peserta_nim  SET NOT NULL;

ALTER TABLE public.skm_jawaban
  ADD CONSTRAINT skm_jawaban_pengajuan_pertanyaan_peserta_key
  UNIQUE (pengajuan_id, skm_pertanyaan_id, peserta_nama, peserta_nim);

COMMIT;

ALTER TABLE public.sertifikats_backup_20261025 ENABLE ROW LEVEL SECURITY;
