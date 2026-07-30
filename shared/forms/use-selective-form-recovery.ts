'use client'

import type { FormEvent, RefObject } from 'react'
import { useEffect, useRef } from 'react'

import type { FormActionResult } from './form-result'

type RecoverableFormState = Pick<FormActionResult, 'fieldErrors' | 'ok'>

function restoreControlValue(
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  submittedValues: FormDataEntryValue[],
  shouldClear: boolean,
) {
  if (control instanceof HTMLInputElement) {
    if (control.type === 'file') return
    if (control.type === 'checkbox' || control.type === 'radio') {
      control.checked =
        !shouldClear && submittedValues.some((submittedValue) => submittedValue === control.value)
      return
    }
  }

  if (control instanceof HTMLSelectElement && control.multiple) {
    const selectedValues = shouldClear ? [] : submittedValues
    for (const option of control.options) {
      option.selected = selectedValues.some((submittedValue) => submittedValue === option.value)
    }
    return
  }

  const submittedValue = submittedValues.find((value): value is string => typeof value === 'string')
  control.value = shouldClear ? '' : (submittedValue ?? '')
}

export function useSelectiveFormRecovery(
  state: RecoverableFormState | null,
  providedFormRef?: RefObject<HTMLFormElement | null>,
) {
  const internalFormRef = useRef<HTMLFormElement>(null)
  const formRef = providedFormRef ?? internalFormRef
  const submittedFormDataRef = useRef<FormData | null>(null)
  const previousStateRef = useRef(state)

  useEffect(() => {
    if (state === previousStateRef.current) return
    previousStateRef.current = state

    const form = formRef.current
    const submittedFormData = submittedFormDataRef.current
    if (!state || state.ok || !form || !submittedFormData) return

    const invalidFieldNames = new Set(Object.keys(state.fieldErrors ?? {}))

    for (const control of form.elements) {
      if (
        !(
          control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement ||
          control instanceof HTMLTextAreaElement
        ) ||
        !control.name
      ) {
        continue
      }

      restoreControlValue(
        control,
        submittedFormData.getAll(control.name),
        invalidFieldNames.has(control.name),
      )
    }
  }, [formRef, state])

  function captureSubmission(event: FormEvent<HTMLFormElement>) {
    submittedFormDataRef.current = new FormData(event.currentTarget)
  }

  return { captureSubmission, formRef }
}
