import { globalStyle } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

globalStyle('*', {
  boxSizing: 'border-box',
})

globalStyle('html', {
  minHeight: '100%',
  background: semanticVars.color.background,
  colorScheme: 'light dark',
})

globalStyle('body', {
  minHeight: '100dvh',
  margin: 0,
  background: semanticVars.color.background,
  color: semanticVars.color.labelNormal,
  fontFamily: semanticVars.font.family,
  WebkitFontSmoothing: 'antialiased',
})

globalStyle('button, input, textarea, select', {
  font: 'inherit',
})

globalStyle('button, a', {
  WebkitTapHighlightColor: 'transparent',
})

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'none',
})

globalStyle('button:focus-visible, a:focus-visible, input:focus-visible', {
  outline: `2px solid ${semanticVars.color.primaryNormal}`,
  outlineOffset: '2px',
})

globalStyle('h1, h2, h3, p', {
  marginBlock: 0,
})
