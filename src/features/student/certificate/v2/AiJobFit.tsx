import { useState } from 'react'
import { BriefcaseBusiness, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { AiJobFit as AiJobFitData } from '../ai'
import { AiAnalysisEvidence } from './AiAnalysisEvidence'
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
  const [selectedRank, setSelectedRank] = useState(
    jobFit.primaryRole?.rank ?? 1,
  )
  const primary = jobFit.primaryRole
  if (!primary) return null

  const candidates = [
    primary,
    ...jobFit.roleCandidates.filter(
      (candidate) => candidate.rank !== primary.rank,
    ),
  ]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
  const selected =
    candidates.find((candidate) => candidate.rank === selectedRank) ?? primary
  const strengths = analyzeStrengths(selected)
  const theory = selected.theoryUnderstanding ?? {
    label: '분석 준비 중',
    summary: '직무 관련 이론 평가가 쌓이면 이해 수준을 분석합니다.',
  }
  const sourceData = jobFit.sourceData
  const projectRoleSummary = selected.fitEvidence.projectRoles
    .map((role) => `${role.label} ${role.projectCount}개 프로젝트`)
    .join(' · ')
  const problemSummary = selected.fitEvidence.troubleshooting.tags
    .map((tag) => `${tag.label} ${tag.count}건`)
    .join(' · ')
  const achievementSummary = sourceData?.assessments
    .filter((assessment) => assessment.assessmentType === 'ACHIEVEMENT')
    .map((assessment) => `${assessment.category} ${assessment.score}점`)
    .join(' · ')
  const csSummary = sourceData?.assessments
    .filter((assessment) => assessment.assessmentType === 'CS')
    .map((assessment) => `${assessment.category} ${assessment.score}점`)
    .join(' · ')
  const existingAnalysisEvidence = [
    ...selected.evidence.map((item) => `종합 역량 · ${item}`),
    ...selected.fitEvidence.projectRoles.map(
      (role) =>
        `프로젝트 수행 역할 · ${role.label} · ${role.projectCount}개 프로젝트 · ${role.taskCount}개 업무`,
    ),
    ...selected.fitEvidence.troubleshooting.tags.map(
      (tag) => `문제해결 반복 영역 · ${tag.label} ${tag.count}건`,
    ),
    ...selected.fitEvidence.highAchievements.map(
      (achievement) =>
        `기존 성취도 평가 · ${achievement.category} ${achievement.score}점`,
    ),
  ]
  const jobCandidateEvidence = [
    ...(sourceData
      ? [
          `프로필 · 관심 ${sourceData.interestedJobs.join(' · ') || '미선택'} / 기술 ${sourceData.skillTags.slice(0, 5).join(' · ')}`,
          `프로젝트 · ${sourceData.projectDomains.join(' · ')} / 역할 ${projectRoleSummary || '확인 대기'}`,
          `성취도 평가 · ${achievementSummary}`,
          `CS 평가 · ${csSummary}`,
          `승인 자격증 · ${sourceData.certifications.slice(0, 3).join(' · ')}`,
          `문제해결 · ${problemSummary || '확인 대기'}`,
        ]
      : existingAnalysisEvidence.slice(0, 6)),
  ]
  const developerTypeEvidence = [
    ...(sourceData
      ? [
          `기술 태그 · ${sourceData.skillTags.slice(0, 5).join(' · ')}`,
          `경험 도메인 · ${sourceData.projectDomains.join(' · ')}`,
        ]
      : []),
    `프로젝트 역할 · ${projectRoleSummary || '확인 대기'}`,
    `문제해결 영역 · ${problemSummary || '확인 대기'}`,
  ]
  const strengthEvidence = [
    ...(sourceData
      ? [
          `기술 태그 · ${sourceData.skillTags.slice(0, 4).join(' · ')}`,
          `승인 자격증 · ${sourceData.certifications.slice(0, 3).join(' · ')}`,
        ]
      : []),
    `프로젝트 역할 · ${projectRoleSummary || '확인 대기'}`,
    `문제해결 영역 · ${problemSummary || '확인 대기'}`,
    `상위 성취 · ${selected.fitEvidence.highAchievements
      .slice(0, 3)
      .map((achievement) => `${achievement.category} ${achievement.score}점`)
      .join(' · ')}`,
  ]
  const theoryEvidence = [
    ...(sourceData
      ? [
          `성취도 평가 · ${achievementSummary}`,
          `CS 평가 · ${csSummary}`,
          `직무 관련 카테고리 · ${sourceData.theoryCategories
            .map(
              (category) =>
                `${category.category} ${category.score}점(${category.weightPercent}%)`,
            )
            .join(' · ')}`,
        ]
      : selected.fitEvidence.highAchievements.map(
          (achievement) =>
            `성취도 평가 · ${achievement.category} ${achievement.score}점`,
        )),
  ]
  const scoreEvidenceSections = [
    {
      label: '실제 데이터',
      items: jobCandidateEvidence,
    },
    {
      label: '분석 흐름',
      items: [
        `입력 신호를 ${selected.jobLabel} 역량과 연결`,
        '여러 출처에서 반복되고 수행 결과로 확인된 신호를 우선',
        '누락 데이터는 감점하지 않고 신뢰도에 반영해 0~100점으로 보정',
      ],
    },
    {
      label: '산출 결과',
      items: [
        `직무 적합도 · ${selected.fitScore}점`,
        `후보 순위 · TOP ${selected.rank}`,
        `분석 신뢰도 · ${CONFIDENCE_LABEL[selected.confidence]}`,
        `점수 해석 · ${selected.summary}`,
        ...selected.limitations.map(
          (limitation) => `제한 사항 · ${limitation}`,
        ),
      ],
    },
  ]

  return (
    <AiAnalysisPanel
      id="ai-job-fit"
      index="01"
      tone="accent"
      title="직무 적합도"
      description="수강생에게 어울리는 직무, 개발자 유형, 핵심 강점과 관련 이론 이해도를 AI가 종합했습니다."
    >
      <div
        role="tablist"
        aria-label="직무 적합도 TOP 3"
        className="border-accent/20 bg-surface-muted grid gap-2 rounded-2xl border p-2 sm:grid-cols-3"
      >
        {candidates.map((candidate) => {
          const isSelected = candidate.rank === selected.rank

          return (
            <button
              key={candidate.rank}
              id={`job-fit-tab-${candidate.rank}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`job-fit-panel-${candidate.rank}`}
              onClick={() => setSelectedRank(candidate.rank)}
              className={cn(
                'focus-visible:ring-brand rounded-xl px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2',
                isSelected
                  ? 'bg-accent-strong text-on-color shadow-sm'
                  : 'bg-surface text-fg-muted hover:bg-accent-bg hover:text-accent-strong',
              )}
            >
              <span className="block text-[12px] font-bold">
                TOP {candidate.rank}
              </span>
              <span className="mt-1 block text-[14px] font-bold">
                {candidate.jobLabel}
              </span>
              <span
                className={cn(
                  'mt-1 block text-[12px] font-semibold',
                  isSelected ? 'text-on-color/80' : 'text-fg-subtle',
                )}
              >
                적합도 {candidate.fitScore}점
              </span>
            </button>
          )
        })}
      </div>

      <div
        id={`job-fit-panel-${selected.rank}`}
        role="tabpanel"
        aria-labelledby={`job-fit-tab-${selected.rank}`}
        className="flex flex-col gap-5"
      >
        <section className="border-accent/25 bg-accent-bg/55 grid gap-5 rounded-2xl border p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_11rem] lg:items-center">
          <div className="min-w-0">
            <div className="text-accent-strong flex flex-wrap items-center gap-2 text-[13px] font-bold">
              <span className="flex items-center gap-1">
                <span>TOP {selected.rank} 직무 후보</span>
                <AiAnalysisEvidence
                  label="직무 후보"
                  evidence={jobCandidateEvidence}
                  flow={[
                    '데이터를 직무군별 관련 신호로 분류',
                    '반복·검증 신호가 선명한 후보를 점수순으로 TOP3 선정',
                  ]}
                />
              </span>
              <span aria-hidden="true">·</span>
              <span>분석 신뢰도 {CONFIDENCE_LABEL[selected.confidence]}</span>
            </div>
            <h3 className="text-fg mt-2 text-[26px] leading-9 font-extrabold">
              {selected.jobLabel}
            </h3>
            <p className="text-fg-muted mt-3 max-w-3xl text-[15px] leading-7">
              {selected.rank === primary.rank && `${jobFit.summary} `}
              {selected.summary}
            </p>
          </div>

          <div className="border-accent/20 bg-surface rounded-2xl border px-5 py-4 text-left shadow-sm lg:text-center">
            <span className="text-fg-subtle inline-flex items-center gap-1 text-[13px] font-semibold">
              <span>직무 적합도</span>
              <AiAnalysisEvidence
                label="직무 적합도 점수"
                evidence={[]}
                sections={scoreEvidenceSections}
              />
            </span>
            <strong className="text-accent-strong mt-1 block text-[38px] leading-none font-extrabold">
              {selected.fitScore}
              <span className="ml-1 text-[15px]">점</span>
            </strong>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="border-border bg-surface rounded-2xl border p-5">
            <span className="bg-accent-bg text-accent-strong flex size-9 items-center justify-center rounded-xl">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
            </span>
            <span className="text-fg-subtle mt-4 flex items-center gap-1 text-[12px] font-bold">
              <span>개발자 유형</span>
              <AiAnalysisEvidence
                label="개발자 유형"
                evidence={developerTypeEvidence}
                flow={[
                  '반복된 기술·도메인·수행 역할을 묶음',
                  '가장 선명한 업무 방식을 유형 라벨로 요약',
                ]}
              />
            </span>
            <h3 className="text-fg mt-1 text-[17px] leading-6 font-bold">
              {selected.workType}
            </h3>
            <p className="text-fg-muted mt-2 text-[14px] leading-6">
              {selected.roleLabel} 영역에서 강점이 선명하며, 문제를 단계적으로
              다루고 결과를 확인하며 완성도를 높이는 유형입니다.
            </p>
          </section>

          <section className="border-border bg-surface rounded-2xl border p-5">
            <span className="bg-success-bg text-success flex size-9 items-center justify-center rounded-xl">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <span className="text-fg-subtle mt-4 flex items-center gap-1 text-[12px] font-bold">
              <span>핵심 강점</span>
              <AiAnalysisEvidence
                label="핵심 강점"
                evidence={strengthEvidence}
                flow={[
                  '서로 다른 출처에서 반복된 강점 신호를 확인',
                  '직무와 직접 연결되는 핵심 강점만 최대 3개로 요약',
                ]}
              />
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
            <span className="text-fg-subtle mt-4 flex items-center gap-1 text-[12px] font-bold">
              <span>관련 이론 이해도</span>
              <AiAnalysisEvidence
                label="관련 이론 이해도"
                evidence={theoryEvidence}
                flow={[
                  '선택 직무와 관련된 성취도·CS 평가 카테고리를 연결',
                  '카테고리 점수와 반영 비중으로 이해 수준을 산출',
                ]}
              />
            </span>
            <h3 className="text-info mt-1 text-[17px] leading-6 font-bold">
              {theory.label}
            </h3>
            <p className="text-fg-muted mt-2 text-[14px] leading-6">
              {theory.summary}
            </p>
          </section>
        </div>
      </div>

      {jobFit.limitations.length > 0 && (
        <p className="text-fg-subtle border-border border-t pt-4 text-[13px] leading-6">
          분석 한계 · {jobFit.limitations.join(' · ')}
        </p>
      )}
    </AiAnalysisPanel>
  )
}
