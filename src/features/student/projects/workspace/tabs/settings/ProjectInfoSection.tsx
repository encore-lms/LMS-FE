// 설정 탭 — "프로젝트 정보" 영역(이름·기간·기술 카테고리 편집, 인증 완료 시 잠금).
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import {
  useUpdateProjectInfo,
  useUpdateProjectTechStacks,
  wsWriteError,
} from '../../../../api/projects'
import type { WorkspaceData } from '../../../types'
import { Field } from '../../../wizard/wizardShared'
import { StackPicker } from '../../components/StackPicker'
import { card } from '../../components/ws-style'

export function ProjectInfoSection({ d }: { d: WorkspaceData }) {
  const toast = useToast()

  // ── 프로젝트 정보 편집 ──
  const infoM = useUpdateProjectInfo(d.id)
  const techM = useUpdateProjectTechStacks(d.id)
  const isPm = d.isOwner === true
  const locked = d.status === 'certified' // 인증 완료면 이름·기간·기술 잠금(인증 전만 편집)
  const [name, setName] = useState(d.title)
  const [start, setStart] = useState(d.startDate ?? '')
  const [end, setEnd] = useState(d.endDate ?? '')
  const [stacks, setStacks] = useState<string[]>(d.stack)

  // 워크스페이스 데이터 갱신 시 편집 폼 초기화(저장 후 재조회 반영).
  useEffect(() => {
    setName(d.title)
    setStart(d.startDate ?? '')
    setEnd(d.endDate ?? '')
    setStacks(d.stack)
  }, [d.title, d.startDate, d.endDate, d.stack])

  const toggleStack = (s: string) =>
    setStacks((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    )

  const saveInfo = () => {
    if (!name.trim()) {
      toast.danger('프로젝트 이름을 입력해 주세요.')
      return
    }
    infoM.mutate(
      { title: name.trim(), start: start || undefined, end: end || undefined },
      {
        onSuccess: () => toast.success('프로젝트 정보를 저장했어요'),
        onError: (e) => toast.danger(wsWriteError(e, '저장에 실패했어요.')),
      },
    )
  }

  const saveStacks = () => {
    techM.mutate(
      { stacks },
      {
        onSuccess: () => toast.success('기술 카테고리를 저장했어요'),
        onError: (e) => toast.danger(wsWriteError(e, '저장에 실패했어요.')),
      },
    )
  }

  const infoInput = inputClass({ size: 'md', className: 'disabled:opacity-60' })

  return (
    <>
      {/* ── 프로젝트 정보 ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 정보</h2>
        <span className="text-fg-subtle text-[12px]">
          이름·기간은 PM만, 기술 카테고리는 팀원 누구나 수정할 수 있어요.
        </span>
      </div>

      {locked && (
        <div className="bg-surface-muted text-fg-muted flex items-center gap-2 rounded-xl px-4 py-3 text-[12px]">
          <Lock className="size-3.5 shrink-0" aria-hidden="true" />
          인증이 완료된 프로젝트는 정보를 수정할 수 없어요. 수정이 필요하면
          강사에게 요청해 주세요.
        </div>
      )}

      {/* 이름·기간 — PM 전용 */}
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-center justify-between">
          <span className="text-fg text-[14px] font-bold">이름 · 기간</span>
          {!isPm && (
            <span className="text-fg-subtle text-[11px]">PM만 수정 가능</span>
          )}
        </div>
        <Field label="프로젝트명" required counter={`${name.length} / 80`}>
          <input
            className={infoInput}
            maxLength={80}
            value={name}
            disabled={!isPm || locked}
            onChange={(e) => setName(e.target.value)}
            aria-label="프로젝트명"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="시작일">
            <DateTimePicker
              mode="date"
              value={start}
              onChange={setStart}
              ariaLabel="시작일"
              placeholder="시작일"
              max={end || undefined}
              disabled={!isPm || locked}
            />
          </Field>
          <Field label="종료일">
            <DateTimePicker
              mode="date"
              value={end}
              onChange={setEnd}
              ariaLabel="종료일"
              placeholder="종료일"
              min={start || undefined}
              disabled={!isPm || locked}
            />
          </Field>
        </div>
        {isPm && !locked && (
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              onClick={saveInfo}
              disabled={infoM.isPending}
            >
              {infoM.isPending ? '저장 중…' : '이름·기간 저장'}
            </Button>
          </div>
        )}
      </section>

      {/* 기술 카테고리 — 팀원 누구나 */}
      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[14px] font-bold">기술 카테고리</span>
          <span className="text-fg-subtle text-[12px]">
            프로젝트가 사용하는 기술 스택입니다. 팀원 누구나 바꿀 수 있어요.
          </span>
        </div>
        <StackPicker value={stacks} onToggle={toggleStack} disabled={locked} />
        {!locked && (
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={saveStacks}
              disabled={techM.isPending}
            >
              {techM.isPending ? '저장 중…' : '기술 카테고리 저장'}
            </Button>
          </div>
        )}
      </section>
    </>
  )
}
