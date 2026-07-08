import { useEffect, useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { OpsAccount } from '@/shared/types'
import { useCourseConfig, useCourseList } from '../api/settings'

interface ScopeModalProps {
  /** non-null이면 해당 계정 기준으로 모달이 열린다. */
  account: OpsAccount | null
  /** 저장: 선택된 cohortId 목록을 전달(실 BE 반영은 부모가 처리). */
  onSave: (account: OpsAccount, cohortIds: string[]) => void
  onClose: () => void
  saving?: boolean
}

// 담당 범위(담당 기수) 설정 — 실 과정 선택 후 그 과정의 기수를 다중 선택한다.
// 저장 값은 cohortId 목록(실 BE: PUT /auth/accounts/{userId}/cohorts).
export function ScopeModal({
  account,
  onSave,
  onClose,
  saving,
}: ScopeModalProps) {
  const { data: courses } = useCourseList()
  const [courseId, setCourseId] = useState<string | null>(null)
  const activeCourseId = courseId ?? courses?.[0]?.courseId ?? null
  const { data: courseConfig } = useCourseConfig(activeCourseId)
  // 선택된 cohortId 집합 — 여러 과정에 걸쳐 누적.
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // 모달이 열릴 때 계정의 기존 담당 기수로 초기화.
  useEffect(() => {
    if (account) setSelected(new Set(account.cohortIds ?? []))
  }, [account])

  const cohorts = courseConfig?.cohorts ?? []
  const toggle = (id: string) => {
    setSelected((p) => {
      const next = new Set(p)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selected.size
  // 현재 과정에서 선택된 기수 라벨(요약 표시).
  const currentCourseSelected = useMemo(
    () =>
      cohorts.filter((c) => selected.has(c.id)).map((c) => `${c.cohortNo}기`),
    [cohorts, selected],
  )

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title="담당 과정·기수 설정"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={() => account && onSave(account, [...selected])}
            disabled={saving}
          >
            저장 ({selectedCount})
          </Button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-4 text-sm">
        과정을 선택한 뒤 담당 기수를 선택하세요. 여러 과정에 걸쳐 선택할 수
        있습니다. 변경 내역은 감사 로그에 기록됩니다.
      </p>

      {/* 과정 선택 */}
      <p className="text-fg-subtle text-xs font-medium">과정</p>
      <Select
        aria-label="과정"
        value={activeCourseId}
        onChange={(v) => setCourseId(v)}
        options={(courses ?? []).map((c) => ({
          value: c.courseId,
          label: c.title,
        }))}
        placeholder="등록 과정 없음"
        className="mt-1 mb-4 h-10 w-full"
      />

      {/* 기수 다중 선택 */}
      <p className="text-fg-subtle text-xs font-medium">기수 (다중 선택)</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {cohorts.map((c) => {
          const on = selected.has(c.id)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={
                on
                  ? 'border-brand bg-accent-bg text-accent-strong flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium'
                  : 'border-border text-fg hover:bg-surface-muted flex items-center justify-between rounded-lg border px-3 py-2 text-sm'
              }
            >
              <span>{c.cohortNo}기</span>
              {on && <Check className="h-4 w-4" />}
            </button>
          )
        })}
        {cohorts.length === 0 && (
          <p className="text-fg-subtle py-2 text-sm">
            이 과정에 기수가 없어요.
          </p>
        )}
      </div>

      {currentCourseSelected.length > 0 && (
        <p className="text-fg-muted mt-3 text-xs">
          이 과정 선택: {currentCourseSelected.join(' · ')} · 전체{' '}
          {selectedCount}개 기수
        </p>
      )}
    </Modal>
  )
}
