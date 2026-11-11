import type { TextareaHTMLAttributes } from 'react'
import styles from './TextField.module.css'

// The label wraps the textarea, so tapping the label focuses the box.
export function TextField({ label, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={styles.field}>
      {label}
      <textarea className={styles.input} {...rest} />
    </label>
  )
}
