import React from 'react'
import Image from 'next/image'

interface AppLogoProps {
  size?: number
  className?: string
  style?: React.CSSProperties
  alt?: string
  priority?: boolean
  variant?: 'simpul' | 'kementan'
  src?: string
}

/**
 * Komponen Reusable Logo SIM-Magang
 * variant: 'simpul' -> /simpul.png (logo SIMPUL)
 * variant: 'kementan' -> /kementan.png (logo Kementerian Pertanian)
 */
export function AppLogo({
  size = 36,
  className,
  style,
  alt,
  priority = false,
  variant = 'simpul',
  src,
}: AppLogoProps) {
  const imageSrc = src || (variant === 'kementan' ? '/kementan.png' : '/simpul.png')
  const defaultAlt = variant === 'kementan' ? 'Logo Kementerian Pertanian' : 'Logo SIMPUL BRMP-PH'

  return (
    <Image
      src={imageSrc}
      alt={alt || defaultAlt}
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
