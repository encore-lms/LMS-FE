import {
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Users,
} from 'lucide-react'
import type { AiProjects } from '../ai'
import { AiAnalysisEvidence } from './AiAnalysisEvidence'
import { AiAnalysisPanel } from './AiAnalysisPanel'

type AggregateAnalysis = NonNullable<AiProjects['aggregateAnalysis']>

function fallbackAnalysis(projects: AiProjects): AggregateAnalysis {
  const roles = new Map<string, { projectCount: number; taskCount: number }>()

  projects.projects.forEach((project) => {
    project.personalEvidence.workCategories.forEach((role) => {
      const current = roles.get(role) ?? { projectCount: 0, taskCount: 0 }
      current.projectCount += 1
      current.taskCount += project.personalEvidence.tasks.length
      roles.set(role, current)
    })
  })

  const assignedTaskCount = projects.projects.reduce(
    (total, project) => total + project.personalEvidence.tasks.length,
    0,
  )

  return {
    summary: [projects.summary, projects.overview.overall].filter(Boolean),
    rolePatterns: [...roles].map(([label, count]) => ({ label, ...count })),
    commonTasks: projects.projects
      .flatMap((project) => project.personalEvidence.tasks)
      .slice(0, 6),
    selfReviewStatements: projects.projects
      .flatMap((project) => project.personalEvidence.peerObservations)
      .slice(0, 3),
    contribution: {
      totalBoardTaskCount: null,
      assignedTaskCount,
      completedAssignedTaskCount: 0,
      summary: [
        `프로젝트 기록에서 개인 담당 업무 ${assignedTaskCount}개가 확인됩니다.`,
        '보드 전체 업무 수와 완료 상태가 연동되면 전체 프로젝트 기여 범위를 분석합니다.',
      ],
    },
    peerAxes: [],
    projectGrowth: projects.projects.map((project) => ({
      projectId: project.projectId,
      projectName: project.name,
      summary: [project.analysis, project.recruiterInsight.strength],
    })),
    strengths: projects.recruiterSummary.strengths,
    evaluationSource: 'PEER_ONLY',
  }
}

function TextLines({ lines }: { lines: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {lines.slice(0, 3).map((line) => (
        <p key={line} className="text-fg-muted text-[14px] leading-6">
          {line}
        </p>
      ))}
    </div>
  )
}

