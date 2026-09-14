export type AppRole = 'pengguna' | 'administrator'

export interface Profile {
  id: string
  name: string
  email: string
  role: AppRole
  no_hp: string | null
  asal_instansi?: string | null
  jurusan?: string | null
  avatar: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface AuthUser {
  id: string
  email?: string
  profile?: Profile | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  confirmPassword?: string
  no_hp?: string
  asal_instansi?: string
  jurusan?: string
}

export interface ForgotPasswordCredentials {
  email: string
}

export interface ResetPasswordCredentials {
  password: string
  confirmPassword: string
}

export interface VerifyOtpCredentials {
  email: string
  token: string
  type?: 'signup' | 'email'
}

export interface ResendOtpCredentials {
  email: string
  type?: 'signup'
}

export interface AuthResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

