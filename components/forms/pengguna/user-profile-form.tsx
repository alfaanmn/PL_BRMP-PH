'use client'

import React, { useState } from 'react'
import { authService } from '@/lib/services/auth.service'
import type { Profile } from '@/types/auth.types'

interface UserProfileFormProps {
  initialProfile: Profile
}

export function UserProfileForm({ initialProfile }: UserProfileFormProps) {
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Edit form states
  const [formData, setFormData] = useState({
    name: initialProfile.name || '',
    no_hp: initialProfile.no_hp || '',
    asal_instansi: initialProfile.asal_instansi || '',
    jurusan: initialProfile.jurusan || '',
    jenis_kelamin: initialProfile.jenis_kelamin || 'Laki-laki',
  })

  // Password fields
  const [wantsPasswordChange, setWantsPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const userInitial = (profile.name || profile.email || 'U').charAt(0).toUpperCase()

  const openEditModal = () => {
    setFormData({
      name: profile.name || '',
      no_hp: profile.no_hp || '',
      asal_instansi: profile.asal_instansi || '',
      jurusan: profile.jurusan || '',
      jenis_kelamin: profile.jenis_kelamin || 'Laki-laki',
    })
    setWantsPasswordChange(false)
    setNewPassword('')
    setConfirmPassword('')
    setFieldErrors({})
    setMessage(null)
    setIsModalOpen(true)
  }

  const closeEditModal = () => {
    if (isLoading) return
    setIsModalOpen(false)
    setFieldErrors({})
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setMessage(null)

    const errors: Record<string, string> = {}

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errors.name = 'Nama lengkap minimal 3 karakter'
    }

    if (wantsPasswordChange) {
      if (!newPassword) {
        errors.newPassword = 'Password baru wajib diisi'
      } else if (newPassword.length < 6) {
        errors.newPassword = 'Password minimal 6 karakter'
      }

      if (!confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password wajib diisi'
      } else if (newPassword !== confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password tidak cocok'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      // 1. Update Profile fields
      const resProfile = await authService.updateProfile(profile.id, {
        name: formData.name,
        no_hp: formData.no_hp,
        asal_instansi: formData.asal_instansi,
        jurusan: formData.jurusan,
        jenis_kelamin: formData.jenis_kelamin,
      })

      if (!resProfile.success || !resProfile.data) {
        setMessage({
          type: 'error',
          text: resProfile.error || 'Gagal memperbarui profil.',
        })
        setIsLoading(false)
        return
      }

      // 2. Update Password jika dicentang
      if (wantsPasswordChange && newPassword) {
        const resPass = await authService.updatePassword(newPassword)
        if (!resPass.success) {
          setMessage({
            type: 'error',
            text: `Profil diperbarui, namun gagal mengubah password: ${resPass.error}`,
          })
          setProfile(resProfile.data)
          setIsLoading(false)
          return
        }
      }

      setProfile(resProfile.data)
      setIsModalOpen(false)
      setShowSuccessModal(true)
    } catch {
      setMessage({
        type: 'error',
        text: 'Terjadi kesalahan sistem saat menyimpan profil.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes checkmarkPop {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .profile-edit-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .profile-edit-btn:hover {
          background-color: #ecfdf5 !important;
          border-color: #86efac !important;
          color: #16a34a !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Toast Alert Feedback jika ada error */}
      {message && (
        <div style={{
          padding: '0.625rem 1rem',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 500,
          backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
          color: message.type === 'success' ? '#16a34a' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Card Identitas Utama (Atas) */}
      <div style={{
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Avatar + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '18px',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
          }}>
            {userInitial}
          </div>

          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 2px 0', lineHeight: 1.2 }}>
              {profile.name || 'Pemohon Magang'}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {profile.email}
            </div>
          </div>
        </div>

        {/* Tombol Edit Profil */}
        <button
          type="button"
          onClick={openEditModal}
          className="profile-edit-btn"
          style={{
            padding: '0.4rem 0.875rem',
            backgroundColor: '#ffffff',
            color: '#334155',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem'
          }}
        >
          <span>Edit profil</span>
        </button>
      </div>

      {/* 2. Card Detail Identitas (Bawah - 1 Card Besar Grid 2 Kolom) */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.25rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem 1.5rem'
        }}>
          {/* Field 1: WhatsApp */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <div style={{ color: '#16a34a', marginTop: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>WhatsApp</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                {profile.no_hp || '-'}
              </div>
            </div>
          </div>

          {/* Field 2: Instansi */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <div style={{ color: '#16a34a', marginTop: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Instansi</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                {profile.asal_instansi || '-'}
              </div>
            </div>
          </div>

          {/* Field 3: Program Studi */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <div style={{ color: '#16a34a', marginTop: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Program studi</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                {profile.jurusan || '-'}
              </div>
            </div>
          </div>

          {/* Field 4: Jenis Kelamin */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <div style={{ color: '#16a34a', marginTop: '2px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3"/>
                <line x1="12" y1="8" x2="12" y2="17"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="21" x2="12" y2="17"/>
                <line x1="15" y1="21" x2="12" y2="17"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>Jenis kelamin</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                {profile.jenis_kelamin || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Catatan Sinkronisasi (1 Baris Ringkas dengan Ikon Info) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.375rem',
        fontSize: '12px',
        color: '#64748b',
        paddingLeft: '2px'
      }}>
        <span style={{ color: '#16a34a', fontWeight: 700 }}>ⓘ</span>
        <span>Data ini otomatis dipakai saat membuat pengajuan magang baru.</span>
      </div>

      {/* 4. Modal Edit Profil & Ubah Password dengan Animasi Halus */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.18)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            animation: 'modalPopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Edit profil pengguna
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Perbarui identitas pemohon dan pengaturan akun
                </span>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                disabled={isLoading}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Email (Read Only) */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                    Alamat email (terkunci)
                  </label>
                  <input
                    type="text"
                    value={profile.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.625rem',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#64748b',
                      cursor: 'not-allowed',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                    Nama lengkap <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nama lengkap sesuai KTP/KTM"
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.625rem',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: `1px solid ${fieldErrors.name ? '#dc2626' : '#cbd5e1'}`,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {fieldErrors.name && (
                    <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* WhatsApp & Jenis Kelamin (2 Kolom) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      No WhatsApp
                    </label>
                    <input
                      type="text"
                      value={formData.no_hp}
                      onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                      placeholder="Contoh: 08123456789"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.625rem',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Jenis kelamin
                    </label>
                    <select
                      value={formData.jenis_kelamin}
                      onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.625rem',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* Instansi & Program Studi (2 Kolom) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Asal instansi
                    </label>
                    <input
                      type="text"
                      value={formData.asal_instansi}
                      onChange={(e) => setFormData({ ...formData, asal_instansi: e.target.value })}
                      placeholder="Universitas / Sekolah"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.625rem',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Program studi / Jurusan
                    </label>
                    <input
                      type="text"
                      value={formData.jurusan}
                      onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                      placeholder="Program studi"
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.625rem',
                        fontSize: '13px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Section Ubah Password (Opsional) */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={wantsPasswordChange}
                      onChange={(e) => setWantsPasswordChange(e.target.checked)}
                      style={{ accentColor: '#16a34a' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                      Ubah password akun
                    </span>
                  </label>

                  {wantsPasswordChange && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.25rem' }}>
                      {/* Password Baru */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                          Password baru (minimal 6 karakter) <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Masukkan password baru"
                            style={{
                              width: '100%',
                              padding: '0.4rem 2rem 0.4rem 0.625rem',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: `1px solid ${fieldErrors.newPassword ? '#dc2626' : '#cbd5e1'}`,
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: '0.5rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              fontSize: '11px',
                              color: '#64748b',
                              cursor: 'pointer'
                            }}
                          >
                            {showPassword ? 'Tutup' : 'Lihat'}
                          </button>
                        </div>
                        {fieldErrors.newPassword && (
                          <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                            {fieldErrors.newPassword}
                          </span>
                        )}
                      </div>

                      {/* Konfirmasi Password Baru */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                          Ulangi password baru <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Ketik ulang password baru"
                          style={{
                            width: '100%',
                            padding: '0.4rem 0.625rem',
                            fontSize: '12px',
                            borderRadius: '6px',
                            border: `1px solid ${fieldErrors.confirmPassword ? '#dc2626' : '#cbd5e1'}`,
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        {fieldErrors.confirmPassword && (
                          <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', display: 'block' }}>
                            {fieldErrors.confirmPassword}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '0.75rem 1.25rem',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.5rem',
                borderBottomLeftRadius: '14px',
                borderBottomRightRadius: '14px'
              }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isLoading}
                  style={{
                    padding: '0.4rem 0.875rem',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: '#16a34a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Pop-up Sukses dengan Animasi Ceklis Hijau di Tengah */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
          boxSizing: 'border-box',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '380px',
            width: '100%',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            animation: 'modalPopIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Animasi Icon Ceklis Hijau */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 900,
              border: '2px solid #86efac',
              boxShadow: '0 0 0 6px rgba(236, 253, 245, 0.8)',
              animation: 'checkmarkPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              ✓
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 0.375rem 0' }}>
                Profil berhasil diperbarui!
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Informasi data diri dan pengaturan akun Anda telah berhasil disimpan dan disinkronkan ke sistem.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1.5rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                transition: 'all 0.15s'
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
