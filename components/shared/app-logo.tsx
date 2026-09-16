import React from 'react'
import Image from 'next/image'

interface AppLogoProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  alt?: string
  priority?: boolean
}

/**
 * Komponen Reusable Logo Tunggal SIM-Magang
 * Menggunakan asset resmi: /smile.png
 */
export function AppLogo({
  size = 36,
  className,
  style,
  alt = 'Logo SIM-Magang BRMP',
  priority = false,
}: AppLogoProps) {
  return (
    <Image
      src="/smile.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={className}
      style={{
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  )
}
