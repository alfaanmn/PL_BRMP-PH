# LAPORAN AUDIT DOKUMEN AKADEMIK DAN REFERENSI JURNAL
**Proyek:** SIMPUL (Sistem Informasi Manajemen Magang dan Pelayanan Publik)  
*(Sebelumnya: SIM-Magang / SIM Magang / SIM_Magang)*  
**Dokumen yang Diaudit:** `jurnall/LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx`  
**Folder Referensi:** `jurnall/`  
**Auditor:** Senior Software Engineer & Academic Document Auditor  
**Tanggal Audit:** 26 Oktober 2026  
**Status Mode:** AUDIT SAJA (READ-ONLY) — Menunggu Persetujuan Pengguna

---

## A. RINGKASAN EKSEKUTIF

Audit komprehensif dilakukan terhadap dokumen laporan praktik lapang (`LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx`), basis kode aktual (Next.js, TypeScript, Supabase, migrasi PostgreSQL, RPC, dan trigger), serta seluruh file referensi pada folder `jurnall/`.

### 1. Ringkasan Temuan Audit Laporan
| Prioritas | Jumlah Temuan | Deskripsi Ringkas |
|---|:---:|---|
| **KRITIS** | **6** | Kesalahan instansi copas ("PT. Braincode"), disinkronisasi total sitasi vs daftar pustaka (24 sitasi yatim & 19 daftar pustaka palsu/tak terkait), Bab IV-VI belum ditulis/kosong, tidak adanya fitur Target Peserta & Status Akun pada analisis kebutuhan, ERD/kamus data usang tanpa kolom/trigger/RPC baru, dan ketiadaan skenario pengujian matriks 6-kasus kesesuaian peserta. |
| **SEDANG** | **4** | Judul subbab 2.1 salah ("Pengujian Perangkat Lunak" padahal berisi SIM Magang), penomoran tabel duplikat parah (Tabel 1, 3, dan 4 dipakai ganda untuk hal berbeda), klaim "9 entitas" basis data yang belum mencerminkan skema aktual (`sertifikats`, `pengajuan_anggotas`), dan inkonsistensi penamaan "SIM-Magang" ke "Simpul" di ~25 titik dokumen. |
| **RINGAN** | **5** | Kalimat terpotong pada paragraf [78], spasi ganda/hilang pada judul pengesahan [12, 29], tanda baca titik ganda pada [84], ketiadaan titik penutup pada [80], dan inkonsistensi singkatan instansi. |
| **TOTAL** | **15** | **Seluruh temuan memerlukan perbaikan terstruktur sebelum laporan diajukan.** |

### 2. Ringkasan Audit Folder Jurnal (44 File Referensi Ilmiah & Regulasi)
*(Catatan: Total 47 PDF di folder `jurnall/` terdiri atas 3 file naskah/template laporan dan 44 file referensi eksternal. Seluruh 44 file memiliki text layer terbaca).*

| Klasifikasi | Jumlah | Keterangan |
|---|:---:|---|
| **PAKAI** | **21** | Dikutip dalam teks laporan dan sangat relevan dengan sistem SIMPUL saat ini (SKM, alur magang, OTP email, UU PDP, UU Pelayanan Publik, model inkremental, ERD, normalisasi, black box testing). |
| **PERTAHANKAN / BELUM DIKUTIP** | **14** | Sangat/cukup relevan dengan arsitektur sistem saat ini (Next.js/TypeScript, Supabase BaaS/RLS, pengujian, evaluasi, profil instansi) namun belum dimasukkan ke sitasi teks. Sangat disarankan untuk dikutip pada Bab III, IV, dan V. |
| **TIDAK TERPAKAI** | **4** | Tidak dikutip di teks dan tidak relevan / sudah usang (kriptografi multilayer non-standar, bimbingan belajar, model waterfall kuno, regulasi usang). Diusulkan untuk diarsipkan. |
| **PERLU DICEK MANUAL** | **5** | Jurnal metodologi / testing tambahan yang perlu dikonfirmasi apakah ingin digunakan untuk memperkuat Bab V (Hasil Pengujian) atau tidak. |
| **TOTAL** | **44** | |

---

## B. TABEL TEMUAN AUDIT LAPORAN

