import type { ReactNode } from 'react'
import { usePeerEvaluations } from './api'
import { useStudentMileageHistory } from '../mileage/history/api'
import type { StudentAccount, InstructorRecordReviewData } from '@/shared/types'
import type { ResumeRow } from '@/shared/types'
import type {
  MentorEvaluationDetail,
  ReputationStudent,
} from '../reputation/types'
import type { CohortProject, StaffEvalRaterEntry } from './types'

// 수강생 종합 '원본 데이터(DB)' 뷰(2026-08-07) — 화면 가공 전 값을 실제 테이블·필드명 그대로
// DB 명세처럼 나열한다. 어떤 데이터를 강사·수강생에 개방할지 정하는 검토용(사용자 요청).
// 표기 테이블명은 각 도메인의 실제 저장 위치(스키마.테이블) 기준이고, 값은 매니저 API 응답 원본이다.
// ※ 과제 제출·퀴즈 응시·QnA 작성글·알림은 수강생 단위 조회 API가 없어 미포함(BE 신설 필요, 후속).

const fmt = (v: unknown): string => {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (Array.isArray(v)) return JSON.stringify(v)
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

/** 테이블 카드 — 헤더에 스키마.테이블명(코드체) + 설명. */
function RawTable({
  table,
  desc,
  children,
}: {
  table: string
  desc?: string
  children: ReactNode
}) {
  return (
    <section className="border-border bg-surface overflow-hidden rounded-xl border">
      <div className="border-divider bg-surface-muted flex flex-wrap items-baseline gap-2 border-b px-4 py-2">
        <code className="text-fg font-mono text-[12px] font-bold">{table}</code>
        {desc && <span className="text-fg-subtle text-[11px]">{desc}</span>}
      </div>
      <div className="overflow-x-auto px-4 py-3">{children}</div>
    </section>
  )
}

/** 단일 행 — 필드:값 2열(DB 명세식). */
function KV({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      {Object.entries(data).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-fg-subtle font-mono text-[11px]">{k}</dt>
          <dd className="text-fg font-mono text-[11px] break-all">{fmt(v)}</dd>
        </div>
      ))}
    </dl>
  )
}

