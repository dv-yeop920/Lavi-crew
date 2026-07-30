import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const form = style({
  display: 'grid',
  gap: '1rem',
})

export const confirmation = style({
  display: 'grid',
  gap: '0.75rem',
  padding: '1rem',
  border: `1px solid ${semanticVars.color.lineStrong}`,
  borderRadius: '0.875rem',
  background: semanticVars.color.surfaceRaised,
})

export const message = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.positiveSoft,
  color: semanticVars.color.positive,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const errorMessage = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.negativeSoft,
  color: semanticVars.color.negative,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})
