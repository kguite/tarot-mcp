import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }

// A real <button>, so it works with the keyboard; anything else (onClick, disabled) passes straight through.
export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={`${styles.button} ${styles[variant]} ${className ?? ''}`} {...rest} />
}

// Icon-only buttons need a label, or a screen reader announces just "button".
export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button className={styles.icon} aria-label={label} {...rest}>
      {children}
    </button>
  )
}
