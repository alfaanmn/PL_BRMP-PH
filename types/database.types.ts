export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      backup_pengajuans: {
        Row: {
          alamat: string | null
          alasan_penolakan: string | null
          anggota: Json | null
          asal_instansi: string | null
          bidang_id: number | null
          catatan_revisi: string | null
          created_at: string | null
          dokumen_tambahan_url: string | null
          durasi_bulan: number | null
          foto_url: string | null
          id: number | null
          idempotency_key: string | null
          jenis_kelamin:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang: Database["public"]["Enums"]["jenjang_type"] | null
          jumlah_anggota: number | null
          jurusan: string | null
          laporan_akhir_url: string | null
          laporan_catatan: string | null
          laporan_reviewed_at: string | null
          laporan_status:
            | Database["public"]["Enums"]["laporan_status_type"]
            | null
          laporan_submitted_at: string | null
          nama_lengkap: string | null
          nilai_akhir: number | null
          nilai_detail: Json | null
          nilai_submitted_at: string | null
          nim_nis: string | null
          no_hp: string | null
          nomor_surat: string | null
          pembimbing_id: number | null
          proposal_url: string | null
          public_id: string | null
          sertifikat_issued_at: string | null
          sertifikat_nomor: string | null
          sertifikat_url: string | null
          skm_reminder_sent_at: string | null
          skm_submitted_at: string | null
          status: Database["public"]["Enums"]["pengajuan_status"] | null
          surat_balasan_url: string | null
          surat_pengantar_url: string | null
          tanggal_mulai: string | null
          tanggal_selesai: string | null
          tanggal_surat: string | null
          token_revisi: string | null
          topik_magang: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          alamat?: string | null
          alasan_penolakan?: string | null
          anggota?: Json | null
          asal_instansi?: string | null
          bidang_id?: number | null
          catatan_revisi?: string | null
          created_at?: string | null
          dokumen_tambahan_url?: string | null
          durasi_bulan?: number | null
          foto_url?: string | null
          id?: number | null
          idempotency_key?: string | null
          jenis_kelamin?:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang?: Database["public"]["Enums"]["jenjang_type"] | null
          jumlah_anggota?: number | null
          jurusan?: string | null
          laporan_akhir_url?: string | null
          laporan_catatan?: string | null
          laporan_reviewed_at?: string | null
          laporan_status?:
            | Database["public"]["Enums"]["laporan_status_type"]
            | null
          laporan_submitted_at?: string | null
          nama_lengkap?: string | null
          nilai_akhir?: number | null
          nilai_detail?: Json | null
          nilai_submitted_at?: string | null
          nim_nis?: string | null
          no_hp?: string | null
          nomor_surat?: string | null
          pembimbing_id?: number | null
          proposal_url?: string | null
          public_id?: string | null
          sertifikat_issued_at?: string | null
          sertifikat_nomor?: string | null
          sertifikat_url?: string | null
          skm_reminder_sent_at?: string | null
          skm_submitted_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"] | null
          surat_balasan_url?: string | null
          surat_pengantar_url?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tanggal_surat?: string | null
          token_revisi?: string | null
          topik_magang?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          alamat?: string | null
          alasan_penolakan?: string | null
          anggota?: Json | null
          asal_instansi?: string | null
          bidang_id?: number | null
          catatan_revisi?: string | null
          created_at?: string | null
          dokumen_tambahan_url?: string | null
          durasi_bulan?: number | null
          foto_url?: string | null
          id?: number | null
          idempotency_key?: string | null
          jenis_kelamin?:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang?: Database["public"]["Enums"]["jenjang_type"] | null
          jumlah_anggota?: number | null
          jurusan?: string | null
          laporan_akhir_url?: string | null
          laporan_catatan?: string | null
          laporan_reviewed_at?: string | null
          laporan_status?:
            | Database["public"]["Enums"]["laporan_status_type"]
            | null
          laporan_submitted_at?: string | null
          nama_lengkap?: string | null
          nilai_akhir?: number | null
          nilai_detail?: Json | null
          nilai_submitted_at?: string | null
          nim_nis?: string | null
          no_hp?: string | null
          nomor_surat?: string | null
          pembimbing_id?: number | null
          proposal_url?: string | null
          public_id?: string | null
          sertifikat_issued_at?: string | null
          sertifikat_nomor?: string | null
          sertifikat_url?: string | null
          skm_reminder_sent_at?: string | null
          skm_submitted_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"] | null
          surat_balasan_url?: string | null
          surat_pengantar_url?: string | null
          tanggal_mulai?: string | null
          tanggal_selesai?: string | null
          tanggal_surat?: string | null
          token_revisi?: string | null
          topik_magang?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      backup_profiles: {
        Row: {
          asal_instansi: string | null
          avatar: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          jenis_kelamin: string | null
          jurusan: string | null
          name: string | null
          no_hp: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
        }
        Insert: {
          asal_instansi?: string | null
          avatar?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          jenis_kelamin?: string | null
          jurusan?: string | null
          name?: string | null
          no_hp?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Update: {
          asal_instansi?: string | null
          avatar?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          jenis_kelamin?: string | null
          jurusan?: string | null
          name?: string | null
          no_hp?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bidang_pembimbing: {
        Row: {
          bidang_id: number
          created_at: string
          id: number
          is_active: boolean
          pembimbing_id: number
          updated_at: string
        }
        Insert: {
          bidang_id: number
          created_at?: string
          id?: never
          is_active?: boolean
          pembimbing_id: number
          updated_at?: string
        }
        Update: {
          bidang_id?: number
          created_at?: string
          id?: never
          is_active?: boolean
          pembimbing_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bidang_pembimbing_bidang_id_fkey"
            columns: ["bidang_id"]
            isOneToOne: false
            referencedRelation: "bidangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bidang_pembimbing_pembimbing_id_fkey"
            columns: ["pembimbing_id"]
            isOneToOne: false
            referencedRelation: "pembimbings"
            referencedColumns: ["id"]
          },
        ]
      }
      bidangs: {
        Row: {
          banner_url: string | null
          created_at: string
          deskripsi: string | null
          id: number
          is_active: boolean
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kuota: number
          nama: string
          persyaratan: Json | null
          target_peserta: string
          terisi: number
          tugas: Json | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          deskripsi?: string | null
          id?: never
          is_active?: boolean
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kuota?: number
          nama: string
          persyaratan?: Json | null
          target_peserta?: string
          terisi?: number
          tugas?: Json | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          deskripsi?: string | null
          id?: never
          is_active?: boolean
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kuota?: number
          nama?: string
          persyaratan?: Json | null
          target_peserta?: string
          terisi?: number
          tugas?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      notifikasi: {
        Row: {
          created_at: string
          id: number
          is_read: boolean
          judul: string
          link: string | null
          pesan: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_read?: boolean
          judul: string
          link?: string | null
          pesan: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          is_read?: boolean
          judul?: string
          link?: string | null
          pesan?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifikasi_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pembimbings: {
        Row: {
          created_at: string
          email: string | null
          id: number
          is_active: boolean
          jabatan: string | null
          kuota_default: number
          nama: string
          nip: string | null
          no_hp: string | null
          spesialisasi: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: never
          is_active?: boolean
          jabatan?: string | null
          kuota_default?: number
          nama: string
          nip?: string | null
          no_hp?: string | null
          spesialisasi?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: never
          is_active?: boolean
          jabatan?: string | null
          kuota_default?: number
          nama?: string
          nip?: string | null
          no_hp?: string | null
          spesialisasi?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      pengajuan_anggotas: {
        Row: {
          alasan_penolakan: string | null
          created_at: string
          diputuskan_oleh: string | null
          diputuskan_pada: string | null
          id: number
          is_ketua: boolean
          jurusan: string | null
          nama: string
          nim_nis: string
          no_hp: string | null
          pengajuan_id: number
          status: string
          updated_at: string
          urutan_prioritas: number | null
        }
        Insert: {
          alasan_penolakan?: string | null
          created_at?: string
          diputuskan_oleh?: string | null
          diputuskan_pada?: string | null
          id?: number
          is_ketua?: boolean
          jurusan?: string | null
          nama: string
          nim_nis: string
          no_hp?: string | null
          pengajuan_id: number
          status?: string
          updated_at?: string
          urutan_prioritas?: number | null
        }
        Update: {
          alasan_penolakan?: string | null
          created_at?: string
          diputuskan_oleh?: string | null
          diputuskan_pada?: string | null
          id?: number
          is_ketua?: boolean
          jurusan?: string | null
          nama?: string
          nim_nis?: string
          no_hp?: string | null
          pengajuan_id?: number
          status?: string
          updated_at?: string
          urutan_prioritas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_anggotas_diputuskan_oleh_fkey"
            columns: ["diputuskan_oleh"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_anggotas_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuans"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuan_status_logs: {
        Row: {
          catatan: string | null
          created_at: string
          created_by: string | null
          id: number
          pengajuan_id: number
          status: Database["public"]["Enums"]["pengajuan_status"]
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: never
          pengajuan_id: number
          status: Database["public"]["Enums"]["pengajuan_status"]
        }
        Update: {
          catatan?: string | null
          created_at?: string
          created_by?: string | null
          id?: never
          pengajuan_id?: number
          status?: Database["public"]["Enums"]["pengajuan_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_status_logs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_status_logs_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuans"
            referencedColumns: ["id"]
          },
        ]
      }
      pengajuans: {
        Row: {
          alamat: string | null
          alasan_penolakan: string | null
          anggota: Json | null
          asal_instansi: string
          bidang_id: number
          catatan_revisi: string | null
          created_at: string
          dokumen_tambahan_url: string | null
          durasi_bulan: number
          foto_url: string | null
          id: number
          idempotency_key: string | null
          jenis_kelamin:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          jumlah_anggota: number
          jumlah_diajukan: number
          jurusan: string
          konfirmasi_kuota_sebagian: boolean
          laporan_akhir_url: string | null
          laporan_catatan: string | null
          laporan_reviewed_at: string | null
          laporan_status: Database["public"]["Enums"]["laporan_status_type"]
          laporan_submitted_at: string | null
          nama_lengkap: string | null
          nilai_akhir: number | null
          nilai_detail: Json | null
          nilai_submitted_at: string | null
          nim_nis: string | null
          no_hp: string | null
          nomor_surat: string | null
          pembimbing_id: number | null
          proposal_url: string | null
          public_id: string
          sertifikat_issued_at: string | null
          sertifikat_nomor: string | null
          sertifikat_url: string | null
          skm_reminder_sent_at: string | null
          skm_submitted_at: string | null
          status: Database["public"]["Enums"]["pengajuan_status"]
          surat_balasan_url: string | null
          surat_pengantar_url: string
          tanggal_mulai: string
          tanggal_selesai: string
          tanggal_surat: string | null
          token_revisi: string | null
          topik_magang: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alamat?: string | null
          alasan_penolakan?: string | null
          anggota?: Json | null
          asal_instansi: string
          bidang_id: number
          catatan_revisi?: string | null
          created_at?: string
          dokumen_tambahan_url?: string | null
          durasi_bulan: number
          foto_url?: string | null
          id?: never
          idempotency_key?: string | null
          jenis_kelamin?:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          jumlah_anggota?: number
          jumlah_diajukan: number
          jurusan: string
          konfirmasi_kuota_sebagian?: boolean
          laporan_akhir_url?: string | null
          laporan_catatan?: string | null
          laporan_reviewed_at?: string | null
          laporan_status?: Database["public"]["Enums"]["laporan_status_type"]
          laporan_submitted_at?: string | null
          nama_lengkap?: string | null
          nilai_akhir?: number | null
          nilai_detail?: Json | null
          nilai_submitted_at?: string | null
          nim_nis?: string | null
          no_hp?: string | null
          nomor_surat?: string | null
          pembimbing_id?: number | null
          proposal_url?: string | null
          public_id?: string
          sertifikat_issued_at?: string | null
          sertifikat_nomor?: string | null
          sertifikat_url?: string | null
          skm_reminder_sent_at?: string | null
          skm_submitted_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"]
          surat_balasan_url?: string | null
          surat_pengantar_url: string
          tanggal_mulai: string
          tanggal_selesai: string
          tanggal_surat?: string | null
          token_revisi?: string | null
          topik_magang?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alamat?: string | null
          alasan_penolakan?: string | null
          anggota?: Json | null
          asal_instansi?: string
          bidang_id?: number
          catatan_revisi?: string | null
          created_at?: string
          dokumen_tambahan_url?: string | null
          durasi_bulan?: number
          foto_url?: string | null
          id?: never
          idempotency_key?: string | null
          jenis_kelamin?:
            | Database["public"]["Enums"]["jenis_kelamin_type"]
            | null
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          jumlah_anggota?: number
          jumlah_diajukan?: number
          jurusan?: string
          konfirmasi_kuota_sebagian?: boolean
          laporan_akhir_url?: string | null
          laporan_catatan?: string | null
          laporan_reviewed_at?: string | null
          laporan_status?: Database["public"]["Enums"]["laporan_status_type"]
          laporan_submitted_at?: string | null
          nama_lengkap?: string | null
          nilai_akhir?: number | null
          nilai_detail?: Json | null
          nilai_submitted_at?: string | null
          nim_nis?: string | null
          no_hp?: string | null
          nomor_surat?: string | null
          pembimbing_id?: number | null
          proposal_url?: string | null
          public_id?: string
          sertifikat_issued_at?: string | null
          sertifikat_nomor?: string | null
          sertifikat_url?: string | null
          skm_reminder_sent_at?: string | null
          skm_submitted_at?: string | null
          status?: Database["public"]["Enums"]["pengajuan_status"]
          surat_balasan_url?: string | null
          surat_pengantar_url?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          tanggal_surat?: string | null
          token_revisi?: string | null
          topik_magang?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuans_bidang_id_fkey"
            columns: ["bidang_id"]
            isOneToOne: false
            referencedRelation: "bidangs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuans_pembimbing_id_fkey"
            columns: ["pembimbing_id"]
            isOneToOne: false
            referencedRelation: "pembimbings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          asal_instansi: string | null
          avatar: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          jenis_kelamin: string | null
          jurusan: string | null
          name: string
          no_hp: string | null
          role: Database["public"]["Enums"]["app_role"]
          status_peserta: string | null
          updated_at: string
        }
        Insert: {
          asal_instansi?: string | null
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          jenis_kelamin?: string | null
          jurusan?: string | null
          name: string
          no_hp?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status_peserta?: string | null
          updated_at?: string
        }
        Update: {
          asal_instansi?: string | null
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          jenis_kelamin?: string | null
          jurusan?: string | null
          name?: string
          no_hp?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status_peserta?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sertifikats: {
        Row: {
          anggota_id: number | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: number
          is_ketua: boolean
          mime_type: string
          notified_at: string | null
          pengajuan_id: number
          peserta_nama: string
          peserta_nim: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          anggota_id?: number | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: number
          is_ketua?: boolean
          mime_type: string
          notified_at?: string | null
          pengajuan_id: number
          peserta_nama: string
          peserta_nim?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          anggota_id?: number | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: number
          is_ketua?: boolean
          mime_type?: string
          notified_at?: string | null
          pengajuan_id?: number
          peserta_nama?: string
          peserta_nim?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sertifikats_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuans"
            referencedColumns: ["id"]
          },
        ]
      }
      sertifikats_backup_20261025: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: number | null
          mime_type: string | null
          notified_at: string | null
          pengajuan_id: number | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: number | null
          mime_type?: string | null
          notified_at?: string | null
          pengajuan_id?: number | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: number | null
          mime_type?: string | null
          notified_at?: string | null
          pengajuan_id?: number | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      skm_jawaban: {
        Row: {
          anggota_id: number | null
          created_at: string
          id: number
          is_anonim: boolean
          is_ketua: boolean
          is_legacy: boolean
          jawaban: string
          pengajuan_id: number
          peserta_nama: string
          peserta_nim: string
          skm_pertanyaan_id: number
        }
        Insert: {
          anggota_id?: number | null
          created_at?: string
          id?: never
          is_anonim?: boolean
          is_ketua?: boolean
          is_legacy?: boolean
          jawaban: string
          pengajuan_id: number
          peserta_nama: string
          peserta_nim?: string
          skm_pertanyaan_id: number
        }
        Update: {
          anggota_id?: number | null
          created_at?: string
          id?: never
          is_anonim?: boolean
          is_ketua?: boolean
          is_legacy?: boolean
          jawaban?: string
          pengajuan_id?: number
          peserta_nama?: string
          peserta_nim?: string
          skm_pertanyaan_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "skm_jawaban_pengajuan_id_fkey"
            columns: ["pengajuan_id"]
            isOneToOne: false
            referencedRelation: "pengajuans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skm_jawaban_skm_pertanyaan_id_fkey"
            columns: ["skm_pertanyaan_id"]
            isOneToOne: false
            referencedRelation: "skm_pertanyaan"
            referencedColumns: ["id"]
          },
        ]
      }
      skm_jawaban_backup_20261025: {
        Row: {
          created_at: string | null
          id: number | null
          is_anonim: boolean | null
          jawaban: string | null
          pengajuan_id: number | null
          skm_pertanyaan_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number | null
          is_anonim?: boolean | null
          jawaban?: string | null
          pengajuan_id?: number | null
          skm_pertanyaan_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number | null
          is_anonim?: boolean | null
          jawaban?: string | null
          pengajuan_id?: number | null
          skm_pertanyaan_id?: number | null
        }
        Relationships: []
      }
      skm_pertanyaan: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          opsi: Json | null
          pertanyaan: string
          tipe: string
          unsur: string
          urutan: number
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          opsi?: Json | null
          pertanyaan: string
          tipe?: string
          unsur: string
          urutan?: number
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          opsi?: Json | null
          pertanyaan?: string
          tipe?: string
          unsur?: string
          urutan?: number
        }
        Relationships: []
      }
      user_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_name: string | null
          created_at: string
          id: number
          new_value: Json | null
          old_value: Json | null
          target_email: string | null
          target_name: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          target_email?: string | null
          target_name?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          id?: never
          new_value?: Json | null
          old_value?: Json | null
          target_email?: string | null
          target_name?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_user_account: {
        Args: {
          p_new_role?: string | null
          p_new_status_peserta?: string | null
          p_target_user_id: string
        }
        Returns: Json
      }
      admin_verifikasi_anggota_atomic: {
        Args: {
          p_alasan_penolakan_global?: string
          p_keputusan_anggota: Json
          p_pembimbing_id: number
          p_pengajuan_id: number
          p_status_target: string
          p_surat_balasan_url?: string
        }
        Returns: Json
      }
      batalkan_pengajuan:
        | { Args: { p_public_id: string }; Returns: undefined }
        | { Args: { p_alasan?: string; p_public_id: string }; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_pengajuan_active: {
        Args: { p_status: Database["public"]["Enums"]["pengajuan_status"] }
        Returns: boolean
      }
      is_pengajuan_slot_holder: {
        Args: { p_status: Database["public"]["Enums"]["pengajuan_status"] }
        Returns: boolean
      }
      submit_pengajuan_atomic: {
        Args: {
          p_alamat_pemohon?: string
          p_anggota_tambahan?: Json
          p_asal_instansi: string
          p_bidang_id: number
          p_dokumen_tambahan_url?: string
          p_durasi_bulan: number
          p_idempotency_key?: string
          p_jenis_kelamin_pemohon?: string
          p_jenjang: string
          p_jumlah_anggota_dipilih?: number
          p_jurusan: string
          p_konfirmasi_kuota_sebagian?: boolean
          p_nama_pemohon?: string
          p_nim_pemohon?: string
          p_no_hp_pemohon?: string
          p_nomor_surat: string
          p_proposal_url?: string
          p_surat_pengantar_url: string
          p_tanggal_mulai: string
          p_tanggal_selesai: string
          p_tanggal_surat: string
          p_topik_magang: string
        }
        Returns: Json
      }
      submit_skm: {
        Args: { p_jawaban: Json; p_public_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "pengguna" | "administrator"
      jenis_kelamin_type: "Laki-laki" | "Perempuan"
      jenjang_type: "Siswa" | "Mahasiswa"
      laporan_status_type:
        | "Belum Ada"
        | "Menunggu Review"
        | "Diterima"
        | "Ditolak"
      pengajuan_status:
        | "Menunggu Verifikasi"
        | "Disetujui"
        | "Ditolak"
        | "Terjadwal"
        | "Sedang Magang"
        | "Selesai"
        | "Dibatalkan"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["pengguna", "administrator"],
      jenis_kelamin_type: ["Laki-laki", "Perempuan"],
      jenjang_type: ["Siswa", "Mahasiswa"],
      laporan_status_type: [
        "Belum Ada",
        "Menunggu Review",
        "Diterima",
        "Ditolak",
      ],
      pengajuan_status: [
        "Menunggu Verifikasi",
        "Disetujui",
        "Ditolak",
        "Terjadwal",
        "Sedang Magang",
        "Selesai",
        "Dibatalkan",
      ],
    },
  },
} as const