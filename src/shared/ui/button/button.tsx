import Link from 'next/link'
import type { ComponentPropsWithRef } from 'react'

import * as styles from './button.css'

type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: keyof typeof styles.button
}

type ButtonLinkProps = ComponentPropsWithRef<typeof Link> & {
  variant?: keyof typeof styles.button
}

function getButtonClassName(variant: keyof typeof styles.button, className?: string) {
  return [styles.button[variant], className].filter(Boolean).join(' ')
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  const { className, ...buttonProps } = props

  return (
    <button className={getButtonClassName(variant, className)} type="button" {...buttonProps} />
  )
}

export function ButtonLink({ variant = 'primary', ...props }: ButtonLinkProps) {
  const { className, ...linkProps } = props

  return <Link className={getButtonClassName(variant, className)} {...linkProps} />
}
