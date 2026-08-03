import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { REVIEW_TABS, RouteTabBar } from '../components/RouteTabBar'
import type {
  BlogGridRow,
  CertGridRow,
  CertType,
  InstructorRecordCategory,
  RecordCellStatus,
  RecordCourseTab,
  RecordGridStudent,
  RecordWeek,
  StudyGridRow,
} from '@/shared/types'
import { useCohortRoster } from '../api/console'
import { useRecordReviews } from '../api/reviews'
import { RecordDetailPanel, type RecordPanelData } from './RecordDetailPanel'
import { SearchInput } from '@/components/ui/SearchInput'

// 학습 기록 조회 (/instructor/records/review) — §13. 강사 조회 전용 그리드.
// 블로그·스터디 = 수강생×주차 히트맵(셀 클릭 상세), 자격증 = 종류별 매트릭스.
// 승인·반려 액션 없음 — 매니저 결정을 색/배지로 표시하고 상세 패널에서 확인만.

const CATEGORY_TABS: { key: InstructorRecordCategory; label: string }[] = [
  { key: 'blog', label: '블로그' },
  { key: 'study', label: '스터디' },
  { key: 'cert', label: '자격증' },
]

const CERT_TYPES: CertType[] = ['PCCE', 'PCCP', 'PCSQL']

// 셀 색 = 매니저 결정: 승인(초록)·검토중(주황)·반려(빨강)·미제출(회색). 토큰만 사용.
const CELL: Record<RecordCellStatus, string> = {
  approved: 'bg-success',
  pending: 'bg-warning',
  rejected: 'bg-danger',
  none: 'bg-border',
}
const CELL_TITLE: Record<RecordCellStatus, string> = {
  approved: '승인',
  pending: '검토 중',
  rejected: '반려',
  none: '미제출',
}

