import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-[#06201c] font-semibold hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100',
  ghost:
    'border border-line text-ink hover:bg-raised hover:border-line-strong disabled:opacity-40',
  danger: 'bg-danger-soft text-danger border border-danger/40 hover:bg-danger/20 disabled:opacity-40',
  subtle: 'text-muted hover:text-ink hover:bg-raised disabled:opacity-40',
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  )
}
