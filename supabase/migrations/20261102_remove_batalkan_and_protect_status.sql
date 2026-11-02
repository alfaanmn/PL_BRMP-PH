-- ==============================================================================
-- Migration: 20261102_remove_batalkan_and_protect_status.sql
-- Tujuan:
-- 1. Mencabut hak akses eksekusi RPC batalkan_pengajuan dari pengguna/anon/publik.
-- 2. Memasang trigger BEFORE UPDATE protect_pengajuan_status pada tabel pengajuans
--    untuk mencegah perubahan status oleh non-admin (hanya admin/service_role yang boleh).
-- 3. Memperketat RLS pengajuans agar pemohon tidak dapat memutasi status langsung.
-- 4. Memastikan kolom nomor_surat bersifat nullable (deprecated).
--
-- JANGAN JALANKAN SECARA OTOMATIS. Jalankan manual di Supabase SQL Editor.
-- ==============================================================================

-- 1. Pastikan kolom nomor_surat bersifat NULLABLE (deprecated)
ALTER TABLE public.pengajuans ALTER COLUMN nomor_surat DROP NOT NULL;

-- 2. Cabut hak eksekusi RPC batalkan_pengajuan dari pemohon / publik (dinamis untuk semua signature)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure AS func_signature
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'batalkan_pengajuan'
  ) LOOP
    EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.func_signature || ' FROM authenticated, anon, PUBLIC;';
  END LOOP;
END $$;

-- 3. Trigger proteksi status pengajuan: Tolak perubahan status oleh non-admin
CREATE OR REPLACE FUNCTION public.protect_pengajuan_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Jika kolom status tidak mengalami perubahan, lewati pengecekan
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_current_user_id := auth.uid();

  -- Jika dieksekusi tanpa sesi JWT pengguna (misalnya: background cron, service role, atau database trigger), izinkan
  IF v_current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Cek apakah pemanggil memiliki role 'administrator'
  SELECT (role = 'administrator') INTO v_is_admin
  FROM public.profiles
  WHERE id = v_current_user_id;

  -- Jika bukan administrator, tolak perubahan status secara tegas
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'FORBIDDEN: Perubahan status pengajuan hanya dapat dilakukan oleh administrator.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_pengajuan_status ON public.pengajuans;
CREATE TRIGGER trg_protect_pengajuan_status
  BEFORE UPDATE ON public.pengajuans
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_pengajuan_status();

-- 4. Perketat Row Level Security (RLS) pada tabel pengajuans
-- Pastikan pemohon tidak memiliki policy UPDATE bebas terhadap baris pengajuannya
DROP POLICY IF EXISTS "Pemohon dapat memperbarui pengajuan miliknya" ON public.pengajuans;
DROP POLICY IF EXISTS "Users can update their own pengajuan" ON public.pengajuans;

-- ==============================================================================
-- QUERY PENGECEKAN DATA LAMA BERSTATUS 'Dibatalkan' (READ-ONLY)
-- Jalankan query berikut di Supabase SQL Editor untuk melihat data lama:
--
-- SELECT id, public_id, nama_lengkap, asal_instansi, status, created_at, updated_at
-- FROM public.pengajuans
-- WHERE status = 'Dibatalkan'
-- ORDER BY created_at DESC;
--
-- Rekomendasi Migrasi Data Lama (opsional, konsultasikan sebelum dijalankan):
-- UPDATE public.pengajuans
-- SET status = 'Ditolak', alasan_penolakan = 'Pengajuan lama dibatalkan pemohon (migrasi status)'
-- WHERE status = 'Dibatalkan';
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK SCRIPT (Jika Ingin Mengembalikan Perubahan):
--
-- DROP TRIGGER IF EXISTS trg_protect_pengajuan_status ON public.pengajuans;
-- DROP FUNCTION IF EXISTS public.protect_pengajuan_status();
-- GRANT EXECUTE ON FUNCTION public.batalkan_pengajuan(TEXT, TEXT) TO authenticated;
-- ==============================================================================
