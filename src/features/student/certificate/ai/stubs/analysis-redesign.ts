import type {
  AiAnalysis,
  AiProjectSnapshot,
  AiProjects,
  CertificateDetailTabsResult,
  Ontology,
  ProblemAi,
  Sentiment,
} from '../types'
import certificateSnapshot from './certificate.snapshot.json'

type LegacyProject = Omit<AiProjectSnapshot, 'recruiterInsight'>
type LegacyProjects = Omit<AiProjects, 'projects' | 'recruiterSummary'> & {
  projects: LegacyProject[]
}
type LegacyAnalysis = {
  projects: LegacyProjects
  problem: ProblemAi
  sentiment: Sentiment
  ontology: Ontology
}

const legacy = certificateSnapshot.analysis as unknown as LegacyAnalysis
const detail =
  certificateSnapshot.tabs as unknown as CertificateDetailTabsResult

function cleanEvidence(value: string) {
  return value
    .replace(/^확정 수행 범위 · /, '')
    .replace(/^담당 과업 · /, '')
    .replace(/^인증 문제 해결 · /, '')
}

const projects: AiProjectSnapshot[] = legacy.projects.projects.map(
  (project) => {
    const role =
      project.personalEvidence.workCategories.join(' · ') ||
      cleanEvidence(
        project.personalEvidence.tasks[0] ?? '개인 담당 역할 확인 중',
      )
    const challenge = project.personalEvidence.troubleshootingCases[0]
      ? cleanEvidence(project.personalEvidence.troubleshootingCases[0])
      : null
    const action = challenge
      ? '재현 조건과 로그를 기준으로 원인 범위를 좁히고, 수정 뒤 같은 조건에서 결과를 다시 검증했습니다.'
      : null
    const personalOutcome = project.personalEvidence.peerObservations[0] ?? null
    const teamOutcome = project.teamContext.outcomes[0] ?? null
    const outcome = teamOutcome ?? personalOutcome
    const strength = challenge
      ? '담당 역할을 문제해결과 검증까지 연결하는 실행력이 확인됩니다.'
      : '개인 담당 범위를 프로젝트 기록으로 남긴 수행력이 확인됩니다.'

    return {
      ...project,
      recruiterInsight: {
        role,
        challenge,
        action,
        outcome,
        strength,
        summary: project.analysis,
        evidenceCodes: project.evidenceCodes.slice(0, 4),
        generatedBy: 'FALLBACK',
      },
    }
  },
)

const roleCounts = new Map<
  string,
  { taskCount: number; projectCount: number }
>()
for (const project of projects) {
  for (const role of project.personalEvidence.workCategories) {
    const current = roleCounts.get(role) ?? { taskCount: 0, projectCount: 0 }
    current.taskCount += project.personalEvidence.tasks.length
    current.projectCount += 1
    roleCounts.set(role, current)
  }
}

const tagCounts = new Map<string, number>()
for (const item of detail.problem.cases) {
  const tag = item.title.match(/중 (.+?) 문제/)?.[1]
  if (tag) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
}

const projectRoles = [...roleCounts.entries()]
  .map(([label, counts]) => ({ label, ...counts }))
  .sort((a, b) => b.projectCount - a.projectCount)
  .slice(0, 3)
