import type { Metadata } from 'next'

import '@/shared/styles/theme.css'
import './global.css'

export const metadata: Metadata = {
  title: '라비크루',
  description: '라비에벨 웨딩홀 크루 스케줄 및 급여 관리',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
