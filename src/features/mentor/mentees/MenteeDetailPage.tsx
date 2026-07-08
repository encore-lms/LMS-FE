import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  MessageSquare,
  Star,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useMenteeDetail } from '../api/mentees'
import type { MenteeAttendanceRow } from '../types'

const CARD_SHELL =
  'border-border bg-surface rounded-2xl border shadow-[0_2px_8px_rgba(18,23,38,0.04)]'

// 5축 막대 색 — Figma 축별 색(기술 brand / 책임감 success / 소통 info / 성장 accent /
// 팀워크 warning). 축별 고정 의미 색인지 장식인지는 openQuestion — Figma 표기 그대로.
const AXIS_COLORS = [
  'bg-brand text-brand',
  'bg-success text-success',
  'bg-info text-info',
  'bg-accent-strong text-accent-strong',
  'bg-warning text-warning',
] as const

// 학생 상세 (/mentor/mentees/:studentId) — Figma 2659:1772.
// 팀 상세에서만 진입하는 보조 상세(독립 목록 없음) · 조회 전용 — 변경은 평가/추천 단계.
// 노출 경계: 멘토 본인이 작성한 평가·코멘트·추천 + 일지 참석 이력만(05-26 결정).
// Figma 의 '24h 수정 가능' 표기는 최종 제출 후 수정 불가 정책(05-31)으로 대체(결정 기록).
export default function MenteeDetailPage() {
  usePageHeader(
    '학생 상세',
    '멘티의 평가·추천·참석 이력을 확인합니다',
  )
  const { studentId = '' } = useParams()
  const { data, isPending, isError, refetch } = useMenteeDetail(studentId)

  if (isPending) {
    return <div className="text-fg-muted p-8">학생 정보를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="학생 정보를 불러오지 못했어요"
          description="배정 팀의 팀원만 조회할 수 있어요."
          action={
            <div className="flex items-center gap-2">
              <Button onClick={() => refetch()}>다시 시도</Button>
              <Link
                to="/mentor/teams"
                className="border-border text-fg hover:bg-surface-muted flex h-14 items-center rounded-[11px] border bg-white px-5 text-[15px] font-bold"
              >
                내 배정 팀으로
              </Link>
            </div>
          }
        />
      </div>
    )
  }

  const { student, evaluation, recommendation, attendance } = data

  const attendanceColumns: Column<MenteeAttendanceRow>[] = [
    {
      key: 'round',
      header: '회차',
      className: 'w-16',
      cell: (r) => <span className="text-fg text-xs font-bold">{r.round}</span>,
    },
    {
      key: 'datetime',
      header: '일시',
      className: 'w-[190px]',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium whitespace-nowrap">
          {r.datetimeLabel}
        </span>
      ),
    },
    {
      key: 'place',
      header: '장소',
      cell: (r) => (
        <span className="text-fg-muted text-xs font-medium">
          {r.placeLabel}
        </span>
      ),
    },
    {
      key: 'recognized',
      header: '인정 시간',
      align: 'right',
      className: 'w-[90px]',
      cell: (r) => (
        <span
          className={cn(
            'text-xs font-bold',
            r.recognizedLabel === '-' ? 'text-fg-subtle' : 'text-success',
          )}
        >
          {r.recognizedLabel}
        </span>
      ),
    },
    {
      key: 'attendance',
      header: '참석',
      align: 'center',
      className: 'w-[90px]',
      cell: (r) =>
        r.attended ? (
          <span className="bg-success-bg text-success inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[10px] font-bold">
            <Check className="h-2.5 w-2.5" />
            참석
          </span>
        ) : (
          <span className="bg-surface-muted text-fg-muted inline-flex rounded-[5px] px-2 py-[3px] text-[10px] font-bold">
            불참
          </span>
        ),
    },
    {
      key: 'status',
      header: '일지 상태',
      align: 'center',
      className: 'w-[110px]',
      // Figma 행4 '검토중' 칩은 일지 상태 어휘(초안/유효/수정 요청)에 없어 정본 라벨로
      // 대체(openQuestion 기록) — 승인·검토 개념 없음(제출 즉시 자동 유효).
      cell: (r) =>
        r.logStatus === 'valid' ? (
          <span className="bg-success-bg text-success inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[10px] font-bold whitespace-nowrap">
            <Check className="h-2.5 w-2.5" />
            인정 완료
          </span>
        ) : (
          <span className="bg-danger-bg text-danger inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[10px] font-bold whitespace-nowrap">
            <AlertTriangle className="h-2.5 w-2.5" />
            수정 요청
          </span>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 브레드크럼 + 권한 칩 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/mentor/teams/${student.teamId}`}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-md border px-2.5 py-[5px] text-xs font-medium"
          >
            <ArrowLeft className="h-3 w-3" />팀 상세로
          </Link>
          <span className="text-fg-subtle text-[13px]">›</span>
          <Link
            to="/mentor/teams"
            className="text-fg-muted text-xs font-medium hover:underline"
          >
            내 배정 팀
          </Link>
          <span className="text-fg-subtle text-[13px]">›</span>
          <Link
            to={`/mentor/teams/${student.teamId}`}
            className="text-fg-muted text-xs font-medium hover:underline"
          >
            {student.teamName}
          </Link>
          <span className="text-fg-subtle text-[13px]">›</span>
          <span className="text-fg text-xs font-medium">팀원 학생 상세</span>
        </div>
        <span className="bg-surface-muted flex items-center gap-2 rounded-md px-2.5 py-1">
          <span className="text-fg-subtle text-[10px] tracking-[0.6px]">
            멘토 권한
          </span>
          <span className="text-fg-muted text-[11px] font-bold">
            {data.permissionScopeLabel}
          </span>
        </span>
      </div>

      {/* Hero — brand 배너 */}
      <section className="bg-brand text-on-color flex flex-wrap items-center justify-between gap-6 rounded-2xl px-8 py-7 shadow-[0_8px_22px_rgba(18,23,38,0.18)]">
        <div className="flex items-center gap-5">
          <Avatar name={student.name} size={80} />
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-surface text-fg rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
                {student.cohortLabel}
              </span>
              <span className="text-[11px] font-semibold tracking-[1.98px]">
                STUDENT DETAIL · 멘토 관점
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[28px] leading-8 font-bold">
                {student.name}
              </h2>
              {student.tagLabel && (
                <span className="bg-surface text-fg rounded-md px-2 py-0.5 text-xs font-bold">
                  {student.tagLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <span>
                소속 팀{' '}
                <span className="text-xs font-bold">{student.teamName}</span>
              </span>
              <HeroDot />
              <span>
                멘토{' '}
                <span className="text-xs font-bold">{student.mentorName}</span>
              </span>
              <HeroDot />
              <span>
                학번{' '}
                <span className="text-xs font-bold">{student.studentNo}</span>
              </span>
            </div>
          </div>
        </div>
        {recommendation?.recommended && (
          <div className="bg-surface text-fg flex flex-col items-center gap-1 rounded-xl px-4.5 py-3.5">
            <span className="text-success flex items-center gap-1 text-xs font-bold">
              <Check className="h-3.5 w-3.5" />
              멘토 추천 대상
            </span>
            <span className="text-2xl font-bold">추천</span>
            <span className="text-fg-muted text-[10px] font-medium">
              팀당 1명 추천 정책
            </span>
          </div>
        )}
      </section>

      {/* 노출 범위 안내 배너 — info 틴트 */}
      <section className="bg-info-bg border-info flex items-start gap-3 rounded-xl border p-4">
        <span className="bg-surface text-info flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <Info className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[13px] font-bold">
            멘토에게 노출되는 학생 정보 범위
          </span>
          <p className="text-fg-muted text-xs leading-[18px]">
            배정 팀의 팀원에 한해, 멘토가 직접 작성한 평가·코멘트·추천과 멘토링
            일지의 참석 이력만 표시. HRD-Net 출결·학생 개인 마이 프로필·다른
            멘토 평가는 노출되지 않습니다.
          </p>
          <p className="text-fg-muted text-xs leading-[18px]">
            원문 평가는 수강생에게 비공개이며, 외부(증명서) 공개는 증명서 전체
            공개 토글 + 인증 완료 + 최신화 스냅샷 기준을 따릅니다.
          </p>
        </div>
      </section>

      {/* 멘토 평가 5축 */}
      <section className={CARD_SHELL}>
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-fg text-base font-bold">멘토 평가 5축</h3>
              {evaluation && (
                <span className="bg-surface-muted text-fg-muted rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                  작성 {evaluation.writtenAtLabel} · 제출 후 수정 불가
                </span>
              )}
            </div>
          </div>
          {evaluation && (
            <div className="flex flex-col items-end">
              <span className="text-fg-subtle text-[10px] tracking-[0.6px]">
                평가 평균
              </span>
              <span className="flex items-baseline gap-1">
                <span className="text-brand text-[26px] font-bold">
                  {evaluation.average}
                </span>
                <span className="text-fg-subtle text-xs">/ 5.0</span>
              </span>
            </div>
          )}
        </header>
        {evaluation ? (
          <div className="flex flex-col gap-2.5 px-6 pb-5">
            {evaluation.axes.map((axis, i) => {
              const [fill, text] =
                AXIS_COLORS[i % AXIS_COLORS.length].split(' ')
              return (
                <div key={axis.label} className="flex items-center gap-3">
                  <span className="text-fg w-14 text-[13px] font-bold">
                    {axis.label}
                  </span>
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: axis.max }, (_, seg) => (
                      <span
                        key={seg}
                        className={cn(
                          'h-3 flex-1 rounded-[3px]',
                          seg < axis.score ? fill : 'bg-surface-muted',
                        )}
                        aria-hidden
                      />
                    ))}
                  </div>
                  <span className="w-[60px] text-right">
                    <span className={cn('text-lg font-bold', text)}>
                      {axis.score}
                    </span>
                    <span className="text-fg-subtle text-[11px]"> /5</span>
                  </span>
                </div>
              )
            })}
            {evaluation.comment && (
              <div className="bg-surface-muted mt-1.5 flex flex-col gap-1.5 rounded-[10px] px-4 py-3.5">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="text-fg-muted h-3 w-3" />
                  <span className="text-fg text-xs font-bold">멘토 코멘트</span>
                  <span className="bg-danger-bg text-danger rounded px-1.5 py-px text-[10px] font-bold">
                    필수
                  </span>
                </span>
                <p className="text-fg-muted text-[13px] leading-5">
                  {evaluation.comment}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pb-5">
            <Empty
              icon={<Star />}
              title="아직 제출한 평가가 없어요"
              description="N시간 완료 또는 조기 종료 후 평가·추천 단계에서 작성할 수 있어요."
              className="py-8"
            />
          </div>
        )}
      </section>

      {/* 멘토 추천 대상 — 추천 확정 시에만 */}
      {recommendation?.recommended && (
        <section className="border-success overflow-hidden rounded-2xl border-[1.5px]">
          <header className="bg-success-bg border-success flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="bg-surface text-success flex h-9 w-9 items-center justify-center rounded-lg">
                <Check className="h-4 w-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="text-fg text-[15px] font-bold">
                    멘토 추천 대상
                  </span>
                  <span className="bg-success text-on-color rounded-[5px] px-2 py-[3px] text-[11px] font-bold">
                    추천 확정
                  </span>
                </span>
                <span className="text-fg-muted text-xs">
                  팀당 1명 추천 정책에 따라 본 학생이 추천 대상으로 선정됨
                </span>
              </div>
            </div>
            <span className="text-fg-subtle text-[11px]">
              제출 {recommendation.submittedAtLabel} · 제출 후 수정 불가
            </span>
          </header>
          <div className="bg-surface flex flex-col gap-2.5 px-6 py-5">
            <span className="flex items-center gap-2">
              <span className="text-fg-muted text-xs font-bold">
                추천 사유 (멘토 작성, {recommendation.reason.length}자)
              </span>
              <span className="bg-danger-bg text-danger rounded px-1.5 py-px text-[10px] font-bold">
                필수
              </span>
            </span>
            <div className="border-border rounded-lg border px-3.5 py-3">
              <p className="text-fg text-[13px] leading-5">
                {recommendation.reason}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 멘토링 참석 이력 */}
      <section className={CARD_SHELL}>
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5 pb-3.5">
          <div className="flex flex-col gap-1">
            <h3 className="text-fg text-base font-bold">멘토링 참석 이력</h3>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-fg-subtle text-[10px] tracking-[0.6px]">
              참석
            </span>
            <span className="flex items-baseline gap-1">
              <span className="text-success text-xl font-bold">
                {attendance.attended}
              </span>
              <span className="text-fg-subtle text-[11px]">
                / {attendance.total}회
              </span>
            </span>
          </div>
        </header>
        <div className="px-6 pb-5">
          <DataTable
            columns={attendanceColumns}
            rows={attendance.history}
            rowKey={(r) => r.logId}
            empty="참석 이력이 없습니다"
          />
        </div>
      </section>

      {/* 하단 액션 바 — 평가/추천 라우트는 M5 평가·추천 PR 에서 구현(canonical 경로 선연결) */}
      <section className="bg-brand-deep text-on-color flex flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 shadow-[0_6px_18px_rgba(18,23,38,0.16)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold">
            학생 평가 / 추천은 평가·추천 페이지에서 확인 (제출 후 수정 불가)
          </span>
          <span className="text-on-color/70 text-[11px]">
            학생 상세는 조회 전용 화면이며, 변경은 평가/추천 단계에서 처리합니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/mentor/teams/${student.teamId}/evaluation`}
            className="border-on-color/70 text-on-color hover:bg-on-color/10 flex items-center gap-1.5 rounded-[9px] border px-3.5 py-2 text-xs font-medium"
          >
            평가로 이동
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to={`/mentor/teams/${student.teamId}/recommendation`}
            className="bg-success text-on-color hover:bg-success/90 flex items-center gap-1.5 rounded-[9px] px-4 py-2 text-xs font-bold"
          >
            추천으로 이동
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function HeroDot() {
  return (
    <span className="bg-on-color/60 h-[3px] w-[3px] rounded-full" aria-hidden />
  )
}