const troubleshootingTags = [...tagCounts.entries()]
  .map(([label, count]) => ({ label, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 4)
const highAchievements = detail.tech.categories
  .filter(
    (item) =>
      item.score >= 80 &&
      /(Python|파이썬|SQL|Pandas|Django|웹|데이터)/i.test(item.label),
  )
  .map((item) => ({ category: item.label, score: item.score }))

const independentCaseCount = detail.problem.cases.filter(
  (item) => item.independent,
).length

const primaryRole = {
  rank: 1,
  role: '백엔드' as const,
  jobLabel: '백엔드 개발자',
  roleLabel: 'API·서버 구현',
  workType: '구현·문제해결형',
  fitScore: 90.8,
  confidence: 'HIGH' as const,
  summary:
    '프로젝트에서 API 구현 역할을 반복 수행했고, 인증 트러블슈팅과 80점 이상 직무 연관 성취가 같은 방향을 뒷받침합니다.',
  evidence: [
    '프로젝트 개인 담당 과업',
    '인증 트러블슈팅과 독립 해결 여부',
    '80점 이상 직무 연관 성취도 평가',
  ],
  fitEvidence: {
    projectRoles,
    troubleshooting: {
      certifiedCaseCount: detail.problem.certifiedCount,
      independentCaseCount,
      independentRate: detail.problem.independentRate,
      tags: troubleshootingTags,
    },
    highAchievements,
  },
  evidenceCodes: projects
    .flatMap((project) => project.evidenceCodes)
    .slice(0, 12),
  limitations: [
    '프로젝트 도메인과 희망 직무는 적합도 계산 및 근거에서 제외했습니다.',
    '80점 미만 또는 미응시 평가는 감점하지 않습니다.',
  ],
}

const strengths = projects
  .map((project) => project.recruiterInsight.strength)
  .filter((value, index, values) => values.indexOf(value) === index)
  .slice(0, 3)

export const AI_ANALYSIS_STUB: AiAnalysis = {
  policyVersion: '2026.08.05-ai-analysis-redesign-v2',
  jobFit: {
    policyVersion: '2026.08.05-job-fit-v2',
    status: 'READY',
    summary:
      '개인 수행과 검증 결과를 함께 보면 백엔드 개발자의 API·서버 구현 역할이 가장 선명합니다.',
    primaryRole,
    roleCandidates: [primaryRole],
    confidence: 'HIGH',
    limitations: primaryRole.limitations,
    sourcePolicies: ['2026.08.05-technical-verdict-v2'],
    generatedBy: 'FALLBACK',
  },
  axisAlignment: {
    policyVersion: '2026.08.05-axis-alignment-v1',
    status: 'NOT_READY',
    summary: '현재 화면에서는 직무·프로젝트·문제해결 핵심 분석에 집중합니다.',
    thresholds: { alignedMaxDifference: 10, divergentMinDifference: 25 },
    axes: [],
    highlights: { alignedAxes: [], divergentAxes: [], largestGapAxis: null },
    limitations: [],
  },
  projects: {
    ...legacy.projects,
    policyVersion: '2026.08.05-project-recruiter-analysis-v2',
    projects,
    recruiterSummary: {
      headline: strengths[0] ?? '개인 역할을 프로젝트 결과로 연결한 수행 경험',
      summary:
        '완료·인증 프로젝트에서 개인 역할, 문제 상황, 해결 행동, 검증 결과를 연결해 채용 관점의 실무 경쟁력을 분석했습니다.',
      strengths,
      evidenceCodes: projects.flatMap((project) => project.evidenceCodes),
      generatedBy: 'FALLBACK',
    },
  },
  troubleshooting: {
    policyVersion: '2026.08.05-troubleshooting-analysis-v2',
    status: legacy.problem.status,
    summary: legacy.problem.troubleshooting.problemSolvingSummary,
    certifiedCaseCount: detail.problem.certifiedCount,
    independentCaseCount,
    independentRate: detail.problem.independentRate,
    period: legacy.problem.period,
    axes: legacy.problem.caps,
    steps: legacy.problem.troubleshooting.problemSolvingSteps,
    groups: legacy.problem.troubleshooting.problemGroups,
    growth: {
      status: legacy.problem.growth.status,
      summary: legacy.problem.growth.summary,
      newDomains: legacy.problem.growth.newDomains,
      repeatedDomains: legacy.problem.growth.repeatedDomains,
      newTechnologies: legacy.problem.growth.newTechnologies,
      repeatedTechnologies: legacy.problem.growth.repeatedTechnologies,
      confidence: legacy.problem.growth.confidence,
    },
    limitations: legacy.problem.limitations,
  },
  sentiment: legacy.sentiment,
  ontology: legacy.ontology,
}