// embedded=true면 과정·기수·교과목 '기록실' 탭에 임베드(자체 헤더·탭·과정/기수 선택 생략, 선택 기수로 고정).
export default function RecordReviewPage({
  embedded = false,
  cohortId: propCohortId = null,
}: {
  embedded?: boolean
  cohortId?: string | null
} = {}) {
  const [courseId, setCourseId] = useState('none')
  const [cohortId, setCohortId] = useState(propCohortId ?? 'none')
  const [category, setCategory] = useState<InstructorRecordCategory>('blog')
  const [q, setQ] = useState('')
  const [panel, setPanel] = useState<RecordPanelData | null>(null)

  usePageHeader(
    '학습 기록 조회',
    '담당 기수 수강생의 학습 기록 제출 현황을 확인합니다',
    !embedded,
  )

  const {
    data: raw,
    isPending,
    isError,
    refetch,
  } = useRecordReviews(courseId, cohortId)
  // 강사는 계정 목록(/users/students) 조회가 막혀 있어(403) 담당 기수 로스터를 쓴다.
  // 그리드 행은 매니저 기록실(RecordsGridPage)과 동일하게 이 로스터(수강생 명단)를 뼈대로
  // 만든다 — 기록이 없어도 수강생 행 + 주차 열이 서고, BE 기록은 셀에 얹는다(아래 rows 참조).
  const { data: roster, isLoading: rosterLoading } = useCohortRoster(
    cohortId === 'none' ? null : cohortId,
  )
  // 상세 패널 본문은 studentUserId만 오므로 로스터로 실명 치환(rows 이름은 로스터에서 직접).
  const data = useMemo(() => {
    if (!raw) return raw
    const items = roster ?? []
    if (items.length === 0) return raw
    const nameById = new Map(items.map((s) => [s.userId, s.name]))
    const fixDetail = <
      D extends { studentName: string; studentUserId?: string },
    >(
      d: D,
    ): D =>
      d.studentUserId && nameById.has(d.studentUserId)
        ? { ...d, studentName: nameById.get(d.studentUserId)! }
        : d
    const mapValues = <
      D extends { studentName: string; studentUserId?: string },
    >(
      obj: Record<string, D>,
    ): Record<string, D> =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fixDetail(v)]))
    return {
      ...raw,
      blogDetails: mapValues(raw.blogDetails),
      studyDetails: mapValues(raw.studyDetails),
      certDetails: mapValues(raw.certDetails),
    }
  }, [raw, roster])

  // 임베드 — 선택 기수(실 UUID)를 포함한 과정으로 고정. 일반 자동 선택 효과보다 우선.
  useEffect(() => {
    if (!embedded || !propCohortId || !data) return
    const owner = data.courses.find((c) =>
      c.cohorts.some((ch) => ch.id === propCohortId),
    )
    if (owner && courseId !== owner.id) setCourseId(owner.id)
    if (cohortId !== propCohortId) setCohortId(propCohortId)
  }, [embedded, propCohortId, data, courseId, cohortId])

  useEffect(() => {
    if (embedded) return
    if (!data) return

    const courseExists = data.courses.some((c) => c.id === courseId)
    const nextCourseId = courseExists ? courseId : data.activeCourseId
    if (!courseExists && data.activeCourseId !== courseId) {
      setCourseId(data.activeCourseId)
    }

    const activeCourse = data.courses.find((c) => c.id === nextCourseId)
    const cohortExists =
      activeCourse?.cohorts.some((c) => c.id === cohortId) ?? false
    if (!cohortExists && data.activeCohortId !== cohortId) {
      setCohortId(data.activeCohortId)
    }
  }, [data, courseId, cohortId])

  // 담당 과정/기수 라벨(단일 고정 표시용).
  const cohortTabs =
    data?.courses.find((c) => c.id === courseId)?.cohorts ??
    ([{ id: cohortId, label: cohortId }] as RecordCourseTab['cohorts'])

  const needle = q.trim()
  // 그리드 행 = 로스터(수강생 명단) 뼈대 × BE 기록 셀 병합 (매니저 RecordsGridPage와 동일).
  // BE 기록이 있는 학생은 studentUserId로 매칭해 셀을 채우고, 없으면 빈 셀 행으로 남긴다.
  // 이름은 로스터에서 직접 취하고(실명), birth·atRisk는 BE 행이 있으면 유지한다.
  const rosterList = useMemo(() => roster ?? [], [roster])
  const byBlog = useMemo(
    () => new Map((data?.blog ?? []).map((r) => [r.student.id, r])),
    [data],
  )
  const byStudy = useMemo(
    () => new Map((data?.study ?? []).map((r) => [r.student.id, r])),
    [data],
  )
  const byCert = useMemo(
    () => new Map((data?.cert ?? []).map((r) => [r.student.id, r])),
    [data],
  )
  const weekCount = data?.weeks.length ?? 0
  // 로스터를 이름 필터·가나다순 정렬한 (userId·name) 목록 — 3종 그리드 공용 뼈대.
  const rosterSorted = useMemo(
    () =>
      rosterList
        .filter((s) => !needle || s.name.includes(needle))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [rosterList, needle],
  )
  const studentOf = (
    s: { userId: string; name: string },
    birth = '',
    atRisk?: boolean,
  ) =>
    ({ id: s.userId, name: s.name, birth, atRisk }) satisfies RecordGridStudent
  const blogRows = useMemo<BlogGridRow[]>(
    () =>
      rosterSorted.map((s) => {
        const g = byBlog.get(s.userId)
        return {
          student: studentOf(s, g?.student.birth ?? '', g?.student.atRisk),
          cells: g?.cells ?? {},
          submissionIds: g?.submissionIds ?? {},
          completed: g?.completed ?? 0,
          total: g?.total ?? weekCount,
        }
      }),
    [rosterSorted, byBlog, weekCount],
  )
  const studyRows = useMemo<StudyGridRow[]>(
    () =>
      rosterSorted.map((s) => {
        const g = byStudy.get(s.userId)
        return {
          student: studentOf(s, g?.student.birth ?? '', g?.student.atRisk),
          cells: g?.cells ?? {},
          submissionIds: g?.submissionIds ?? {},
          streakWeeks: g?.streakWeeks ?? 0,
          mileagePaid: g?.mileagePaid ?? false,
        }
      }),
    [rosterSorted, byStudy],
  )
  const certRows = useMemo<CertGridRow[]>(
    () =>
      rosterSorted.map((s) => {
        const g = byCert.get(s.userId)
        return {
          student: studentOf(s, g?.student.birth ?? '', g?.student.atRisk),
          certs: g?.certs ?? { PCCE: 'none', PCCP: 'none', PCSQL: 'none' },
          submissionIds: g?.submissionIds ?? {},
          mileage: g?.mileage ?? 0,
          paid: g?.paid ?? false,
        }
      }),
    [rosterSorted, byCert],
  )

  return (
    <div className={embedded ? '' : 'p-8'}>
      {/* 담당 과정·기수 — 강사는 한 교육만 맡으므로 선택이 아닌 단일 고정 표시(탭 위에 배치). */}
      {!embedded && (
        <p className="text-fg mb-3 text-lg font-bold">
          <span>
            {data?.courses.find((c) => c.id === courseId)?.label ?? '담당 과정'}
          </span>
          {(() => {
            const label = cohortTabs.find((c) => c.id === cohortId)?.label
            return label ? (
              <span className="text-fg-muted ml-1.5 font-semibold">
                {label}
              </span>
            ) : null
          })()}
        </p>
      )}
      {!embedded && <RouteTabBar tabs={REVIEW_TABS} />}

      {/* 검색 + 카테고리 토글 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="이름으로 검색"
          ariaLabel="수강생 이름 검색"
          className="w-64"
        />
        <div className="bg-surface-muted flex gap-1 rounded-lg p-1">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setCategory(t.key)}
              className={cn(
                'rounded-md px-4 py-1.5 text-sm font-semibold',
                category === t.key
                  ? 'text-fg bg-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 — 그리드 뼈대가 로스터라, 명단 로딩도 로딩에 포함(빈 상태 깜빡임 방지). */}
      <DataBoundary
        isPending={isPending || rosterLoading}
        isError={isError || !data}
        onRetry={() => refetch()}
        loadingText="불러오는 중…"
        errorTitle="학습 기록을 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data &&
          (category === 'cert' ? (
            certRows.length === 0 ? (
              <EmptyGrid />
            ) : (
              <CertMatrix
                rows={certRows}
                onOpen={(row, type) => {
                  const id = row.submissionIds[type]
                  const detail = id ? data.certDetails[id] : undefined
                  if (detail) setPanel({ kind: 'cert', detail })
                }}
              />
            )
          ) : category === 'study' ? (
            studyRows.length === 0 ? (
              <EmptyGrid />
            ) : (
              <StudyGrid
                weeks={data.weeks}
                rows={studyRows}
                onOpen={(id) => {
                  const detail = data.studyDetails[id]
                  if (detail) setPanel({ kind: 'study', detail })
                }}
              />
            )
          ) : blogRows.length === 0 ? (
            <EmptyGrid />
          ) : (
            <BlogGrid
              weeks={data.weeks}
              rows={blogRows}
              onOpen={(id) => {
                const detail = data.blogDetails[id]
                if (detail) setPanel({ kind: 'blog', detail })
              }}
            />
          ))}
      </DataBoundary>

      <p className="text-fg-subtle mt-3 text-xs">
        조회 전용 — 승인·반려·보완 요청은 운영 매니저가 처리합니다.
      </p>

      <RecordDetailPanel data={panel} onClose={() => setPanel(null)} />
    </div>
  )
}

