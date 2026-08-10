import type { ReactNode } from 'react'
import { AlertTriangle, Bot, ClipboardList, FileText } from 'lucide-react'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import type {
  DiagnosisLevel,
  StudentDiagnosis,
  WeeklyDiagnosisReport,
} from './types'

// 진단 리포트 단일 주차 뷰 — 그룹 요약 → 학생별 현황 표 → 학생별 상세 카드.
// LLM PoV 산출물 구조(지표 그리드·진단 근거·취약 패턴·위험 신호·권장 조치·피드백 초안)를 그대로 따른다.

const LEVEL_TONE: Record<DiagnosisLevel, BadgeTone> = {
  입문: 'neutral',
  초급: 'warning',
  중급: 'info',
  해결사: 'success',
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h4 className="text-fg text-[13px] font-bold">{children}</h4>
}

function BulletList({
  items,
  warning = false,
}: {
  items: string[]
  warning?: boolean
}) {
  if (items.length === 0) {
    return <p className="text-fg-subtle text-[13px]">없음</p>
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li
          key={item}
          className={`flex items-start gap-1.5 text-[13px] leading-relaxed ${
            warning ? 'text-warning' : 'text-fg-muted'
          }`}
        >
          <span aria-hidden="true" className="mt-0.5 shrink-0">
            {warning ? '⚠' : '•'}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-fg-subtle text-[11px] font-medium">{label}</dt>
      <dd className="text-fg text-[13px] font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  )
}

function StudentCard({ s }: { s: StudentDiagnosis }) {
  const m = s.metrics
  return (
    <section className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5">
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-fg text-[15px] font-bold">{s.name}</h3>
        <span className="text-fg-subtle text-xs">A그룹 · {s.track}</span>
        <StatusBadge label={s.level} tone={LEVEL_TONE[s.level]} />
        <span className="text-fg-subtle text-xs">확신도: {s.confidence}</span>
      </header>

      <dl className="border-border bg-surface-muted/50 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-4">
        <MetricCell
          label="진행 단계"
          value={`${m.stepsCompleted}/${m.totalSteps} 완료 (현재 ${m.currentStep}단계)`}
        />
        <MetricCell label="활동일" value={`${m.activeDays}일`} />
        <MetricCell label="현 단계 정체" value={`${m.stalledDays}일`} />
        <MetricCell
          label="최근 미접속"
          value={`${m.daysSinceLastActivity}일`}
        />
        <MetricCell
          label="실행당 에러"
          value={`${m.errorPerRun.toFixed(2)} (${m.errorRuns}회/${m.totalRuns}회)`}
        />
        <MetricCell
          label="힌트 요청"
          value={`${m.hintTotal}회 (일 ${m.hintPerActiveDay.toFixed(2)}회)`}
        />
        <MetricCell
          label="에러 후 재시도 간격"
          value={`${m.retryGapAvgMin.toFixed(1)}분 (최대 ${m.retryGapMaxMin.toFixed(1)}분)`}
        />
        <MetricCell
          label="주요 에러"
          value={m.topErrors.map((e) => `${e.type}×${e.count}`).join(', ')}
        />
      </dl>

      <div className="flex flex-col gap-1.5">
        <SectionTitle>진단 근거</SectionTitle>
        <p className="text-fg-muted text-[13px] leading-relaxed">{s.basis}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionTitle>취약 패턴</SectionTitle>
        <BulletList items={s.weakPatterns} />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionTitle>이탈·부진 위험 신호</SectionTitle>
        <BulletList items={s.riskSignals} warning />
      </div>

      <div className="flex flex-col gap-1.5">
        <SectionTitle>강사 권장 조치</SectionTitle>
        <BulletList items={s.actions} />
      </div>

      <div className="border-brand/30 bg-brand/5 flex flex-col gap-1.5 rounded-lg border p-4">
        <h4 className="text-brand-deep flex items-center gap-1.5 text-[13px] font-bold">
          <FileText aria-hidden="true" className="h-3.5 w-3.5" />
          피드백 초안 (강사 검토·승인 후 전달 — AI가 직접 전달하지 않음)
        </h4>
        <p className="text-fg text-[13px] leading-relaxed">{s.feedbackDraft}</p>
      </div>
    </section>
  )
}

export function ReportView({ report }: { report: WeeklyDiagnosisReport }) {
  return (
    <article className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-fg text-lg font-bold">
          주간 수준 진단 리포트 — {report.group} ({report.trackLabel})
        </h2>
        <p className="text-fg-subtle text-xs">
          {report.week}주차 · 분석 기준일: {report.baseDate} · 생성:{' '}
          {report.generator}
        </p>
      </header>

      <div className="border-warning/40 bg-warning-bg text-warning flex items-start gap-2 rounded-lg border p-3 text-[13px] leading-relaxed">
        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          본 리포트는 AI 분석 결과이며, 피드백 초안은 반드시 강사/매니저 검토 후
          전달합니다.
        </p>
      </div>

      <section className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-5">
        <h3 className="text-fg flex items-center gap-1.5 text-[14px] font-bold">
          <Bot aria-hidden="true" className="h-4 w-4" />
          그룹 요약 (AI)
        </h3>
        <p className="text-fg-muted text-[13px] leading-relaxed">
          {report.groupSummary}
        </p>
      </section>

      <section className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-5">
        <h3 className="text-fg flex items-center gap-1.5 text-[14px] font-bold">
          <ClipboardList aria-hidden="true" className="h-4 w-4" />
          학생별 현황
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-border text-fg-subtle border-b text-xs">
                <th className="py-2 pr-4 font-medium">이름</th>
                <th className="py-2 pr-4 font-medium">등급</th>
                <th className="py-2 pr-4 font-medium">진행</th>
                <th className="py-2 pr-4 font-medium">정체</th>
                <th className="py-2 font-medium">위험 신호</th>
              </tr>
            </thead>
            <tbody>
              {report.students.map((s) => (
                <tr
                  key={s.name}
                  className="border-divider border-b last:border-0"
                >
                  <td className="text-fg py-2 pr-4 font-semibold">{s.name}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge label={s.level} tone={LEVEL_TONE[s.level]} />
                  </td>
                  <td className="text-fg-muted py-2 pr-4 tabular-nums">
                    {s.metrics.stepsCompleted}/{s.metrics.totalSteps}
                  </td>
                  <td className="text-fg-muted py-2 pr-4 tabular-nums">
                    {s.metrics.stalledDays}일
                  </td>
                  <td className="py-2">
                    {s.riskSignals.length > 0 ? (
                      <span className="text-warning">
                        ⚠ {s.riskSignals.length}건
                      </span>
                    ) : (
                      <span className="text-fg-subtle">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {report.students.map((s) => (
        <StudentCard key={s.name} s={s} />
      ))}
    </article>
  )
}
