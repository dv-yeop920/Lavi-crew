import { globalStyle } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

globalStyle('*', {
  boxSizing: 'border-box',
})

globalStyle('html', {
  minHeight: '100%',
  background: semanticVars.color.background,
  colorScheme: 'light',
})

globalStyle('body', {
  minHeight: '100dvh',
  margin: 0,
  background: semanticVars.color.background,
  color: semanticVars.color.labelNormal,
  fontFamily: semanticVars.font.family,
  fontSize: semanticVars.font.size.bodyMedium,
  fontWeight: semanticVars.font.weight.regular,
  lineHeight: semanticVars.font.lineHeight.normal,
  WebkitFontSmoothing: 'antialiased',
})

globalStyle('button, input, textarea, select', {
  font: 'inherit',
})

globalStyle('button', {
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  lineHeight: semanticVars.font.lineHeight.normal,
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

globalStyle('h1', {
  fontSize: semanticVars.font.size.titleMedium,
  fontWeight: semanticVars.font.weight.extraBold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
  lineHeight: semanticVars.font.lineHeight.tight,
})

globalStyle('h2', {
  fontSize: semanticVars.font.size.headingMedium,
  fontWeight: semanticVars.font.weight.bold,
  letterSpacing: semanticVars.font.letterSpacing.tight,
  lineHeight: semanticVars.font.lineHeight.tight,
})

globalStyle('h3', {
  fontSize: semanticVars.font.size.headingSmall,
  fontWeight: semanticVars.font.weight.bold,
  lineHeight: semanticVars.font.lineHeight.tight,
})

globalStyle('p', {
  fontSize: semanticVars.font.size.bodyMedium,
  lineHeight: semanticVars.font.lineHeight.relaxed,
})
