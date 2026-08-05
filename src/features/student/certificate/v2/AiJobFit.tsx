import {
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Wrench,
} from 'lucide-react'
import type { AiJobFit as AiJobFitData } from '../ai'
import { AiAnalysisPanel } from './AiAnalysisPanel'

const CONFIDENCE_LABEL = { HIGH: '높음', MEDIUM: '보통', LOW: '낮음' } as const

export function AiJobFit({ jobFit }: { jobFit: AiJobFitData }) {
  const primary = jobFit.primaryRole
  if (!primary) return null

  const { projectRoles, troubleshooting, highAchievements } =
    primary.fitEvidence

  return (
    <AiAnalysisPanel
      index="01"
      title="직무 적합도"
      description="프로젝트 개인 역할, 인증 문제해결, 80점 이상 직무 연관 성취를 함께 분석한 결과입니다."
    >
      <section className="bg-brand text-on-color overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <div className="text-on-color/80 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
              <span>가장 적합한 직무</span>
              <span aria-hidden="true">·</span>
              <span>근거 충분도 {CONFIDENCE_LABEL[primary.confidence]}</span>
            </div>
            <h3 className="mt-2 text-[24px] leading-8 font-extrabold">
              {primary.jobLabel}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="bg-on-color/15 rounded-lg px-3 py-1.5 text-[14px] font-semibold">
                역할 · {primary.roleLabel}
              </span>
              <span className="bg-on-color/15 rounded-lg px-3 py-1.5 text-[14px] font-semibold">
                유형 · {primary.workType}
              </span>
            </div>
            <p className="text-on-color/90 mt-4 max-w-3xl text-[14px] leading-6">
              {jobFit.summary}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <span className="text-on-color/75 block text-[12px] font-semibold">
              적합도
            </span>
            <strong className="mt-1 block text-[36px] leading-none font-extrabold">
              {primary.fitScore}
              <span className="ml-1 text-[15px]">점</span>
            </strong>
          </div>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-3">
        <article className="border-border bg-surface rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-accent-bg text-accent-strong flex size-9 items-center justify-center rounded-lg">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-fg text-[15px] font-bold">프로젝트 역할</h3>
              <p className="text-fg-subtle text-[12px]">개인 담당 과업 40%</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {projectRoles.map((item) => (
              <div
                key={item.label}
                className="bg-surface-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
              >
                <span className="text-fg text-[14px] font-semibold">
                  {item.label}
                </span>
                <span className="text-fg-muted shrink-0 text-[12px]">
                  {item.projectCount}개 프로젝트
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="border-border bg-surface rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-success-bg text-success flex size-9 items-center justify-center rounded-lg">
              <Wrench className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-fg text-[15px] font-bold">문제해결 근거</h3>
              <p className="text-fg-subtle text-[12px]">인증 트러블슈팅 30%</p>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <strong className="text-fg text-[22px] font-extrabold">
              {troubleshooting.certifiedCaseCount}건
            </strong>
            <span className="text-fg-muted text-[13px]">
              독립 해결 {troubleshooting.independentCaseCount}건
              {troubleshooting.independentRate != null &&
                ` · ${troubleshooting.independentRate}%`}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {troubleshooting.tags.map((tag) => (
              <span
                key={tag.label}
                className="bg-success-bg text-success rounded-lg px-2.5 py-1.5 text-[12px] font-semibold"
              >
                {tag.label} {tag.count}건
              </span>
            ))}
          </div>
        </article>

        <article className="border-border bg-surface rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-info-bg text-info flex size-9 items-center justify-center rounded-lg">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-fg text-[15px] font-bold">상위 성취 결과</h3>
              <p className="text-fg-subtle text-[12px]">
                직무 연관 80점 이상 20%
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {highAchievements.map((item) => (
              <div
                key={item.category}
                className="bg-surface-muted flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
              >
                <span className="text-fg text-[13px] font-semibold">
                  {item.category}
                </span>
                <strong className="text-info shrink-0 text-[16px]">
                  {item.score}점
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="border-border bg-surface-muted flex items-start gap-2 rounded-xl border px-4 py-3">
        <CheckCircle2
          className="text-success mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />
        <p className="text-fg-muted text-[13px] leading-5">
          직무 적합도는 개인 역할 40%, 인증 문제해결 30%, 80점 이상 직무 연관
          성취 20%, 교차 검증 10%로 계산합니다. 도메인과 희망 직무는 근거에서
          제외하며, 80점 미만이나 미응시는 감점하지 않습니다.
        </p>
      </div>
    </AiAnalysisPanel>
  )
}
