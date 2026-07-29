import { useMemo, useState } from 'react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import type { ProjectCertReviewStatus, ProjectReviewRow } from '@/shared/types'
import {
  useCertifyProject,
  useProjectReviews,
  useRequestProjectChanges,
  useRevokeProjectCertification,
} from '../api/reviews'
import { SupplementRequestModal } from '../assignments/SupplementRequestModal'
import { COHORT_ALL, cohortOptions } from './cohort'
import {
  useCohortContext,
  COHORT_ID_TO_LABEL,
  COHORT_LABEL_TO_ID,
} from '../cohortContext'
import { QueueFilterBar, QueueStats } from './QueueShell'
import { ReviewDetailPanel, type ReviewDetailTarget } from './ReviewDetailPanel'
import { RevokeCertificationModal } from './RevokeCertificationModal'
import { REVIEW_TABS, RouteTabBar } from '../components/RouteTabBar'

type StatusFilter = 'all' | ProjectCertReviewStatus

const STATUS_META: Record<
  ProjectCertReviewStatus,
  { label: string; tone: BadgeTone }
> = {
  requested: { label: '인증 요청', tone: 'warning' },
  supplementing: { label: '보완 중', tone: 'danger' },
  certified: { label: '인증 완료', tone: 'success' },
}

// 프로젝트 검토 (/instructor/projects/review) — §14. (Figma 1422:10276)
// 발표 후 인증 큐 — 인증 시 ProjectCertification 생성, 인증 후 학생 직접 수정 불가(§11 변경 제안 분리).
// embedded=true면 과정·기수·교과목 '프로젝트' 탭에 임베드(자체 헤더·탭·기수 필터 생략, 선택 기수로 스코프).
export default function ProjectReviewPage({
  embedded = false,
  cohortId: propCohortId = null,
}: {
  embedded?: boolean
  cohortId?: string | null
} = {}) {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useProjectReviews()
  const certify = useCertifyProject()
  const requestChanges = useRequestProjectChanges()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  // 선택 기수 — 대시보드와 공유하는 공용 컨텍스트(화면 이동에도 유지).
  const { cohortId, setCohortId } = useCohortContext()
  // 보완 요청 모달 대상(사유 필수). 단위 테스트의 모킹 쿼리는 refetch가 없어
  // mutation 성공 시 낙관적 로컬 패치로 상태를 즉시 반영한다.
  const [supplementTarget, setSupplementTarget] =
    useState<ProjectReviewRow | null>(null)
  const [localStatus, setLocalStatus] = useState<
    Record<string, ProjectCertReviewStatus>
  >({})
  // 상세 패널 대상 — 행을 클릭하면 열린다(액션 컬럼은 없앴다: '결과'·'확인'·'상세'가
  // 모두 같은 상세를 열어 무엇이 다른지 알 수 없었다). 인증·보완 요청은 상세 안에서 한다.
  const revoke = useRevokeProjectCertification()
  // 인증 취소 대상 — 확인 문구를 입력받는 모달을 거친다.
  const [revokeTarget, setRevokeTarget] = useState<typeof detailRow>(null)
  const [detailTarget, setDetailTarget] = useState<ReviewDetailTarget>(null)
  usePageHeader(
    '프로젝트 검토',
    '수강생의 프로젝트를 검토하고 인증합니다',
    !embedded,
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
      // 임베드는 선택 기수(실 UUID)로 스코프, 일반은 기수 라벨 탭으로 필터.
      if (embedded) {
        if (propCohortId && r.cohortId !== propCohortId) return false
      } else if (cohort !== COHORT_ALL && r.cohortLabel !== cohort) {
        return false
      }
      if (status !== 'all' && r.status !== status) return false
      if (needle) {
        const hay = `${r.name} ${r.team}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [data, q, status, cohort, localStatus, embedded, propCohortId])

  // 상세 패널이 띄운 행 — 액션 노출 여부(pending)와 보완 요청 대상 판단에 쓴다.
  const detailRow =
    detailTarget?.kind === 'project'
      ? (filtered.find((r) => r.id === detailTarget.id) ?? null)
      : null

  const onCertify = (row: ProjectReviewRow) => {
    certify.mutate(
      { id: row.id },
      {
        onSuccess: () => {
          setLocalStatus((m) => ({ ...m, [row.id]: 'certified' }))
          toast.success(`${row.name} 인증 — ProjectCertification 생성`)
        },
        onError: () => toast.danger('인증 처리에 실패했어요'),
      },
    )
  }

  const onRequestChanges = (row: ProjectReviewRow, reason: string) => {
    requestChanges.mutate(
      { id: row.id, reason },
      {
        onSuccess: () => {
          setLocalStatus((m) => ({ ...m, [row.id]: 'supplementing' }))
          toast.success(`${row.name} 보완 요청을 보냈어요`)
        },
        onError: () => toast.danger('보완 요청에 실패했어요'),
      },
    )
  }

  const columns: Column<ProjectReviewRow>[] = [
    {
      key: 'name',
      header: '프로젝트명',
      cell: (r) => (
        <span className="text-fg text-sm font-medium">{r.name}</span>
      ),
    },
    {
      key: 'cohort',
      header: '과정/기수',
      className: 'w-24',
      cell: (r) => <StatusBadge label={r.cohortLabel} tone="info" />,
    },
    {
      key: 'team',
      header: '팀',
      // "5명 (PM 박지훈)"이 줄바꿈되지 않도록 여유 폭 확보.
      className: 'w-40',
      cell: (r) => <span className="text-fg-muted text-sm">{r.team}</span>,
    },
    {
      key: 'stack',
      header: '기술 스택',
      className: 'w-44',
      cell: (r) => (
        <span title={r.stack} className="text-fg-muted block truncate text-sm">
          {r.stack}
        </span>
      ),
    },
    {
      key: 'artifacts',
      header: '산출물',
      // StatusBadge는 nowrap — "GitHub · 발표 · 영상"이 들어갈 폭.
      className: 'w-44',
      cell: (r) =>
        r.artifacts === null ? (
          <span className="text-fg-muted text-sm">-</span>
        ) : (
          <StatusBadge label={r.artifacts} tone="neutral" />
        ),
    },
    {
      key: 'status',
      header: '인증 상태',
      className: 'w-28',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="인증 큐를 불러오는 중…"
      errorTitle="인증 큐를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className={embedded ? '' : 'p-8'}
    >
      {data && (
        <div className={embedded ? '' : 'p-8'}>
          {!embedded && <RouteTabBar tabs={REVIEW_TABS} />}
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
                key: 'requested' as StatusFilter,
                label: '인증 요청',
                count: data.counts.requested,
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
            cohortTabs={embedded ? [] : cohortTabs}
            activeCohort={cohort}
            onCohort={(c) => setCohortId(COHORT_LABEL_TO_ID[c] ?? 'all')}
          />
          <div className="mt-3">
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              onRowClick={(r) => setDetailTarget({ kind: 'project', id: r.id })}
              empty="조건에 맞는 프로젝트가 없어요"
            />
          </div>

          <ReviewDetailPanel
            target={detailTarget}
            cohortId={propCohortId}
            onClose={() => setDetailTarget(null)}
            actions={
              detailRow
                ? {
                    pending: detailRow.status === 'requested',
                    certified: detailRow.status === 'certified',
                    onRevoke: () => setRevokeTarget(detailRow),
                    busy: certify.isPending || requestChanges.isPending || revoke.isPending,
                    onCertify: () => {
                      onCertify(detailRow)
                      setDetailTarget(null)
                    },
                    onRequestChanges: () => setSupplementTarget(detailRow),
                  }
                : undefined
            }
          />
          <RevokeCertificationModal
            open={revokeTarget !== null}
            targetName={revokeTarget?.name ?? ''}
            busy={revoke.isPending}
            onClose={() => setRevokeTarget(null)}
            onConfirm={(reason) => {
              const target = revokeTarget
              if (!target) return
              revoke.mutate(
                { id: target.id, reason },
                {
                  onSuccess: () => {
                    setLocalStatus((m) => ({ ...m, [target.id]: 'requested' }))
                    setRevokeTarget(null)
                    setDetailTarget(null)
                    toast.success(`${target.name} 인증을 취소했어요`)
                  },
                  onError: () => toast.danger('인증을 취소하지 못했어요'),
                },
              )
            }}
          />
          <SupplementRequestModal
            open={supplementTarget !== null}
            studentName={supplementTarget?.name ?? ''}
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