function EmptyGrid() {
  return (
    <Empty
      icon={<AlertTriangle />}
      title="이 기수에 수강생이 없어요"
      description="매니저가 HRD 계정 동기화로 수강생을 등록하면 그리드가 표시됩니다."
    />
  )
}

// ── 그리드 셀 ──
function GridCell({
  status,
  onClick,
}: {
  status: RecordCellStatus
  onClick?: () => void
}) {
  const clickable = !!onClick && status !== 'none'
  return (
    <button
      type="button"
      title={CELL_TITLE[status]}
      disabled={!clickable}
      onClick={onClick}
      className={cn(
        'inline-block size-6 rounded-md',
        CELL[status],
        clickable
          ? 'hover:ring-brand/40 cursor-pointer ring-offset-1 hover:ring-2'
          : 'cursor-default',
      )}
    />
  )
}

// 수강생 이름 셀(sticky) — 위험 행은 핑크 배경.
function StudentCell({
  name,
  birth,
  atRisk,
}: {
  name: string
  birth: string
  atRisk?: boolean
}) {
  return (
    <td
      className={cn(
        'sticky left-0 z-10 min-w-36 px-4 py-2.5',
        atRisk ? 'bg-danger-bg' : 'bg-white',
      )}
    >
      <div className="text-fg font-medium">{name}</div>
      {birth && <div className="text-fg-subtle text-xs">{birth}</div>}
    </td>
  )
}