| No | Lokasi (Paragraf/Halaman) | Teks Saat Ini (Kutipan) | Masalah / Kesenjangan terhadap Program | Perbaikan yang Disarankan | Prioritas |
|:--:|---|---|---|---|:---:|
| 1 | **Bab I — Tujuan**<br>(Paragraf [52]) | *"Tujuan pelaksanaan praktik lapang di PT. Braincode Sinergi Nusantara pada divisi Support Programmer/QA adalah sebagai berikut:"* | **Fatal Copy-Paste:** Menyebutkan perusahaan lain ("PT. Braincode Sinergi Nusantara") dan divisi "Support Programmer/QA", padahal tempat praktik lapang aktual adalah **BRMP Pengelola Hasil** (Kementan Bogor) pada Bagian Tata Usaha. | Ganti total menjadi: *"Tujuan pelaksanaan praktik lapang di Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian (BRMP Pengelola Hasil) pada Subbagian Tata Usaha adalah sebagai berikut:"* | **KRITIS** |
| 2 | **Daftar Pustaka vs Sitasi Teks**<br>(Paragraf [317]–[338]) | Teks mengutip 24 sumber ilmiah aktual (Zulfikar, Purnomo, Putro, Sutjiadi, Bana, Sunarya, Maulida Sari, Zikri, Rian, Gumelta, Mushaf, Mukhlis, Rahmi Aulia, Syarif, Samosir, UU 25/2009, UU 27/2022, dll). Namun Daftar Pustaka berisi 20 entri lain (Aditama, Agung Adidarma, Agustin, Anggraeni, Deanita, Duen Ralky, Ferreira, Fitrianto, Haykhal, Juwita, Laila, Maqbool, Yusop, Fikri, Romadhan, Sapto, Shofian, Visconti, Zikra). | **Disinkronisasi Total:** 95% Daftar Pustaka adalah daftar pustaka "palsu/yatim" hasil ekspor koleksi Mendeley yang tidak pernah disitasi di teks, sedangkan 24 referensi yang disitasi di teks tidak ada di Daftar Pustaka. | Hapus ke-20 entri Daftar Pustaka yang tidak terpakai, lalu susun ulang Daftar Pustaka resmi berbasis 24 sitasi aktual di Mendeley sesuai format template (APA Style). | **KRITIS** |
| 3 | **Bab IV, V, VI**<br>(Paragraf [315]–[317]) | Paragraf [315] memuat *"BAB IV PERANCANGAN DAN IMPLEMENTASI"*, lalu [316] *"4.1 Analisis dan Perancangan Sistem"*, lalu langsung loncat ke [317] *"DAFTAR PUSTAKA"*. | **Laporan Belum Selesai (Naskah Terputus):** Seluruh isi Bab IV (Perancangan arsitektur, ERD, antarmuka), Bab V (Hasil implementasi dan pengujian), serta Bab VI (Kesimpulan dan saran) sama sekali belum ditulis di file Word ini. | Lengkapi naskah Bab IV, V, dan VI mengacu pada sistem aktual Simpul, screenshot antarmuka terbaru, dan pengujian aktual. | **KRITIS** |
| 4 | **Bab III — Kebutuhan Fungsional**<br>(Paragraf [189]–[191], Tabel 3) | Tabel kebutuhan fungsional hanya memuat formulir bertahap umum, registrasi OTP, pelacakan status, dan SKM. | **Fitur Baru Tidak Disebut:** Belum mencakup: (1) Pemilihan dan penguncian status akun (Mahasiswa/Siswa) pada profil, (2) Pengelompokan lowongan berdasarkan target peserta, (3) Validasi pendaftaran bertingkat (hanya lowongan sesuai status akun), (4) Dasbor admin untuk mengelola status akun peserta dan filtering. | Tambahkan butir kebutuhan fungsional: *Pemohon: penentuan status akun peserta (Mahasiswa/Siswa) terproteksi; penyesuaian otomatis jenjang dan akses lowongan. Administrator: pengaturan status akun pemohon, verifikasi status, dan filtering terpadu.* | **KRITIS** |
| 5 | **Bab III — Perancangan Basis Data**<br>(Paragraf [193]) | *"Pada SIM-Magang, basis data dirancang dengan PostgreSQL melalui Supabase, terdiri atas sembilan entitas..."* | **Skema Basis Data Usang:** Tidak menyebutkan kolom baru `bidangs.target_peserta`, `profiles.status_peserta`, trigger keamanan `protect_status_peserta`, serta fungsi RPC atomik `submit_pengajuan_atomic` yang memverifikasi target peserta di level basis data. Juga belum mencatat entitas relasi `pengajuan_anggotas` dan `sertifikats`. | Perbarui penjelasan basis data: jelaskan penambahan kolom klasifikasi peserta, mekanisme trigger proteksi profil (`protect_status_peserta`), dan RPC atomik untuk integritas pendaftaran. | **KRITIS** |
| 6 | **Bab III — Skenario Pengujian**<br>(Paragraf [221]–[247], Tabel 5) | Tabel 5 hanya berisi 20 skenario umum (Autentikasi 4, Pengajuan 5, Status 3, Admin 5, SKM 3). | **Ketiadaan Pengujian Aturan Bisnis Inti:** Belum ada skenario uji matriks 6-kasus kesesuaian peserta (Mahasiswa->Mahasiswa [OK], Mahasiswa->Siswa [Tolak], Mahasiswa->Keduanya [OK], Siswa->Siswa [OK], Siswa->Mahasiswa [Tolak], Siswa->Keduanya [OK]), uji proteksi trigger non-admin ubah status, uji akun status NULL, dan uji Step 1 read-only. | Tambahkan modul/skenario pengujian khusus: "Validasi Hak Akses dan Kesesuaian Target Peserta" (minimal 6 skenario matriks + 2 skenario trigger dan form read-only). Total skenario menjadi 28 skenario. | **KRITIS** |
| 7 | **Bab II — Judul Subbab 2.1**<br>(Paragraf [85]–[91]) | Judul Heading2 [85]: *"2.1 Pengujian Perangkat Lunak"*, tetapi subbab di bawahnya adalah [86] *"2.1.1 Sistem Informasi"*, [88] *"2.1.2 Pengelolaan Pengajuan Magang"*, [90] *"2.1.3 Pelacakan Status Pengajuan"*. | **Heading Menyesatkan:** Judul 2.1 tertulis "Pengujian Perangkat Lunak", padahal isinya membahas konsep Sistem Informasi Manajemen Magang. Pengujian baru dibahas di Bab III. | Ubah Heading 2.1 menjadi: *"2.1 Sistem Informasi Manajemen Magang"*. | **SEDANG** |
| 8 | **Penomoran Tabel Duplikat**<br>(Paragraf [97], [141], [186], [198], [221], [257], [306]) | Tabel 1 digunakan untuk "Mutu Pelayanan SKM" [97] DAN "Penelitian Terdahulu" [141].<br>Tabel 3 untuk "Kebutuhan Pengguna" [186] DAN "Perangkat Lunak" [257].<br>Tabel 4 untuk "Jadwal Iterasi" [198] DAN "Perangkat Keras" [306]. | **Inkonsistensi Penomoran Dokumen Akademik:** Penomoran tabel tabrakan dan membingungkan pembaca/penguji karena nomor yang sama merujuk ke isi yang berbeda. | Urutkan ulang tabel secara runtut sesuai standar template (Tabel 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5 atau nomor berurutan 1 sampai 7). | **SEDANG** |
| 9 | **Penamaan Sistem: SIM-Magang vs Simpul**<br>(Di ~25 lokasi: Sampul, Lembar Pengesahan, Bab I, II, III, IV) | Tersebar penamaan *"Sistem Informasi Manajemen Magang (SIM-Magang)"*, *"SIM-Magang"*, *"SIM Magang"*. | **Rebranding Proyek:** Sistem telah resmi berganti nama menjadi **Simpul** (SIMPUL). Nama lama masih mendominasi naskah. | Sesuaikan penamaan menjadi: *"Simpul (Sistem Informasi Manajemen Magang dan Pelayanan Publik)"* pada kemunculan pertama, dan selanjutnya disingkat *"Simpul"*. | **SEDANG** |
| 10 | **Klaim Jenjang Form Bebas**<br>(Bab I [65], Bab III [189]) | Formulir pengajuan bertahap ditulis sebagai pemilihan jenjang bebas oleh pemohon. | **Ketidaksesuaian Alur Program:** Pada program sekarang, jenjang pada Step 1 bersifat *read-only* yang dikunci otomatis mengikuti `profiles.status_peserta` pemohon. | Perbarui deskripsi alur: jelaskan bahwa jenjang dikunci otomatis berdasarkan status profil yang terverifikasi demi menegakkan integritas seleksi. | **SEDANG** |
| 11 | **Kalimat Menggantung / Terpotong**<br>(Paragraf [78]) | *"...mulai dari identifikasi kebutuhan"* | Kalimat berhenti di tengah jalan tanpa tanda titik atau kelanjutan klausa. | Lengkapi kalimat: *"...mulai dari identifikasi kebutuhan hingga pengujian dan evaluasi sistem bersama pembimbing lapangan."* | **RINGAN** |
| 12 | **Tanda Baca Tanpa Titik Penutup**<br>(Paragraf [80]) | *"...serta Nodemailer untuk pengiriman notifikasi email"* | Kalimat akhir butir manfaat mahasiswa tidak diakhiri dengan tanda titik. | Tambahkan tanda titik di akhir kalimat. | **RINGAN** |
| 13 | **Tanda Baca Titik Ganda**<br>(Paragraf [84]) | *"...Nomor 14 Tahun 2017.."* | Terdapat dua tanda titik berturut-turut di akhir kalimat. | Hapus satu tanda titik menjadi *"Nomor 14 Tahun 2017."* | **RINGAN** |
| 14 | **Typo Spasi pada Halaman Judul/Pengesahan**<br>(Paragraf [12], [29]) | Paragraf [12]: *"Status     Pengajuan"* (spasi ganda 5x).<br>Paragraf [29]: *"StatusPengajuan"* (spasi hilang). | Kesalahan tipografi pada judul di lembar pengesahan dan konfirmasi revisi. | Rapikan spasi menjadi: *"Status Pengajuan"*. | **RINGAN** |
| 15 | **Klaim Email Header/Logo (Pemeriksaan Negatif)**<br>(Seluruh dokumen) | Tidak ditemukan klaim kustomisasi header logo email. | **Konfirmasi Negatif:** Fitur ini sebelumnya dibatalkan di kode. Dokumen laporan sudah bersih dari klaim fitur yang dibatalkan ini (STATUS: BAIK / TIDAK PERLU DIUBAH). | Pertahankan (jangan sampai ditambahkan ke laporan). | **RINGAN** |

