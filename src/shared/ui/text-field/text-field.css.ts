import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const field = style({
  display: 'grid',
  gap: '0.5rem',
})

export const label = style({
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})

export const input = style({
  WebkitAppearance: 'none',
  appearance: 'none',
  width: '100%',
  minHeight: '3rem',
  paddingInline: '0.875rem',
  border: `1px solid ${semanticVars.color.lineStrong}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  fontSize: '1rem',
  selectors: {
    '&::placeholder': {
      color: semanticVars.color.labelMuted,
    },
    '&:hover': {
      borderColor: semanticVars.color.primarySoft,
    },
    '&:focus': {
      borderColor: semanticVars.color.primaryNormal,
    },
    '&[aria-invalid="true"]': {
      borderColor: semanticVars.color.negative,
    },
  },
})

export const hint = style({
  color: semanticVars.color.labelMuted,
  fontSize: semanticVars.font.size.captionLarge,
})

export const error = style({
  color: semanticVars.color.negative,
  fontSize: semanticVars.font.size.captionLarge,
  fontWeight: semanticVars.font.weight.semibold,
})
