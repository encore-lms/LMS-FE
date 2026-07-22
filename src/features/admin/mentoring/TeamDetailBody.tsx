// 멘토링 팀 상세 본문 — 헤더·개요·차트·타임라인·명단·관리 모달 조립. MentoringTeamDetailPage에서 분리.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, FileText } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { useMentorAssignments } from './api'
import {
  ASSIGNMENT_STATUS_META,
  progressFillClass,
  type AssignmentDisplayStatus,
} from './statusMeta'
import { AssignmentManageModal } from './AssignmentManageModal'
import { AddMenteesModal } from './AddMenteesModal'
import { EarlyEndModal } from './EarlyEndModal'
import { LogReviewModal } from './LogReviewModal'
import { RoundHoursBarChart } from './RoundHoursBarChart'
import { LogStatusDonut } from './LogStatusDonut'
import { TeamAlertStrip } from './TeamAlertStrip'
import { LogTimelineSection } from './LogTimelineSection'
import { MenteeRosterSection } from './MenteeRosterSection'
import type { AdminMentoringTeamDetail, MentorAssignmentRow } from './types'

/** 로드 후 본문 — 파생 상태·배정 보드 조회가 non-null 상세를 전제하므로 분리. */
export function TeamDetailBody({ d }: { d: AdminMentoringTeamDetail }) {
  // 관리 모달은 배정 보드의 row(멘토 교체 등에 필요)로 동작 — 이 팀의 기수 보드에서 row를 찾는다.
  const board = useMentorAssignments(d.cohortId)
  const [manageOpen, setManageOpen] = useState(false)
  const [earlyEndOpen, setEarlyEndOpen] = useState(false)
  const [addMenteesOpen, setAddMenteesOpen] = useState(false)
  const [reviewLogId, setReviewLogId] = useState<string | null>(null)

  const displayStatus: AssignmentDisplayStatus = !d.assignmentId
    ? 'unassigned'
    : d.status === 'early_ended'
      ? 'early_ended'
      : d.nHoursDone
        ? 'n_hours_done'
        : 'in_progress'
  const statusMeta = ASSIGNMENT_STATUS_META[displayStatus]
  const progress = d.recognizedHours ?? 0
  const remaining =
    d.allocatedHours !== null ? Math.max(0, d.allocatedHours - progress) : null
  const pct = d.recognizedPct
  const boardRow: MentorAssignmentRow | undefined = board.data?.rows.find(
    (r) => r.teamId === d.teamId,
  )
  const isInProgress = displayStatus === 'in_progress'

  return (
    <>
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-fg text-xl font-bold">{d.teamName}</h1>
            <StatusBadge label={statusMeta.label} tone={statusMeta.tone} />
          </div>
          <p className="text-fg-subtle mt-1 text-[13px]">
            멘티 {d.members.length}명
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {boardRow && (
            <button
              type="button"
              onClick={() => setManageOpen(true)}
              className="border-border text-fg-muted hover:bg-surface-muted bg-surface rounded-md border px-3 py-2 text-[12px] font-bold"
            >
              수정
            </button>
          )}
          <Link
            to={`/admin/mentoring/teams/${d.teamId}/log-fields`}
            className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1 rounded-md border px-3 py-2 text-[12px] font-bold"
          >
            <FileText className="h-3.5 w-3.5" />
            일지 항목
          </Link>
          {boardRow && isInProgress && (
            <button
              type="button"
              onClick={() => setEarlyEndOpen(true)}
              className="border-warning text-warning hover:bg-warning/10 bg-surface rounded-md border px-3 py-2 text-[12px] font-bold"
            >
              조기 종료
            </button>
          )}
        </div>
      </div>

      {/* 할 일·경고 스트립 */}
      <TeamAlertStrip
        d={d}
        displayStatus={displayStatus}
        isInProgress={isInProgress}
        remaining={remaining}
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* 좌 — 개요 + 추이 차트 + 일지 타임라인 */}
        <div className="flex flex-col gap-5">
          {/* 개요 */}
          <section className="border-border bg-surface rounded-xl border p-5">
            <div className="flex items-center gap-3">
              {d.mentor ? (
                <>
                  <Avatar name={d.mentor.name} size={40} />
                  <div>
                    <p className="text-fg-subtle text-[11px]">멘토</p>
                    <p className="text-fg text-[15px] font-bold">
                      {d.mentor.name}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <span className="bg-fg-subtle text-on-color inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
                    ?
                  </span>
                  <p className="text-fg-subtle text-[15px] font-medium">
                    멘토 미배정
                  </p>
                </>
              )}
            </div>
            <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-fg-muted inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  진행{' '}
                  <b className="text-fg tabular-nums">
                    {d.recognizedHours !== null ? `${progress}h` : '-'}
                  </b>
                  {remaining !== null && (
                    <>
                      {' · '}잔여{' '}
                      <b className="text-fg tabular-nums">{remaining}h</b>
                    </>
                  )}
                </span>
                {d.allocatedHours !== null && (
                  <span className="text-fg-subtle tabular-nums">
                    배정 {d.allocatedHours}h{pct !== null && ` · ${pct}%`}
                  </span>
                )}
              </div>
              {pct !== null && (
                <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      progressFillClass(pct),
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </section>

          {/* 회차별 인정 시간 */}
          <section className="border-border bg-surface rounded-xl border p-5">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-fg text-[15px] font-bold">회차별 인정 시간</p>
              <span className="text-fg-subtle text-[12px]">
                누적 {progress}h
                {d.allocatedHours !== null && ` / 배정 ${d.allocatedHours}h`}
              </span>
            </div>
            {d.logs.length === 0 ? (
              <p className="text-fg-subtle py-8 text-center text-[13px]">
                아직 일지가 없어요
              </p>
            ) : (
              <RoundHoursBarChart logs={d.logs} />
            )}
          </section>

          {/* 일지 타임라인 */}
          <LogTimelineSection logs={d.logs} onReview={setReviewLogId} />
        </div>

        {/* 우 — 일지 상태 도넛 + 멘티 명단 */}
        <div className="flex flex-col gap-5">
          <section className="border-border bg-surface h-fit rounded-xl border">
            <div className="border-border border-b px-5 py-3.5">
              <p className="text-fg text-[15px] font-bold">일지 상태 분포</p>
            </div>
            <LogStatusDonut logs={d.logs} />
          </section>

          <MenteeRosterSection
            members={d.members}
            onAdd={() => setAddMenteesOpen(true)}
          />
        </div>
      </div>

      {/* 관리 모달 */}
      {manageOpen && boardRow && board.data && (
        <AssignmentManageModal
          open
          onClose={() => setManageOpen(false)}
          row={boardRow}
          data={board.data}
        />
      )}
      {earlyEndOpen && boardRow && (
        <EarlyEndModal
          open
          onClose={() => setEarlyEndOpen(false)}
          row={boardRow}
        />
      )}
      {addMenteesOpen && (
        <AddMenteesModal
          open
          onClose={() => setAddMenteesOpen(false)}
          teamId={d.teamId}
          cohortId={d.cohortId}
          existingIds={d.members.map((m) => m.userId)}
        />
      )}
      {reviewLogId && (
        <LogReviewModal
          open
          onClose={() => setReviewLogId(null)}
          logId={reviewLogId}
        />
      )}
    </>
  )
}
