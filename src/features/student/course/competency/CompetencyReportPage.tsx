import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useCompetencyReport } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
import { CompetencyMetricCards } from './components/CompetencyMetricCards'
import { ScoreBarPanel } from './components/ScoreBarPanel'
import type { EvidenceTone, RemediationTone } from './types'

const EVIDENCE_CHIP: Record<EvidenceTone, string> = {
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
  success: 'bg-success-bg text-success',
}
const REMEDIATION_CHIP: Record<RemediationTone, string> = {
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
}

/**
 * 과정별 역량 리포트 (/student/course/competency) — Figma 3345:5971.
 * 과정 핵심 지표 + 6축/퀴즈 카테고리 점수 + 근거 목록 + 보완 항목. 증명서 5탭과는 별도.
 */
export default function CompetencyReportPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useCompetencyReport()

  if (isPending) {
    return <div className="text-fg-muted p-8">역량 리포트를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="역량 리포트를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-fg text-2xl font-bold">
          역량 리포트 — {data.courseName} · {data.cohortName}
        </h1>
        <p className="text-fg-muted text-[13px]">
          과정/기수 범위의 학습 성취와 보완 항목을 확인합니다. 증명서
          미리보기와는 별도입니다.
        </p>
      </div>

      <CourseTabs counts={{ quizzes: 2, materials: 24, assignments: 1 }} />

      {/* 과정 핵심 지표 */}
      <div className="flex items-baseline gap-3">
        <h2 className="text-fg text-[18px] font-bold">과정 핵심 지표</h2>
        <span className="text-fg-muted text-[12px]">
          {data.collectedAtLabel}
        </span>
      </div>
      <CompetencyMetricCards metrics={data.metrics} />

      {/* 6축 / 퀴즈 카테고리 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <ScoreBarPanel
          title="6축 역량 추이"
          subtitle="강의 활동에서 산출된 과정 단위 지표"
          bars={data.skillAxes}
          chipLabel="증명서 종합 요약과 동일 산식 사용"
          chipTone="info"
        />
        <ScoreBarPanel
          title="퀴즈 카테고리 점수"
          subtitle="QuizCategoryScore 기반 · 수동 채점 대기 제외"
          bars={data.quizCategories}
          chipLabel="낮은 카테고리는 보완 항목으로 연결"
          chipTone="warning"
        />
      </div>

      {/* 근거 목록 / 보완 항목 */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_400px]">
        <section className="border-border bg-surface flex flex-col gap-3.5 rounded-[14px] border p-6">
          <div className="flex items-baseline gap-3">
            <h2 className="text-fg text-[17px] font-bold">근거 목록</h2>
            <span className="text-fg-muted text-[12px]">
              과제·출결·기록실에서 집계된 과정 근거
            </span>
          </div>
          {data.evidence.map((e) => (
            <div
              key={e.id}
              className="border-border flex items-center justify-between gap-3 rounded-[10px] border p-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-fg text-[14px] font-semibold">
                  {e.title}
                </span>
                <span className="text-fg-muted text-[12px]">{e.sub}</span>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold',
                  EVIDENCE_CHIP[e.chipTone],
                )}
              >
                {e.chipLabel}
              </span>
            </div>
          ))}
        </section>

        <section className="border-border bg-surface flex flex-col gap-3 rounded-[14px] border p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-fg text-[17px] font-bold">보완 항목</h2>
            <span className="text-fg-muted text-[12px]">
              증명서 요청 전 보완이 필요한 과정 데이터
            </span>
          </div>
          {data.remediation.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 py-1">
              <span
                className={cn(
                  'w-fit rounded-full px-3 py-1 text-[12px] font-semibold',
                  REMEDIATION_CHIP[r.chipTone],
                )}
              >
                {r.chipLabel}
              </span>
              <p className="text-fg text-[13px]">{r.desc}</p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => navigate('/student/course/assignments')}
            className="bg-brand mt-2 h-10 w-fit rounded-[10px] px-5 text-[13px] font-semibold text-white"
          >
            보완 항목 확인
          </button>
        </section>
      </div>

      <p className="text-fg-muted text-[12px]">
        주의: 이 화면은 과정/기수 컨텍스트의 학습 진단입니다. 인증 신청·공개
        설정·5탭 증명서 확인은 수강 역량 증명서 메뉴에서 처리합니다.
      </p>
    </div>
  )
}
