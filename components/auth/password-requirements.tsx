'use client'

import React from 'react'
import { checkPasswordCriteria } from '@/lib/helpers/password.helper'

interface PasswordRequirementsProps {
  password: string
  /**
   * Jika true, checklist hanya muncul saat user mulai mengetik password.
   * Default: true
   */
  showOnlyOnInput?: boolean
}

export function PasswordRequirements({ password, showOnlyOnInput = true }: PasswordRequirementsProps) {
  // Jika showOnlyOnInput aktif dan belum ada karakter yang diketik, tidak render
  if (showOnlyOnInput && (!password || password.length === 0)) {
    return null
  }

  const criteria = checkPasswordCriteria(password)

  const items = [
    { label: 'Minimal 8 karakter', met: criteria.hasMinLength },
    { label: 'Huruf kapital (A-Z)', met: criteria.hasUpperCase },
    { label: 'Angka (0-9)', met: criteria.hasNumber },
    { label: 'Simbol khusus (@, #, $, !, %, dll)', met: criteria.hasSymbol },
    { label: 'Tidak boleh mengandung spasi', met: criteria.hasNoSpace },
  ]

  return (
    <div
      style={{
        marginTop: '0.5rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '8px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        fontSize: '0.75rem',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: '0.375rem',
          color: '#334155',
        }}
      >
        Syarat Keamanan Password:
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.375rem 0.75rem',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: item.met ? '#0F172A' : '#94A3B8',
              fontWeight: item.met ? 600 : 400,
              transition: 'color 0.2s ease, font-weight 0.2s ease',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                fontSize: '0.65rem',
                lineHeight: 1,
                border: item.met ? '1.5px solid #0F172A' : '1.5px solid #CBD5E1',
                backgroundColor: item.met ? '#0F172A' : 'transparent',
                color: item.met ? '#FFFFFF' : '#94A3B8',
                fontWeight: 700,
              }}
            >
              {item.met ? '✓' : '○'}
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
