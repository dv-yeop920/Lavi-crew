import type { ButtonHTMLAttributes } from 'react'

import * as styles from './button.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof styles.button
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  return <button className={styles.button[variant]} type="button" {...props} />
}
