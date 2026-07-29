// HRD API Key 신규 등록 폼 — 폼 상태는 부모(HrdApiKeyPage)가 소유하고 props로 배선. HrdApiKeyPage에서 분리.
import type { FormEventHandler } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Info, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/shared/lib/cn'
import type { HrdKeyInput } from './hrdKey.schema'

export function HrdKeyRegisterForm({
  onSubmit,
  register,
  errors,
  activateNow,
  onToggleActivateNow,
  pending,
}: {
  onSubmit: FormEventHandler<HTMLFormElement>
  register: UseFormRegister<HrdKeyInput>
  errors: FieldErrors<HrdKeyInput>
  activateNow: boolean
  onToggleActivateNow: () => void
  pending: boolean
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="border-border bg-surface h-fit rounded-xl border p-5"
    >
      <p className="text-fg flex items-center gap-1.5 text-sm font-bold">
        <KeyRound className="h-4 w-4" /> 새 API Key 등록
      </p>
      <p className="text-fg-subtle mt-0.5 text-xs">
        등록 후 키 원문은 다시 표시되지 않습니다
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <Input
          label="API 이름"
          required
          placeholder="HRD 운영키 2026"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="API Key"
          required
          type="password"
          placeholder="********-********-********"
          error={errors.key?.message}
          {...register('key')}
        />
        <Input
          label="설명"
          placeholder="운영용 · 분기별 교체 예정"
          error={errors.description?.message}
          {...register('description')}
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-fg text-xs font-medium">등록 즉시 사용</p>
          <p className="text-fg-subtle text-[11px]">OFF 시 비활성으로 보관</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={activateNow}
          aria-label="등록 즉시 사용"
          onClick={onToggleActivateNow}
          className={cn(
            'h-6 w-11 rounded-full p-0.5 transition-colors',
            activateNow ? 'bg-brand' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'bg-surface block h-5 w-5 rounded-full transition-transform',
              activateNow && 'translate-x-5',
            )}
          />
        </button>
      </div>
      <div className="border-divider mt-4 flex gap-2 border-t pt-4">
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? '등록 중…' : '등록'}
        </Button>
      </div>
      <p className="bg-surface-muted text-fg-muted mt-3 flex items-start gap-1.5 rounded-lg p-3 text-xs">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        연결 테스트는 등록된 키 행에서 실행할 수 있습니다
      </p>
    </form>
  )
}
