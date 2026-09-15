import { createClient } from '@/lib/supabase/client'
import type {
  LoginCredentials,
  RegisterCredentials,
  VerifyOtpCredentials,
  ResendOtpCredentials,
  Profile,
  AuthResponse,
} from '@/types/auth.types'

export const authService = {
  /**
   * Login dengan Email dan Password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse<{ profile: Profile; role: string }>> {
    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    })

    if (authError) {
      let message = 'Email atau password salah'
      if (authError.message.includes('Email not confirmed')) {
        message = 'Email belum diverifikasi. Silakan periksa inbox email Anda.'
      } else if (authError.message.includes('Invalid login credentials')) {
        message = 'Email atau password tidak sesuai'
      } else if (authError.message.includes('rate limit')) {
        message = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat.'
      }
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message,
        },
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Gagal mendapatkan data pengguna.',
        },
      }
    }

    // Ambil profile dari public.profiles berdasarkan id = auth.uid()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil pengguna tidak ditemukan.',
        },
      }
    }

    // Validasi is_active
    if (!profile.is_active) {
      await supabase.auth.signOut()
      return {
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Akun Anda dinonaktifkan. Silakan hubungi administrator.',
        },
      }
    }

    return {
      success: true,
      data: {
        profile: profile as Profile,
        role: profile.role,
      },
    }
  },

  /**
   * Register Pengguna Baru (Trigger DB otomatis insert ke public.profiles dengan role 'pengguna')
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse<{ user: unknown; requiresEmailConfirmation: boolean }>> {
    const supabase = createClient()

    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
      options: {
        data: {
          name: credentials.name.trim(),
          no_hp: credentials.no_hp?.trim() || null,
          asal_instansi: credentials.asal_instansi?.trim() || null,
          jurusan: credentials.jurusan?.trim() || null,
          jenis_kelamin: credentials.jenis_kelamin?.trim() || null,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      let message = error.message || 'Gagal melakukan registrasi'
      const lowerMsg = error.message?.toLowerCase() || ''
      const errorCode = (error as { code?: string }).code || ''

      if (lowerMsg.includes('already registered') || lowerMsg.includes('user already registered') || errorCode === 'user_already_exists') {
        message = 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.'
      } else if (lowerMsg.includes('rate limit') || errorCode === 'over_email_send_rate_limit') {
        message = 'Batas pengiriman email verifikasi telah tercapai (Rate limit). Silakan tunggu beberapa saat sebelum mencoba lagi.'
      } else if ((lowerMsg.includes('invalid') && lowerMsg.includes('email')) || errorCode === 'email_address_invalid') {
        message = 'Alamat email tidak valid atau domain email ditolak oleh server autentikasi.'
      } else if (lowerMsg.includes('password should be') || lowerMsg.includes('weak password') || errorCode === 'weak_password') {
        message = 'Password tidak memenuhi syarat (minimal 6 karakter).'
      } else if (lowerMsg.includes('signup is disabled') || errorCode === 'signup_disabled') {
        message = 'Pendaftaran akun baru saat ini dinonaktifkan di sistem.'
      }

      return {
        success: false,
        error: {
          code: errorCode || 'REGISTER_ERROR',
          message,
        },
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_CREATED',
          message: 'Pendaftaran tidak dapat diproses oleh server autentikasi. Silakan periksa kembali email dan password Anda.',
        },
      }
    }

    // Jika session null tetapi user terbuat, berarti konfirmasi email aktif di Supabase
    const requiresEmailConfirmation = !data.session && !!data.user

    return {
      success: true,
      data: {
        user: data.user,
        requiresEmailConfirmation,
      },
    }
  },

  /**
   * Verifikasi Kode OTP 6 Digit untuk Pendaftaran Pengguna Baru
   */
  async verifyOtp(credentials: VerifyOtpCredentials): Promise<AuthResponse<{ profile: Profile; role: string }>> {
    const supabase = createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      email: credentials.email.trim(),
      token: credentials.token.trim(),
      type: credentials.type || 'signup',
    })

    if (error) {
      let message = error.message || 'Kode OTP tidak valid atau telah kedaluwarsa'
      const lowerMsg = error.message?.toLowerCase() || ''
      if (lowerMsg.includes('expired') || lowerMsg.includes('token has expired')) {
        message = 'Kode OTP telah kedaluwarsa. Silakan kirim ulang kode OTP baru.'
      } else if (lowerMsg.includes('invalid') || lowerMsg.includes('token is invalid') || lowerMsg.includes('incorrect')) {
        message = 'Kode OTP salah. Silakan periksa kembali 6 digit kode Anda.'
      }

      return {
        success: false,
        error: {
          code: 'OTP_VERIFICATION_ERROR',
          message,
        },
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Gagal memverifikasi akun pengguna.',
        },
      }
    }

    // Ambil profile dari public.profiles (yang otomatis dibuat oleh trigger handle_new_user)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, no_hp, avatar, is_active, asal_instansi, jurusan, jenis_kelamin')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profil pengguna tidak ditemukan.',
        },
      }
    }

    return {
      success: true,
      data: {
        profile: profile as Profile,
        role: profile.role,
      },
    }
  },

  /**
   * Kirim Ulang (Resend) Kode OTP Pendaftaran
   */
  async resendOtp(credentials: ResendOtpCredentials): Promise<AuthResponse<null>> {
    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      type: credentials.type || 'signup',
      email: credentials.email.trim(),
    })

    if (error) {
      let message = error.message || 'Gagal mengirim ulang kode OTP'
      const lowerMsg = error.message?.toLowerCase() || ''
      if (lowerMsg.includes('rate limit') || lowerMsg.includes('too many')) {
        message = 'Batas pengiriman OTP tercapai (Rate limit). Silakan tunggu beberapa saat.'
      }

      return {
        success: false,
        error: {
          code: 'RESEND_OTP_ERROR',
          message,
        },
      }
    }

    return {
      success: true,
      data: null,
    }
  },

  /**
   * Login dengan Google OAuth
   */
  async loginWithGoogle(): Promise<AuthResponse<{ url?: string }>> {
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          code: 'OAUTH_ERROR',
          message: error.message || 'Gagal memulai login dengan Google.',
        },
      }
    }

    return {
      success: true,
      data: {
        url: data.url,
      },
    }
  },

  /**
   * Logout Pengguna
   */
  async logout(): Promise<AuthResponse<null>> {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: error.message,
        },
      }
    }

    return {
      success: true,
      data: null,
    }
  },

  /**
   * Kirim Email Reset Password
   */
  async forgotPassword(email: string): Promise<AuthResponse<null>> {
    const supabase = createClient()
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      return {
        success: false,
        error: {
          code: 'FORGOT_PASSWORD_ERROR',
          message: error.message || 'Gagal mengirim email reset password.',
        },
      }
    }

    return {
      success: true,
      data: null,
    }
  },

  /**
   * Update Password Baru
   */
  async resetPassword(password: string): Promise<AuthResponse<null>> {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        success: false,
        error: {
          code: 'RESET_PASSWORD_ERROR',
          message: error.message || 'Gagal memperbarui password.',
        },
      }
    }

    return {
      success: true,
      data: null,
    }
  },

  /**
   * Mengambil Profil Pengguna Saat Ini
   */
  async getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, role, no_hp, asal_instansi, jurusan, jenis_kelamin, avatar, is_active, created_at, updated_at')
      .eq('id', user.id)
      .single()

    return profile as Profile | null
  },

  /**
   * Memperbarui Data Profil Pengguna
   */
  async updateProfile(
    userId: string,
    data: {
      name: string
      no_hp?: string | null
      jenis_kelamin?: string | null
      asal_instansi?: string | null
      jurusan?: string | null
    }
  ): Promise<{ success: boolean; data?: Profile; error?: string }> {
    try {
      const supabase = createClient()

      const { data: updated, error } = await supabase
        .from('profiles')
        .update({
          name: data.name.trim(),
          no_hp: data.no_hp ? data.no_hp.trim() : null,
          jenis_kelamin: data.jenis_kelamin || null,
          asal_instansi: data.asal_instansi ? data.asal_instansi.trim() : null,
          jurusan: data.jurusan ? data.jurusan.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Gagal memperbarui profil.' }
      }

      return { success: true, data: updated as Profile }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.'
      return { success: false, error: msg }
    }
  },

  /**
   * Mengubah Password Pengguna yang sedang login
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: error.message || 'Gagal mengubah password.' }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat mengubah password.'
      return { success: false, error: msg }
    }
  },
}
