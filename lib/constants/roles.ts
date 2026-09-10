import type { AppRole } from '@/types/auth.types'

export const ROLES = {
  PENGGUNA: 'pengguna' as AppRole,
  ADMINISTRATOR: 'administrator' as AppRole,
} as const

export const ROLE_LABELS: Record<AppRole, string> = {
  pengguna: 'Pengguna',
  administrator: 'Administrator',
} as const