---

## C. TABEL AUDIT FOLDER JURNAL (REFERENSI)

Berikut adalah hasil audit terhadap 44 file referensi ilmiah dan regulasi di folder `jurnall/`:

| No | File Referensi di `jurnall/` | Dikutip di Laporan? | Relevansi terhadap Program Simpul | Klasifikasi | Alasan Akademik & Teknis |
|:--:|---|---|---|:---:|---|
| 1 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/3138-Article Text-7346-1-10-20230717_SKM.pdf` | **Ya** (Bab I [50]) | **Sangat Relevan** (SKM berbasis web) | **PAKAI** | Menjadi rujukan ilmiah (Zulfikar et al., 2023) untuk integrasi modul Survei Kepuasan Masyarakat dalam layanan magang. |
| 2 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/id+400+-+Copy+Editing+(edited)+(3)_PKL2_P3.pdf` | **Ya** (Bab I [50]) | **Sangat Relevan** (Modul PKL/Magang terintegrasi) | **PAKAI** | Menjadi rujukan (Fidi Wincoko Putro et al., 2023) mengenai pentingnya integrasi sistem administrasi magang daring. |
| 3 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/sitiaminah,+998-Article+Text-4179-1-6-20231210_PKL_P3.pdf` | **Ya** (Bab I [50]) | **Sangat Relevan** (Pengembangan modul PKL) | **PAKAI** | Menjadi rujukan (Purnomo et al., 2023) untuk perancangan alur formulir bertahap kegiatan magang. |
| 4 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/UU Nomor 25 Tahun 2009.pdf` | **Ya** (Bab I [48], Bab II [94]) | **Sangat Relevan** (Regulasi Pelayanan Publik) | **PAKAI** | Landasan hukum wajib untuk transparansi, akuntabilitas, dan kewajiban SKM bagi instansi pemerintah. |
| 5 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/UU_Nomor_27_Tahun_2022 Perlindungan Data Pribadi_latbek_p1.3.pdf` | **Ya** (Bab I [48, 55], Bab II [125]) | **Sangat Relevan** (Regulasi PDP & Keamanan Data) | **PAKAI** | Landasan hukum proteksi identitas pemohon magang, pemisahan hak akses RLS, dan verifikasi OTP. |
| 6 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/Permentan_Nomor_13_Tahun_2023_Latbek_P1.pdf` | **Ya** (Bab I [48]) | **Sangat Relevan** (OTK Instansi BRMP) | **PAKAI** | Landasan pembentukan dan tugas pokok BRMP Pengelola Hasil di lingkup Kementan. |
| 7 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/FINAL-warta+agrostandar+vol+1+no+1+tahun+2024+sudah+sama+cover_latbek_P1.2.pdf` | Belum | **Relevan** (Profil Instansi BRMP) | **PERTAHANKAN / BELUM DIKUTIP** | Memuat ulasan resmi transformasi kelembagaan BSIP/BRMP, sangat cocok disitasi di Bab I.1 atau Bab II.4. |
| 8 | `01_BAB_I_PENDAHULUAN/01_Latar_Belakang/firdi,+241-Article+Text-771-1-10-20210630_latbek_p1.3.pdf` | Tidak | Kurang Relevan (Keamanan data lama) | **TIDAK TERPAKAI** | Tidak dikutip; isu perlindungan data sudah diwakili secara formal dan jauh lebih kuat oleh UU 27/2022. |
| 9 | `02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/2089-File Naskah Utama-7372-1-10-20260804.pdf` | **Ya** (Bab II [87]) | **Sangat Relevan** (SIM Magang Polman Babel) | **PAKAI** | Rujukan (Zikri et al., 2026) mengenai dampak pergantian sistem magang konvensional ke berbasis web. |
| 10 | `02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.1_Sistem_Informasi/asrianda,+7+Jurnal+Indah+Maulida+Sari+(new).pdf` | **Ya** (Bab II [87, 91]) | **Sangat Relevan** (Pelacakan Status Magang) | **PAKAI** | Rujukan (Maulida Sari et al., 2024) mengenai antarmuka pemantauan status persetujuan magang. |
| 11 | `02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.2_Pengelolaan_Pengajuan_Magang/ojs_thamrin,+Artikel+Hesti+Handa.pdf` | **Ya** (Bab II [89]) | **Sangat Relevan** (Alur Seleksi Berkas Magang) | **PAKAI** | Rujukan (Rian et al., 2023) untuk verifikasi berkas permohonan magang secara daring terpusat. |
| 12 | `02_BAB_II_TINJAUAN_PUSTAKA/2.4_Tinjauan Instansi/2.4.1 Visi misi brmp/permentan-no-12-tahun-2026.pdf` | **Ya** (Bab II [130]) | **Sangat Relevan** (Permentan 12/2026 OTK BRMP) | **PAKAI** | Rujukan hukum terbaru tugas pokok, struktur organisasi, dan tata kerja BRMP Pengelola Hasil Bogor. |
| 13 | `02_BAB_II_TINJAUAN_PUSTAKA/2.7_Penelitian_Terdahulu/1772-Article Text-11372-1-10-20250818.pdf` | Belum spesifik | **Sangat Relevan** (Penelitian Terdahulu Magang) | **PERTAHANKAN / BELUM DIKUTIP** | Cocok untuk melengkapi komparasi sistem magang pada Tabel 1 (Penelitian Terdahulu) di Bab II.7. |
| 14 | `03_BAB_III_METODE_PENELITIAN/inkremental/4334-Article Text-11687-1-10-20230623.pdf` | **Ya** (Bab I [50], Bab III [180, 184]) | **Sangat Relevan** (Model Inkremental) | **PAKAI** | Rujukan metodologi utama (Sutjiadi et al., 2022) penerapan incremental model pada pengembangan sistem. |
| 15 | `03_BAB_III_METODE_PENELITIAN/inkremental/614-Article Text-1958-2-10-20230530.pdf` | **Ya** (Bab I [50], Bab III [180]) | **Sangat Relevan** (Siklus Rilis Inkremental) | **PAKAI** | Rujukan (Bana et al., 2023) prinsip rilis modul bertahap dan evaluasi berkelanjutan. |
| 16 | `03_BAB_III_METODE_PENELITIAN/inkremental/Pengaruh_Metode_Waterfall_dalam_Penyempurnaan_Pros.pdf` | **Ya** (Bab III [180]) | **Relevan** (Komparasi Waterfall vs Agile/Inkremental) | **PAKAI** | Rujukan (Sunarya et al., 2025) sebagai dasar justifikasi mengapa tidak menggunakan metode Waterfall. |
| 17 | `03_BAB_III_METODE_PENELITIAN/inkremental/Penerapan_Model_Waterfall_pada_Perancangan_Corpora.pdf` | Tidak | Kurang Relevan (Fokus Waterfall murni) | **TIDAK TERPAKAI** | Tidak dikutip di teks; sudah cukup diwakili oleh Sunarya et al. (2025). |
| 18 | `03_BAB_III_METODE_PENELITIAN/inkremental/intan_maulina,+73-81.pdf` | Belum | Cukup Relevan (Pengujian perangkat lunak) | **PERTAHANKAN / BELUM DIKUTIP** | Dapat digunakan untuk memperkuat landasan teori pengujian fungsional di Bab III.1.4. |
| 19 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.2 Perancangan Basis Data dan Antarmuka/1+-+Iqbal+Ramadhani+Mukhlis.pdf` | **Ya** (Bab III [193]) | **Sangat Relevan** (Normalisasi Basis Data) | **PAKAI** | Rujukan ilmiah (Mukhlis et al., 2024) untuk normalisasi 3NF skema relasional tabel Simpul. |
| 20 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.2 Perancangan Basis Data dan Antarmuka/1.+2682-Publish+(100-111).pdf` | **Ya** (Bab III [193]) | **Sangat Relevan** (Entity Relationship Diagram) | **PAKAI** | Rujukan ilmiah (Rahmi Aulia et al., 2025) untuk perancangan ERD dan pemodelan kardinalitas relasi. |
| 21 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.2 Perancangan Basis Data dan Antarmuka/256-Article Text-1141-2-10-20251227.pdf` | **Ya** (Bab III [194]) | **Sangat Relevan** (Wireframing UI Figma) | **PAKAI** | Rujukan ilmiah (Syarif, 2024) untuk metodologi perancangan antarmuka visual dua peran (pemohon & admin). |
| 22 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.2 Perancangan Basis Data dan Antarmuka/1616-5647-4-PB.pdf` | Belum | Cukup Relevan (Perancangan basis data) | **PERTAHANKAN / BELUM DIKUTIP** | Relevan untuk memperkuat subbab perancangan basis data atau penjelasan RLS. |
| 23 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.5 Evaluasi/13.+aldy+1649+HAL+128-138.pdf` | Belum | Cukup Relevan (Evaluasi Sistem) | **PERTAHANKAN / BELUM DIKUTIP** | Cocok dikutip untuk memperkuat subbab 3.1.5 Evaluasi dan pembahasan hasil Bab V. |
| 24 | `metodologi_agile/(279-298)+-+Mushaf,et.al+-+Development+of+a+Web-Based+Scheduling+Information+System.pdf` | **Ya** (Bab III [196, 220]) | **Sangat Relevan** (Implementasi Koding & Black Box) | **PAKAI** | Rujukan utama (Mushaf et al., 2025) untuk tahap implementasi aplikasi web dan testing black box. |
| 25 | `metodologi_agile/179.pdf` | **Ya** (Bab III [248]) | **Sangat Relevan** (Evaluasi Siklus Iterasi) | **PAKAI** | Rujukan (Samosir & Nengsih, 2024) untuk mekanisme evaluasi feedback pengguna di tiap iterasi. |
| 26 | `metodologi_agile/173-Article Text-837-2-10-20250625.pdf` | Belum | Cukup Relevan (Analisis Kebutuhan Sistem) | **PERTAHANKAN / BELUM DIKUTIP** | Relevan melengkapi subbab 3.1.1 Analisis Kebutuhan. |
| 27 | `metodologi_agile/173-Article Text-837-2-10-20250625_3.1.1 Analisis Kebutuhan.pdf` | Belum | Cukup Relevan (Varian 173) | **PERTAHANKAN / BELUM DIKUTIP** | File salinan/anotasi dari artikel 173 di atas. |
| 28 | `metodologi_agile/173-Article Text-837-2-10-20250625_P4.pdf` | Belum | Cukup Relevan (Varian 173) | **PERTAHANKAN / BELUM DIKUTIP** | File salinan/anotasi dari artikel 173 di atas. |
| 29 | `metodologi_agile/5659-Article File-39272-1-10-20240826.pdf` | Belum | Cukup Relevan (Pengembangan Web Responsif) | **PERTAHANKAN / BELUM DIKUTIP** | Relevan untuk justifikasi optimasi tampilan mobile (Iterasi 3). |
| 30 | `metodologi_agile/aakreditasi2017,+2145-5243-1-CE+55-66.pdf` | Belum | Cukup Relevan (Metodologi Agile/Iteratif) | **PERTAHANKAN / BELUM DIKUTIP** | Menjelaskan siklus iteratif web, relevan untuk subbab 3.1. |
| 31 | `metodologi_agile/aakreditasi2017,+2145-5243-1-CE+55-66_P4.pdf` | Belum | Cukup Relevan (Varian akreditasi) | **PERTAHANKAN / BELUM DIKUTIP** | Salinan anotasi dari artikel di atas. |
| 32 | `metodologi_agile/Fahma+Vol+20+No+2+Mei+2022-1.pdf` | Belum | Cukup Relevan (Rancang Bangun Sistem Informasi) | **PERTAHANKAN / BELUM DIKUTIP** | Relevan untuk komparasi metodologi sistem informasi. |
| 33 | `metodologi_agile/rifdafaticha,+1442-Article+Text-7044-1-6-20240102.pdf` | Belum | Cukup Relevan (Pengujian Sistem Informasi) | **PERTAHANKAN / BELUM DIKUTIP** | Relevan melengkapi pengujian black box di Bab V. |
| 34 | `metodologi_agile/Rancang+Bangun+Web+Optimasi+Promosi+Bimbingan+Belajar+Menggunakan+Next.JS+Dengan+Pendekatan+Agile.pdf` | Tidak di teks | Kurang Relevan (Bimbel komersial) | **TIDAK TERPAKAI** | Topik bimbingan belajar komersial tidak selaras dengan sistem magang instansi pemerintah. |
| 35 | `Teknologi yg dipakai/2.5.1_Nextjs_dan_TypeScript/martono,+32.+966-976_Syuhda+Fakhrunnisa,+Rahadian+Kurniawan.pdf` | Belum | **Sangat Relevan** (Next.js & TypeScript) | **PERTAHANKAN / BELUM DIKUTIP** | Sangat disarankan disitasi pada Bab III.3.1 (Tabel Perangkat Lunak) untuk rujukan Next.js & TypeScript. |
| 36 | `Teknologi yg dipakai/2.5.2_Supabase/747-Article Text-4255-1-10-20230812.pdf` | Belum spesifik | **Sangat Relevan** (Supabase BaaS & PostgreSQL) | **PERTAHANKAN / BELUM DIKUTIP** | Sangat disarankan menggantikan sitasi website "Supabase (2026)" di paragraf [194] menjadi jurnal akademik resmi. |
| 37 | `Teknologi yg dipakai/2.5.2_Supabase/Jnanaloka-5_2_1.pdf` | Belum | Relevan (Supabase Cloud Service) | **PERTAHANKAN / BELUM DIKUTIP** | Memperkuat rujukan backend-as-a-service dan PostgreSQL RLS. |
| 38 | `Teknologi yg dipakai/2.5.2_Supabase/1224+-.pdf` | Belum | Relevan (Pemanfaatan BaaS) | **PERTAHANKAN / BELUM DIKUTIP** | Mendukung tinjauan pustaka infrastruktur cloud Supabase. |
| 39 | `Teknologi yg dipakai/2.5.3_Nodemailer/[80-86]+Pengembangan+Database+Sistem+Penilaian+dengan+Manajemen+Akses+Terjadwal+dan+Verifikasi+OTP+Email.pdf` | **Ya** (Bab I [50], Bab II [127]) | **Sangat Relevan** (Verifikasi OTP via Email) | **PAKAI** | Rujukan ilmiah utama (Rizqy Ath-Thaariq et al., 2023) untuk mekanisme pengiriman kode OTP via SMTP/Nodemailer. |
| 40 | `Teknologi yg dipakai/2.5.3_Nodemailer/J1.+Implementasi+Cryptography+Based+Multilayer+Authentication+pada+Sistem+Login+Berbasis+Web.pdf` | Tidak | Kurang Relevan (Kriptografi Multilayer Kompleks) | **TIDAK TERPAKAI** | Sistem Simpul menggunakan OTP email 6-digit standar; implementasi multilayer kriptografi tidak diterapkan. |
| 41 | `Teknologi yg dipakai/2.5.3_Nodemailer/luthfi,+Journal+editor,+1850-1863.pdf` | Belum | Cukup Relevan (Notifikasi Email Sistem) | **PERLU DICEK MANUAL** | Perlu dicek apakah fokusnya pada notifikasi transaksional atau arsitektur server lain. |
| 42 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.4 Pengujian Black Box/173-Article Text-837-2-10-20250625.pdf` | Belum | Cukup Relevan (Black Box Testing) | **PERLU DICEK MANUAL** | Duplikat dari artikel 173 di subfolder metodologi, perlu diputuskan apakah ingin dimasukkan di Bab V. |
| 43 | `03_BAB_III_METODE_PENELITIAN/3.1_Mtode_penelitian/3.1.4 Pengujian Black Box/aakreditasi2017,+2145-5243-1-CE+55-66.pdf` | Belum | Cukup Relevan (Pengujian Sistem) | **PERLU DICEK MANUAL** | Duplikat file dari subfolder metodologi_agile. |
| 44 | `02_BAB_II_TINJAUAN_PUSTAKA/2.1_Sistem_Informasi_Manajemen_Magang/2.1.3_Pelacakan_Status_Pengajuan/Gumelta et al. 2025.pdf` | **Ya** (Bab II [89, 91]) | **Sangat Relevan** (Pelacakan Status Magang PT Semen Padang) | **PAKAI** | Rujukan kunci (Gumelta et al., 2025) untuk implementasi pelacakan status bertahap pemohon. |

---

## D. DAFTAR SITASI YATIM & ANOMALI REFERENSI

### 1. Sitasi dalam Teks yang TIDAK ADA di Daftar Pustaka (24 Sumber Yatim)
Seluruh referensi ini **dikutip secara aktif dan valid** pada Bab I, II, dan III naskah, tetapi **hilang/tidak tercantum** pada halaman Daftar Pustaka dokumen Word:
1. `Kementerian Pertanian Republik Indonesia (2026)` — Permentan No. 12 Tahun 2026 (OTK BRMP). *(Dikutip pada baris 48, 130, 133, 134)*.
2. `Republik Indonesia (2009)` — UU No. 25 Tahun 2009 tentang Pelayanan Publik. *(Dikutip pada baris 48, 94)*.
3. `Republik Indonesia (2022)` — UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi. *(Dikutip pada baris 48, 125)*.
4. `Kementerian PAN-RB (2017)` — Permenpan-RB No. 14 Tahun 2017 tentang Pedoman SKM. *(Dikutip pada baris 49, 94, 96)*.
5. `Purnomo et al. (2023)` — Modul Praktik Kerja Lapangan. *(Dikutip pada baris 50)*.
6. `Fidi Wincoko Putro et al. (2023)` — Sistem magang terintegrasi akademik. *(Dikutip pada baris 50)*.
7. `Rizqy Ath-Thaariq et al. (2023)` — Verifikasi OTP email. *(Dikutip pada baris 50, 127)*.
8. `Zulfikar et al. (2023)` — SKM berbasis web. *(Dikutip pada baris 50)*.
9. `Sutjiadi et al. (2022)` — Model Inkremental. *(Dikutip pada baris 50, 180, 184)*.
10. `Sarlota Bana et al. (2023) / Bana et al. (2023)` — Penerapan Inkremental. *(Dikutip pada baris 50, 180)*.
11. `Maulida Sari et al. (2024)` — Sistem informasi dan status pengajuan BPJS TK. *(Dikutip pada baris 87, 91)*.
12. `Zikri et al. (2026)` — Sistem informasi magang Polman Babel. *(Dikutip pada baris 87)*.
13. `Rian et al. (2023)` — Pengelolaan pengajuan magang. *(Dikutip pada baris 89)*.
14. `Gumelta et al. (2025)` — Pelacakan status pengajuan magang PT Semen Padang. *(Dikutip pada baris 89, 91)*.
15. `Veri Ilhadi (2024)` — Rujukan tabel penelitian terdahulu. *(Dikutip pada baris 147)*.
16. `Muhammad Ibrahim Nasution (2025)` — Rujukan tabel penelitian terdahulu. *(Dikutip pada baris 148)*.
17. `Syavira Indah Maryam (2025)` — Rujukan tabel penelitian terdahulu. *(Dikutip pada baris 149)*.
18. `Sunarya et al. (2025)` — Evaluasi kelemahan Waterfall. *(Dikutip pada baris 180)*.
19. `Ghozali & Sofian (2026)` — Sumber diagram alir. *(Dikutip pada baris 182)*.
20. `Rahmi Aulia et al. (2025)` — Perancangan ERD. *(Dikutip pada baris 193)*.
21. `Mukhlis et al. (2024)` — Normalisasi basis data. *(Dikutip pada baris 193)*.
22. `Supabase (2026)` — Dokumentasi Row Level Security (RLS). *(Dikutip pada baris 194)*.
23. `Syarif (2024)` — Perancangan wireframe Figma. *(Dikutip pada baris 194)*.
24. `Mushaf et al. (2025)` — Implementasi koding dan black box testing. *(Dikutip pada baris 196, 220)*.
25. `Samosir & Nengsih (2024)` — Evaluasi siklus iterasi. *(Dikutip pada baris 248)*.

### 2. Entri Daftar Pustaka yang TIDAK PERNAH Disitasi di Teks (19 Entri Yatim)
Entri-entri ini tercantum pada halaman Daftar Pustaka [318]–[338] dokumen Word, tetapi **sama sekali tidak memiliki sitasi di dalam batang tubuh laporan**:
1. `Aditama, D. F., & Imelda, I. (2026)` — FlowTrackr bug report.
2. `Agung Adidarma, P. et al. (2026)` — Model Prototype Quality Control.
3. `Agustin, A. S. et al. (2026)` — Automated Testing in Software QA.
4. `Anggraeni, M. M., & Susetyo, Y. A. (2025)` — Laravel Bimbingan Belajar.
5. `Deanita Mabilaka, F., & Parlika, R. (2026)` — Laravel Pengelolaan Aset.
6. `Duen Ralky, B., & Andriyani, W. (2024)` — Katalon Studio dan Python E-Commerce.
7. `Ferreira, J. M. et al. (2023)` — Usability Mechanisms (IEEE TSE).
8. `Fitrianto, D., & Sulistyo, W. Y. (2026)` — RBAC SIMPEL Lazismu.
9. `Haykhal, F. (2025)` — Pengajuan Judul Tugas Akhir (JITET).
10. `Juwita, Awaluddin, & Iqbal, M. (2026)` — Basis Data E-Belajar Tekkomdik.
11. `Laila Ramadhani, S., & Prihantoro Putro, H. (2023)` — Aplikasi Qase.
12. `Maqbool, B., & Herold, S. (2024)` — Usability digital health (JSS).
13. `Mohamad Yusop, N. S. et al. (2023)` — STEM test artifacts.
14. `Muhammad Fikri et al. (2025)` — Persediaan barang website.
15. `Romadhan, H., & Mansur. (2025)` — RBAC Pembayaran Pendidikan.
16. `Sapto Prasetyo, D., & Silfianti, W. (2023)` — Pengujian Automation E-Commerce.
17. `Shofian Aprilliansyah, A. (2025)` — Home Shoes Cleaner Waterfall.
18. `Visconti, E. et al. (2025)` — Automated Monitoring Web UI (ACM).
19. `Zikra, A. A. et al. (2025)` — Project Management RBAC.

*(Catatan: Hanya `Ghozali, A. F., & Sofian, R. (2026)` yang memiliki irisan sitasi sebagai sumber diagram pada paragraf [182]).*

---

## E. DAFTAR USULAN PERUBAHAN & PERKIRAAN PEKERJAAN

Berikut urutan tahapan kerja yang diusulkan setelah Anda menyetujui laporan audit ini:

| Urutan Kerja | Aksi Perbaikan | File Terdampak | Perkiraan Waktu |
|:---:|---|---|:---:|
| **Fase 1** | **Koreksi Fatal Identitas Instansi & Tipografi Header**<br>• Ganti instansi copas ("PT. Braincode") di Tujuan [52] menjadi BRMP Pengelola Hasil.<br>• Perbaiki spasi judul lembar pengesahan [12, 29] dan kalimat terpotong [78, 80, 84]. | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx` | 15 menit |
| **Fase 2** | **Rekonsiliasi Total Daftar Pustaka & Sitasi Ilmiah**<br>• Hapus 19 entri daftar pustaka yang tidak disitasi.<br>• Masukkan ke-24 sumber ilmiah aktual ke Daftar Pustaka sesuai gaya APA / Mendeley.<br>• Tambahkan referensi teknologi Next.js/TypeScript (Martono/Syuhda) dan Supabase (Jnanaloka). | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx`, Mendeley | 30 menit |
| **Fase 3** | **Pembaruan Bab I & II (Rebranding & Struktur Heading)**<br>• Ganti nama proyek menjadi **Simpul** secara konsisten.<br>• Koreksi judul Heading 2.1 menjadi *"Sistem Informasi Manajemen Magang"* (bukan pengujian).<br>• Rapikan penomoran Tabel 1 (Mutu Pelayanan) dan Tabel 2 (Penelitian Terdahulu). | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx` | 30 menit |
| **Fase 4** | **Pembaruan Bab III (Metodologi & Spesifikasi Fitur Baru)**<br>• Perbarui Tabel Kebutuhan Fungsional dengan aturan Target Peserta & Status Akun profil.<br>• Perbarui penjelasan basis data (kolom `target_peserta`, `status_peserta`, trigger `protect_status_peserta`, dan RPC `submit_pengajuan_atomic`).<br>• Perluas Tabel 5 Skenario Uji dari 20 skenario menjadi 28 skenario (tambah 8 skenario matriks target vs status, form read-only, dan trigger admin).<br>• Benahi penomoran Tabel 3 dan Tabel 4 yang duplikat. | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx` | 45 menit |
| **Fase 5** | **Penyusunan Naskah Bab IV (Perancangan & Implementasi Simpul)**<br>• Tulis analisis arsitektur, diagram alur pendaftaran berjenjang, ERD aktual, dan rancangan UI Figma.<br>• Dokumentasikan implementasi kode Next.js App Router, Supabase RLS, dan RPC atomik. | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx` | 60 menit |
| **Fase 6** | **Penyusunan Naskah Bab V & VI (Hasil Pengujian & Kesimpulan)**<br>• Masukkan tabel hasil pengujian 28 skenario black box (termasuk hasil 100% lulus matriks kesesuaian target peserta).<br>• Susun kesimpulan keberhasilan implementasi Simpul dan saran pengembangan. | `LAPORAN_PRAKTEK_LAPANG_ALFAN_V2.docx` | 45 menit |

