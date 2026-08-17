import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const monthNavigator = style({
  display: 'grid',
  gridTemplateColumns: '2.75rem minmax(0, 1fr) 2.75rem',
  alignItems: 'center',
  gap: '0.75rem',
  textAlign: 'center',
})

export const arrowLink = style({
  display: 'grid',
  width: '2.75rem',
  height: '2.75rem',
  placeItems: 'center',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  fontSize: semanticVars.font.size.numberSmall,
  textDecoration: 'none',
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

export const summary = style({
  display: 'grid',
  justifyItems: 'start',
  gap: '0.5rem',
})

export const amount = style({
  fontSize: semanticVars.font.size.numberLarge,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
  lineHeight: semanticVars.font.lineHeight.tight,
})

export const responsiveRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  minWidth: 0,
})

export const meta = style({
  overflowWrap: 'anywhere',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const emptyState = style({
  paddingBlock: '1rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})
