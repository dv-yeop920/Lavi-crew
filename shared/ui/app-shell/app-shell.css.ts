import { globalStyle, style, styleVariants } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const viewport = style({
  minHeight: '100dvh',
  background: semanticVars.color.background,
})

export const shell = style({
  width: 'min(100%, 48rem)',
  minHeight: '100dvh',
  marginInline: 'auto',
  background: semanticVars.color.background,
})

export const topNavigation = style({
  position: 'sticky',
  zIndex: 10,
  top: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '3.5rem',
  paddingTop: 'env(safe-area-inset-top)',
  paddingInline: '1rem',
  borderBottom: `1px solid ${semanticVars.color.lineNormal}`,
  background: semanticVars.color.surface,
})

export const brand = style({
  color: semanticVars.color.primaryNormal,
  fontSize: semanticVars.font.size.headingSmall,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
})

export const headerActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
})

globalStyle(`${headerActions} > button`, {
  minHeight: '2.25rem',
  paddingInline: '0.75rem',
})

export const content = style({
  padding: '1.25rem 1rem calc(6rem + env(safe-area-inset-bottom))',
})

export const bottomNavigation = style({
  position: 'fixed',
  zIndex: 20,
  right: 0,
  bottom: 0,
  left: 0,
  display: 'flex',
  justifyContent: 'center',
  pointerEvents: 'none',
})

export const bottomNavigationInner = style({
  display: 'grid',
  width: 'min(100%, 48rem)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  borderTop: `1px solid ${semanticVars.color.lineNormal}`,
  background: semanticVars.color.surface,
  pointerEvents: 'auto',
})

export const bottomNavigationColumns = styleVariants({
  three: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  five: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
})

export const navigationItem = style({
  display: 'grid',
  minWidth: 0,
  minHeight: '3.75rem',
  placeItems: 'center',
  alignContent: 'center',
  gap: '0.1875rem',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.labelSmall,
  selectors: {
    '&[aria-current="page"]': {
      color: semanticVars.color.primaryStrong,
      fontWeight: semanticVars.font.weight.extraBold,
    },
  },
})

export const navigationIcon = style({
  width: '1.375rem',
  height: '1.375rem',
  strokeWidth: 1.8,
})
