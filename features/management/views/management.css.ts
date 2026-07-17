import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const cardActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
})

export const editLink = style({
  display: 'inline-flex',
  minHeight: '2.75rem',
  alignItems: 'center',
  justifyContent: 'center',
  paddingInline: '1rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.primaryNormal,
  color: semanticVars.color.onPrimary,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  textDecoration: 'none',
  selectors: {
    '&:hover': {
      background: semanticVars.color.primaryStrong,
    },
    '&:focus-visible': {
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '2px',
    },
  },
})

export const contactList = style({
  display: 'grid',
  gap: '0.25rem',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
})

export const form = style({
  display: 'grid',
  gap: '1rem',
})

export const checkboxGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.625rem',
  '@media': {
    'screen and (max-width: 22rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

export const positionFieldset = style({
  display: 'grid',
  minWidth: 0,
  gap: '1rem',
  margin: 0,
  padding: '1rem',
  border: `1px solid ${semanticVars.color.primaryMuted}`,
  borderRadius: '0.875rem',
})

export const positionLegend = style({
  paddingInline: '0.375rem',
  color: semanticVars.color.labelStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})

export const checkbox = style({
  display: 'flex',
  minHeight: '2.75rem',
  alignItems: 'center',
  gap: '0.625rem',
  paddingInline: '0.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  cursor: 'pointer',
})

export const checkboxInput = style({
  width: '1.125rem',
  height: '1.125rem',
  accentColor: semanticVars.color.primaryNormal,
})

export const confirmation = style({
  display: 'grid',
  gap: '0.75rem',
  padding: '1rem',
  border: `1px solid ${semanticVars.color.lineStrong}`,
  borderRadius: '0.875rem',
  background: semanticVars.color.surfaceRaised,
})

export const saveMessage = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.positiveSoft,
  color: semanticVars.color.positive,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const wage = style({
  color: semanticVars.color.labelStrong,
  fontSize: semanticVars.font.size.numberSmall,
  fontWeight: semanticVars.font.weight.bold,
})
