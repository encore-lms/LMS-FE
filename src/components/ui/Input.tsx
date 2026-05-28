import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  labelAction?: ReactNode
  id?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    required,
    leftIcon,
    rightIcon,
    labelAction,
    id: idProp,
    className = '',
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1">
          <span className="text-[13px] font-bold text-fg">{label}</span>
          {required && (
            <span aria-hidden className="text-sm text-danger">
              *
            </span>
          )}
        </label>
        {labelAction}
      </div>
      <div className="focus-within:border-brand flex h-[52px] items-center gap-[10px] rounded-[10px] border-2 border-border bg-white px-4 py-[14px]">
        {leftIcon && <div className="text-fg-muted shrink-0">{leftIcon}</div>}
        <input
          ref={ref}
          id={id}
          aria-required={required}
          className={`text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none ${className}`}
          {...rest}
        />
        {rightIcon && <div className="text-fg-muted shrink-0">{rightIcon}</div>}
      </div>
    </div>
  )
})
