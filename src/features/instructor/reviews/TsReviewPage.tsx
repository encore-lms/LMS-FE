import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type { TsReviewRow, TsReviewStatus } from '@/shared/types'
import {
  useCertifyTroubleshooting,
  useRequestTsChanges,
  useTsReviews,
} from '../api/reviews'
import { SupplementRequestModal } from '../assignments/SupplementRequestModal'
import { COHORT_ALL, cohortOptions } from './cohort'
import {
  useCohortContext,
  COHORT_ID_TO_LABEL,
  COHORT_LABEL_TO_ID,
} from '../cohortContext'
import { QueueFilterBar, QueueStats } from './QueueShell'

type StatusFilter = 'all' | TsReviewStatus

const STATUS_META: Record<
  TsReviewStatus,
  { label: string; tone: BadgeTone; action: string }
> = {
  pending: { label: '검토 대기', tone: 'warning', action: '인증' },
  supplementing: { label: '보완 중', tone: 'danger', action: '확인' },
  certified: { label: '인증 완료', tone: 'success', action: '결과' },
}

// 트러블슈팅 검토 (/instructor/troubleshooting/review) — §15. (Figma 1422:10543)
// STAR 사례 인증 큐 — 인증 시 TroubleshootingCertification 생성, 인증 후 직접 수정 불가(§12 변경 제안 분리).
export default function TsReviewPage() {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useTsReviews()
  const certify = useCertifyTroubleshooting()
  const requestChanges = useRequestTsChanges()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  // 선택 기수 — 대시보드와 공유하는 공용 컨텍스트(화면 이동에도 유지).
  const { cohortId, setCohortId } = useCohortContext()
  // 보완 요청 모달 대상(사유 필수). 모킹 쿼리는 refetch가 없어 mutation 성공 시
  // 낙관적 로컬 패치로 상태를 즉시 반영한다.
  const [supplementTarget, setSupplementTarget] = useState<TsReviewRow | null>(
    null,
  )
  const [localStatus, setLocalStatus] = useState<
    Record<string, TsReviewStatus>
  >({})
  usePageHeader(
    '트러블슈팅 검토',
    '수강생의 트러블슈팅 사례를 검토하고 인증합니다',
  )

  const cohortTabs = useMemo(
    () => cohortOptions(data?.rows ?? []),
    [data?.rows],
  )
  // 공용 컨텍스트 선택 기수를 이 화면 옵션에 매핑(옵션에 없으면 전체).
  const ctxLabel = COHORT_ID_TO_LABEL[cohortId] ?? COHORT_ALL
  const cohort = cohortTabs.includes(ctxLabel) ? ctxLabel : COHORT_ALL

  const filtered = useMemo(() => {
    const rows = (data?.rows ?? []).map((r) =>
      localStatus[r.id] ? { ...r, status: localStatus[r.id] } : r,
    )
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (cohort !== COHORT_ALL && r.cohortLabel !== cohort) return false
      if (status !== 'all' && r.status !== status) return false
      if (needle && !r.studentName.toLowerCase().includes(needle)) return false
      return true
    })
  }, [data, q, status, cohort, localStatus])

  const onCertify = (row: TsReviewRow) => {
    certify.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          setLocalStatus((m) => ({ ...m, [row.id]: 'certified' }))
          toast.success(`${row.title} 인증 — TroubleshootingCertification 생성`)
        },
        onError: () => toast.danger('인증 처리에 실패했어요'),
      },
    )
  }

  const onRequestChanges = (row: TsReviewRow, reason: string) => {
    requestChanges.mutate(
      { id: row.id, reason },
      {
        onSuccess: () => {
          setLocalStatus((m) => ({ ...m, [row.id]: 'supplementing' }))
          toast.success(`${row.title} 보완 요청을 보냈어요`)
        },
        onError: () => toast.danger('보완 요청에 실패했어요'),
      },
    )
  }

  const columns: Column<TsReviewRow>[] = [
    {
      key: 'student',
      header: '수강생',
      className: 'w-32',
      cell: (r) => (
        <div>
          <p className="text-fg text-sm font-medium">{r.studentName}</p>
          <p className="text-fg-subtle text-xs">{r.cohortLabel}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: '사례 제목',
      cell: (r) => <StatusBadge label={r.title} tone="neutral" />,
    },
    {
      key: 'category',
      header: '카테고리',
      className: 'w-28',
      cell: (r) => <span className="text-fg-muted text-sm">{r.category}</span>,
    },
    {
      key: 'solved',
      header: '독립해결·소요',
      className: 'w-32',
      cell: (r) =>
        r.solvedBy === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <div>
            <p className="text-fg text-sm font-medium">{r.solvedBy}</p>
            <p className="text-fg-subtle text-xs">{r.durationDays}</p>
          </div>
        ),
    },
    {
      key: 'project',
      header: '발표 프로젝트',
      className: 'w-32',
      cell: (r) =>
        r.project === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <StatusBadge label={r.project} tone="neutral" />
        ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-40',
      cell: (r) => (
        <div className="flex gap-1.5">
          {r.status === 'pending' ? (
            <>
              <Button
                size="sm"
                disabled={certify.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  onCertify(r)
                }}
              >
                인증
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={requestChanges.isPending}
                onClick={(e) => {
                  e.stopPropagation()
                  setSupplementTarget(r)
                }}
              >
                보완 요청
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.info(`${r.title} — 준비 중입니다.`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              {STATUS_META[r.status].action}
            </button>
          )}
          {!(r.status === 'certified' && r.solvedBy === null) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.info(`${r.title} 상세는 준비 중입니다.`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              상세
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="사례 큐를 불러오는 중…"
      errorTitle="사례 큐를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          <QueueStats stats={data.stats} />
          <QueueFilterBar
            q={q}
            onSearch={setQ}
            searchPlaceholder="이름으로 검색"
            tabs={[
              {
                key: 'all' as StatusFilter,
                label: '전체',
                count: data.counts.all,
              },
              {
                key: 'pending' as StatusFilter,
                label: '검토 대기',
                count: data.counts.pending,
              },
              {
                key: 'supplementing' as StatusFilter,
                label: '보완 중',
                count: data.counts.supplementing,
              },
              {
                key: 'certified' as StatusFilter,
                label: '인증 완료',
                count: data.counts.certified,
              },
            ]}
            active={status}
            onTab={setStatus}
            cohortTabs={cohortTabs}
            activeCohort={cohort}
            onCohort={(c) => setCohortId(COHORT_LABEL_TO_ID[c] ?? 'all')}
          />
          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty="조건에 맞는 사례가 없어요"
            />
          </div>
          <p className="text-fg-subtle mt-3 text-xs">
            인증 시 TroubleshootingCertification 기록이 생성되며, 인증 후 학생
            직접 수정은 차단됩니다 (변경 제안 흐름)
          </p>

          <SupplementRequestModal
            open={supplementTarget !== null}
            studentName={supplementTarget?.studentName ?? ''}
            onClose={() => setSupplementTarget(null)}
            onConfirm={(reason) => {
              const target = supplementTarget
              setSupplementTarget(null)
              if (target) onRequestChanges(target, reason)
            }}
          />
        </div>
      )}
    </DataBoundary>
  )
}
