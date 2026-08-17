import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'

import * as styles from './text-field.css'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  hint?: string
  label: string
}

export function TextField({ error, hint, id, label, name, ...inputProps }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? name ?? generatedId
  const descriptionId = `${inputId}-description`

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        name={name}
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
    </div>
  )
}
