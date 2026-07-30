import type { ComponentPropsWithRef } from 'react'

import * as styles from './button.css'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: keyof typeof styles.button
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  const { className, ...buttonProps } = props
  const mergedClassName = [styles.button[variant], className].filter(Boolean).join(' ')

  return <button className={mergedClassName} type="button" {...buttonProps} />
}
