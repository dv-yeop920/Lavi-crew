import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const calendar = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '0.375rem',
})

export const weekday = style({
  paddingBlock: '0.375rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
  fontSize: '0.75rem',
})

export const blankDay = style({
  minHeight: '2.75rem',
})

export const day = style({
  minWidth: 0,
  minHeight: '2.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.625rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      borderColor: 'transparent',
      background: 'transparent',
      color: semanticVars.color.labelNeutral,
      cursor: 'default',
      opacity: 0.55,
    },
    '&[aria-pressed="true"]': {
      borderColor: semanticVars.color.primaryStrong,
      background: semanticVars.color.primaryNormal,
      color: semanticVars.color.onPrimary,
      fontWeight: 800,
    },
  },
})

export const detail = style({
  display: 'grid',
  gap: '0.25rem',
})

export const meta = style({
  color: semanticVars.color.labelNeutral,
  lineHeight: 1.5,
})

export const tabList = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.25rem',
  padding: '0.25rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
})

export const tab = style({
  minHeight: '2.5rem',
  border: 0,
  borderRadius: '0.5rem',
  background: 'transparent',
  color: semanticVars.color.labelNeutral,
  selectors: {
    '&[aria-selected="true"]': {
      background: semanticVars.color.surfaceMuted,
      color: semanticVars.color.labelStrong,
      fontWeight: 700,
    },
  },
})

export const personRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '0.75rem',
})