function WeekHead({ weeks }: { weeks: RecordWeek[] }) {
  return (
    <>
      <th className="bg-surface-muted text-fg-subtle sticky left-0 z-10 min-w-36 px-4 py-3 text-left font-semibold">
        수강생
      </th>
      {weeks.map((w) => (
        <th
          key={w.no}
          className="text-fg-subtle px-2 py-3 text-center text-xs font-medium whitespace-nowrap"
        >
          {w.label}
        </th>
      ))}
    </>
  )
}

// ── 블로그 그리드 (완주 컬럼) ──
function BlogGrid({
  weeks,
  rows,
  onOpen,
}: {
  weeks: RecordWeek[]
  rows: BlogGridRow[]
  onOpen: (submissionId: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <table className="border-collapse text-sm">
        <thead>
          <tr className="bg-surface-muted">
            <WeekHead weeks={weeks} />
            <th className="text-fg-subtle border-divider bg-surface-muted sticky right-0 z-10 w-24 border-l px-4 py-3 text-center font-semibold">
              완주
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.student.id}
              className={cn(
                'border-border border-t',
                r.student.atRisk && 'bg-danger-bg/40',
              )}
            >
              <StudentCell {...r.student} />
              {weeks.map((w) => (
                <td key={w.no} className="px-2 py-2.5 text-center">
                  <GridCell
                    status={r.cells[w.no] ?? 'none'}
                    onClick={
                      r.submissionIds[w.no]
                        ? () => onOpen(r.submissionIds[w.no])
                        : undefined
                    }
                  />
                </td>
              ))}
              <td
                className={cn(
                  'border-divider sticky right-0 z-10 w-24 border-l px-4 py-2.5 text-center',
                  r.student.atRisk ? 'bg-danger-bg' : 'bg-white',
                )}
              >
                <span className="bg-accent-bg text-accent-strong inline-block rounded-full px-2.5 py-1 text-xs font-bold">
                  {r.completed}/{r.total}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── 스터디 그리드 (연속 + 마일리지 컬럼) ──
function StudyGrid({
  weeks,
  rows,
  onOpen,
}: {
  weeks: RecordWeek[]
  rows: StudyGridRow[]
  onOpen: (submissionId: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <table className="border-collapse text-sm">
        <thead>
          <tr className="bg-surface-muted">
            <WeekHead weeks={weeks} />
            <th
              className="text-fg-subtle border-divider bg-surface-muted sticky z-10 border-l px-2 py-3 text-center text-xs font-semibold whitespace-nowrap"
              style={{ width: 84, minWidth: 84, right: 84 }}
            >
              연속
            </th>
            <th
              className="text-fg-subtle bg-surface-muted sticky z-10 px-2 py-3 text-center text-xs font-semibold whitespace-nowrap"
              style={{ width: 84, minWidth: 84, right: 0 }}
            >
              마일리지
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pinBg = r.student.atRisk ? 'bg-danger-bg' : 'bg-white'
            return (
              <tr
                key={r.student.id}
                className={cn(
                  'border-border border-t',
                  r.student.atRisk && 'bg-danger-bg/40',
                )}
              >
                <StudentCell {...r.student} />
                {weeks.map((w) => (
                  <td key={w.no} className="px-2 py-2.5 text-center">
                    <GridCell
                      status={r.cells[w.no] ?? 'none'}
                      onClick={
                        r.submissionIds[w.no]
                          ? () => onOpen(r.submissionIds[w.no])
                          : undefined
                      }
                    />
                  </td>
                ))}
                <td
                  className={cn(
                    'border-divider sticky z-10 border-l px-2 py-2.5 text-center whitespace-nowrap',
                    pinBg,
                  )}
                  style={{ width: 84, minWidth: 84, right: 84 }}
                >
                  <span
                    className={cn(
                      'text-sm font-bold',
                      r.streakWeeks > 0
                        ? 'text-accent-strong'
                        : 'text-fg-subtle',
                    )}
                  >
                    {r.streakWeeks}주
                  </span>
                </td>
                <td
                  className={cn('sticky z-10 px-2 py-2.5 text-center', pinBg)}
                  style={{ width: 84, minWidth: 84, right: 0 }}
                >
                  {r.mileagePaid ? (
                    <span className="bg-accent-strong inline-block rounded-md px-2 py-0.5 text-xs font-bold text-white">
                      지급
                    </span>
                  ) : (
                    <span className="text-fg-subtle text-sm">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── 자격증 매트릭스 (PCCE/PCCP/PCSQL + 마일리지 + 지급) ──
function CertMatrix({
  rows,
  onOpen,
}: {
  rows: CertGridRow[]
  onOpen: (row: CertGridRow, type: CertType) => void
}) {
  return (
    <div className="overflow-x-auto rounded-2xl shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-muted text-fg-subtle">
            <th className="px-4 py-3 text-left font-semibold">수강생</th>
            {CERT_TYPES.map((t) => (
              <th key={t} className="px-4 py-3 text-center font-semibold">
                {t}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-semibold">마일리지</th>
            <th className="px-4 py-3 text-center font-semibold">지급</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.student.id}
              className={cn(
                'border-border border-t',
                r.student.atRisk && 'bg-danger-bg/40',
              )}
            >
              <td className="px-4 py-3">
                <div className="text-fg font-medium">{r.student.name}</div>
                <div className="text-fg-subtle text-xs">{r.student.birth}</div>
              </td>
              {CERT_TYPES.map((t) => (
                <td key={t} className="px-4 py-3 text-center">
                  <CertBadges
                    state={r.certs[t]}
                    onClick={
                      r.submissionIds[t] ? () => onOpen(r, t) : undefined
                    }
                  />
                </td>
              ))}
              <td className="px-4 py-3 text-right whitespace-nowrap">
                {r.mileage > 0 ? (
                  <span className="text-accent-strong font-bold">
                    {r.mileage.toLocaleString()}P
                  </span>
                ) : (
                  <span className="text-fg-subtle">–</span>
                )}
              </td>
              <td className="px-4 py-3 text-center whitespace-nowrap">
                {r.paid ? (
                  <span className="text-success inline-flex items-center gap-1 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> 지급 완료
                  </span>
                ) : r.mileage > 0 ? (
                  <span className="text-warning text-sm font-semibold">
                    지급 대기
                  </span>
                ) : (
                  <span className="text-fg-subtle text-sm">마일리지 없음</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// 자격증 셀 — 검토/승인/반려 3상태 인디케이터(활성만 강조). 제출 있으면 클릭 → 패널.
function CertBadges({
  state,
  onClick,
}: {
  state: RecordCellStatus
  onClick?: () => void
}) {
  if (state === 'none') return <span className="text-fg-subtle">–</span>
  const pill = (label: string, active: boolean, activeCls: string) => (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 text-xs font-bold',
        active ? activeCls : 'bg-surface-muted text-fg-subtle',
      )}
    >
      {label}
    </span>
  )
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg px-1 py-0.5"
    >
      {pill('검토', state === 'pending', 'bg-warning-bg text-warning')}
      {pill('승인', state === 'approved', 'bg-success text-white')}
      {pill('반려', state === 'rejected', 'bg-danger-bg text-danger')}
    </button>
  )
}
