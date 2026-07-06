import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { RecertificationRow } from '@/shared/types'
import {
  useRecertifications,
  useResolveRecertification,
} from '../api/changeRequests'
import { ChangeDiffCard } from './ChangeDiffCard'
import { ReasonModal } from './ReasonModal'
import { TARGET_TYPE_META, TYPE_FILTERS, type TypeFilter } from './meta'
import { SkeletonListPage } from '@/components/ui/Skeleton'

// 재인증 통합 검토 (/instructor/recertifications) — P0 29. (Figma 2750:2202)
// 인증 후 수정으로 재인증이 필요한 프로젝트·트러블슈팅 통합 큐 + 요청 상세(변경된 내역 중심).
// Figma는 상세 1건 단독 — 통합 '큐' 요구사항은 변경 제안과 같은 요청 리스트로 보완(06-11 결정 패턴 일관).
export default function RecertificationsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useRecertifications()
  const resolveMutation = useResolveRecertification()
  const [filter, setFilter] = useState<TypeFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 보완요청 사유 입력 대상 — 모달 열림 상태.
  const [supplementTarget, setSupplementTarget] =
    useState<RecertificationRow | null>(null)
  // 승인/보완요청 처리분 — 서버 무효화와 별개로 즉시 큐에서 제거(낙관적 업데이트).
  const [resolved, setResolved] = useState<Record<string, string>>({})
  usePageHeader(
    '재인증 통합 검토',
    '프로젝트와 트러블슈팅의 수정 완료 요청을 변경 내역 중심으로 검토합니다',
  )

  const rows = useMemo(
    () =>
      (data?.items ?? []).filter(
        (r) => !resolved[r.id] && (filter === 'all' || r.type === filter),
      ),
    [data, filter, resolved],
  )

  // 기본 선택 = 첫 요청 (Figma 상세 1건 노출과 동일)
  const selected: RecertificationRow | null =
    rows.find((r) => r.id === selectedId) ?? rows[0] ?? null

  if (isPending) {
    return <SkeletonListPage columns={4} />
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="재인증 요청을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 재인증 승인/보완요청 공통 종결 — 낙관적으로 큐에서 제거 후 mutation 호출.
  const resolve = async (
    row: RecertificationRow,
    verdict: '재인증 승인' | '보완요청',
    reason?: string,
  ) => {
    setResolved((prev) => ({ ...prev, [row.id]: verdict }))
    setSelectedId(null)
    try {
      await resolveMutation.mutateAsync({
        id: row.id,
        action: verdict === '재인증 승인' ? 'approved' : 'changes_requested',
        reason,
      })
      toast.success(`${row.target} ${verdict}`)
    } catch {
      setResolved((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
      toast.danger(`${row.target} 처리에 실패했어요`)
    }
  }

  const approve = (row: RecertificationRow) => resolve(row, '재인증 승인')
  const confirmSupplement = (reason: string) => {
    if (!supplementTarget) return
    const target = supplementTarget
    setSupplementTarget(null)
    resolve(target, '보완요청', reason)
  }

  return (
    <div className="p-8">
      {/* 유형 탭 + 변경 제안 복귀 (헤더 보조 버튼 — 06-11 결정) */}
      <div className="flex flex-wrap items-center gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              setFilter(f)
              setSelectedId(null)
            }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium',
              filter === f
                ? 'bg-accent-bg text-accent-strong'
                : 'text-fg-muted hover:bg-surface-muted',
            )}
          >
            {f === 'all' ? '전체' : TARGET_TYPE_META[f].label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => navigate('/instructor/change-requests')}
          className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          ← 변경 제안 검토
        </button>
      </div>

      {/* 요청 큐 — 행 선택 시 아래 상세 갱신 */}
      {rows.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm',
                selected?.id === r.id
                  ? 'border-accent-strong bg-accent-bg/40 text-fg font-bold'
                  : 'border-border text-fg-muted hover:bg-surface-muted font-medium',
              )}
            >
              {r.target}
              <span className="text-fg-subtle text-xs">{r.requesterLabel}</span>
            </button>
          ))}
        </div>
      )}

      {/* 재인증 요청 상세 */}
      <section className="border-border bg-surface mt-4 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">재인증 요청 상세</p>
        {!selected ? (
          <p className="text-fg-muted mt-4 text-sm">
            검토 대기 중인 재인증 요청이 없어요
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <StatusBadge
                label={TARGET_TYPE_META[selected.type].label}
                tone={TARGET_TYPE_META[selected.type].tone}
              />
              <p className="text-fg text-sm font-semibold">
                {selected.target} · {selected.requesterLabel} ·{' '}
                {selected.summary}
              </p>
            </div>
            <p className="text-fg mt-6 text-sm font-bold">변경된 내역만 보기</p>
            <div className="mt-2 flex flex-col gap-2.5">
              {selected.changes.map((c) => (
                <ChangeDiffCard key={c.id} item={c} />
              ))}
            </div>
            <div className="mt-7 flex justify-end gap-2">
              <Button
                variant="secondary"
                className="h-10 text-sm"
                disabled={resolveMutation.isPending}
                onClick={() => setSupplementTarget(selected)}
              >
                보완요청
              </Button>
              <Button
                className="h-10 text-sm"
                disabled={resolveMutation.isPending}
                onClick={() => approve(selected)}
              >
                재인증 승인
              </Button>
            </div>
          </>
        )}
      </section>

      <ReasonModal
        open={supplementTarget !== null}
        title="보완요청을 보낼까요?"
        description="보완요청 사유는 요청자에게 전달되며, 사유 작성은 필수입니다."
        confirmLabel="보완요청"
        placeholder="예: 변경된 산출물의 검증 근거를 함께 첨부해 주세요."
        pending={resolveMutation.isPending}
        onClose={() => setSupplementTarget(null)}
        onConfirm={confirmSupplement}
      />
    </div>
  )
}
