import { NextResponse } from 'next/server'
import type { AuthResponse } from '@/types/auth.types'

export function successResponse<T>(data?: T, status = 200) {
  const body: AuthResponse<T> = {
    success: true,
    data,
  }
  return NextResponse.json(body, { status })
}

export function errorResponse(message: string, code = 'ERROR', status = 400) {
  const body: AuthResponse<never> = {
    success: false,
    error: {
      code,
      message,
    },
  }
  return NextResponse.json(body, { status })
}
