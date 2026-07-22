// 팀 상세 멘토링 일지 타임라인 섹션 — 항목 클릭 시 검토 모달 오픈. TeamDetailBody에서 분리.
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LOG_STATUS_META } from './statusMeta'
import { logColorOf } from './logColors'
import type { AdminTeamLogBrief } from './types'

export function LogTimelineSection({
  logs,
  onReview,
}: {
  logs: AdminTeamLogBrief[]
  onReview: (logId: string) => void
}) {
  return (
    <section className="border-border bg-surface rounded-xl border">
      <div className="border-border flex items-center justify-between border-b px-5 py-3.5">
        <p className="text-fg text-[15px] font-bold">멘토링 일지</p>
        <Link
          to="/admin/mentoring/logs"
          className="text-brand hover:text-brand-deep text-[12px] font-semibold"
        >
          전체 보기
        </Link>
      </div>
      {logs.length === 0 ? (
        <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
          작성된 일지가 없어요
        </p>
      ) : (
        <ol className="px-5 py-4">
          {logs.map((log, i) => {
            const key =
              log.resubmitted && log.status === 'valid'
                ? 'resubmitted_valid'
                : log.status
            const meta = LOG_STATUS_META[key] ?? {
              label: log.status,
              tone: 'neutral' as const,
            }
            const color = logColorOf(log.status, log.resubmitted)
            const last = i === logs.length - 1
            return (
              <li
                key={log.logId}
                className="relative flex gap-3 pb-4 last:pb-0"
              >
                {/* 타임라인 축 */}
                <div className="relative flex flex-col items-center">
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white"
                    style={{ background: color }}
                  />
                  {!last && (
                    <span className="bg-border w-px flex-1" aria-hidden />
                  )}
                </div>
                {/* 항목 클릭 → 검토 모달(상세·승인·수정요청) */}
                <button
                  type="button"
                  onClick={() => onReview(log.logId)}
                  className="hover:bg-surface-muted -mx-2 -my-1 flex min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-2 py-1 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-fg text-[13px] font-semibold">
                      {log.roundLabel}
                    </p>
                    <p className="text-fg-subtle text-[11px]">
                      {log.performedAtLabel}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    {log.recognizedHours !== null && (
                      <span className="text-fg-muted text-[12px] tabular-nums">
                        {log.recognizedHours}h
                      </span>
                    )}
                    <StatusBadge label={meta.label} tone={meta.tone} />
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
