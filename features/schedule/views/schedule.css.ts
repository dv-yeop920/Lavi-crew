import { style } from '@vanilla-extract/css'

import { semanticVars } from '@/shared/styles/theme.css'

export const calendar = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
  gap: '0.375rem',
  '@media': {
    'screen and (max-width: 22rem)': {
      gap: '0.125rem',
    },
  },
})

export const applicationCalendar = style({
  '@media': {
    'screen and (max-width: 22rem)': {
      width: 'calc(100% + 3.375rem)',
      marginInline: '-1.6875rem',
      gap: 0,
    },
  },
})

export const monthNavigator = style({
  display: 'grid',
  gridTemplateColumns: '2.75rem minmax(0, 1fr) 2.75rem',
  alignItems: 'center',
  gap: '0.75rem',
  textAlign: 'center',
})

export const periodNavigator = style({
  display: 'grid',
  gridTemplateColumns: '2.75rem minmax(0, 1fr) 2.75rem',
  alignItems: 'center',
  gap: '0.75rem',
  textAlign: 'center',
})

export const monthArrowButton = style({
  display: 'grid',
  width: '2.75rem',
  height: '2.75rem',
  placeItems: 'center',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  cursor: 'pointer',
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

export const weekday = style({
  paddingBlock: '0.375rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
  fontSize: semanticVars.font.size.labelSmall,
  selectors: {
    '&[data-weekday="saturday"]': {
      color: semanticVars.color.weekendSaturday,
    },
    '&[data-weekday="sunday"]': {
      color: semanticVars.color.weekendSunday,
    },
  },
})

export const blankDay = style({
  minHeight: '2.75rem',
})

export const adminCalendarDay = style({
  display: 'grid',
  minWidth: 0,
  minHeight: '2.75rem',
  placeItems: 'center',
  border: 0,
  borderRadius: '0.625rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  selectors: {
    '&[data-registered="true"]': {
      background: semanticVars.color.primarySubtle,
      color: semanticVars.color.primaryStrong,
      fontWeight: semanticVars.font.weight.bold,
    },
    '&[data-weekday="saturday"]': {
      color: semanticVars.color.weekendSaturday,
    },
    '&[data-weekday="sunday"]': {
      color: semanticVars.color.weekendSunday,
    },
  },
})

export const day = style({
  minWidth: 0,
  minHeight: '2.75rem',
  border: 0,
  borderRadius: '0.625rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      background: 'transparent',
      color: semanticVars.color.labelNeutral,
      cursor: 'default',
      opacity: 0.55,
    },
    '&[aria-pressed="true"]': {
      background: semanticVars.color.primaryNormal,
      color: semanticVars.color.onPrimary,
      fontWeight: semanticVars.font.weight.extraBold,
    },
    '&[data-registered="true"]': {
      background: semanticVars.color.primarySubtle,
      color: semanticVars.color.primaryStrong,
      fontWeight: semanticVars.font.weight.bold,
    },
    '&[data-weekday="saturday"]': {
      color: semanticVars.color.weekendSaturday,
    },
    '&[data-weekday="sunday"]': {
      color: semanticVars.color.weekendSunday,
    },
    '&[aria-pressed="true"]:not(:disabled)': {
      color: semanticVars.color.onPrimary,
    },
    '&:focus-visible': {
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '2px',
    },
  },
})

export const detail = style({
  display: 'grid',
  gap: '0.25rem',
})

