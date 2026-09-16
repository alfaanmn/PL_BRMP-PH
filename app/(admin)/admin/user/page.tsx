'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  adminUserService,
  type AdminUserListItem,
  type AdminUserStats,
} from '@/lib/services/admin-user.service'
import { authService } from '@/lib/services/auth.service'
import { UserFilterBar } from '@/components/admin/user-filter-bar'
import { UserDetailModal } from '@/components/admin/user-detail-modal'
import {
  UsersIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  LayersIcon,
  SearchIcon,
  PowerIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  MailIcon,
  PhoneIcon,
  BriefcaseIcon,
} from '@/components/ui/admin-icons'

export default function AdminUserPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [stats, setStats] = useState<AdminUserStats>({
    totalUser: 0,
    activeUser: 0,
    inactiveUser: 0,
    totalPengguna: 0,
    totalAdmin: 0,
  })
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)

  // Filters & Pagination state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'pengguna' | 'administrator'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 10

  // Modal & Actions state
  const [selectedUserIdForDetail, setSelectedUserIdForDetail] = useState<string | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message })
    setTimeout(() => {
      setFeedbackToast(null)
    }, 4000)
  }

  // Ambil ID admin yang sedang login untuk proteksi self-deactivation
  useEffect(() => {
    async function loadCurrentAdmin() {
      try {
        const p = await authService.getCurrentProfile()
        if (p) setCurrentAdminId(p.id)
      } catch (err) {
        console.warn('Gagal memuat profil admin:', err)
      }
    }
    loadCurrentAdmin()
  }, [])

  // Load User Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await adminUserService.getUserStats()
      if (res.data) {
        setStats(res.data)
      }
    } catch (err) {
      console.warn('Gagal memuat statistik pengguna:', err)
    }
  }, [])

  // Load User List
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await adminUserService.getAdminUsers({
        search,
        status: statusFilter,
        role: roleFilter,
        page: currentPage,
        limit,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setUsers(res.data)
        setTotalCount(res.totalCount)
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kegagalan saat memuat data pengguna.')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, roleFilter, currentPage])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers()
    }, 250)
    return () => clearTimeout(timeout)
  }, [loadUsers])

  const handleToggleStatus = async (user: AdminUserListItem) => {
    if (user.id === currentAdminId && user.is_active) {
      showToast('error', 'Tindakan ditolak: Anda tidak dapat menonaktifkan akun Anda sendiri.')
      return
    }

    const targetStatus = !user.is_active
    const confirmMessage = targetStatus
      ? `Aktifkan kembali akun "${user.name}" (${user.email})? Pengguna akan dapat login kembali.`
      : `Nonaktifkan akun "${user.name}" (${user.email})? Pengguna tidak akan dapat mengakses sistem hingga diaktifkan kembali.`

    if (!window.confirm(confirmMessage)) return

    setActionLoadingId(user.id)
    try {
      const res = await adminUserService.toggleUserActiveStatus(
        user.id,
        currentAdminId || '',
        targetStatus
      )

      if (res.error) {
        showToast('error', res.error)
      } else {
        showToast(
          'success',
          `Akun "${user.name}" berhasil ${targetStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
        )
        loadUsers()
        loadStats()
      }
    } catch {
      showToast('error', 'Gagal memperbarui status aktif akun.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const totalPages = Math.max(Math.ceil(totalCount / limit), 1)

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1200px' }}>
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: feedbackToast.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircleIcon width={16} height={16} />
          ) : (
            <AlertCircleIcon width={16} height={16} />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              Kelola Pengguna Sistem
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: '#dcfce7',
                color: '#15803d',
                border: '1px solid #bbf7d0',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
              }}
            >
              User Directory
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Daftar akun pemohon magang dan administrator terdaftar di lingkungan SIM-Magang BRMP PH.
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {/* Total Pengguna */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803d',
            }}
          >
            <UsersIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Total Akun</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {stats.totalUser}
            </p>
          </div>
        </div>

        {/* Akun Aktif */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
            }}
          >
            <ShieldCheckIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Akun Aktif</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {stats.activeUser}
            </p>
          </div>
        </div>

        {/* Akun Nonaktif */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <XCircleIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Akun Nonaktif</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {stats.inactiveUser}
            </p>
          </div>
        </div>

        {/* Total Pemohon Magang */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.875rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#166534',
            }}
          >
            <UserCheckIcon width={20} height={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Pemohon (Pengguna)</p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {stats.totalPengguna}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <UserFilterBar
        search={search}
        statusFilter={statusFilter}
        roleFilter={roleFilter}
        totalCount={totalCount}
        activeCount={stats.activeUser}
        inactiveCount={stats.inactiveUser}
        loading={loading}
        onSearchChange={(kw) => {
          setSearch(kw)
          setCurrentPage(1)
        }}
        onStatusChange={(st) => {
          setStatusFilter(st)
          setCurrentPage(1)
        }}
        onRoleChange={(rl) => {
          setRoleFilter(rl)
          setCurrentPage(1)
        }}
        onRefresh={() => {
          loadUsers()
          loadStats()
        }}
      />

      {/* Main List Container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#15803d' }}>
              <LoaderIcon width={24} height={24} />
            </div>
            Memuat daftar pengguna...
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <AlertCircleIcon width={28} height={28} />
            </div>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: 500 }}>{errorMsg}</p>
            <button
              onClick={() => loadUsers()}
              style={{
                marginTop: '0.75rem',
                padding: '0.4rem 0.875rem',
                fontSize: '12px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#cbd5e1' }}>
              <UsersIcon width={32} height={32} />
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#475569' }}>
              Tidak ada data pengguna yang sesuai dengan filter.
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '11px' }}>
              Silakan sesuaikan kata kunci pencarian atau ganti filter status akun/role.
            </p>
          </div>
        ) : (
          <div>
            {users.map((user, idx) => {
              const isLoadingAction = actionLoadingId === user.id
              const isSelf = user.id === currentAdminId

              return (
                <div
                  key={user.id}
                  style={{
                    padding: '1.125rem 1.25rem',
                    borderBottom: idx === users.length - 1 ? 'none' : '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  {/* Left Column: User Identity & Details */}
                  <div style={{ flex: '1 1 320px', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        {user.name}
                      </h3>

                      {/* Role Badge (Administrator: Dark Green Solid; Pengguna: Green Outline) */}
                      {user.role === 'administrator' ? (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor: '#166534',
                            color: '#ffffff',
                            border: '1px solid #14532d',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                            letterSpacing: '0.02em',
                          }}
                        >
                          ADMIN
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '4px',
                          }}
                        >
                          PENGGUNA
                        </span>
                      )}

                      {/* Status Badge */}
                      {user.is_active ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <CheckCircleIcon width={10} height={10} />
                          Aktif
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <XCircleIcon width={10} height={10} />
                          Nonaktif
                        </span>
                      )}

                      {isSelf && (
                        <span
                          style={{
                            fontSize: '10px',
                            backgroundColor: '#f8fafc',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          (Akun Anda)
                        </span>
                      )}
                    </div>

                    {/* Contact & Affiliation Metadata */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '12px',
                        color: '#64748b',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MailIcon width={13} height={13} />
                        <span>{user.email}</span>
                      </div>

                      {user.no_hp && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <PhoneIcon width={13} height={13} />
                          <span>{user.no_hp}</span>
                        </div>
                      )}
                    </div>

                    {/* Academic / Organization & Application Summary */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        fontSize: '12px',
                        color: '#64748b',
                      }}
                    >
                      {(user.asal_instansi || user.jurusan) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <BriefcaseIcon width={13} height={13} />
                          <span>
                            {user.asal_instansi || '-'}
                            {user.jurusan ? ` (${user.jurusan})` : ''}
                          </span>
                        </div>
                      )}

                      {user.total_pengajuan !== undefined && (
                        <div style={{ fontSize: '11px', color: '#475569' }}>
                          Pengajuan: <strong style={{ color: '#0f172a' }}>{user.total_pengajuan}</strong>
                          {user.pengajuan_aktif ? (
                            <span style={{ color: '#15803d', fontWeight: 600, marginLeft: '4px' }}>
                              ({user.pengajuan_aktif} Sedang Magang)
                            </span>
                          ) : null}
                        </div>
                      )}

                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Terdaftar: {formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Actions (Detail & Active Toggle) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserIdForDetail(user.id)
                        setIsDetailModalOpen(true)
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: '#f8fafc',
                        color: '#334155',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <LayersIcon width={13} height={13} />
                      <span>Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(user)}
                      disabled={isLoadingAction || (isSelf && user.is_active)}
                      title={
                        isSelf && user.is_active
                          ? 'Anda tidak dapat menonaktifkan akun sendiri'
                          : user.is_active
                          ? 'Nonaktifkan akun'
                          : 'Aktifkan akun'
                      }
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '12px',
                        fontWeight: 500,
                        backgroundColor: user.is_active ? '#fffbeb' : '#f0fdf4',
                        color: user.is_active ? '#b45309' : '#15803d',
                        border: user.is_active ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        borderRadius: '6px',
                        cursor: isSelf && user.is_active ? 'not-allowed' : 'pointer',
                        opacity: isSelf && user.is_active ? 0.5 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      {isLoadingAction ? (
                        <LoaderIcon width={13} height={13} />
                      ) : (
                        <PowerIcon width={13} height={13} />
                      )}
                      <span>{user.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Footer */}
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            backgroundColor: '#ffffff',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Menampilkan <strong>{users.length}</strong> dari <strong>{totalCount}</strong> pengguna
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1 || loading}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: currentPage <= 1 ? '#9ca3af' : '#15803d',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Sebelumnya
            </button>

            <span style={{ fontSize: '12px', color: '#374151', padding: '0 4px' }}>
              Hal. <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages || loading}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                color: currentPage >= totalPages ? '#9ca3af' : '#15803d',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        isOpen={isDetailModalOpen}
        userId={selectedUserIdForDetail}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUserIdForDetail(null)
        }}
      />
    </div>
  )
}
