'use client'

import React, { useState, useRef, useEffect } from 'react'
import { THEME_COLORS } from '@/lib/constants/theme'

export interface ExportMenuProps {
  onExportPDF?: () => Promise<void> | void
  onExportWord?: () => Promise<void> | void
  onExportExcel?: () => Promise<void> | void
  disabled?: boolean
  loading?: boolean
  buttonText?: string
}

export function ExportMenu({
  onExportPDF,
  onExportWord,
  onExportExcel,
  disabled = false,
  loading = false,
  buttonText = 'Export',
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = async (action?: () => Promise<void> | void) => {
    if (!action || disabled || loading) return
    setIsOpen(false)
    await action()
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.55rem 1rem',
          backgroundColor: THEME_COLORS.blue.primary,
          color: THEME_COLORS.neutral.white,
          borderRadius: '8px',
          border: 'none',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 1px 3px rgba(26, 111, 196, 0.3)',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => {
          if (!disabled && !loading) e.currentTarget.style.backgroundColor = THEME_COLORS.blue.hover
        }}
        onMouseOut={(e) => {
          if (!disabled && !loading) e.currentTarget.style.backgroundColor = THEME_COLORS.blue.primary
        }}
      >
        {loading ? (
          <svg
            style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg
            style={{ width: '14px', height: '14px' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
        <span>{loading ? 'Mengekspor...' : buttonText}</span>
        <svg
          style={{
            width: '12px',
            height: '12px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu 3 Format */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.375rem',
            width: '210px',
            backgroundColor: THEME_COLORS.neutral.white,
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${THEME_COLORS.neutral.border}`,
            zIndex: 50,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: THEME_COLORS.neutral.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `1px solid ${THEME_COLORS.neutral.borderLight}`,
              backgroundColor: THEME_COLORS.neutral.bg,
            }}
          >
            Pilih Format Berkas
          </div>

          <div style={{ padding: '0.25rem' }}>
            {/* 1. PDF */}
            {onExportPDF && (
              <button
                type="button"
                onClick={() => handleSelect(onExportPDF)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: THEME_COLORS.neutral.textMain,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = THEME_COLORS.red.light)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: THEME_COLORS.red.light,
                    color: THEME_COLORS.red.primary,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  PDF
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>PDF Document</div>
                  <div style={{ fontSize: '0.6875rem', color: THEME_COLORS.neutral.textMuted }}>.pdf (Landscape)</div>
                </div>
              </button>
            )}

            {/* 2. Word */}
            {onExportWord && (
              <button
                type="button"
                onClick={() => handleSelect(onExportWord)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: THEME_COLORS.neutral.textMain,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = THEME_COLORS.blue.light)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: THEME_COLORS.blue.light,
                    color: THEME_COLORS.blue.primary,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  DOC
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Word Document</div>
                  <div style={{ fontSize: '0.6875rem', color: THEME_COLORS.neutral.textMuted }}>.docx (Editable)</div>
                </div>
              </button>
            )}

            {/* 3. Excel */}
            {onExportExcel && (
              <button
                type="button"
                onClick={() => handleSelect(onExportExcel)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: THEME_COLORS.neutral.textMain,
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = THEME_COLORS.green.light)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: THEME_COLORS.green.light,
                    color: THEME_COLORS.green.primary,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  XLS
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>Excel Spreadsheet</div>
                  <div style={{ fontSize: '0.6875rem', color: THEME_COLORS.neutral.textMuted }}>.xlsx (Worksheet)</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
