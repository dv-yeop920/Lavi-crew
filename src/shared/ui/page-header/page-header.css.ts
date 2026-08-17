import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const header = style({
  display: 'grid',
  gap: '0.375rem',
})

export const backLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifySelf: 'start',
  gap: '0.375rem',
  minHeight: '2.75rem',
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  textDecoration: 'none',
  selectors: {
    '&:focus-visible': {
      borderRadius: '0.5rem',
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '2px',
    },
  },
})

export const eyebrow = style({
  color: semanticVars.color.primaryStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const description = style({
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodyMedium,
  lineHeight: semanticVars.font.lineHeight.relaxed,
})
