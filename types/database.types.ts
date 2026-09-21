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
          created_at: string | null
        }
        Insert: {
          id?: number
          pengajuan_id?: number | null
          skm_pertanyaan_id: number
          jawaban: string
          is_anonim?: boolean
          created_at?: string | null
        }
        Update: {
          id?: number
          pengajuan_id?: number | null
          skm_pertanyaan_id?: number
          jawaban?: string
          is_anonim?: boolean
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
