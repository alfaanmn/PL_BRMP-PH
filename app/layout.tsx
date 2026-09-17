import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SIM-Magang',
  description: 'Sistem Informasi Manajemen Magang',
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
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