export const meta = style({
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const applicationList = style({
  display: 'grid',
  gap: '0.5rem',
  margin: '0.75rem 0 0',
  padding: 0,
  listStyle: 'none',
})

export const applicationItem = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  minHeight: '3rem',
  paddingBlock: '0.375rem',
  borderBottom: `1px solid ${semanticVars.color.lineNormal}`,
  '@media': {
    'screen and (max-width: 22rem)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
})

export const emptyState = style({
  paddingBlock: '1rem',
  color: semanticVars.color.labelNeutral,
  textAlign: 'center',
  fontSize: semanticVars.font.size.bodySmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const tabList = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.25rem',
  padding: '0.25rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
})

export const tab = style({
  display: 'grid',
  minHeight: '2.5rem',
  placeItems: 'center',
  border: 0,
  borderRadius: '0.5rem',
  background: 'transparent',
  color: semanticVars.color.labelNeutral,
  textDecoration: 'none',
  selectors: {
    '&[aria-current="page"]': {
      background: semanticVars.color.surfaceMuted,
      color: semanticVars.color.labelStrong,
      fontWeight: semanticVars.font.weight.bold,
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

export const personRow = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: '0.75rem',
})

export const registeredScheduleCardLink = style({
  display: 'block',
  color: semanticVars.color.labelNormal,
  textDecoration: 'none',
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${semanticVars.color.primaryNormal}`,
      outlineOffset: '3px',
      borderRadius: '1rem',
    },
  },
})

export const cardAction = style({
  color: semanticVars.color.primaryNormal,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.bold,
})

export const scheduleInfoGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '0.75rem',
  marginBlock: '1rem',
  '@media': {
    'screen and (max-width: 34rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

export const deadlineGrid = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
  alignItems: 'end',
  gap: '0.75rem',
  marginTop: '0.25rem',
  '@media': {
    'screen and (max-width: 34rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

export const fieldLabel = style({
  display: 'grid',
  gap: '0.375rem',
  color: semanticVars.color.labelNeutral,
  fontSize: semanticVars.font.size.labelMedium,
  fontWeight: semanticVars.font.weight.semibold,
})

export const compactInput = style({
  width: '100%',
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
    '&:read-only': {
      borderColor: semanticVars.color.lineNormal,
      background: semanticVars.color.surfaceMuted,
      color: semanticVars.color.labelStrong,
      cursor: 'default',
    },
  },
})

export const textArea = style({
  width: '100%',
  minHeight: '6rem',
  resize: 'vertical',
  padding: '0.75rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '0.75rem',
  background: semanticVars.color.surface,
  color: semanticVars.color.labelNormal,
  font: 'inherit',
  lineHeight: semanticVars.font.lineHeight.normal,
  selectors: {
    '&:focus-visible': {
      borderColor: semanticVars.color.primaryNormal,
      outline: `2px solid ${semanticVars.color.primarySoft}`,
      outlineOffset: '1px',
    },
    '&:disabled': {
      background: semanticVars.color.surfaceMuted,
      cursor: 'not-allowed',
      opacity: 0.65,
    },
  },
})

export const attendanceList = style({
  display: 'grid',
  gap: '0.75rem',
  margin: 0,
  padding: 0,
  listStyle: 'none',
})

export const attendanceItem = style({
  display: 'grid',
  gap: '0.75rem',
  minWidth: 0,
  padding: '1rem',
  border: `1px solid ${semanticVars.color.lineNormal}`,
  borderRadius: '1rem',
  background: semanticVars.color.surface,
  boxShadow: `0 0.25rem 1rem ${semanticVars.color.primarySubtle}`,
})

export const attendanceTimeGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '0.75rem',
  '@media': {
    'screen and (max-width: 34rem)': {
      gridTemplateColumns: '1fr',
    },
  },
})

export const saveMessage = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.primarySubtle,
  color: semanticVars.color.primaryStrong,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const errorMessage = style({
  padding: '0.75rem',
  borderRadius: '0.75rem',
  background: semanticVars.color.negativeSoft,
  color: semanticVars.color.negative,
  fontSize: semanticVars.font.size.bodySmall,
  fontWeight: semanticVars.font.weight.semibold,
})

export const fieldError = style({
  color: semanticVars.color.negative,
  fontSize: semanticVars.font.size.captionSmall,
  lineHeight: semanticVars.font.lineHeight.normal,
})

export const confirmation = style({
  display: 'grid',
  gap: '0.75rem',
  padding: '1rem',
  border: `1px solid ${semanticVars.color.lineStrong}`,
  borderRadius: '0.875rem',
  background: semanticVars.color.surfaceRaised,
})
