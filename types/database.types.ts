export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: 'pengguna' | 'administrator'
          no_hp: string | null
          asal_instansi: string | null
          jurusan: string | null
          jenis_kelamin: string | null
          avatar: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          role?: 'pengguna' | 'administrator'
          no_hp?: string | null
          asal_instansi?: string | null
          jurusan?: string | null
          jenis_kelamin?: string | null
          avatar?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'pengguna' | 'administrator'
          no_hp?: string | null
          asal_instansi?: string | null
          jurusan?: string | null
          jenis_kelamin?: string | null
          avatar?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      skm_pertanyaan: {
        Row: {
          id: number
          pertanyaan: string
          unsur: string | null
          urutan: number
          tipe: string | null
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          pertanyaan: string
          unsur?: string | null
          urutan: number
          tipe?: string | null
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          pertanyaan?: string
          unsur?: string | null
          urutan?: number
          tipe?: string | null
          is_active?: boolean
          created_at?: string | null
        }
      }
      skm_jawaban: {
        Row: {
          id: number
          pengajuan_id: number | null
          skm_pertanyaan_id: number
          jawaban: string
          is_anonim: boolean
          peserta_nama: string
          peserta_nim: string
          is_ketua: boolean
          anggota_id: number | null
          is_legacy: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          pengajuan_id?: number | null
          skm_pertanyaan_id: number
          jawaban: string
          is_anonim?: boolean
          peserta_nama?: string
          peserta_nim?: string
          is_ketua?: boolean
          anggota_id?: number | null
          is_legacy?: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          pengajuan_id?: number | null
          skm_pertanyaan_id?: number
          jawaban?: string
          is_anonim?: boolean
          peserta_nama?: string
          peserta_nim?: string
          is_ketua?: boolean
          anggota_id?: number | null
          is_legacy?: boolean
          created_at?: string | null
        }
      }
      sertifikats: {
        Row: {
          id: number
          pengajuan_id: number
          file_path: string
          file_name: string
          mime_type: string
          file_size: number
          peserta_nama: string
          peserta_nim: string
          is_ketua: boolean
          anggota_id: number | null
          uploaded_by: string | null
          uploaded_at: string
          notified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          pengajuan_id: number
          file_path: string
          file_name: string
          mime_type: string
          file_size: number
          peserta_nama: string
          peserta_nim?: string
          is_ketua?: boolean
          anggota_id?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
          notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          pengajuan_id?: number
          file_path?: string
          file_name?: string
          mime_type?: string
          file_size?: number
          peserta_nama?: string
          peserta_nim?: string
          is_ketua?: boolean
          anggota_id?: number | null
          uploaded_by?: string | null
          uploaded_at?: string
          notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifikasi: {
        Row: {
          id: number
          user_id: string
          judul: string
          pesan: string
          link: string | null
          is_read: boolean
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          judul: string
          pesan: string
          link?: string | null
          is_read?: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          judul?: string
          pesan?: string
          link?: string | null
          is_read?: boolean
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'pengguna' | 'administrator'
    }
  }
}
