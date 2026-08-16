import type { Metadata } from 'next'

import '@/shared/styles/theme.css'
import './global.css'

export const metadata: Metadata = {
  title: '라비에벨 스케줄 관리',
  description: '라비에벨 웨딩홀 알바 스케줄 및 급여 관리',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-theme="light">
      <body>{children}</body>
    </html>
  )
}
