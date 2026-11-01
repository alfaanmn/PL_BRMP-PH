import type { Metadata } from 'next'
import './globals.css'
import { TabSessionGuard } from '@/components/auth/tab-session-guard'

export const metadata: Metadata = {
  title: 'SIMPUL - Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan',
  description: 'Simpul BRMP-PH - Sistem Informasi Magang dan Pelatihan Unggulan Lanjutan Balai Pengelola Hasil Perakitan dan Modernisasi Pertanian',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" style={{ scrollBehavior: 'smooth' }}>
      <body style={{ margin: 0, padding: 0 }}>
        <TabSessionGuard>{children}</TabSessionGuard>
      </body>
    </html>
  )
}
