import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { InstructorChangeRequestRow } from '@/shared/types'
import {
  useChangeRequests,
  useResolveChangeRequest,
} from '../api/changeRequests'
import { useCohortRosterMap } from '../api/console'
import { ChangeDiffCard } from './ChangeDiffCard'
import { ReasonModal } from './ReasonModal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import {
  CHANGE_REQUEST_STATUS_META,
  TARGET_TYPE_META,
  TYPE_FILTERS,
  type TypeFilter,
} from './meta'

// 변경 제안 통합 검토 (/instructor/change-requests) — P0 29 §11~§12 통합. (Figma 2750:2070)
// 구 프로젝트/트러블슈팅 변경 제안 검토 2종(Deprecated) 대체.
// 상세는 별도 frame 부재 → 큐 아래 상세 패널(재인증 2750:2202의 접힘 카드 비교 패턴 재사용, 06-11 결정).
export default function ChangeRequestsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useChangeRequests()
  // 요청자 이름 — BE 는 requesterUserId 만 주므로 담당 기수 통합 로스터로 join.
  const nameOf = useCohortRosterMap()
  const resolveMutation = useResolveChangeRequest()
  const [filter, setFilter] = useState<TypeFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 반려 사유 입력 대상 — 모달 열림 상태.
  const [rejectTarget, setRejectTarget] =
    useState<InstructorChangeRequestRow | null>(null)
  // 승인/반려 처리분 — 서버 무효화와 별개로 즉시 큐에서 제거(낙관적 업데이트).
  const [resolved, setResolved] = useState<Record<string, '승인' | '반려'>>({})
  usePageHeader(
    '변경 제안 통합 검토',
    '프로젝트와 트러블슈팅 변경 제안을 한 화면에서 검토합니다',
  )

  const rows = useMemo(
    () =>
      (data?.items ?? []).filter(
        (r) => !resolved[r.id] && (filter === 'all' || r.type === filter),
      ),
    [data, filter, resolved],
  )

  const selected: InstructorChangeRequestRow | null =
    rows.find((r) => r.id === selectedId) ?? null

  // 승인/반려 공통 종결 — 낙관적으로 큐에서 제거 후 mutation 호출.
  const resolve = async (
    row: InstructorChangeRequestRow,
    verdict: '승인' | '반려',
    reason?: string,
  ) => {
    setResolved((prev) => ({ ...prev, [row.id]: verdict }))
    setSelectedId(null)
    try {
      await resolveMutation.mutateAsync({
        id: row.id,
        action: verdict === '승인' ? 'approved' : 'rejected',
        reason,
      })
      toast.success(`${row.target} 변경 제안 ${verdict}`)
    } catch {
      // 실패 시 낙관적 제거 롤백.
      setResolved((prev) => {
        const next = { ...prev }
        delete next[row.id]
        return next
      })
      toast.danger(`${row.target} 변경 제안 처리에 실패했어요`)
    }
  }

  const approve = (row: InstructorChangeRequestRow) => resolve(row, '승인')
  const confirmReject = (reason: string) => {
    if (!rejectTarget) return
    const target = rejectTarget
    setRejectTarget(null)
    resolve(target, '반려', reason)
  }

  const columns: Column<InstructorChangeRequestRow>[] = [
    {
      key: 'type',
      header: '유형',
      className: 'w-32',
      cell: (r) => (
        <StatusBadge
          label={TARGET_TYPE_META[r.type].label}
          tone={TARGET_TYPE_META[r.type].tone}
        />
      ),
    },
    {
      key: 'target',
      header: '대상',
      cell: (r) => (
        <div className="flex items-center gap-2">
          <p className="text-fg text-sm font-medium">{r.target}</p>
          {r.certifierAbsent && (
            <StatusBadge label="인증자 부재 — 매니저 대체" tone="info" />
          )}
        </div>
      ),
    },
    {
      key: 'requester',
      header: '요청자',
      className: 'w-32',
      cell: (r) => (
        <span className="text-fg-muted text-sm">
          {nameOf(r.requesterUserId)}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={CHANGE_REQUEST_STATUS_META[r.status].label}
          tone={CHANGE_REQUEST_STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-24',
      cell: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedId(r.id)
          }}
          className="border-border text-fg hover:bg-surface-muted rounded-lg border bg-white px-3.5 py-2 text-xs font-semibold"
        >
          검토
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 유형 탭 + 재인증 전환 (헤더 보조 버튼 — 06-11 결정) */}
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
          onClick={() => navigate('/instructor/recertifications')}
          className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-lg border px-3 py-1.5 text-xs font-medium"
        >
          재인증 검토 →
        </button>
      </div>

      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={() => refetch()}
        skeleton={<SkeletonListPage columns={5} className="" />}
        errorTitle="변경 제안을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
        className="mt-4"
      >
        {data && (
          <>
            {/* 검토 대기 큐 */}
            <section className="border-border bg-surface mt-4 rounded-xl border p-6">
              <p className="text-fg text-base font-bold">검토 대기 변경 제안</p>
              <div className="mt-4">
                <DataTable
                  columns={columns}
                  rows={rows}
                  rowKey={(r) => r.id}
                  onRowClick={(r) => setSelectedId(r.id)}
                  rowClassName={(r) =>
                    selected?.id === r.id ? 'bg-accent-bg/30' : ''
                  }
                  empty="검토 대기 중인 변경 제안이 없어요"
                />
              </div>
            </section>

            {/* 상세 패널 — 변경 전/후 비교 + 승인/반려 */}
            {selected && (
              <section className="border-border bg-surface mt-5 rounded-xl border p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    label={TARGET_TYPE_META[selected.type].label}
                    tone={TARGET_TYPE_META[selected.type].tone}
                  />
                  <p className="text-fg text-base font-bold">
                    {selected.target} · {nameOf(selected.requesterUserId)}
                  </p>
                  {selected.certifierAbsent && (
                    <StatusBadge
                      label="인증자 부재 — 매니저 대체 검토 가능"
                      tone="info"
                    />
                  )}
                </div>
                <p className="text-fg mt-5 text-sm font-bold">
                  변경된 내역만 보기
                </p>
                <div className="mt-2 flex flex-col gap-2.5">
                  {selected.changes.map((c, i) => (
                    <ChangeDiffCard key={c.id ?? i} item={c} />
                  ))}
                </div>
                <div className="mt-7 flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    disabled={resolveMutation.isPending}
                    onClick={() => setRejectTarget(selected)}
                  >
                    반려
                  </Button>
                  <Button
                    disabled={resolveMutation.isPending}
                    onClick={() => approve(selected)}
                  >
                    승인
                  </Button>
                </div>
              </section>
            )}

            <ReasonModal
              open={rejectTarget !== null}
              title="변경 제안을 반려할까요?"
              description="반려 사유는 요청자에게 전달되며, 사유 작성은 필수입니다."
              confirmLabel="반려"
              placeholder="예: 변경 근거가 부족합니다. 측정 방법을 함께 첨부해 주세요."
              pending={resolveMutation.isPending}
              onClose={() => setRejectTarget(null)}
              onConfirm={confirmReject}
            />
          </>
        )}
      </DataBoundary>
    </div>
  )
}