---

## F. HAL YANG MEMERLUKAN KEPUTUSAN ANDA

Sebelum tahapan edit dokumen dijalankan, mohon konfirmasi untuk hal-hal berikut:

1. **Lingkup Penamaan "Simpul":**
   - *Opsi A (Direkomendasikan):* Nama **Simpul** digunakan secara menyeluruh di dokumen laporan akademik (Judul, Abstrak, Bab I-VI), sedangkan nama folder/repositori (`SIM_Magang`) dan nama basis data tetap dipertahankan agar tidak merusak path Git dan konfigurasi Supabase lokal/Vercel.
   - *Opsi B:* Seluruh package, repositori, dan nama folder ikut diubah menjadi Simpul (berisiko pada environment build Vercel dan history git).

2. **Format Penomoran Tabel Dokumen:**
   - *Opsi A (Sesuai Template Unpak):* Penomoran tabel berbasis bab (contoh: Tabel 2.1, Tabel 2.2, Tabel 3.1, Tabel 3.2, Tabel 3.3, Tabel 3.4). Ini otomatis mengatasi seluruh tabrakan nomor tabel.
   - *Opsi B:* Penomoran berurutan kontinu dari Bab I sampai Bab VI (Tabel 1 sampai Tabel 10).

3. **Status 4 Jurnal yang Tidak Terpakai:**
   - Apakah 4 file jurnal yang diklasifikasikan *TIDAK TERPAKAI* (Waterfal lama, bimbingan belajar, dan kriptografi multilayer) diizinkan dipindahkan ke folder arsip terpisah (`jurnall/_arsip_tidak_terpakai/`), atau dibiarkan tetap di lokasinya saat ini?

---

*Laporan audit ini telah dibuat secara objektif berdasarkan verifikasi kode aktual, struktur migrasi Supabase, dan pembacaan teks dokumen Word.*  
*Mode saat ini: Menunggu instruksi dan persetujuan Pengguna.*
