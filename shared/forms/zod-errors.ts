import 'server-only'

import { z } from 'zod'

import type { FormFieldErrors } from './form-result'

export function getZodFieldErrors(error: z.ZodError): FormFieldErrors {
  return z.flattenError(error).fieldErrors
}
