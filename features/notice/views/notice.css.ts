import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const form = style({
  display: 'grid',
  gap: '1rem',
})

export const field = style({
  display: 'grid',
  gap: '0.375rem',
})

export const label = style({
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})

export const textarea = style({
  width: '100%',
  minHeight: '7rem',
  padding: '0.75rem',
  resize: 'vertical',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  selectors: {
    '&:focus-visible': {
      borderColor: semanticVars.color.primaryNormal,
      outline: `2px solid ${semanticVars.color.primarySoft}`,
      outlineOffset: '1px',
    },
  },
})

export const checkbox = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.semibold,
})

export const empty = style({
  padding: '1rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
})
