import { globalStyle, style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

const mobileTableBreakpoint = 'screen and (max-width: 34rem)'

export const tableScroll = style({
  width: '100%',
  marginTop: '0.75rem',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  '@media': {
    [mobileTableBreakpoint]: {
      overflowX: 'visible',
    },
  },
})

export const assignmentTable = style({
  width: '100%',
  minWidth: '43rem',
  borderCollapse: 'collapse',
  '@media': {
    [mobileTableBreakpoint]: {
      display: 'block',
      minWidth: 0,
    },
  },
})

globalStyle(`${assignmentTable} th`, {
  color: semanticVars.color.labelStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
  textAlign: 'left',
})

globalStyle(`${assignmentTable} th, ${assignmentTable} td`, {
  padding: '0.75rem',
  borderBottom: `1px solid ${semanticVars.color.lineNormal}`,
  verticalAlign: 'top',
})

globalStyle(`${assignmentTable} th:first-child`, {
  width: '6rem',
  '@media': {
    [mobileTableBreakpoint]: {
      width: '100%',
    },
  },
})

globalStyle(`${assignmentTable} thead`, {
  '@media': {
    [mobileTableBreakpoint]: {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    },
  },
})

globalStyle(`${assignmentTable} tbody`, {
  '@media': {
    [mobileTableBreakpoint]: {
      display: 'grid',
      gap: '0.75rem',
      width: '100%',
    },
  },
})

globalStyle(`${assignmentTable} tbody tr`, {
  '@media': {
    [mobileTableBreakpoint]: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      width: '100%',
      overflow: 'hidden',
      border: `1px solid ${semanticVars.color.lineNormal}`,
      borderRadius: '0.75rem',
      background: semanticVars.color.surface,
    },
  },
})

globalStyle(`${assignmentTable} tbody th`, {
  '@media': {
    [mobileTableBreakpoint]: {
      display: 'block',
      boxSizing: 'border-box',
      width: '100%',
      padding: '0.75rem',
      borderBottom: `1px solid ${semanticVars.color.lineNormal}`,
      background: semanticVars.color.surfaceMuted,
    },
  },
})

globalStyle(`${assignmentTable} tbody td`, {
  '@media': {
    [mobileTableBreakpoint]: {
      display: 'block',
      boxSizing: 'border-box',
      width: '100%',
      minWidth: 0,
      padding: '0.75rem',
      borderBottom: 0,
    },
  },
})

export const personSelectList = style({
  display: 'grid',
  gap: '0.625rem',
})

export const personSelectField = style({
  display: 'grid',
  gap: '0.25rem',
})

export const personSelectControl = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '0.5rem',
  minWidth: 0,
})

export const personSelect = style({
  width: '100%',
  minWidth: 0,
  minHeight: '2.75rem',
  paddingInline: '0.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  font: 'inherit',
  selectors: {
    '&:focus-visible': {
      borderColor: semanticVars.color.primaryNormal,
      outline: `2px solid ${semanticVars.color.primarySoft}`,
      outlineOffset: '1px',
    },
  },
})

export const personSummary = style({
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.captionSmall,
  lineHeight: semanticVars.font.lineHeight.normal,
  overflowWrap: 'anywhere',
})

export const assignedPerson = style({
  display: 'grid',
  gap: '0.25rem',
  paddingBlock: '0.25rem',
})

export const assignedPersonHeader = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
})

export const trainingToggle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  minHeight: '2.75rem',
  color: semanticVars.color.labelStrong,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.semibold,
  cursor: 'pointer',
})

globalStyle(`${trainingToggle} input`, {
  width: '1.125rem',
  height: '1.125rem',
  accentColor: semanticVars.color.primaryNormal,
})

globalStyle(`${trainingToggle} input:disabled`, {
  cursor: 'not-allowed',
})

export const removePersonButton = style({
  width: '2.75rem',
  height: '2.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNeutral,
  cursor: 'pointer',
  fontSize: semanticVars.font.size.numberSmall,
  selectors: {
    '&:hover': {
      background: semanticVars.color.warningSoft,
    },
    '&:focus-visible': {
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '2px',
    },
  },
})

export const visuallyHidden = style({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
})
