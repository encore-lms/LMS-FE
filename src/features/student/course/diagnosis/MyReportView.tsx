import {
  Bot,
  Lightbulb,
  MessageSquareHeart,
  ThumbsUp,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LEVEL_TONE } from './levelTone'
import { MetricGrid } from './MetricGrid'
import type { MyWeeklyReport } from './types'

// 개인 진단 리포트 단일 주차 뷰 — 수강생 눈높이 구성:
// 이번 주 요약 → 지표 → 지난주 대비 변화 → 강점 → 보완점 → 학습 제안 → 강사 피드백.
// 그룹 리포트와 달리 강사 권장 조치·위험 신호 원문·타 학생 정보는 싣지 않는다.

function Section({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: string[]
}) {
  return (
    <section className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
      <h3 className="text-fg flex items-center gap-1.5 text-[14px] font-bold">
        <span aria-hidden="true" className="[&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li
            key={item}
            className="text-fg-muted flex items-start gap-1.5 text-[13px] leading-relaxed"
          >
            <span aria-hidden="true" className="mt-0.5 shrink-0">
              •
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function MyReportView({ report }: { report: MyWeeklyReport }) {
  const m = report.metrics
  return (
    <article className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-fg text-lg font-bold">
          나의 주간 수준 진단 리포트
        </h2>
        <p className="text-fg-subtle text-xs">
          {report.week}주차 · 분석 기준일: {report.baseDate} · 생성:{' '}
          {report.generator}
        </p>
      </header>

      <div className="border-info/40 bg-info-bg text-info flex items-start gap-2 rounded-lg border p-3 text-[13px] leading-relaxed">
        <Bot aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          AI가 학습 기록을 분석한 참고용 리포트예요. 실제 지도와 피드백은
          강사·매니저가 함께합니다.
        </p>
      </div>

      <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-fg text-[14px] font-bold">이번 주 나의 수준</h3>
          <StatusBadge label={report.level} tone={LEVEL_TONE[report.level]} />
          <span className="text-fg-subtle text-xs">
            확신도: {report.confidence}
          </span>
          <span className="text-fg-muted ml-auto text-[13px] tabular-nums">
            진행 {m.stepsCompleted}/{m.totalSteps}단계
          </span>
        </div>
        <MetricGrid m={m} />
      </section>

      <Section
        icon={<TrendingUp />}
        title="지난주 대비 변화"
        items={report.growth}
      />
      <Section
        icon={<ThumbsUp />}
        title="잘하고 있는 점"
        items={report.strengths}
      />
      <Section
        icon={<Wrench />}
        title="보완하면 좋은 점"
        items={report.weakPatterns}
      />
      <Section
        icon={<Lightbulb />}
        title="이번 주 학습 제안"
        items={report.tips}
      />

      <section className="border-brand/30 bg-brand/5 flex flex-col gap-1.5 rounded-xl border p-5">
        <h3 className="text-brand-deep flex items-center gap-1.5 text-[14px] font-bold">
          <MessageSquareHeart aria-hidden="true" className="h-4 w-4" />
          강사 피드백
        </h3>
        <p className="text-fg text-[13px] leading-relaxed">
          {report.instructorFeedback}
        </p>
      </section>
    </article>
  )
}
