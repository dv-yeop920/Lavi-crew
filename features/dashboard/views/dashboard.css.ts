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
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const link = style({
  color: semanticVars.color.primaryStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})
