import { useMemo } from 'react'
import { AlertTriangle, Info, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import { usePageHeader } from '@/shared/store'
import { useMentoringStatistics } from './api'
import {
  CERTIFICATE_STATE_META,
  STAT_TEAM_STATUS_KEYS,
  STAT_TEAM_STATUS_LABEL,
  evaluationCellMeta,
} from './statusMeta'
import { MentoringTabs } from './MentoringTabs'
import type {
  MentorTeamStatRow,
  StatEvaluationState,
  StatRecommendationState,
} from './types'

const EVAL_FILTER_LABEL: Record<StatEvaluationState, string> = {
  submitted: '평가 완료',
  needed: '평가 필요',
  not_eligible: 'N시간 미달',
}

const RECOMMEND_FILTER_LABEL: Record<StatRecommendationState, string> = {
  recommended: '추천',
  not_recommended: '추천 안 함',
  pending: '미제출',
}

// 멘토 통계 (/admin/mentoring/statistics) — 운영(MANAGER/ADMIN) **조회 전용**(§33).
// 평가·추천 원문 수정, 변경 요청, 직접 보정 액션 미제공(403 MENTORING_STATISTICS_READ_ONLY)
// — mutation 버튼·훅 자체가 없다. 데이터는 A1 배정·일지 mock 상태에서 파생(즉시 반영).
// (Figma 3206:3024 — 본문 정식 스펙은 오버레이 패널 3206:3440, 평판 관리 잔재 본문 제외)
export default function StatisticsPage() {
  usePageHeader(
    '멘토 통계',
    '멘토/팀별 N시간 · 일지 · 평가·추천 · 증명서 반영 상태 조회',
  )
  const { data, isPending, isError, refetch } = useMentoringStatistics()
  const [course, setCourse] = useSearchParamState('course', 'all')
  const [mentor, setMentor] = useSearchParamState('mentor', 'all')
  const [teamStatus, setTeamStatus] = useSearchParamState('teamStatus', 'all')
  const [evalState, setEvalState] = useSearchParamState('evalState', 'all')
  const [recommendState, setRecommendState] = useSearchParamState(
    'recommendState',
    'all',
  )
  const [q, setQ] = useSearchParamState('q')

  const rows = useMemo(() => data?.rows ?? [], [data])
  const courses = useMemo(
    () => [...new Set(rows.map((r) => r.courseName))],
    [rows],
  )
  const mentors = useMemo(
    () =>
      [...new Map(rows.map((r) => [r.mentorId, r.mentorName])).entries()].map(
        ([mentorId, name]) => ({ mentorId, name }),
      ),
    [rows],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => {
      if (course !== 'all' && r.courseName !== course) return false
      if (mentor !== 'all' && r.mentorId !== mentor) return false
      if (teamStatus !== 'all' && r.teamStatus !== teamStatus) return false
      if (evalState !== 'all' && r.evaluation !== evalState) return false
      if (recommendState !== 'all' && r.recommendation !== recommendState)
        return false
      if (needle) {
        const hay = `${r.teamName} ${r.mentorName}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [rows, course, mentor, teamStatus, evalState, recommendState, q])

  if (isPending) {
    return <div className="text-fg-muted p-8">멘토 통계를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="멘토 통계를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const columns: Column<MentorTeamStatRow>[] = [
    {
      key: 'mentorTeam',
      header: '멘토 / 팀',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.mentorName} size={28} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5">
              <span className="text-fg text-[13px] font-bold">
                {r.mentorName} / {r.teamName}
              </span>
              {r.earlyEnded && <StatusBadge label="조기 종료" tone="warning" />}
            </p>
            <p className="text-fg-subtle text-[11px]">
              {r.courseName} · {r.cohortLabel}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'allocated',
      header: 'N시간',
      className: 'w-20',
      cell: (r) => (
        <span className="text-fg text-[13px] font-bold">
          {r.allocatedHours}h
        </span>
      ),
    },
    {
      key: 'recognized',
      header: '인정 시간',
      className: 'w-24',
      cell: (r) => (
        <span className="text-brand text-[13px] font-bold">
          {r.recognizedHours}h
        </span>
      ),
    },
    {
      key: 'logs',
      header: '일지',
      className: 'w-36',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
          <span className="text-fg font-bold">{r.logCount}건</span> · 수정 요청{' '}
          {r.changeRequestCount}
        </span>
      ),
    },
    {
      key: 'evaluation',
      header: '평가·추천',
      className: 'w-44',
      cell: (r) => {
        const meta = evaluationCellMeta(r)
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
    {
      key: 'certificate',
      header: '증명서 반영',
      className: 'w-36',
      cell: (r) => {
        const meta = CERTIFICATE_STATE_META[r.certificate]
        return <StatusBadge label={meta.label} tone={meta.tone} />
      },
    },
  ]

  return (
    <div className="p-8">
      <MentoringTabs />
      {/* 접근 경계 + 조회 전용 안내 칩 */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <span className="bg-info-bg text-info inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
          <Info className="h-3 w-3" />
          내부 사용자 전용 · 외부 토큰 미사용
        </span>
        <span className="bg-surface-muted text-fg-muted inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold">
          <Lock className="h-3 w-3" />
          조회 전용
        </span>
      </div>

      {/* 필터 — 과정/기수 · 멘토 · 팀 상태 · 평가 상태 · 추천 상태 · 팀/멘토 검색 */}
      <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            aria-label="과정/기수 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">과정 전체</option>
            {courses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={mentor}
            onChange={(e) => setMentor(e.target.value)}
            aria-label="멘토 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">멘토 전체</option>
            {mentors.map((m) => (
              <option key={m.mentorId} value={m.mentorId}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            value={teamStatus}
            onChange={(e) => setTeamStatus(e.target.value)}
            aria-label="팀 상태 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">팀 상태 전체</option>
            {STAT_TEAM_STATUS_KEYS.map((key) => (
              <option key={key} value={key}>
                {STAT_TEAM_STATUS_LABEL[key]}
              </option>
            ))}
          </select>
          <select
            value={evalState}
            onChange={(e) => setEvalState(e.target.value)}
            aria-label="평가 상태 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">평가 상태 전체</option>
            {(Object.keys(EVAL_FILTER_LABEL) as StatEvaluationState[]).map(
              (key) => (
                <option key={key} value={key}>
                  {EVAL_FILTER_LABEL[key]}
                </option>
              ),
            )}
          </select>
          <select
            value={recommendState}
            onChange={(e) => setRecommendState(e.target.value)}
            aria-label="추천 상태 필터"
            className="border-border text-fg-muted focus:border-brand bg-surface h-9 rounded-lg border px-3 text-sm outline-none"
          >
            <option value="all">추천 상태 전체</option>
            {(
              Object.keys(RECOMMEND_FILTER_LABEL) as StatRecommendationState[]
            ).map((key) => (
              <option key={key} value={key}>
                {RECOMMEND_FILTER_LABEL[key]}
              </option>
            ))}
          </select>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="팀/멘토 검색"
          aria-label="팀/멘토 검색"
          className="border-border text-fg placeholder:text-fg-subtle focus:border-brand bg-surface h-9 w-52 rounded-lg border px-3 text-sm outline-none"
        />
      </div>

      {/* 상태 요약 — 조회 전용 주석 포함(3206:3440 오버레이 원문) */}
      <div className="border-border bg-surface mt-4 rounded-xl border">
        <div className="grid grid-cols-2 gap-4 px-6 py-5 sm:grid-cols-5">
          {STAT_TEAM_STATUS_KEYS.map((key) => (
            <div key={key} className="flex items-baseline gap-2">
              <span className="text-fg-muted text-sm font-medium">
                {STAT_TEAM_STATUS_LABEL[key]}
              </span>
              <span className="text-fg text-lg font-semibold">
                {data.summary[key]}
              </span>
            </div>
          ))}
        </div>
        <p className="border-divider text-fg-subtle border-t px-6 py-3 text-xs">
          상태는 조회용입니다. 평가·추천 원문 수정, 변경 요청, 직접 보정 액션은
          제공하지 않습니다.
        </p>
      </div>

      {/* 통계 테이블 — 읽기 전용(행 액션 없음) */}
      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.assignmentId}
          empty="조건에 맞는 팀이 없어요"
        />
        <div className="text-fg-subtle mt-3 text-xs">
          총 {rows.length}팀 · 표시 {filtered.length}팀
        </div>
      </div>

      {/* 비공개 기준 — 5축 원점수·원문 코멘트 비노출(§33) */}
      <div className="bg-surface-muted border-border mt-6 rounded-xl border p-5">
        <p className="text-fg text-sm font-bold">비공개 기준</p>
        <p className="text-fg-muted mt-1.5 text-xs">
          수강생별 5축 평균, 추천 여부, 증명서용 요약만 조회합니다. 5축 원점수와
          멘토 원문 코멘트는 통계 화면에 노출하지 않습니다.
        </p>
      </div>
    </div>
  )
}
