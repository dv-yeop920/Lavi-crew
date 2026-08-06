import { style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const viewport = style({
  position: 'fixed',
  top: '1rem',
  right: '1rem',
  zIndex: 1000,
  display: 'grid',
  gap: '0.5rem',
  maxWidth: 'min(22rem, calc(100vw - 2rem))',
  pointerEvents: 'none',
})

const base = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  boxShadow: `0 0.5rem 1.5rem ${semanticVars.color.lineStrong}`,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
  lineHeight: semanticVars.font.lineHeight.normal,
  pointerEvents: 'auto',
})

export const toast = styleVariants({
  negative: [
    base,
    { background: semanticVars.color.negativeSoft, color: semanticVars.color.negative },
  ],
  neutral: [
    base,
    { background: semanticVars.color.surfaceRaised, color: semanticVars.color.labelNormal },
  ],
  positive: [
    base,
    { background: semanticVars.color.positiveSoft, color: semanticVars.color.positive },
  ],
})

export const message = style({
  margin: 0,
})

export const dismissButton = style({
  display: 'grid',
  flexShrink: 0,
  width: '1.75rem',
  height: '1.75rem',
  placeItems: 'center',
  border: 0,
  borderRadius: '999px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: semanticVars.font.size.labelMedium,
  selectors: {
    '&:hover': {
      background: semanticVars.color.primarySubtle,
    },
    '&:focus-visible': {
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '2px',
    },
  },
})
