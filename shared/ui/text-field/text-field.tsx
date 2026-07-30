import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'

import * as styles from './text-field.css'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  error?: string
  hint?: string
  label: string
}

export function TextField({ error, hint, label, ...inputProps }: TextFieldProps) {
  const inputId = useId()
  const descriptionId = `${inputId}-description`

  return (
    <label className={styles.field} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input
        {...inputProps}
        id={inputId}
        className={styles.input}
        aria-describedby={error || hint ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <span aria-live="polite" className={styles.error} id={descriptionId}>
          {error}
        </span>
      ) : hint ? (
        <span className={styles.hint} id={descriptionId}>
          {hint}
        </span>
      ) : null}
    </label>
  )
}
