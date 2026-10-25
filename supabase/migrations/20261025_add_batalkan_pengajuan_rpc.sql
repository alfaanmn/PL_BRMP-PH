-- Migration: 20261025_add_batalkan_pengajuan_rpc.sql
-- Deskripsi: Fungsi RPC atomic untuk pembatalan mandiri pengajuan magang oleh pengguna pemilik.

CREATE OR REPLACE FUNCTION public.batalkan_pengajuan(
  p_public_id TEXT,
  p_alasan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_pengajuan RECORD;
  v_catatan TEXT;
BEGIN
  -- 1. Ambil ID pengguna yang sedang login dari sesi Supabase Auth
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'UNAUTHORIZED',
        'message', 'Sesi Anda telah berakhir. Silakan login kembali.'
      )
    );
  END IF;

  -- 2. Ambil data pengajuan dan kunci baris (ROW LOCK) untuk mencegah race condition
  SELECT id, public_id, user_id, status, bidang_id, jumlah_anggota
  INTO v_pengajuan
  FROM public.pengajuans
  WHERE public_id = p_public_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'NOT_FOUND',
        'message', 'Pengajuan tidak ditemukan.'
      )
    );
  END IF;

  -- 3. Otorisasi kepemilikan: Hanya pemilik pengajuan yang berhak membatalkan
  IF v_pengajuan.user_id <> v_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'FORBIDDEN',
        'message', 'Anda tidak memiliki hak akses untuk membatalkan pengajuan ini.'
      )
    );
  END IF;

  -- 4. Idempotensi: Jika sudah Dibatalkan sebelumnya, jangan error, kembalikan status sukses
  IF v_pengajuan.status = 'Dibatalkan' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Pengajuan sudah dibatalkan sebelumnya.',
      'data', jsonb_build_object(
        'id', v_pengajuan.id,
        'public_id', v_pengajuan.public_id,
        'status', 'Dibatalkan'
      )
    );
  END IF;

  -- 5. Validasi Status: Hanya status 'Menunggu Verifikasi' yang diizinkan untuk dibatalkan
  IF v_pengajuan.status <> 'Menunggu Verifikasi' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', jsonb_build_object(
        'code', 'INVALID_STATUS',
        'message', format('Pengajuan dengan status "%s" tidak dapat dibatalkan.', v_pengajuan.status)
      )
    );
  END IF;

  -- 6. Susun catatan audit log pembatalan
  IF p_alasan IS NOT NULL AND trim(p_alasan) <> '' THEN
    v_catatan := format('Dibatalkan oleh pemohon. Alasan: %s', trim(p_alasan));
  ELSE
    v_catatan := 'Dibatalkan sendiri oleh pemohon magang.';
  END IF;

  -- 7. Update status pengajuan menjadi 'Dibatalkan' (Soft Cancel)
  -- Catatan: alasan_penolakan TIDAK diubah agar tetap khusus untuk penolakan admin.
  UPDATE public.pengajuans
  SET
    status = 'Dibatalkan',
    updated_at = NOW()
  WHERE id = v_pengajuan.id;

  -- 8. Catat ke pengajuan_status_logs sebagai audit trail permanen
  INSERT INTO public.pengajuan_status_logs (
    pengajuan_id,
    status,
    catatan,
    created_by,
    created_at
  ) VALUES (
    v_pengajuan.id,
    'Dibatalkan',
    v_catatan,
    v_user_id,
    NOW()
  );

  -- 9. Kembalikan response sukses terstruktur
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Pengajuan magang berhasil dibatalkan.',
    'data', jsonb_build_object(
      'id', v_pengajuan.id,
      'public_id', v_pengajuan.public_id,
      'status', 'Dibatalkan'
    )
  );
END;
$$;

-- Izin Eksekusi: Hanya untuk pengguna terotentikasi (authenticated)
REVOKE EXECUTE ON FUNCTION public.batalkan_pengajuan(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.batalkan_pengajuan(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.batalkan_pengajuan(TEXT, TEXT) TO authenticated;
