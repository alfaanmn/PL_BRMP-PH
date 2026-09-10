import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SIM-Magang',
  description: 'Sistem Informasi Manajemen Magang',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