/** 다행 — 컬럼 헤더 + 행(모노스페이스). */
function Rows({
  columns,
  rows,
}: {
  columns: string[]
  rows: Record<string, unknown>[]
}) {
  if (rows.length === 0)
    return <p className="text-fg-subtle font-mono text-[11px]">0 rows</p>
  return (
    <table className="w-full text-left">
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c}
              className="text-fg-subtle pr-4 pb-1 font-mono text-[11px] font-medium"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-divider border-t">
            {columns.map((c) => (
              <td
                key={c}
                className="text-fg py-1 pr-4 font-mono text-[11px] break-all"
              >
                {fmt(r[c])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** 프로젝트 1건의 상호평가 원본 — 받은 평가만 추려 테이블로. */
function PeerEvalRawTable({
  projectId,
  projectTitle,
  studentUserId,
}: {
  projectId: string
  projectTitle: string
  studentUserId: string
}) {
  const { data } = usePeerEvaluations(projectId)
  const received = (data?.evaluations ?? []).filter(
    (e) => e.targetUserId === studentUserId,
  )
  return (
    <RawTable
      table="education.project_peer_evaluations"
      desc={`received · ${projectTitle}`}
    >
      <Rows
        columns={[
          'raterName',
          'scores',
          'average',
          'comment',
          'draft',
          'submittedAt',
        ]}
        rows={received.map((e) => ({ ...e }))}
      />
    </RawTable>
  )
}

export function StudentOverviewRaw({
  student,
  cohortId,
  staffEntries,
  reputation,
  mentorDetail,
  resume,
  projects,
  attendanceIssue,
  records,
}: {
  student: StudentAccount
  cohortId: string
  staffEntries: StaffEvalRaterEntry[]
  reputation: ReputationStudent | null
  mentorDetail: MentorEvaluationDetail | null
  resume: ResumeRow | null
  projects: CohortProject[]
  attendanceIssue: {
    lateCount: number
    absentCount: number
    marks?: string[]
  } | null
  records: InstructorRecordReviewData | null
}) {
  const mileage = useStudentMileageHistory(student.id)
  const blogRow = records?.blog.find((r) => r.student.name === student.name)
  const studyRow = records?.study.find((r) => r.student.name === student.name)
  const certRow = records?.cert.find((r) => r.student.name === student.name)

  return (
    <div className="flex flex-col gap-3">
      <RawTable
        table="auth_user.users"
        desc="계정·훈련 상태(useStudentAccounts)"
      >
        <KV
          data={{
            id: student.id,
            name: student.name,
            student_uuid: student.studentUuid,
            birth_date: student.birthDate,
            joined_at: student.joinedAt,
            last_login_at: student.lastLoginAt,
            training_status: student.trainingStatus,
            hrd_training_status: student.hrdTrainingStatus,
            login_blocked: student.loginBlocked,
            is_test: student.isTest,
            cohort_id: cohortId,
          }}
        />
      </RawTable>

      <RawTable
        table="auth_user.staff_student_evaluations"
        desc="강사·매니저 4축 평가 — scores 순서: 기술/기술기여·소통·협업·팀워크·문제해결·책임감"
      >
        <Rows
          columns={[
            'raterName',
            'raterRole',
            'scores',
            'comment',
            'updatedAtLabel',
          ]}
          rows={staffEntries.map((e) => ({ ...e }))}
        />
      </RawTable>

      <RawTable
        table="auth_user.mentor_evaluation_entries"
        desc="멘토 4축 평가 + mentor_recommendations(추천)"
      >
        {mentorDetail && mentorDetail.hasTeam ? (
          <KV
            data={{
              team_name: mentorDetail.teamName,
              mentor_name: mentorDetail.mentorName,
              eval_status: mentorDetail.evalStatus,
              evaluation_submitted: mentorDetail.evaluationSubmitted,
              ...Object.fromEntries(
                mentorDetail.axes.map((a) => [`score(${a.label})`, a.value]),
              ),
              comment: mentorDetail.comment,
              recommendation: mentorDetail.recommendation,
              recommendation_summary: mentorDetail.recommendationSummary,
            }}
          />
        ) : (
          <p className="text-fg-subtle font-mono text-[11px]">
            0 rows (멘토링 팀 미배정)
          </p>
        )}
      </RawTable>

      <RawTable
        table="education.instructor_endorsements"
        desc="강사 추천서(평판 관리 집계)"
      >
        <KV
          data={{
            endorsement_status: reputation?.endorsementStatus ?? null,
            endorsement_by: reputation?.endorsementBy ?? null,
            endorsement_comment: reputation?.endorsementComment ?? null,
          }}
        />
      </RawTable>

      <RawTable table="reputation(집계)" desc="운영 평판 관리 row 원본">
        <KV
          data={{
            mentor_eval_status: reputation?.mentorEvalStatus ?? null,
            mentor_by: reputation?.mentorBy ?? null,
            mentor_scores: reputation?.mentorScores ?? null,
            peer_count: reputation?.peerCount ?? null,
            peer_total: reputation?.peerTotal ?? null,
            push_targets: reputation?.pushTargets ?? null,
          }}
        />
      </RawTable>

      {projects.map((p) => (
        <PeerEvalRawTable
          key={p.id}
          projectId={p.id}
          projectTitle={p.title}
          studentUserId={student.id}
        />
      ))}

      <RawTable table="learning.resumes" desc="이력서">
        {resume ? (
          <KV
            data={{
              id: resume.id,
              student_user_id: resume.studentUserId,
              title: resume.title,
              status: resume.status,
              feedback_count: resume.feedbackCount,
              updated_at: resume.updatedAt,
            }}
          />
        ) : (
          <p className="text-fg-subtle font-mono text-[11px]">0 rows</p>
        )}
      </RawTable>

      <RawTable
        table="learning.records(records/review)"
        desc="기록실 — 블로그/스터디/자격증 그리드 행 원본(이름 조인)"
      >
        <KV
          data={{
            'blog.completed/total': blogRow
              ? `${blogRow.completed}/${blogRow.total}`
              : null,
            'blog.cells': blogRow?.cells ?? null,
            'study.streak_weeks': studyRow?.streakWeeks ?? null,
            'study.mileage_paid': studyRow?.mileagePaid ?? null,
            'cert.certs': certRow?.certs ?? null,
            'cert.mileage': certRow?.mileage ?? null,
            'cert.paid': certRow?.paid ?? null,
          }}
        />
      </RawTable>

      <RawTable
        table="education.projects + project_members"
        desc="참여 프로젝트"
      >
        <Rows
          columns={[
            'title',
            'status',
            'period',
            'memberCount',
            'role',
            'peerEvalEnabled',
          ]}
          rows={projects.map((p) => ({
            title: p.title,
            status: p.status,
            period: p.period,
            memberCount: p.memberCount,
            role: p.members.find((m) => m.userId === student.id)?.role ?? null,
            peerEvalEnabled: p.peerEvalEnabled,
          }))}
        />
      </RawTable>

      <RawTable
        table="HRD-Net attendance(issues)"
        desc="출결 이슈(지각·결석 반복) — 요약 API 원본"
      >
        {attendanceIssue ? (
          <KV
            data={{
              late_count: attendanceIssue.lateCount,
              absent_count: attendanceIssue.absentCount,
              marks: attendanceIssue.marks ?? null,
            }}
          />
        ) : (
          <p className="text-fg-subtle font-mono text-[11px]">
            0 rows (이슈 없음)
          </p>
        )}
      </RawTable>

      <RawTable
        table="operations.mileage_transactions"
        desc="마일리지 원장(수강생 이력)"
      >
        {mileage.data ? (
          <div className="flex flex-col gap-2">
            <KV
              data={{
                balance: mileage.data.balance,
                total_earned: mileage.data.totalEarned,
                total_spent: mileage.data.totalSpent,
              }}
            />
            <Rows
              columns={['date', 'txType', 'reason', 'amount']}
              rows={mileage.data.rows.map((r) => ({ ...r }))}
            />
          </div>
        ) : (
          <p className="text-fg-subtle font-mono text-[11px]">
            {mileage.isError
              ? '조회 실패(마일리지 미사용 기수일 수 있음)'
              : '불러오는 중…'}
          </p>
        )}
      </RawTable>

      <p className="text-fg-subtle px-1 text-[11px]">
        미포함(수강생 단위 조회 API 없음 — BE 신설 필요): 과제 제출·퀴즈
        응시·QnA 작성글·알림·멘토링 일지 참석·트러블슈팅·증명서 발행 이력.
      </p>
    </div>
  )
}
