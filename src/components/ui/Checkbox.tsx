import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  id?: string
}

export function Checkbox({
  checked,
  onChange,
  label,
  id: idProp,
}: CheckboxProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`peer-focus-visible:ring-brand flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${
          checked ? 'border-brand bg-brand' : 'border-border bg-white'
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <span className="text-fg text-[13px] font-bold">{label}</span>
    </label>
  )
}
