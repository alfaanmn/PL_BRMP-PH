'use client'

import React from 'react'
import { SearchIcon, RefreshIcon } from '@/components/ui/admin-icons'

interface UserFilterBarProps {
  search: string
  statusFilter: 'all' | 'active' | 'inactive'
  roleFilter: 'all' | 'pengguna' | 'administrator'
  totalCount: number
  activeCount: number
  inactiveCount: number
  loading: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void
  onRoleChange: (role: 'all' | 'pengguna' | 'administrator') => void
  onRefresh: () => void
}

export function UserFilterBar({
  search,
  statusFilter,
  roleFilter,
  totalCount,
  activeCount,
  inactiveCount,
  loading,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onRefresh,
}: UserFilterBarProps) {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        padding: '0.875rem 1rem',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px', minWidth: '220px' }}>
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <SearchIcon width={15} height={15} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama, email, instansi, jurusan..."
          style={{
            width: '100%',
            padding: '0.45rem 0.75rem 0.45rem 2rem',
            fontSize: '12px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filter Controls (Status, Role, Refresh) */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        {/* Role Filter Dropdown */}
        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value as 'all' | 'pengguna' | 'administrator')}
          style={{
            padding: '0.35rem 0.65rem',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#334155',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="all">Semua Role</option>
          <option value="pengguna">Role: Pengguna (Pemohon)</option>
          <option value="administrator">Role: Administrator</option>
        </select>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <button
            type="button"
            onClick={() => onStatusChange('all')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'all' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'all' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Semua ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('active')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'active' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'active' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('inactive')}
            style={{
              padding: '0.35rem 0.7rem',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: statusFilter === 'inactive' ? '#15803d' : '#f1f5f9',
              color: statusFilter === 'inactive' ? '#ffffff' : '#475569',
              transition: 'all 0.15s ease',
            }}
          >
            Nonaktif ({inactiveCount})
          </button>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          title="Muat ulang data"
          style={{
            padding: '0.4rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#64748b',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshIcon width={14} height={14} />
        </button>
      </div>
    </div>
  )
}
