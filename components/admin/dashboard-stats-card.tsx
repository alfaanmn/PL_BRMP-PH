import React from 'react'

export interface StatsCardProps {
  title: string
  value: number | string
  iconType?: 'users' | 'file-text' | 'star'
}

export function DashboardStatsCard({
  title,
  value,
  iconType = 'users',
}: StatsCardProps) {
  const renderIcon = () => {
    switch (iconType) {
      case 'users':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      case 'file-text':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        )
      case 'star':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #f1f5f9',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Icon 32x32px, radius 8px, bg-success (#dcfce7), text-success (#15803d) */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: '#dcfce7',
          color: '#15803d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {renderIcon()}
      </div>

      {/* Label kecil 11px di atas, Angka besar 22px font-weight 500 di bawah */}
      <div>
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            fontWeight: 500,
            textTransform: 'lowercase',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#111827',
            marginTop: '0.25rem',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}
