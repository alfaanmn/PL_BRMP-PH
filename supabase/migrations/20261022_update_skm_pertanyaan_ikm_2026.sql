-- =================================================================
-- MIGRATION DOKUMENTASI: Update Instrumen Kuesioner IKM / SKM 2026
-- Tanggal: 2026-10-22
-- Catatan: SQL ini sudah dieksekusi oleh user di Supabase SQL Editor.
-- File ini disimpan sebagai dokumentasi versioning skema project.
-- =================================================================

-- 1. Bersihkan pertanyaan lama (skm_jawaban kosong saat migrasi)
DELETE FROM skm_pertanyaan;

-- 2. Masukkan 16 butir pertanyaan pilihan skala 1-4 + 1 butir masukan teks terbuka (urutan 17)
INSERT INTO skm_pertanyaan (urutan, pertanyaan, unsur, tipe, opsi, is_active) VALUES
(1, 'Informasi pelayanan tersedia melalui media elektronik maupun nonelektronik', 'Informasi Pelayanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(2, 'Kesesuaian persyaratan dengan standar pelayanan/informasi yang diberikan', 'Persyaratan Pelayanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(3, 'Standar dan prosedur layanan diinformasikan dengan jelas', 'Kejelasan Prosedur', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(4, 'Prosedur/Alur layanan mudah dipahami dan dilakukan', 'Kemudahan Prosedur', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(5, 'Jangka waktu layanan sesuai dengan yang diinformasikan', 'Waktu Layanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(6, 'Biaya layanan sesuai dengan yang diinformasikan', 'Biaya Layanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(7, 'Produk layanan yang diterima sesuai dengan yang dipublikasikan', 'Produk Layanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(8, 'Petugas merespon kebutuhan dengan cepat', 'Kecepatan Respon', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(9, 'Petugas melayani saya dengan ramah', 'Keramahan Petugas', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(10, 'Layanan konsultasi dan pengaduan mudah diakses', 'Akses Pengaduan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(11, 'Sarana prasarana nyaman dan mudah diakses', 'Sarana Prasarana', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(12, 'Saya dilayani secara adil tanpa diskriminasi', 'Keadilan Pelayanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(13, 'Layanan diberikan sesuai prosedur tanpa adanya kecurangan', 'Integritas Layanan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(14, 'Pelayanan diberikan tanpa imbalan uang, barang, atau fasilitas di luar aturan', 'Anti Gratifikasi', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(15, 'Tidak ada pungutan liar (pungli) dalam pelayanan', 'Bebas Pungli', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(16, 'Tidak ada percaloan/perantara tidak resmi dalam pelayanan', 'Bebas Percaloan', 'pilihan', '[{"skor": 1, "label": "Tidak Baik"}, {"skor": 2, "label": "Kurang Baik"}, {"skor": 3, "label": "Baik"}, {"skor": 4, "label": "Sangat Baik"}]'::jsonb, true),
(17, 'Saran dan masukan untuk Layanan BRMP Pengelola Hasil', 'Saran dan Masukan', 'teks', null, true);
