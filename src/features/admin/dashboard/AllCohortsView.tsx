import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatDateDot } from '@/shared/lib/date'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { DashboardInsight } from './DashboardInsight'
import { QuickLinks } from './QuickLinks'
import { Sparkline } from './Sparkline'
import type { CohortBoard, ScheduleItem } from './types'
import { STATUS_META, cohortColor } from './dashboardConstants'
import { NoData, RiskList } from './dashboardParts'

// 오늘부터 거꾸로 주말(토·일) 제외 최근 n영업일(ISO, 과거→최근) — BE issueDays 부재 시 축 폴백.
function recentBusinessDays(n: number): string[] {
  const days: string[] = []
  const d = new Date()
  while (days.length < n) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      days.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      )
    }
    d.setDate(d.getDate() - 1)
  }
  return days.reverse()
}

/* ─────────────── 전체 비교 뷰 ─────────────── */

export function AllCohortsView({
  boards,
  quarantineCount,
  today,
  upcoming,
  onSelect,
}: {
  boards: CohortBoard[]
  quarantineCount: number
  today: string
  upcoming: ScheduleItem[]
  onSelect: (cohortId: string) => void
}) {
  const columns: Column<CohortBoard>[] = [
    {
      key: 'cohort',
      header: '기수',
      cell: (b) => (
        <span className="flex items-center gap-2.5">
          <i
            className="h-6 w-[3px] shrink-0 rounded-full"
            style={{ background: cohortColor(boards.indexOf(b)) }}
            aria-hidden
          />
          <span>
            <span className="text-fg block text-[13px] font-bold">
              {b.cohortLabel}
            </span>
            <span className="text-fg-subtle block text-[12px]">
              {formatDateDot(b.startDate)}–{formatDateDot(b.endDate)}
              {b.source === 'hrd-live' && (
                <span className="text-info ml-1.5 font-semibold">
                  HRD 라이브
                </span>
              )}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-24',
      cell: (b) => (
        <StatusBadge
          label={STATUS_META[b.status].label}
          tone={STATUS_META[b.status].tone}
        />
      ),
    },
    {
      key: 'students',
      header: '수강생',
      className: 'w-28',
      cell: (b) =>
        b.students ? (
          <span className="text-fg text-[13px] tabular-nums">
            {b.students.active}명
            {b.students.dropout > 0 && (
              <span className="text-fg-subtle text-[11px]">
                {' '}
                · 탈락 {b.students.dropout}
              </span>
            )}
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'today',
      header: '오늘 출석',
      className: 'w-24',
      cell: (b) =>
        b.attendance?.todayTotal != null ? (
          <span className="text-fg text-[13px] font-semibold tabular-nums">
            {b.attendance.todayPresent}/{b.attendance.todayTotal}
          </span>
        ) : (
          <span className="text-fg-subtle text-[12px]">
            {b.status === 'ended'
              ? '종료'
              : b.status === 'upcoming'
                ? '개강 전'
                : '—'}
          </span>
        ),
    },
    {
      key: 'trend',
      header: '출석률 추이',
      className: 'w-44',
      cell: (b) =>
        b.attendance && b.attendance.weekly.length >= 2 ? (
          <span className="flex items-center gap-2">
            <Sparkline
              points={b.attendance.weekly.map((w) => w.rate)}
              width={110}
              height={30}
              stroke={cohortColor(boards.indexOf(b))}
              todayIndex={b.attendance.weekly.length - 1}
            />
            <span className="text-fg text-[12px] font-semibold tabular-nums">
              {b.attendance.avgRate}%
            </span>
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'assessment',
      header: '성취도',
      className: 'w-20',
      cell: (b) =>
        b.assessment?.avg != null ? (
          <span className="text-fg text-[13px] tabular-nums">
            {b.assessment.avg}점
          </span>
        ) : (
          <NoData />
        ),
    },
    {
      key: 'issues',
      header: '관리',
      className: 'w-20',
      cell: (b) =>
        b.issues.length > 0 ? (
          <StatusBadge label={`${b.issues.length}건`} tone="warning" />
        ) : (
          <span className="text-fg-subtle text-[12px]">—</span>
        ),
    },
  ]

  // 기수별로 분리해 보여준다 — 이슈가 있는 기수만 패널을 만든다.
  const issueBoards = boards.filter((b) => b.issues.length > 0)
  // 요일 축 — BE issueDays(마크와 동일 축) 우선, 없으면(구 BE) 오늘 기준 최근 5영업일.
  const issueDays =
    issueBoards.find((b) => b.issueDays?.length)?.issueDays ??
    recentBusinessDays(5)
  const issueDayAxis = issueDays.map((iso) => {
    const d = new Date(`${iso}T00:00:00`)
    return {
      date: iso,
      dow: '일월화수목금토'[d.getDay()],
      label: `${d.getMonth() + 1}.${d.getDate()}`,
    }
  })
  // 관리 필요 수강생 기수별 아코디언 — 기본은 첫 기수만 펼침(나머지 접힘).
  const [openCohorts, setOpenCohorts] = useState<Set<string>>(
    () => new Set(issueBoards[0] ? [issueBoards[0].cohortId] : []),
  )
  const toggleCohort = (id: string) =>
    setOpenCohorts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      {/* 오늘 인사이트 — 자동 생성 액션 큐 + 상황 요약 + 지표 팝오버 */}
      <DashboardInsight
        boards={boards}
        quarantineCount={quarantineCount}
        today={today}
        upcoming={upcoming}
      />

      {/* 바로가기 — 자주 쓰는 화면 타일(매니저 개인 편집 가능) */}
      <div className="mt-5">
        <QuickLinks />
      </div>

      {/* KPI 합산 카드는 제거(운영 요구) — 인사이트 지표 타일과 중복. */}

      {/* 기수 비교 표 */}
      <div className="mt-6">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-fg text-[15px] font-bold">기수 비교</p>
          <p className="text-fg-subtle text-[12px]">
            행을 클릭하면 기수 상세로 이동해요
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={boards}
          rowKey={(b) => b.cohortId}
          onRowClick={(b) => onSelect(b.cohortId)}
          empty="담당 기수가 없어요"
        />
      </div>

      {/* 연속 지각·결석 감지 — 기수별 분리 패널 + 우측 최근 5영업일 요일 축 */}
      <div className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-4">
          <p className="text-fg text-[17px] font-bold">연속 지각·결석 감지</p>
          <div className="flex items-center gap-3 pr-[152px]">
            {issueDayAxis.map((d) => (
              <span
                key={d.date}
                className="flex w-4 flex-col items-center gap-0.5"
              >
                <span className="text-fg-subtle text-[11px]">{d.dow}</span>
                <span className="text-fg-muted text-[11px] tabular-nums">
                  {d.label}
                </span>
              </span>
            ))}
          </div>
        </div>
        {issueBoards.length === 0 ? (
          <p className="text-fg-subtle py-8 text-center text-[13px]">
            지각·결석 반복 수강생이 없어요
          </p>
        ) : (
          // 아웃라인 없는 플랫 아코디언 — 기수 헤더 클릭으로 접기/펼치기(기본 첫 기수만 펼침).
          <div className="flex flex-col gap-3">
            {issueBoards.map((b) => {
              const open = openCohorts.has(b.cohortId)
              return (
                <div key={b.cohortId}>
                  {/* 기수 그룹 헤더 — ▾ 과정·기수명 + 인원 다크 pill(클릭으로 접기/펼치기) */}
                  <button
                    type="button"
                    onClick={() => toggleCohort(b.cohortId)}
                    aria-expanded={open}
                    className="hover:bg-surface-muted/60 -mx-2 flex w-fit items-center gap-2 rounded-full px-2 py-1 transition-colors"
                  >
                    <ChevronRight
                      className={cn(
                        'text-fg-subtle size-4 shrink-0 transition-transform',
                        open && 'rotate-90',
                      )}
                    />
                    <span className="text-fg text-[14px] font-bold">
                      {b.courseName} {b.cohortLabel}
                    </span>
                    {b.source === 'hrd-live' && (
                      <span className="text-info text-[12px] font-semibold">
                        HRD 라이브
                      </span>
                    )}
                    <span className="bg-surface-inverse rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white">
                      {b.issues.length}명
                    </span>
                  </button>
                  {open && (
                    <div className="pt-2.5">
                      <RiskList issues={b.issues} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
