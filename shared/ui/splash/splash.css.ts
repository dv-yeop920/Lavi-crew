import { keyframes, style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const fadeScale = keyframes({
  from: { opacity: 0, transform: 'scale(0.7)' },
  to: { opacity: 1, transform: 'scale(1)' },
})

const drawChar = keyframes({
  from: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
  to: { clipPath: 'inset(0 0 0 0)', opacity: 1 },
})

export const viewport = style({
  display: 'grid',
  placeItems: 'center',
  minHeight: '100dvh',
  background: semanticVars.color.background,
})

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
})

export const icon = style({
  width: '4rem',
  height: '4rem',
  color: semanticVars.color.primaryNormal,
  opacity: 0,
  animation: `${fadeScale} 0.5s ease-out forwards`,
})

export const text = style({
  display: 'flex',
  gap: '0.125rem',
})

const charBase = style({
  display: 'inline-block',
  opacity: 0,
  color: semanticVars.color.primaryNormal,
  fontSize: semanticVars.font.size.titleMedium,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
  animation: `${drawChar} 0.4s ease-out forwards`,
})

export const char = styleVariants({
  first: [charBase, { animationDelay: '0.4s' }],
  second: [charBase, { animationDelay: '0.65s' }],
})
