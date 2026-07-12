import { Inbox } from 'lucide-react'
import { formatDateDot } from '@/shared/lib/date'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import type { CohortBoard } from './types'
import { STATUS_META } from './dashboardConstants'
import {
  BarRow,
  IssueList,
  Panel,
  PanelEmpty,
  RiskList,
} from './dashboardParts'

/* ─────────────── 기수 딥다이브 뷰 ─────────────── */

export function CohortDeepDive({
  board,
  hrdPending,
  hideHeader,
}: {
  board: CohortBoard
  hrdPending?: boolean
  /** 모달에서 제목이 이미 있을 때 내부 헤더를 숨긴다. 소스·기간 배지는 유지. */
  hideHeader?: boolean
}) {
  const meta = STATUS_META[board.status]

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {!hideHeader && (
          <p className="text-fg text-[15px] font-bold">
            {board.courseName} {board.cohortLabel}
          </p>
        )}
        <StatusBadge label={meta.label} tone={meta.tone} />
        {board.source === 'hrd-live' && (
          <StatusBadge label="HRD-Net 라이브" tone="info" />
        )}
        {board.source === 'staging' && (
          <StatusBadge label="인입 데이터" tone="neutral" />
        )}
        <p className="text-fg-subtle text-[12px]">
          {formatDateDot(board.startDate)} – {formatDateDot(board.endDate)}
        </p>
      </div>

      {!board.hasData ? (
        <div className="mt-4">
          {hrdPending ? (
            <p className="text-fg-muted py-10 text-center text-[13px]">
              HRD-Net에서 출결 데이터를 불러오는 중…
            </p>
          ) : (
            <Empty
              icon={<Inbox />}
              title="아직 인입된 데이터가 없어요"
              description="CSV 매핑·업로드에서 이 기수의 출결·평가 데이터를 인입하면 여기에 집계가 표시됩니다."
            />
          )}
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="수강생"
              value={`${board.students?.active ?? 0}명`}
              hint={
                board.students && board.students.dropout > 0
                  ? `중도탈락 ${board.students.dropout}명 포함 ${board.students.total}명 입과`
                  : `입과 ${board.students?.total ?? 0}명`
              }
            />
            <KpiCard
              label="오늘 출석"
              value={
                board.attendance?.todayTotal != null
                  ? `${board.attendance.todayPresent}/${board.attendance.todayTotal}`
                  : '—'
              }
              hint={
                board.attendance?.todayTotal != null
                  ? `결석 ${board.attendance.todayAbsentees.length}명`
                  : board.status === 'ended'
                    ? '과정 종료'
                    : '오늘 수업 없음'
              }
            />
            <KpiCard
              label={board.status === 'ended' ? '최종 출석률' : '평균 출석률'}
              value={
                board.attendance?.avgRate != null
                  ? `${board.attendance.avgRate}%`
                  : '—'
              }
              hint="전체 수업일 기준"
            />
            <KpiCard
              label="성취도 평균"
              value={
                board.assessment?.avg != null
                  ? `${board.assessment.avg}점`
                  : '—'
              }
              hint={
                board.assessment && board.assessment.rounds.length > 0
                  ? `${board.assessment.rounds.length}회차 평가 기준`
                  : '평가 전'
              }
            />
          </div>

          {/* 차트 2열 */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="최근 수업일 출석률" sub="단위 %">
              {board.attendance && board.attendance.weekly.length > 0 ? (
                <BarRow
                  items={board.attendance.weekly.map((w) => ({
                    label: w.date.slice(5).replace('-', '/'),
                    value: w.rate,
                  }))}
                  max={100}
                  min={60}
                  unit="%"
                />
              ) : (
                <PanelEmpty text="출석 데이터가 없어요" />
              )}
            </Panel>

            <Panel
              title={
                board.attendance?.todayTotal != null
                  ? '오늘 결석자'
                  : '관리 필요 수강생'
              }
            >
              {board.attendance?.todayTotal != null ? (
                board.attendance.todayAbsentees.length === 0 ? (
                  <PanelEmpty text="전원 출석이에요" />
                ) : (
                  <IssueList
                    rows={board.attendance.todayAbsentees.map((a) => ({
                      key: a.studentUuid,
                      name: a.name,
                      desc: a.detail,
                    }))}
                  />
                )
              ) : board.issues.length === 0 ? (
                <PanelEmpty text="지각·결석 반복 수강생이 없어요" />
              ) : (
                <RiskList issues={board.issues} />
              )}
            </Panel>
          </div>

          {/* 성취도 회차별 */}
          {board.assessment && board.assessment.rounds.length > 0 && (
            <div className="mt-4">
              <Panel title="성취도 평가 회차별 평균" sub="100점 만점">
                <BarRow
                  items={board.assessment.rounds.map((r) => ({
                    label: `${r.round}회차`,
                    value: r.avg,
                  }))}
                  max={100}
                  min={0}
                  unit="점"
                  narrow
                />
              </Panel>
            </div>
          )}

          {/* 승인 대기 */}
          {board.pending &&
            board.pending.certificates + board.pending.troubleshooting > 0 && (
              <p className="text-fg-muted mt-4 text-[12.5px]">
                승인 대기 — 자격증 {board.pending.certificates}건 · 트러블슈팅{' '}
                {board.pending.troubleshooting}건
              </p>
            )}
        </>
      )}
    </>
  )
}
