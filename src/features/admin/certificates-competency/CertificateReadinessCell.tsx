import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { formatDateTime } from '@/shared/lib/date'
import type {
  CertificateAdminAnalysisStatus,
  CertificateGoldStatus,
  CompetencyCertRow,
} from './types'

const GOLD_META: Record<
  CertificateGoldStatus,
  { label: string; tone: BadgeTone }
> = {
  UNKNOWN: { label: 'Gold 확인 전', tone: 'neutral' },
  READY: { label: 'Gold 준비', tone: 'success' },
  PARTIAL: { label: 'Gold 일부 누락', tone: 'warning' },
  NOT_READY: { label: 'Gold 미준비', tone: 'warning' },
  UNAVAILABLE: { label: 'Gold 없음', tone: 'danger' },
  CHECK_FAILED: { label: 'Gold 확인 실패', tone: 'danger' },
}

const ANALYSIS_META: Record<
  CertificateAdminAnalysisStatus,
  { label: string; tone: BadgeTone }
> = {
  UNKNOWN: { label: 'AI 확인 전', tone: 'neutral' },
  WAITING_FOR_GOLD: { label: 'Gold 준비 대기', tone: 'warning' },
  NOT_STARTED: { label: 'AI 실행 전', tone: 'neutral' },
  QUEUED: { label: 'AI 대기 중', tone: 'info' },
  GENERATING: { label: 'AI 생성 중', tone: 'info' },
  READY: { label: '7개 탭 준비', tone: 'success' },
  FAILED: { label: 'AI 생성 실패', tone: 'danger' },
  CHECK_FAILED: { label: 'AI 상태 확인 실패', tone: 'danger' },
}

function CheckedAt({ value }: { value: string | null }) {
  return value ? (
    <span className="text-fg-subtle text-[10px]">
      확인 {formatDateTime(value)}
    </span>
  ) : null
}

function NotificationState({
  failed,
  notifiedAt,
}: {
  failed: boolean
  notifiedAt: string | null
}) {
  if (!failed) return null
  return (
    <span className={notifiedAt ? 'text-warning' : 'text-danger'}>
      {notifiedAt
        ? `담당 매니저 알림 ${formatDateTime(notifiedAt)}`
        : '담당 매니저 알림 대기'}
    </span>
  )
}

/** 실패 원인과 조치가 상태 배지에서 떨어지면 운영자가 재처리할 수 없어 한 칸에 묶는다. */
export function CertificateReadinessCell({ row }: { row: CompetencyCertRow }) {
  const gold = GOLD_META[row.goldStatus]
  const analysis = ANALYSIS_META[row.analysisStatus]
  const goldFailed = !['UNKNOWN', 'READY'].includes(row.goldStatus)
  const analysisFailed = row.analysisStatus === 'FAILED'

  return (
    <div className="grid min-w-[34rem] grid-cols-2 gap-4 py-1">
      <section className="border-divider flex flex-col items-start gap-1.5 border-r pr-4">
        <StatusBadge tone={gold.tone} label={gold.label} />
        {row.goldIssues.slice(0, 2).map((issue) => (
          <div
            key={issue.code}
            className="text-fg-subtle text-[11px] leading-4"
          >
            <strong className="text-fg block font-semibold">
              {issue.label}
            </strong>
            <span className="block">원천 {issue.source}</span>
            <span className="block">조치 {issue.resolution}</span>
          </div>
        ))}
        {row.goldIssues.length > 2 && (
          <span className="text-fg-subtle text-[11px]">
            추가 원인 {row.goldIssues.length - 2}건
          </span>
        )}
        <CheckedAt value={row.goldCheckedAt} />
        <NotificationState
          failed={goldFailed}
          notifiedAt={row.goldManagerNotifiedAt}
        />
      </section>

      <section className="flex flex-col items-start gap-1.5">
        <StatusBadge tone={analysis.tone} label={analysis.label} />
        {row.analysisFailure && (
          <div className="text-fg-subtle text-[11px] leading-4">
            <strong className="text-fg block font-semibold">
              {row.analysisFailure.label}
            </strong>
            <span className="block">원천 {row.analysisFailure.source}</span>
            <span className="block">조치 {row.analysisFailure.resolution}</span>
            <span className="block">
              {row.analysisFailure.retryable ? '재실행 가능' : '원천 보완 필요'}
            </span>
          </div>
        )}
        {row.analysisSourceVersion && (
          <span className="text-fg-subtle max-w-56 truncate font-mono text-[10px]">
            source {row.analysisSourceVersion}
          </span>
        )}
        <CheckedAt value={row.analysisCheckedAt} />
        <NotificationState
          failed={analysisFailed}
          notifiedAt={row.analysisManagerNotifiedAt}
        />
      </section>
    </div>
  )
}
