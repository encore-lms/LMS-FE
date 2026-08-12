import { useMemo, useState, type ReactNode } from 'react'
import { Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ListToolbar } from '@/components/ui/ListToolbar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import { EVALUATION_AXIS_LABELS } from '@/shared/constants'
import { useStudentAccounts } from '@/shared/api/students'
import { useMentorEvaluationDetail, useReputation } from '../reputation/api'
import { AXIS_SHORT } from '../reputation/reputationMeta'
import { StudentOverviewRaw } from './StudentOverviewRaw'
import {
  useAdminRecordGrid,
  useCohortAttendanceIssues,
  useCohortProjects,
  usePeerEvaluations,
  useResumes,
  useStaffStudentEvalsAll,
  useStudentActivitySummary,
} from './api'
import { useStudentMileageHistory } from '../mileage/history/api'

// 수강생 종합 데이터 탭(2026-08-07 신설, 매니저 전용) — 수강생 1명의 연관 데이터를 DB 뷰처럼
// 한 화면에 모은다: 스태프(강사·매니저) 4축 평가 · 멘토 평가·추천 · 강사 추천서 · 동료 평가 ·
// 출결 이슈 · 이력서 · 기록실 · 프로젝트. 좌측 명단에서 고르면 우측 상세가 바뀐다.
// 어떤 데이터를 강사·수강생에게도 열지는 이 화면으로 전체를 본 뒤 결정한다(사용자 계획).
// 조인 키가 소스마다 달라(userId/HRD uuid/이름) 계정 목록(useStudentAccounts)을 허브로 쓴다.

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <h4 className="text-fg text-[13px] font-bold">{title}</h4>
        {badge}
      </div>
      {children}
    </section>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-fg-subtle text-[12px]">{children}</p>
}

/** 4축 축약 점수 칩(기·소·문·책) — 수강생 평가 행과 같은 표기. */
function ScoreChips({ scores }: { scores: (number | null)[] }) {
  return (
    <span className="flex items-center gap-1">
      {scores.map((v, i) => (
        <span
          key={EVALUATION_AXIS_LABELS[i]}
          title={EVALUATION_AXIS_LABELS[i]}
          className="border-border text-fg-muted flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[11px]"
        >
          {AXIS_SHORT[i]}
          <b className="text-fg tabular-nums">{v ?? '-'}</b>
        </span>
      ))}
    </span>
  )
}

/** 프로젝트 1건에서 받은 상호평가 요약 한 줄 — 받은 게 없으면 숨긴다. */
function PeerReceivedLine({
  projectId,
  projectTitle,
  studentUserId,
}: {
  projectId: string
  projectTitle: string
  studentUserId: string
}) {
  const { data } = usePeerEvaluations(projectId)
  const me = (data?.members ?? []).find((m) => m.userId === studentUserId)
  if (!me || me.receivedSubmitted === 0) return null
  return (
    <span className="text-fg-muted">
      · {projectTitle}: 받음{' '}
      <b className="text-fg tabular-nums">{me.receivedSubmitted}건</b>
      {me.receivedAverage != null && (
        <>
          {' '}
          평균{' '}
          <b className="text-fg tabular-nums">
            {me.receivedAverage.toFixed(1)}
          </b>
        </>
      )}
    </span>
  )
}

const RESUME_STATUS_LABEL: Record<string, string> = {
  DRAFT: '작성 중',
  COMPLETED: '작성 완료',
}

