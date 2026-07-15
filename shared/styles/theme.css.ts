import { createGlobalTheme, createGlobalThemeContract } from '@vanilla-extract/css'

const atomicVars = createGlobalThemeContract(
  {
    color: {
      common0: null,
      common100: null,
      blue50: null,
      blue55: null,
      blue60: null,
      coolNeutral90: null,
      coolNeutral99: null,
      surface: null,
      line: null,
      positive: null,
      warning: null,
    },
  },
  (_, path) => `color-atomic-${path.join('-')}`,
)

createGlobalTheme(':root', atomicVars, {
  color: {
    common0: 'CanvasText',
    common100: 'Canvas',
    blue50: 'ActiveText',
    blue55: 'LinkText',
    blue60: 'Highlight',
    coolNeutral90: 'GrayText',
    coolNeutral99: 'CanvasText',
    surface: 'Field',
    line: 'ButtonBorder',
    positive: 'LinkText',
    warning: 'MarkText',
  },
})

export const semanticVars = createGlobalThemeContract(
  {
    color: {
      background: null,
      surface: null,
      surfaceMuted: null,
      labelNormal: null,
      labelStrong: null,
      labelNeutral: null,
      lineNormal: null,
      primaryNormal: null,
      primaryStrong: null,
      primaryHeavy: null,
      onPrimary: null,
      positive: null,
      warning: null,
    },
    font: {
      family: null,
    },
  },
  (_, path) =>
    path[0] === 'color'
      ? `color-semantic-${path.slice(1).join('-')}`
      : `font-semantic-${path.slice(1).join('-')}`,
)

createGlobalTheme(':root', semanticVars, {
  color: {
    background: atomicVars.color.common100,
    surface: atomicVars.color.surface,
    surfaceMuted: 'ButtonFace',
    labelNormal: atomicVars.color.coolNeutral99,
    labelStrong: atomicVars.color.common0,
    labelNeutral: atomicVars.color.coolNeutral90,
    lineNormal: atomicVars.color.line,
    primaryNormal: atomicVars.color.blue60,
    primaryStrong: atomicVars.color.blue55,
    primaryHeavy: atomicVars.color.blue50,
    onPrimary: 'HighlightText',
    positive: atomicVars.color.positive,
    warning: atomicVars.color.warning,
  },
  font: {
    family:
      "'Pretendard JP', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
})
