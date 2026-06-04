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
  /** 검증 에러 메시지. 있으면 빨강 보더 + aria-invalid + 메시지 노출 (RHF: error={errors.x?.message}) */
  error?: string
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
    error,
    ...rest
  },
  ref,
) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  const errorId = `${id}-error`

  return (
    <div className="flex w-full flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1">
          <span className="text-fg text-[13px] font-bold">{label}</span>
          {required && (
            <span aria-hidden className="text-danger text-sm">
              *
            </span>
          )}
        </label>
        {labelAction}
      </div>
      <div
        className={`flex h-[52px] items-center gap-[10px] rounded-[10px] border-2 bg-white px-4 py-[14px] ${
          error ? 'border-danger' : 'focus-within:border-brand border-border'
        }`}
      >
        {leftIcon && <div className="text-fg-muted shrink-0">{leftIcon}</div>}
        <input
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none ${className}`}
          {...rest}
        />
        {rightIcon && <div className="text-fg-muted shrink-0">{rightIcon}</div>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-danger text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
})
