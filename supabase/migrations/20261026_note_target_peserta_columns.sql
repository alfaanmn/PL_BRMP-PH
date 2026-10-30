-- Migration: 20261026_note_target_peserta_columns.sql
-- Deskripsi: Catatan migrasi idempotent untuk penambahan kolom target_peserta pada bidangs
--            dan status_peserta pada profiles (sudah dieksekusi manual di database).

-- 1. Tabel bidangs: kolom target_peserta
ALTER TABLE public.bidangs 
ADD COLUMN IF NOT EXISTS target_peserta VARCHAR(20) DEFAULT 'Keduanya' NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_target_peserta'
  ) THEN
    ALTER TABLE public.bidangs 
    ADD CONSTRAINT check_target_peserta CHECK (target_peserta IN ('Mahasiswa', 'Siswa', 'Keduanya'));
  END IF;
END $$;

-- 2. Tabel profiles: kolom status_peserta
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status_peserta VARCHAR(20) DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_status_peserta'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_status_peserta CHECK (status_peserta IS NULL OR status_peserta IN ('Mahasiswa', 'Siswa'));
  END IF;
END $$;
