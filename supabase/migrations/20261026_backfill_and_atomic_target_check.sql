-- Migration: 20261026_backfill_and_atomic_target_check.sql
-- Deskripsi:
-- 1. Backfill profiles.status_peserta HANYA dari pengajuans.jenjang::text terbaru (user tanpa riwayat dibiarkan NULL).
-- 2. Trigger protect_status_peserta pada profiles agar user biasa tidak bisa mengubah status_peserta setelah terisi.
-- 3. CREATE OR REPLACE FUNCTION submit_pengajuan_atomic dengan verifikasi target_peserta berbasis status_peserta profil aktual.

-- ==============================================================================
-- 1. BACKFILL PROFILES.STATUS_PESERTA
-- ==============================================================================
UPDATE public.profiles p
SET status_peserta = sub.latest_jenjang
FROM (
  SELECT DISTINCT ON (user_id) 
    user_id, 
    jenjang::text AS latest_jenjang
  FROM public.pengajuans
  WHERE jenjang IS NOT NULL
  ORDER BY user_id, created_at DESC
) sub
WHERE p.id = sub.user_id 
  AND p.status_peserta IS NULL;

-- ==============================================================================
-- 2. TRIGGER PROTEKSI PROFILES.STATUS_PESERTA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.protect_status_peserta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  -- Jika status_peserta tidak mengalami perubahan nilai, lewati
  IF OLD.status_peserta IS NOT DISTINCT FROM NEW.status_peserta THEN
    RETURN NEW;
  END IF;

  v_current_user_id := auth.uid();

  -- Cek apakah pemanggil adalah administrator
  SELECT (role = 'administrator') INTO v_is_admin
  FROM public.profiles
  WHERE id = v_current_user_id;

  -- KASUS 1: Pengisian pertama kali (OLD bernilai NULL, NEW non-NULL)
  -- Boleh dilakukan oleh pemilik akun sendiri atau administrator
  IF OLD.status_peserta IS NULL AND NEW.status_peserta IS NOT NULL THEN
    IF v_current_user_id = OLD.id OR v_is_admin IS TRUE OR v_current_user_id IS NULL THEN
      RETURN NEW;
    END IF;
  END IF;

  -- KASUS 2: Pengubahan nilai non-NULL ke nilai lain
  -- HANYA ADMINISTRATOR yang boleh mengubah! User biasa dilarang keras.
  IF OLD.status_peserta IS NOT NULL AND NEW.status_peserta <> OLD.status_peserta THEN
    IF v_is_admin IS NOT TRUE AND v_current_user_id IS NOT NULL THEN
      RAISE EXCEPTION 'FORBIDDEN: Status peserta hanya dapat diubah oleh administrator.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_status_peserta ON public.profiles;
CREATE TRIGGER trg_protect_status_peserta
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_status_peserta();

