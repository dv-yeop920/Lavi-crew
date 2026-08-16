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
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
@keyframes splash-icon{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
@keyframes splash-char{from{clip-path:inset(0 100% 0 0);opacity:0}to{clip-path:inset(0 0 0 0);opacity:1}}
@keyframes splash-out{0%{opacity:1;visibility:visible}90%{opacity:1}100%{opacity:0;visibility:hidden}}
#splash{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#fff;pointer-events:none;animation:splash-out 1.8s ease-out 1.2s forwards}
#splash>div{display:flex;flex-direction:column;align-items:center;gap:1rem}
#splash svg{width:4rem;height:4rem;opacity:0;animation:splash-icon .5s ease-out forwards}
#splash .t{display:flex;gap:.125rem;color:#4B0082;font-size:1.375rem;font-weight:800;letter-spacing:-.025em}
#splash .c1{display:inline-block;opacity:0;animation:splash-char .4s ease-out .4s forwards}
#splash .c2{display:inline-block;opacity:0;animation:splash-char .4s ease-out .65s forwards}
`,
          }}
        />
      </head>
      <body>
        <div id="splash" aria-hidden="true">
          <div>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#4B0082" />
              <text
                x="16"
                y="23"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize="20"
                fontWeight="700"
                fill="#FFFFFF"
              >
                L
              </text>
            </svg>
            <div className="t">
              <span className="c1">라</span>
              <span className="c2">비</span>
            </div>
          </div>
        </div>
        {children}
      </body>
    </html>
  )
}
