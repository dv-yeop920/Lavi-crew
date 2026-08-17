import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const metric = style({
  display: 'grid',
  gap: '0.25rem',
})

export const metricValue = style({
  fontSize: semanticVars.font.size.numberMedium,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
  lineHeight: semanticVars.font.lineHeight.tight,
})

export const meta = style({
  overflowWrap: 'anywhere',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const link = style({
  color: semanticVars.color.primaryStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  overflowWrap: 'anywhere',
})

export const cardLink = style({
  display: 'block',
  color: semanticVars.color.labelNormal,
  textDecoration: 'none',
  selectors: {
    '&:focus-visible': {
      borderRadius: '1rem',
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '3px',
    },
  },
})

export const responsiveRow = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  minWidth: 0,
})

export const noticePreview = style({
  margin: 0,
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
