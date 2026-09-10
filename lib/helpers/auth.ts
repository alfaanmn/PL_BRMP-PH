import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, AppRole } from '@/types/auth.types'

/**
 * Mengambil User dari Supabase Auth Session di Server Context
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * Mengambil Profil Pengguna dari database public.profiles di Server Context
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, no_hp, avatar, is_active, created_at, updated_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  return profile as Profile
}

/**
 * Guard server-side untuk memastikan user telah terautentikasi
 */
export async function requireAuth(redirectTo = '/login') {
  const user = await getCurrentUser()
  if (!user) {
    redirect(redirectTo)
  }
  return user
}

/**
 * Guard server-side untuk memastikan user memiliki role tertentu
 */
export async function requireRole(requiredRole: AppRole, unauthorizedRedirect?: string) {
  const profile = await getCurrentProfile()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== requiredRole) {
    if (unauthorizedRedirect) {
      redirect(unauthorizedRedirect)
    }
    if (profile.role === 'administrator') {
      redirect('/admin/dashboard')
    } else {
      redirect('/pengguna/dashboard')
    }
  }

  return profile
}
