'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types/auth.types'
import { notifikasiService, type NotifikasiRecord } from '@/lib/services/notifikasi.service'

interface AdminHeaderProps {
  profile: Profile | null
  onOpenMobileSidebar: () => void
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHours = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSec < 60) return 'Baru saja'
    if (diffMin < 60) return `${diffMin} mnt lalu`
    if (diffHours < 24) return `${diffHours} jam lalu`
    if (diffDays === 1) return 'Kemarin'
    if (diffDays < 7) return `${diffDays} hari lalu`

    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function AdminHeader({
  profile,
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  const router = useRouter()
  const [navSearchKeyword, setNavSearchKeyword] = useState('')
  const [notifications, setNotifications] = useState<NotifikasiRecord[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [isNotifLoading, setIsNotifLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const adminName = profile?.name || 'Administrator'

  const todayDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const fetchNotifications = async () => {
    try {
      setIsNotifLoading(true)
      const res = await notifikasiService.getAdminNotifications()
      if (res.success) {
        setNotifications(res.notifications)
        setUnreadCount(res.unreadCount)
      }
    } finally {
      setIsNotifLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }

    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotifOpen])

  const handleToggleNotif = () => {
    if (!isNotifOpen) {
      fetchNotifications()
    }
    setIsNotifOpen((prev) => !prev)
  }

  const handleNotificationItemClick = async (notif: NotifikasiRecord) => {
    if (!notif.is_read) {
      await notifikasiService.markAsRead(notif.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    setIsNotifOpen(false)

    if (notif.link) {
      let targetUrl = notif.link
      if (targetUrl.startsWith('/admin/pengajuan-verifikasi')) {
        targetUrl = '/admin/riwayat-pengajuan'
      }
      router.push(targetUrl)
    }
  }

  const handleMarkAllAsRead = async () => {
    await notifikasiService.markAllAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const handleNavSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = navSearchKeyword.trim()
    if (trimmed) {
      router.push(`/admin/riwayat-pengajuan?search=${encodeURIComponent(trimmed)}`)
    } else {
      router.push('/admin/riwayat-pengajuan')
    }
  }

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #F5C400',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        gap: '1rem',
      }}
    >
      {/* Left: Mobile Toggle Button & Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
        {/* Mobile Toggle Button (< 1024px) */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Buka Menu"
          title="Buka Menu"
          style={{
            display: 'none',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#0f172a',
          }}
          className="admin-mobile-menu-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#1A6FC4',
                backgroundColor: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #bfdbfe',
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1A6FC4' }} />
              SIM BRMP PH
            </span>
            <span style={{ fontSize: '13px', color: '#475569' }}>
              Selamat datang, <strong style={{ color: '#0f172a', fontWeight: 700 }}>{adminName}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <form
        onSubmit={handleNavSearch}
        style={{
          flex: '1 1 200px',
          maxWidth: '380px',
          position: 'relative',
        }}
        className="admin-header-search"
      >
        <div
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          value={navSearchKeyword}
          onChange={(e) => setNavSearchKeyword(e.target.value)}
          placeholder="Cari pengajuan, nama, instansi..."
          style={{
            width: '100%',
            padding: '6px 12px 6px 30px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            backgroundColor: '#f8fafc',
            color: '#0f172a',
            fontSize: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s ease, background-color 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#1A6FC4'
            e.currentTarget.style.backgroundColor = '#ffffff'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1'
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }}
        />
      </form>

      {/* Right: Notification & Compact Account Widget */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Notification Bell with Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={handleToggleNotif}
            aria-label="Notifikasi Sistem"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: isNotifOpen ? '#e2e8f0' : '#f8fafc',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              color: isNotifOpen ? '#0f172a' : '#475569',
              transition: 'all 0.15s ease',
              padding: 0,
            }}
            title="Notifikasi Sistem"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>

            {/* Unread Count Badge */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 4px',
                  borderRadius: '999px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Modal */}
          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '360px',
                maxWidth: 'calc(100vw - 2rem)',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              {/* Header Dropdown */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    Notifikasi Sistem
                  </span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {unreadCount} baru
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1A6FC4',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    Tandai dibaca
                  </button>
                )}
              </div>

              {/* Body Dropdown List */}
              <div
                style={{
                  maxHeight: '360px',
                  overflowY: 'auto',
                }}
              >
                {isNotifLoading && notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                    Memuat notifikasi...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '0.375rem' }}>🔔</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                      Belum ada notifikasi
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      Pemberitahuan pengajuan baru atau survei SKM akan muncul di sini.
                    </div>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.is_read
                    const isPengajuan = notif.judul.toLowerCase().includes('pengajuan')
                    const isSKM = notif.judul.toLowerCase().includes('skm') || notif.judul.toLowerCase().includes('survei')

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationItemClick(notif)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid #f8fafc',
                          backgroundColor: isUnread ? '#f0fdf4' : '#ffffff',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#dcfce7' : '#f8fafc'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#f0fdf4' : '#ffffff'
                        }}
                      >
                        {/* Icon Type */}
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            backgroundColor: isPengajuan ? '#eff6ff' : isSKM ? '#fef3c7' : '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          {isPengajuan ? '📄' : isSKM ? '⭐' : '🔔'}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: isUnread ? 700 : 600,
                                color: isUnread ? '#14532d' : '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {notif.judul}
                            </span>
                            <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
                              {formatRelativeTime(notif.created_at)}
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: '11px',
                              color: isUnread ? '#166534' : '#64748b',
                              margin: 0,
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {notif.pesan}
                          </p>
                        </div>

                        {/* Unread dot indicator */}
                        {isUnread && (
                          <div
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#16a34a',
                              marginTop: '6px',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer Dropdown */}
              <div
                style={{
                  padding: '0.5rem 1rem',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                  Pemberitahuan otomatis sistem SIM-Magang
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Compact Account Widget (Tanpa duplikasi avatar besar) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '5px 12px',
            borderRadius: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
            {adminName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#78350F',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              padding: '1px 6px',
              borderRadius: '4px',
              letterSpacing: '0.03em',
            }}
          >
            Admin
          </span>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1023px) {
          .admin-mobile-menu-btn {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .admin-header-search {
            display: none !important;
          }
        }
      `}</style>
    </header>
  )
}
