import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const viewport = style({
  minHeight: '100dvh',
  background: semanticVars.color.background,
})

export const shell = style({
  width: 'min(100%, 48rem)',
  minHeight: '100dvh',
  marginInline: 'auto',
  borderInline: `1px solid ${semanticVars.color.lineNormal}`,
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
  fontWeight: 800,
  letterSpacing: '-0.02em',
})

export const role = style({
  color: semanticVars.color.labelNeutral,
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
  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  paddingBottom: 'env(safe-area-inset-bottom)',
  borderTop: `1px solid ${semanticVars.color.lineNormal}`,
  borderInline: `1px solid ${semanticVars.color.lineNormal}`,
  background: semanticVars.color.surface,
  pointerEvents: 'auto',
})

export const navigationItem = style({
  display: 'grid',
  minWidth: 0,
  minHeight: '3.75rem',
  placeItems: 'center',
  alignContent: 'center',
  gap: '0.125rem',
  color: semanticVars.color.labelNeutral,
  fontSize: '0.75rem',
  selectors: {
    '&[aria-current="page"]': {
      color: semanticVars.color.primaryStrong,
      fontWeight: 800,
    },
  },
})

export const navigationMark = style({
  width: '1.25rem',
  height: '0.25rem',
  borderRadius: '999px',
  background: 'transparent',
  selectors: {
    '[aria-current="page"] &': {
      background: semanticVars.color.primaryNormal,
    },
  },
})
