/**
 * SIM-Magang BRMP PH - Theme & Color Tokens
 * Berdasarkan Palet Resmi Identitas Kementerian Pertanian
 * Dilengkapi kepatuhan kontras WCAG 2.1 AA
 */

export const THEME_COLORS = {
  // Kuning / Emas Kementan (CTA Utama & Status Menunggu)
  gold: {
    primary: '#F5C400',
    hover: '#E0B300',
    dark: '#B8860B',
    light: '#FEF3C7',
    textDark: '#78350F',
    textBlack: '#0F172A',
    border: '#FDE68A',
  },
  // Biru Kementan (Calibrated untuk teks putih >= 4.5:1 kontras)
  blue: {
    primary: '#1A6FC4', // 4.85:1 terhadap putih (PASS WCAG AA)
    brand: '#1E78D2',   // Non-text (border, bar chart, line dekorasi)
    hover: '#155DA6',
    dark: '#0F2A47',    // Navy admin sidebar
    navyHover: '#163B63',
    light: '#EFF6FF',
    text: '#1D4ED8',
    textDeep: '#1E40AF',
    border: '#BFDBFE',
  },
  // Hijau Pertanian (Calibrated untuk teks putih >= 4.5:1 kontras)
  green: {
    primary: '#238833', // 4.60:1 terhadap putih (PASS WCAG AA)
    brand: '#2E9E3E',   // Non-text (logo, border, accent line)
    dark: '#02482E',    // Forest green Kementan
    forestHover: '#013723',
    light: '#ECFDF5',
    text: '#065F46',
    textDeep: '#064E3B',
    border: '#A7F3D0',
  },
  // Merah Kementan (Aksi Kritis, Penolakan, Batal)
  red: {
    primary: '#D62828', // 5.01:1 terhadap putih (PASS WCAG AA)
    hover: '#BA1F1F',
    dark: '#991B1B',
    light: '#FEF2F2',
    text: '#991B1B',
    textDeep: '#7F1D1D',
    border: '#FECACA',
  },
  // Netral Slate
  neutral: {
    white: '#FFFFFF',
    bg: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    textMain: '#0F172A',
    textBody: '#1E293B',
    textMuted: '#64748B',
    textSubtle: '#94A3B8',
  },
} as const
