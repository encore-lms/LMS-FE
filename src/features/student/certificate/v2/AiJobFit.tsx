import { BriefcaseBusiness, GraduationCap, Sparkles } from 'lucide-react'
import type { AiJobFit as AiJobFitData } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const CONFIDENCE_LABEL = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' } as const

type PrimaryRole = NonNullable<AiJobFitData['primaryRole']>

function analyzeStrengths(primary: PrimaryRole) {
  const strengths: string[] = []
  const projectRole = primary.fitEvidence.projectRoles[0]
  const troubleshooting = primary.fitEvidence.troubleshooting.tags[0]
  const achievement = primary.fitEvidence.highAchievements[0]

  if (projectRole) {
    strengths.push(
      `${projectRole.label} 역할을 중심으로 수행을 완결하는 실행력`,
    )
  }
  if (troubleshooting) {
    strengths.push(`${troubleshooting.label} 문제를 구조화하고 해결하는 역량`)
  }
  if (achievement) {
    strengths.push(`${achievement.category} 이론을 직무 판단과 연결하는 이해력`)
  }

  return strengths.length > 0 ? strengths.slice(0, 3) : [primary.summary]
}

export function AiJobFit({ jobFit }: { jobFit: AiJobFitData }) {
  const primary = jobFit.primaryRole
  if (!primary) return null

  const relatedRoles = jobFit.roleCandidates.filter(
    (candidate) => candidate.rank !== primary.rank,
  )
  const strengths = analyzeStrengths(primary)
  const theory = primary.theoryUnderstanding ?? {
    label: '분석 준비 중',
    summary: '직무 관련 이론 평가가 쌓이면 이해 수준을 분석합니다.',
  }

  return (
    <AiAnalysisPanel
      id="ai-job-fit"
      index="01"
      tone="accent"
      title="직무 적합도"
      description="수강생에게 어울리는 직무, 개발자 유형, 핵심 강점과 관련 이론 이해도를 AI가 종합했습니다."
    >
      <section className="border-accent/25 bg-accent-bg/55 grid gap-5 rounded-2xl border p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-center">
        <div className="min-w-0">
          <div className="text-accent-strong flex flex-wrap items-center gap-2 text-[13px] font-bold">
            <span>가장 어울리는 직무</span>
            <span aria-hidden="true">·</span>
            <span>분석 신뢰도 {CONFIDENCE_LABEL[primary.confidence]}</span>
          </div>
          <h3 className="text-fg mt-2 text-[26px] leading-9 font-extrabold">
            {primary.jobLabel}
          </h3>
          <p className="text-fg-muted mt-3 max-w-3xl text-[15px] leading-7">
            {jobFit.summary} {primary.summary}
          </p>
        </div>

        <div className="border-accent/20 bg-surface rounded-2xl border px-5 py-4 text-left shadow-sm lg:text-center">
          <span className="text-fg-subtle text-[13px] font-semibold">
            직무 적합도
          </span>
          <strong className="text-accent-strong mt-1 block text-[38px] leading-none font-extrabold">
            {primary.fitScore}
            <span className="ml-1 text-[15px]">점</span>
          </strong>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="border-border bg-surface rounded-2xl border p-5">
          <span className="bg-accent-bg text-accent-strong flex size-9 items-center justify-center rounded-xl">
            <BriefcaseBusiness className="size-4" aria-hidden="true" />
          </span>
          <span className="text-fg-subtle mt-4 block text-[12px] font-bold">
            개발자 유형
          </span>
          <h3 className="text-fg mt-1 text-[17px] leading-6 font-bold">
            {primary.workType}
          </h3>
          <p className="text-fg-muted mt-2 text-[14px] leading-6">
            {primary.roleLabel} 영역에서 강점이 선명하며, 문제를 단계적으로
            다루고 결과를 확인하며 완성도를 높이는 유형입니다.
          </p>
        </section>

        <section className="border-border bg-surface rounded-2xl border p-5">
          <span className="bg-success-bg text-success flex size-9 items-center justify-center rounded-xl">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-fg-subtle mt-4 block text-[12px] font-bold">
            핵심 강점
          </span>
          <ul className="mt-2 flex flex-col gap-2.5">
            {strengths.map((strength) => (
              <li
                key={strength}
                className="text-fg text-[14px] leading-6 font-semibold"
              >
                {strength}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-border bg-surface rounded-2xl border p-5">
          <span className="bg-info-bg text-info flex size-9 items-center justify-center rounded-xl">
            <GraduationCap className="size-4" aria-hidden="true" />
          </span>
          <span className="text-fg-subtle mt-4 block text-[12px] font-bold">
            관련 이론 이해도
          </span>
          <h3 className="text-info mt-1 text-[17px] leading-6 font-bold">
            {theory.label}
          </h3>
          <p className="text-fg-muted mt-2 text-[14px] leading-6">
            {theory.summary}
          </p>
        </section>
      </div>

      {relatedRoles.length > 0 && (
        <section className="border-border bg-surface-muted rounded-2xl border px-5 py-4">
          <h3 className="text-fg text-[14px] font-bold">
            함께 고려할 수 있는 직무 방향
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedRoles.map((role) => (
              <span
                key={role.rank}
                className="bg-surface text-fg-muted rounded-lg px-3 py-2 text-[13px] font-semibold"
              >
                {role.jobLabel} · {role.fitScore}점
              </span>
            ))}
          </div>
        </section>
      )}

      {jobFit.limitations.length > 0 && (
        <p className="text-fg-subtle border-border border-t pt-4 text-[13px] leading-6">
          분석 한계 · {jobFit.limitations.join(' · ')}
        </p>
      )}
    </AiAnalysisPanel>
  )
}