export function StudentOverviewPane({
  courseId,
  cohortId,
}: {
  courseId: string | null
  cohortId: string
}) {
  // 조인 허브 — userId·HRD uuid·이름을 모두 가진 유일한 소스.
  const accounts = useStudentAccounts(cohortId)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 보기 전환 — 요약(가공) vs 원본 데이터(DB 명세식, 필드명 그대로).
  const [viewMode, setViewMode] = useState<'summary' | 'raw'>('summary')

  // 기수 단위 소스(1회 조회, 섹션별 graceful degrade).
  const { data: staffAll } = useStaffStudentEvalsAll(cohortId)
  const { data: reputation } = useReputation(cohortId ? [cohortId] : undefined)
  const { data: resumes } = useResumes(courseId, cohortId)
  const { data: projects } = useCohortProjects(courseId, cohortId)
  const { data: attendance } = useCohortAttendanceIssues(cohortId)
  const { data: records } = useAdminRecordGrid(cohortId)

  const allStudents = accounts.data?.items ?? []
  const students = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allStudents.filter((s) => !q || s.name.toLowerCase().includes(q))
  }, [allStudents, query])

  const staffByStudent = useMemo(
    () =>
      new Map((staffAll?.students ?? []).map((s) => [s.studentId, s.entries])),
    [staffAll],
  )
  const reputationByStudent = useMemo(
    () =>
      new Map(
        (reputation?.students ?? [])
          .filter((s) => !s.cohortId || s.cohortId === cohortId)
          .map((s) => [s.id, s]),
      ),
    [reputation, cohortId],
  )

  const selected = allStudents.find((s) => s.id === selectedId) ?? null
  // 멘토 평가 상세(코멘트·추천 포함) — 선택 시에만 조회.
  const mentorDetail = useMentorEvaluationDetail(selected?.id ?? null)
  // 학습 활동 요약(과제·퀴즈·QnA)·마일리지 — 선택 시에만 조회.
  const activity = useStudentActivitySummary(cohortId, selected?.id ?? null)
  const mileage = useStudentMileageHistory(selected?.id ?? null)

  return (
    <DataBoundary
      isPending={accounts.isPending}
      isError={accounts.isError}
      onRetry={() => accounts.refetch()}
      loadingText="수강생 데이터를 불러오는 중…"
      errorTitle="수강생 목록을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      <div className="flex flex-col gap-4">
        <ListToolbar
          left={
            <span>
              총 {students.length}명
              {students.length !== allStudents.length
                ? ` (전체 ${allStudents.length})`
                : ''}{' '}
              · 수강생을 선택하면 연관 데이터를 한눈에 봅니다
            </span>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: '수강생 이름 검색',
            ariaLabel: '수강생 검색',
          }}
        />

        {students.length === 0 ? (
          <Empty
            icon={<Users className="h-6 w-6" />}
            title="수강생이 없어요"
            description="검색어를 지우거나 다른 이름으로 찾아보세요."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            {/* 좌측 — 수강생 명단 */}
            <div className="max-h-[720px] overflow-y-auto rounded-xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
              {students.map((s) => {
                const active = s.id === selectedId
                const staffCount = staffByStudent.get(s.id)?.length ?? 0
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      'border-divider flex w-full items-center gap-2.5 border-b px-4 py-2.5 text-left transition-colors first:rounded-t-xl last:rounded-b-xl last:border-b-0',
                      active
                        ? 'bg-brand/10'
                        : 'bg-surface hover:bg-surface-muted',
                    )}
                  >
                    <Avatar name={s.name} size={30} />
                    <span className="flex min-w-0 flex-col">
                      <span
                        className={cn(
                          'truncate text-[13px] font-bold',
                          active ? 'text-brand' : 'text-fg',
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        평가 {staffCount} ·{' '}
                        {reputationByStudent.get(s.id)?.endorsementStatus ===
                        'collected'
                          ? '추천서 있음'
                          : '추천서 없음'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* 우측 — 선택 수강생 종합(요약/원본 토글) */}
            {!selected ? (
              <div className="border-border bg-surface flex items-center justify-center rounded-xl border py-24">
                <EmptyLine>좌측에서 수강생을 선택하세요</EmptyLine>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="bg-surface-muted flex w-fit gap-1 rounded-lg p-1">
                  {(
                    [
                      ['summary', '요약'],
                      ['raw', '원본 데이터(DB)'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        'rounded-md px-3.5 py-1.5 text-[12px] font-semibold',
                        viewMode === mode
                          ? 'text-fg bg-white shadow-sm'
                          : 'text-fg-muted hover:text-fg',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {viewMode === 'raw' ? (
                  <StudentOverviewRaw
                    key={selected.id}
                    student={selected}
                    cohortId={cohortId}
                    staffEntries={staffByStudent.get(selected.id) ?? []}
                    reputation={reputationByStudent.get(selected.id) ?? null}
                    mentorDetail={mentorDetail.data ?? null}
                    resume={
                      (resumes ?? []).find(
                        (r) => r.studentUserId === selected.id,
                      ) ?? null
                    }
                    projects={(projects ?? []).filter((p) =>
                      p.members.some((m) => m.userId === selected.id),
                    )}
                    attendanceIssue={
                      (attendance?.issues ?? []).find(
                        (i) =>
                          i.studentUuid === selected.studentUuid ||
                          i.name === selected.name,
                      ) ?? null
                    }
                    records={records ?? null}
                  />
                ) : (
                  <OverviewDetail
                    key={selected.id}
                    student={selected}
                    activity={activity.data ?? null}
                    mileage={mileage.data ?? null}
                    staffEntries={staffByStudent.get(selected.id) ?? []}
                    reputation={reputationByStudent.get(selected.id) ?? null}
                    mentorDetail={mentorDetail.data ?? null}
                    resume={
                      (resumes ?? []).find(
                        (r) => r.studentUserId === selected.id,
                      ) ?? null
                    }
                    projects={(projects ?? []).filter((p) =>
                      p.members.some((m) => m.userId === selected.id),
                    )}
                    attendanceIssue={
                      (attendance?.issues ?? []).find(
                        (i) =>
                          i.studentUuid === selected.studentUuid ||
                          i.name === selected.name,
                      ) ?? null
                    }
                    records={records ?? null}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DataBoundary>
  )
}

function OverviewDetail({
  student,
  activity,
  mileage,
  staffEntries,
  reputation,
  mentorDetail,
  resume,
  projects,
  attendanceIssue,
  records,
}: {
  student: {
    id: string
    name: string
    studentUuid: string
    birthDate?: string | null
    trainingStatus?: string | null
    lastLoginAt?: string | null
  }
  activity: import('./types').StudentActivitySummary | null
  mileage: import('../mileage/history/types').StudentMileageHistory | null
  staffEntries: import('./types').StaffEvalRaterEntry[]
  reputation: import('../reputation/types').ReputationStudent | null
  mentorDetail: import('../reputation/types').MentorEvaluationDetail | null
  resume: import('@/shared/types').ResumeRow | null
  projects: import('./types').CohortProject[]
  attendanceIssue: {
    lateCount: number
    absentCount: number
  } | null
  records: import('@/shared/types').InstructorRecordReviewData | null
}) {
  // 기록실 그리드 행 — 조인 키가 그리드 자체 id 라 이름으로 잇는다(기수 내 동명이인 없으면 정확).
  const blogRow = records?.blog.find((r) => r.student.name === student.name)
  const studyRow = records?.study.find((r) => r.student.name === student.name)
  const certRow = records?.cert.find((r) => r.student.name === student.name)
  const certDone = certRow
    ? Object.values(certRow.certs).filter((s) => s === 'approved').length
    : 0

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 — 계정·훈련 상태 */}
      <section className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <Avatar name={student.name} size={44} />
        <div className="flex min-w-0 flex-col">
          <span className="text-fg text-[16px] font-bold">{student.name}</span>
          <span className="text-fg-subtle text-[12px]">
            HRD {student.studentUuid || '-'}
            {student.birthDate ? ` · ${student.birthDate}` : ''}
          </span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {student.trainingStatus && (
            <StatusBadge
              label={
                student.trainingStatus === 'dropout' ? '중도탈락' : '수강 중'
              }
              tone={student.trainingStatus === 'dropout' ? 'danger' : 'success'}
            />
          )}
          {student.lastLoginAt && (
            <span className="text-fg-subtle text-[11px]">
              최근 로그인 {student.lastLoginAt}
            </span>
          )}
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-2">
        {/* 스태프 4축 평가 — 강사·매니저 각자 저장분 */}
        <Section
          title="수강생 평가 (강사·매니저)"
          badge={
            <StatusBadge
              label={`${staffEntries.length}건`}
              tone={staffEntries.length > 0 ? 'success' : 'neutral'}
            />
          }
        >
          {staffEntries.length === 0 ? (
            <EmptyLine>아직 저장된 평가가 없어요</EmptyLine>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {staffEntries.map((e) => (
                <li key={e.raterUserId} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-fg text-[12px] font-bold">
                      {e.raterName}
                    </span>
                    <StatusBadge label={e.raterRole || '스태프'} tone="info" />
                    <ScoreChips scores={e.scores} />
                    <span className="text-fg-subtle ml-auto text-[11px]">
                      {e.updatedAtLabel}
                    </span>
                  </div>
                  {e.comment && (
                    <p className="bg-surface-muted text-fg rounded-lg px-3 py-2 text-[12px] leading-relaxed">
                      {e.comment}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* 멘토 평가·추천 */}
        <Section
          title="멘토 평가·추천"
          badge={
            mentorDetail?.evaluationSubmitted ? (
              <StatusBadge label="제출됨" tone="success" />
            ) : (
              <StatusBadge label="미제출" tone="neutral" />
            )
          }
        >
          {!mentorDetail || !mentorDetail.hasTeam ? (
            <EmptyLine>멘토링 팀 배정이 없어요</EmptyLine>
          ) : (
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-fg-muted text-[12px]">
                  {mentorDetail.teamName} · {mentorDetail.mentorName}
                </span>
                {mentorDetail.evaluationSubmitted && (
                  <ScoreChips scores={mentorDetail.axes.map((a) => a.value)} />
                )}
              </div>
              {mentorDetail.comment && (
                <p className="bg-surface-muted text-fg rounded-lg px-3 py-2 text-[12px] leading-relaxed">
                  {mentorDetail.comment}
                </p>
              )}
              <span className="text-fg-subtle text-[11px]">
                추천:{' '}
                {mentorDetail.recommendationSummary ||
                  mentorDetail.recommendation ||
                  '-'}
              </span>
            </div>
          )}
        </Section>

        {/* 강사 추천서 */}
        <Section
          title="강사 추천서"
          badge={
            reputation?.endorsementStatus === 'collected' ? (
              <StatusBadge label="수집됨" tone="success" />
            ) : (
              <StatusBadge label="미수집" tone="neutral" />
            )
          }
        >
          {reputation?.endorsementStatus === 'collected' ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-fg-muted text-[12px]">
                {reputation.endorsementBy}
              </span>
              {reputation.endorsementComment && (
                <p className="bg-surface-muted text-fg rounded-lg px-3 py-2 text-[12px] leading-relaxed">
                  {reputation.endorsementComment}
                </p>
              )}
            </div>
          ) : (
            <EmptyLine>아직 작성된 추천서가 없어요</EmptyLine>
          )}
        </Section>

        {/* 동료 평가 + 출결 */}
        <Section title="동료 평가 · 출결">
          <div className="flex flex-col gap-1.5 text-[12px]">
            <span className="text-fg-muted">
              동료 평가 받음{' '}
              <b className="text-fg tabular-nums">
                {reputation
                  ? `${reputation.peerCount}/${reputation.peerTotal}`
                  : '-'}
              </b>
            </span>
            {projects.map((p) => (
              <PeerReceivedLine
                key={p.id}
                projectId={p.id}
                projectTitle={p.title}
                studentUserId={student.id}
              />
            ))}
            <span className="text-fg-muted">
              출결 특이사항{' '}
              {attendanceIssue ? (
                <b className="text-warning">
                  지각 {attendanceIssue.lateCount} · 결석{' '}
                  {attendanceIssue.absentCount}
                </b>
              ) : (
                <b className="text-success">없음</b>
              )}
            </span>
          </div>
        </Section>

        {/* 학습 활동 — 과제·퀴즈·QnA(수강생별 집계 API) */}
        <Section title="학습 활동 (과제·퀴즈·QnA)">
          {activity ? (
            <div className="flex flex-col gap-1.5 text-[12px]">
              <span className="text-fg-muted">
                과제 제출{' '}
                <b className="text-fg tabular-nums">
                  {activity.assignments.submitted}/{activity.assignments.total}
                </b>
                {activity.assignments.supplementRequested > 0 && (
                  <b className="text-warning">
                    {' '}
                    · 보완요청 {activity.assignments.supplementRequested}
                  </b>
                )}
                {activity.assignments.reviewDone > 0 &&
                  ` · 검토완료 ${activity.assignments.reviewDone}`}
              </span>
              <span className="text-fg-muted">
                퀴즈 응시{' '}
                <b className="text-fg tabular-nums">
                  {activity.quizzes.attempted}/{activity.quizzes.totalOpen}
                </b>
                {activity.quizzes.avgScorePct != null &&
                  ` · 평균 ${activity.quizzes.avgScorePct}%`}
              </span>
              <span className="text-fg-muted">
                QnA 질문{' '}
                <b className="text-fg tabular-nums">
                  {activity.qna.questionCount}건
                </b>
              </span>
            </div>
          ) : (
            <EmptyLine>불러오는 중…</EmptyLine>
          )}
        </Section>

        {/* 마일리지 */}
        <Section
          title="마일리지"
          badge={
            mileage ? (
              <StatusBadge label={`잔액 ${mileage.balance}`} tone="info" />
            ) : undefined
          }
        >
          {mileage ? (
            <div className="flex flex-col gap-1 text-[12px]">
              <span className="text-fg-muted">
                적립{' '}
                <b className="text-fg tabular-nums">{mileage.totalEarned}</b> ·
                사용{' '}
                <b className="text-fg tabular-nums">{mileage.totalSpent}</b> ·
                거래{' '}
                <b className="text-fg tabular-nums">{mileage.rows.length}건</b>
              </span>
              {mileage.rows.slice(0, 3).map((r) => (
                <span key={r.id} className="text-fg-subtle">
                  {r.date} · {r.reason} · {r.amount}
                </span>
              ))}
            </div>
          ) : (
            <EmptyLine>마일리지 이력이 없거나 미사용 기수예요</EmptyLine>
          )}
        </Section>

        {/* 이력서 */}
        <Section
          title="이력서"
          badge={
            resume ? (
              <StatusBadge
                label={RESUME_STATUS_LABEL[resume.status] ?? resume.status}
                tone={resume.status === 'COMPLETED' ? 'success' : 'warning'}
              />
            ) : (
              <StatusBadge label="없음" tone="neutral" />
            )
          }
        >
          {resume ? (
            <div className="flex flex-col gap-0.5 text-[12px]">
              <span className="text-fg font-medium">{resume.title}</span>
              <span className="text-fg-subtle">
                피드백 {resume.feedbackCount}건 · 수정 {resume.updatedAt}
              </span>
            </div>
          ) : (
            <EmptyLine>작성된 이력서가 없어요</EmptyLine>
          )}
        </Section>

        {/* 기록실 */}
        <Section title="기록실">
          {records ? (
            <div className="flex flex-col gap-1 text-[12px]">
              <span className="text-fg-muted">
                블로그{' '}
                <b className="text-fg tabular-nums">
                  {blogRow ? `${blogRow.completed}/${blogRow.total}` : '-'}
                </b>{' '}
                · 스터디 연속{' '}
                <b className="text-fg tabular-nums">
                  {studyRow ? `${studyRow.streakWeeks}주` : '-'}
                </b>{' '}
                · 자격증 승인{' '}
                <b className="text-fg tabular-nums">
                  {certRow ? certDone : '-'}
                </b>
              </span>
            </div>
          ) : (
            <EmptyLine>기록실 데이터를 불러오는 중이거나 없어요</EmptyLine>
          )}
        </Section>

        {/* 프로젝트 — 전체 폭 */}
        <div className="xl:col-span-2">
          <Section
            title="프로젝트"
            badge={<StatusBadge label={`${projects.length}건`} tone="info" />}
          >
            {projects.length === 0 ? (
              <EmptyLine>참여 중인 프로젝트가 없어요</EmptyLine>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px]"
                  >
                    <span className="text-fg font-medium">{p.title}</span>
                    <span className="text-fg-subtle">{p.statusLabel}</span>
                    {p.members.find((m) => m.userId === student.id)?.role ===
                      'OWNER' && <StatusBadge label="PM" tone="info" />}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
