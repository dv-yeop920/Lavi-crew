export type FormFieldErrors = Record<string, string[] | undefined>

export type FormActionResult = {
  code?: string
  fieldErrors?: FormFieldErrors
  message: string
  ok: boolean
}

export function getFirstFieldError(fieldErrors: FormFieldErrors | undefined, fieldName: string) {
  return fieldErrors?.[fieldName]?.[0]
}