export function AiProjectAnalysis({
  projects,
  className,
}: {
  projects: AiProjects
  className?: string
}) {
  if (projects.projects.length === 0) return null

  const analysis = projects.aggregateAnalysis ?? fallbackAnalysis(projects)
  const contribution = analysis.contribution
  const roleSummary = analysis.rolePatterns
    .map((role) => `${role.label} · ${role.taskCount}개 업무`)
    .join('\n')
  const contributionHeadline =
    contribution.totalBoardTaskCount === null
      ? `담당 업무 ${contribution.assignedTaskCount}개`
      : `전체 ${contribution.totalBoardTaskCount}개 중 ${contribution.assignedTaskCount}개 담당`
  const originalProjectEvidence = projects.projects.flatMap((project) => [
    `프로젝트 · ${project.name} · ${project.teamContext.domain ?? '도메인 미입력'}`,
    `담당 역할 · ${project.recruiterInsight.role}`,
    `개인 기술 · ${project.personalEvidence.technologies.slice(0, 5).join(' · ')}`,
    ...(project.teamContext.outcomes[0]
      ? [`프로젝트 전체 결과 · ${project.teamContext.outcomes[0]}`]
      : []),
    `확인된 강점 · ${project.recruiterInsight.strength}`,
  ])
  const roleEvidence = [
    ...analysis.rolePatterns.map(
      (role) =>
        `${role.label} · 프로젝트 ${role.projectCount}개 · 담당 업무 ${role.taskCount}개`,
    ),
    ...projects.projects.flatMap((project) =>
      project.personalEvidence.workCategories.map(
        (role) => `${project.name} · 담당 역할 ${role}`,
      ),
    ),
  ]
  const taskEvidence = [
    ...analysis.commonTasks
      .slice(0, 4)
      .map((task) => `보드 담당 업무 · ${task}`),
    ...analysis.selfReviewStatements
      .slice(0, 2)
      .map((statement) => `본인 작성 수행·기여 · ${statement}`),
  ]
  const contributionEvidence = [
    contribution.totalBoardTaskCount === null
      ? `보드 담당 업무 ${contribution.assignedTaskCount}개`
      : `보드 전체 ${contribution.totalBoardTaskCount}개 중 담당 ${contribution.assignedTaskCount}개 · 완료 ${contribution.completedAssignedTaskCount}개`,
    ...analysis.selfReviewStatements,
    ...projects.projects.flatMap((project) => [
      ...project.personalEvidence.peerObservations.map(
        (observation) => `${project.name} · 본인 작성 수행·기여 ${observation}`,
      ),
      ...project.personalEvidence.artifacts.map(
        (artifact) => `${project.name} · 확인 산출물 ${artifact}`,
      ),
    ]),
  ]
  const peerEvidence = [
    ...analysis.peerAxes.map(
      (axis) =>
        `${axis.key} · ${axis.score === null ? '평가 없음' : `${axis.score.toFixed(1)} / 5`}`,
    ),
    '동료 평가만 사용하며 멘토·강사·운영 평가는 제외합니다.',
  ]
  const summaryEvidence = [
    `기존 전체 분석 · ${projects.overview.overall}`,
    `기존 수행 스타일 · ${projects.overview.workingStyle}`,
    ...roleEvidence.slice(0, 1),
    ...contributionEvidence.slice(0, 1),
    ...peerEvidence.slice(0, 2),
  ]
  const strengthEvidence = [
    ...roleEvidence.slice(0, 1),
    ...contributionEvidence.slice(0, 1),
    ...peerEvidence.slice(0, 3),
    ...originalProjectEvidence.slice(-1),
  ]

  return (
    <AiAnalysisPanel
      id="ai-project-analysis"
      index="02"
      tone="info"
      title="프로젝트 분석"
      description="전체 프로젝트의 보드 담당 업무, 본인이 작성한 수행·기여, 맡은 역할과 동료평가 4축을 함께 읽어 프로젝트 수행 스타일과 성장 범위를 분석했습니다."
      className={className}
    >
      <section
        data-project-analysis-summary
        className="border-info/25 bg-info-bg/45 rounded-xl border px-4 py-4 sm:px-5"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-info size-4" aria-hidden="true" />
          <h3 className="text-info text-[13px] font-bold">AI 전체 요약</h3>
          <AiAnalysisEvidence
            label="AI 전체 요약"
            evidence={summaryEvidence}
            flow={[
              '전체 프로젝트의 역할·업무·기여·동료평가를 통합',
              '두 출처 이상에서 반복된 수행 특징을 2~3문장으로 요약',
            ]}
          />
        </div>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {analysis.summary.slice(0, 3).map((line) => (
            <p
              key={line}
              className="text-fg text-[15px] leading-6 font-semibold"
            >
              {line}
            </p>
          ))}
        </div>
      </section>

      <section aria-labelledby="project-work-pattern-title">
        <h3
          id="project-work-pattern-title"
          className="text-fg text-[15px] font-bold"
        >
          전체 프로젝트에서 주로 한 일
        </h3>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <article className="border-border bg-surface rounded-xl border p-4">
            <span className="flex items-center gap-2">
              <Users className="text-info size-4" aria-hidden="true" />
              <span className="text-fg-subtle text-[12px] font-bold">
                주로 맡은 역할
              </span>
              <AiAnalysisEvidence
                label="주로 맡은 역할"
                evidence={roleEvidence}
                flow={[
                  '프로젝트별 담당 역할을 같은 의미끼리 묶음',
                  '가장 많은 프로젝트에서 반복된 역할을 우선 표시',
                ]}
              />
            </span>
            <p className="text-fg mt-2 text-[14px] leading-6 font-semibold whitespace-pre-line">
              {roleSummary || '역할 데이터 연동 대기'}
            </p>
          </article>

          <article className="border-border bg-surface rounded-xl border p-4">
            <span className="flex items-center gap-2">
              <ClipboardList className="text-info size-4" aria-hidden="true" />
              <span className="text-fg-subtle text-[12px] font-bold">
                주로 맡은 업무
              </span>
              <AiAnalysisEvidence
                label="주로 맡은 업무"
                evidence={taskEvidence}
                flow={[
                  '보드 업무와 본인 작성 수행 내용을 업무 유형별로 묶음',
                  '여러 프로젝트에서 반복된 업무를 우선 표시',
                ]}
              />
            </span>
            <p className="text-fg mt-2 text-[14px] leading-6 font-semibold">
              {analysis.commonTasks.join(' · ') || '담당 업무 데이터 연동 대기'}
            </p>
          </article>

          <article className="border-border bg-surface rounded-xl border p-4">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="text-info size-4" aria-hidden="true" />
              <span className="text-fg-subtle text-[12px] font-bold">
                프로젝트 기여
              </span>
              <AiAnalysisEvidence
                label="프로젝트 기여"
                evidence={contributionEvidence}
                flow={[
                  '전체 보드 중 담당·완료 업무 수를 집계',
                  '본인 작성 기여와 확인 산출물로 기여 맥락을 보완',
                ]}
              />
            </span>
            <p className="text-fg mt-2 text-[15px] leading-6 font-bold">
              {contributionHeadline}
            </p>
            <TextLines lines={contribution.summary} />
          </article>
        </div>

        {analysis.selfReviewStatements.length > 0 && (
          <div className="border-border bg-surface-muted mt-3 rounded-xl border px-4 py-3.5">
            <h4 className="text-fg-subtle text-[12px] font-bold">
              본인이 작성한 수행·기여에서 반복된 내용
            </h4>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {analysis.selfReviewStatements.map((statement) => (
                <p
                  key={statement}
                  className="text-fg text-[13px] leading-5 font-medium"
                >
                  {statement}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="project-peer-style-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3
            id="project-peer-style-title"
            className="text-fg text-[15px] font-bold"
          >
            동료평가 4축으로 본 프로젝트 스타일
          </h3>
          <p className="text-fg-subtle text-[11px] font-semibold">
            동료 평가만 사용 · 멘토·강사·운영 평가 제외
          </p>
        </div>

        {analysis.peerAxes.length === 4 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {analysis.peerAxes.map((axis) => (
              <article
                key={axis.key}
                data-project-peer-axis={axis.key}
                className="border-info/20 bg-info-bg/30 rounded-xl border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1">
                    <h4 className="text-fg text-[13px] font-bold">
                      {axis.key}
                    </h4>
                    <AiAnalysisEvidence
                      label={`${axis.key} 프로젝트 스타일`}
                      evidence={[
                        `동료평가 평균 · ${axis.score === null ? '평가 없음' : `${axis.score.toFixed(1)} / 5`}`,
                        '멘토·강사·운영 평가 제외',
                      ]}
                      flow={[
                        '프로젝트별 동료 평가자 점수를 먼저 평균',
                        '프로젝트 평균을 동일 비중으로 합쳐 축별 유형을 요약',
                      ]}
                    />
                  </span>
                  <strong className="text-info text-[14px] font-extrabold">
                    {axis.score === null
                      ? '분석 대기'
                      : `${axis.score.toFixed(1)} / 5`}
                  </strong>
                </div>
                <div className="mt-2">
                  <TextLines lines={axis.summary} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border-border bg-surface-muted mt-3 rounded-xl border px-4 py-5 text-center">
            <p className="text-fg text-[13px] font-bold">
              동료평가 4축 데이터 연동이 필요합니다.
            </p>
          </div>
        )}
      </section>

      <section aria-labelledby="project-growth-title">
        <div className="flex items-center gap-2">
          <ChartNoAxesColumnIncreasing
            className="text-info size-4"
            aria-hidden="true"
          />
          <h3
            id="project-growth-title"
            className="text-fg text-[15px] font-bold"
          >
            프로젝트마다 성장하거나 확장한 부분
          </h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {analysis.projectGrowth.map((growth) => {
            const sourceProject = projects.projects.find(
              (project) => project.projectId === growth.projectId,
            )
            const growthEvidence = sourceProject
              ? [
                  `도메인 · ${sourceProject.teamContext.domain ?? '미입력'}`,
                  `기술 스택 · ${sourceProject.teamContext.techStacks.join(' · ')}`,
                  `역할 · ${sourceProject.personalEvidence.workCategories.join(' · ')}`,
                  `담당 업무 · ${sourceProject.personalEvidence.tasks.join(' · ')}`,
                  ...(sourceProject.personalEvidence.peerObservations[0]
                    ? [
                        `본인 작성 수행·기여 · ${sourceProject.personalEvidence.peerObservations[0]}`,
                      ]
                    : []),
                  ...(sourceProject.teamContext.outcomes[0]
                    ? [
                        `프로젝트 전체 결과 · ${sourceProject.teamContext.outcomes[0]}`,
                      ]
                    : []),
                  `기존 강점 해석 · ${sourceProject.recruiterInsight.strength}`,
                ]
              : []

            return (
              <article
                key={growth.projectId}
                data-project-growth={growth.projectId}
                className="border-border bg-surface rounded-xl border p-4"
              >
                <span className="flex items-center gap-1">
                  <h4 className="text-fg text-[14px] leading-6 font-bold">
                    {growth.projectName}
                  </h4>
                  <AiAnalysisEvidence
                    label={`${growth.projectName} 성장·확장`}
                    evidence={growthEvidence}
                    flow={[
                      '이전 프로젝트와 역할·업무·기술 범위를 비교',
                      '새로 맡거나 더 깊어진 부분만 성장·확장으로 요약',
                    ]}
                  />
                </span>
                <div className="mt-1.5">
                  <TextLines lines={growth.summary} />
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="project-strength-title">
        <span className="flex items-center gap-1">
          <h3
            id="project-strength-title"
            className="text-fg text-[15px] font-bold"
          >
            핵심 강점
          </h3>
          <AiAnalysisEvidence
            label="프로젝트 핵심 강점"
            evidence={strengthEvidence}
            flow={[
              '보드·본인 작성 내용·동료평가의 공통 신호를 확인',
              '두 출처 이상에서 확인된 강점만 최종 요약',
            ]}
          />
        </span>
        <ul className="mt-3 grid gap-2 md:grid-cols-3">
          {analysis.strengths.map((strength) => (
            <li
              key={strength}
              className="border-info/20 bg-info-bg/35 text-fg rounded-xl border px-4 py-3 text-[13px] leading-5 font-semibold"
            >
              {strength}
            </li>
          ))}
        </ul>
      </section>
    </AiAnalysisPanel>
  )
}
