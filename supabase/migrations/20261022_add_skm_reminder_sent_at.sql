-- MIGRATION DOKUMENTASI: Penanda Pengingat SKM & Index Cron SIM-Magang
-- Tanggal: 2026-10-22
-- Catatan: Script ini sudah dijalankan langsung di Supabase SQL Editor oleh user.

-- 1. Penanda: email pengingat SKM sudah dikirim untuk pengajuan ini
ALTER TABLE pengajuans
ADD COLUMN IF NOT EXISTS skm_reminder_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Indeks untuk mempercepat pengecekan cron harian
CREATE INDEX IF NOT EXISTS idx_pengajuans_skm_reminder
ON pengajuans (status, tanggal_selesai, skm_reminder_sent_at);
