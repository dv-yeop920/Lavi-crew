import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const viewport = style({
  display: 'grid',
  minHeight: '100dvh',
  padding: 'max(1.5rem, env(safe-area-inset-top)) 1rem max(1.5rem, env(safe-area-inset-bottom))',
  background: semanticVars.color.background,
})

export const shell = style({
  display: 'grid',
  width: 'min(100%, 28rem)',
  margin: 'auto',
  alignContent: 'center',
  gap: '2rem',
})

export const header = style({
  display: 'grid',
  gap: '0.75rem',
})

export const brand = style({
  color: semanticVars.color.primaryNormal,
  fontSize: semanticVars.font.size.headingSmall,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
})

export const description = style({
  color: semanticVars.color.labelNeutral,
})

export const form = style({
  display: 'grid',
  gap: '1rem',
})

export const fullButton = style({
  width: '100%',
  marginTop: '0.25rem',
})

export const message = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.warningSoft,
  color: semanticVars.color.warning,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const footer = style({
  display: 'flex',
  justifyContent: 'center',
  gap: '0.375rem',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
})

export const link = style({
  color: semanticVars.color.primaryStrong,
  fontWeight: semanticVars.font.weight.bold,
})

export const resetLink = style({
  justifySelf: 'center',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const checkbox = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.625rem',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  cursor: 'pointer',
})

export const checkboxInput = style({
  width: '1.125rem',
  height: '1.125rem',
  margin: '0.125rem 0 0',
  accentColor: semanticVars.color.primaryNormal,
})
