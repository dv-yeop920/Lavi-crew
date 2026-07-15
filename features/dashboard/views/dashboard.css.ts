import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const metric = style({
  display: 'grid',
  gap: '0.25rem',
})

export const metricValue = style({
  fontSize: '1.75rem',
  fontWeight: 800,
})

export const meta = style({
  color: semanticVars.color.labelNeutral,
  lineHeight: 1.5,
})

export const link = style({
  color: semanticVars.color.primaryStrong,
  fontWeight: 700,
})
