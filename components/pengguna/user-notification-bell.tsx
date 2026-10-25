'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { notifikasiService, NotifikasiRecord } from '@/lib/services/notifikasi.service'

export function UserNotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotifikasiRecord[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await notifikasiService.getUserNotifications()
      if (res.success) {
        setNotifications(res.notifications || [])
        setUnreadCount(res.unreadCount || 0)
      }
    } catch (err) {
      console.warn('Gagal memuat notifikasi pengguna:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load awal & polling ringan setiap 45 detik
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 45000)
    return () => clearInterval(interval)
  }, [])

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications()
    }
    setIsOpen((prev) => !prev)
  }

  const handleItemClick = async (item: NotifikasiRecord) => {
    if (!item.is_read) {
      await notifikasiService.markUserAsRead(item.id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }

    setIsOpen(false)

    if (item.link) {
      router.push(item.link)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notifikasiService.markUserAsRead(undefined, true)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.warn('Gagal menandai seluruh notifikasi:', err)
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Tombol Lonceng Pengguna */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifikasi Pengguna"
        title="Notifikasi Pengguna"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          backgroundColor: isOpen ? '#ecfdf5' : '#ffffff',
          border: '1px solid #bfdbfe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          color: isOpen ? '#047857' : '#1A6FC4',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ display: 'block', flexShrink: 0 }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Badge Angka Belum Dibaca */}
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

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
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
            zIndex: 9999,
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
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                Pemberitahuan
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '999px',
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
                  fontSize: '11px',
                  color: '#15803d',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '2px 4px',
                }}
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* List Item Notifikasi */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                Memuat pemberitahuan...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ display: 'block', margin: '0 auto 0.75rem' }}
                >
                  <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                  <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                </svg>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Belum ada pemberitahuan
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Aktivitas akun dan status magang Anda akan tampil di sini.
                </div>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid #f8fafc',
                    backgroundColor: !item.is_read ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = !item.is_read ? '#e2fbe8' : '#f8fafc'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !item.is_read ? '#f0fdf4' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: !item.is_read ? 700 : 600,
                        color: !item.is_read ? '#064e3b' : '#1e293b',
                      }}
                    >
                      {item.judul}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatTime(item.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '11px',
                      color: '#475569',
                      lineHeight: 1.45,
                    }}
                  >
                    {item.pesan}
                  </p>

                  {item.link && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        fontSize: '11px',
                        color: '#15803d',
                        fontWeight: 600,
                      }}
                    >
                      Buka tautan &rarr;
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
