import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const header = style({
  display: 'grid',
  gap: '0.375rem',
})

export const eyebrow = style({
  color: semanticVars.color.primaryStrong,
  fontWeight: 700,
})

export const description = style({
  color: semanticVars.color.labelNeutral,
  lineHeight: 1.6,
})