-- ==============================================================================
-- 3. CREATE OR REPLACE FUNCTION submit_pengajuan_atomic
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_pengajuan_atomic(
  p_bidang_id BIGINT,
  p_nomor_surat TEXT,
  p_tanggal_surat DATE,
  p_jenjang TEXT,
  p_asal_instansi TEXT,
  p_jurusan TEXT,
  p_tanggal_mulai DATE,
  p_tanggal_selesai DATE,
  p_durasi_bulan INTEGER,
  p_topik_magang TEXT,
  p_surat_pengantar_url TEXT,
  p_proposal_url TEXT DEFAULT NULL,
  p_dokumen_tambahan_url TEXT DEFAULT NULL,
  p_nama_pemohon TEXT DEFAULT NULL,
  p_nim_pemohon TEXT DEFAULT NULL,
  p_no_hp_pemohon TEXT DEFAULT NULL,
  p_jenis_kelamin_pemohon TEXT DEFAULT NULL,
  p_alamat_pemohon TEXT DEFAULT NULL,
  p_anggota_tambahan JSONB DEFAULT '[]'::JSONB,
  p_jumlah_anggota_dipilih INTEGER DEFAULT 1,
  p_konfirmasi_kuota_sebagian BOOLEAN DEFAULT FALSE,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_existing RECORD;
  v_status_peserta TEXT;
  v_bidang RECORD;
  v_sisa_kuota INTEGER;
  v_total_peserta INTEGER;
  v_peserta_diterima INTEGER;
  v_public_id TEXT;
  v_pengajuan_id BIGINT;
  v_elem JSONB;
BEGIN
  -- 1. Ambil Sesi User Login
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Sesi autentikasi tidak ditemukan. Silakan login kembali.';
  END IF;

  -- 2. Idempotensi
  IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
    SELECT id, public_id INTO v_existing
    FROM public.pengajuans
    WHERE idempotency_key = p_idempotency_key AND user_id = v_user_id;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', true,
        'id', v_existing.id,
        'public_id', v_existing.public_id,
        'is_idempotent_replay', true
      );
    END IF;
  END IF;

  -- 3. Cek Pengajuan Aktif
  IF EXISTS (
    SELECT 1 FROM public.pengajuans
    WHERE user_id = v_user_id
      AND status::text IN ('Menunggu Verifikasi', 'Sedang Magang', 'Disetujui', 'Terjadwal')
  ) THEN
    RAISE EXCEPTION 'ACTIVE_APPLICATION_EXISTS: Anda sudah memiliki pengajuan magang yang sedang aktif.';
  END IF;

  -- 4. KOREKSI DARI USER: Cek Status Peserta Profil (Jangan Percaya p_jenjang dari Client)
  SELECT status_peserta INTO v_status_peserta
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_status_peserta IS NULL OR trim(v_status_peserta) = '' THEN
    RAISE EXCEPTION 'STATUS_PESERTA_NULL: Anda belum memilih status peserta (Mahasiswa atau Siswa). Silakan lengkapi status akun di profil Anda terlebih dahulu.';
  END IF;

  -- 5. Kunci Baris Bidang & Cek Ketersediaan
  SELECT id, nama, target_peserta, kuota, terisi, is_active
  INTO v_bidang
  FROM public.bidangs
  WHERE id = p_bidang_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Bidang magang tidak ditemukan.';
  END IF;

  IF v_bidang.is_active IS FALSE THEN
    RAISE EXCEPTION 'BIDANG_INACTIVE: Pendaftaran pada bidang magang ini sedang ditutup.';
  END IF;

  -- 6. KOREKSI DARI USER: Validasi Kecocokan Target Lowongan
  IF v_bidang.target_peserta = 'Mahasiswa' AND v_status_peserta <> 'Mahasiswa' THEN
    RAISE EXCEPTION 'TARGET_PESERTA_MISMATCH: Lowongan ini hanya untuk mahasiswa.';
  END IF;

  IF v_bidang.target_peserta = 'Siswa' AND v_status_peserta <> 'Siswa' THEN
    RAISE EXCEPTION 'TARGET_PESERTA_MISMATCH: Lowongan ini hanya untuk siswa.';
  END IF;

  -- 7. Evaluasi Kuota
  v_sisa_kuota := GREATEST(0, v_bidang.kuota - v_bidang.terisi);
  v_total_peserta := COALESCE(p_jumlah_anggota_dipilih, 1);

  IF v_sisa_kuota <= 0 THEN
    RAISE EXCEPTION 'KUOTA_PENUH: Kuota pada bidang ini sudah terisi penuh oleh pengajuan lain.';
  END IF;

  IF v_total_peserta > v_sisa_kuota AND p_konfirmasi_kuota_sebagian IS NOT TRUE THEN
    RAISE EXCEPTION 'MEMERLUKAN_KONFIRMASI_KUOTA: Sisa kuota bidang ini %, sedangkan pengajuan Anda % orang.', v_sisa_kuota, v_total_peserta;
  END IF;

  v_peserta_diterima := LEAST(v_total_peserta, v_sisa_kuota);

  -- 8. Generate Public ID
  v_public_id := encode(extensions.gen_random_bytes(8), 'hex');

  -- 9. Insert Pengajuan (Paksa jenjang dari status profil yang terverifikasi)
  INSERT INTO public.pengajuans (
    public_id,
    user_id,
    bidang_id,
    nomor_surat,
    tanggal_surat,
    jenjang,
    asal_instansi,
    jurusan,
    tanggal_mulai,
    tanggal_selesai,
    durasi_bulan,
    jumlah_anggota,
    jumlah_diajukan,
    nama_lengkap,
    nim_nis,
    jenis_kelamin,
    no_hp,
    alamat,
    topik_magang,
    surat_pengantar_url,
    proposal_url,
    dokumen_tambahan_url,
    status,
    konfirmasi_kuota_sebagian,
    idempotency_key,
    anggota
  ) VALUES (
    v_public_id,
    v_user_id,
    p_bidang_id,
    p_nomor_surat,
    p_tanggal_surat,
    v_status_peserta::public.jenjang_type,
    p_asal_instansi,
    p_jurusan,
    p_tanggal_mulai,
    p_tanggal_selesai,
    p_durasi_bulan,
    v_peserta_diterima,
    v_total_peserta,
    p_nama_pemohon,
    p_nim_pemohon,
    p_jenis_kelamin_pemohon::public.jenis_kelamin_type,
    p_no_hp_pemohon,
    p_alamat_pemohon,
    p_topik_magang,
    p_surat_pengantar_url,
    p_proposal_url,
    p_dokumen_tambahan_url,
    'Menunggu Verifikasi',
    p_konfirmasi_kuota_sebagian,
    p_idempotency_key,
    p_anggota_tambahan
  )
  RETURNING id INTO v_pengajuan_id;

  -- 10. Insert Pemohon ke pengajuan_anggotas sebagai Ketua
  INSERT INTO public.pengajuan_anggotas (
    pengajuan_id,
    nama,
    nim_nis,
    no_hp,
    jurusan,
    is_ketua,
    status
  ) VALUES (
    v_pengajuan_id,
    COALESCE(p_nama_pemohon, 'Pemohon Utama'),
    COALESCE(p_nim_pemohon, '-'),
    p_no_hp_pemohon,
    p_jurusan,
    true,
    'menunggu'
  );

  -- 11. Insert Anggota Tambahan jika ada
  IF p_anggota_tambahan IS NOT NULL AND jsonb_array_length(p_anggota_tambahan) > 0 THEN
    FOR v_elem IN SELECT * FROM jsonb_array_elements(p_anggota_tambahan)
    LOOP
      INSERT INTO public.pengajuan_anggotas (
        pengajuan_id,
        nama,
        nim_nis,
        no_hp,
        jurusan,
        is_ketua,
        status
      ) VALUES (
        v_pengajuan_id,
        COALESCE(v_elem->>'nama', 'Anggota'),
        COALESCE(v_elem->>'nim_nis', '-'),
        v_elem->>'no_hp',
        v_elem->>'jurusan',
        false,
        'menunggu'
      );
    END LOOP;
  END IF;

  -- 12. Audit Trail Log Status
  INSERT INTO public.pengajuan_status_logs (
    pengajuan_id,
    status,
    catatan,
    created_by
  ) VALUES (
    v_pengajuan_id,
    'Menunggu Verifikasi',
    'Pengajuan magang berhasil dikirimkan oleh pemohon.',
    v_user_id
  );

  -- 13. Update Kuota Terisi Bidang
  UPDATE public.bidangs
  SET terisi = terisi + v_peserta_diterima,
      updated_at = NOW()
  WHERE id = p_bidang_id;

  -- 14. Return Berhasil
  RETURN jsonb_build_object(
    'success', true,
    'id', v_pengajuan_id,
    'public_id', v_public_id,
    'is_idempotent_replay', false
  );
END;
$$;
