import type {
  AiAnalysis,
  CertificateDetailTabsResult,
  CertificateScoreResult,
} from '../types'
import {
  createParkSujinDetailTabs,
  createParkSujinScore,
  PARK_SUJIN_AI_ANALYSIS,
} from './park-sujin'

/**
 * 34기 실제 로스터 — 이름·역량 점검(1·2차) 점수는 배포 BE 실측(2026-08-11 채점 확정)이다.
 * 관리자 증명서 미리보기가 어떤 수강생을 열어도 이름·점수가 실제와 일치하도록,
 * 이 테이블에서 학생별 목데이터를 결정론적으로 파생한다.
 * 황수빈(데모 계정)만 손으로 만든 리치 스텁(park-sujin.ts)을 그대로 쓴다.
 */
export interface RosterEntry {
  id: string
  name: string
  q1: number
  q2: number
}

export const HWANG_SUBIN_ID = 'f074a93b-5ad7-4234-ba35-4e260d9272ea'

export const REAL_ROSTER: RosterEntry[] = [
  { id: '173c1f4a-8f1a-4347-9313-a616928c747e', name: '김건우', q1: 84, q2: 86 },
  { id: 'c83424f0-3657-464d-8755-ffbf0bdd4300', name: '김기호', q1: 93, q2: 94 },
  { id: '36b5abd6-20b7-4371-8333-0884806535d2', name: '김대호', q1: 83, q2: 72 },
  { id: '8fda7ecf-ab02-4c70-b6cb-f99252b97208', name: '김동섭', q1: 92, q2: 83 },
  { id: '3e8122dc-2fcd-4965-9482-1461a40071d1', name: '김재현', q1: 63, q2: 60 },
  { id: '7a63e4f0-a5cb-4bfb-96d2-d13f3c9eac40', name: '김진화', q1: 82, q2: 90 },
  { id: 'fcc3ae0a-a921-4f3a-9a32-0992a225dbee', name: '김태윤', q1: 84, q2: 92 },
  { id: 'cc416cf9-ee44-4568-9298-d72e13fbb3f9', name: '김현지', q1: 94, q2: 92 },
  { id: 'b8f5bec7-a8e1-4b95-b646-481aeda7acac', name: '노민환', q1: 70, q2: 76 },
  { id: '84333024-ae0e-46a1-8199-96c667b95157', name: '문성호', q1: 90, q2: 72 },
  { id: 'bbc694f0-9325-426c-a85d-dca6cd4f39bb', name: '송승재', q1: 96, q2: 97 },
  { id: 'd9748c45-3779-428a-9509-344272e385f3', name: '윤성호', q1: 65, q2: 72 },
  { id: '75130370-ad62-4a2b-b0b3-25d3c9f4995a', name: '이성민', q1: 50, q2: 47 },
  { id: '27652d16-2c51-444e-80e9-378e7d88da36', name: '이현준', q1: 90, q2: 78 },
  { id: '3745ede2-1a35-4a25-9f50-870b6e256883', name: '이홍규', q1: 64, q2: 74 },
  { id: 'bcb748bf-4649-4414-b6bf-cccdbad3d8e6', name: '임형준', q1: 76, q2: 60 },
  { id: '272cc951-d4f9-49df-b4b7-900fa5e2478b', name: '전진영', q1: 82, q2: 74 },
  { id: '7d369529-546c-4ac3-ba23-bc2bb762e8aa', name: '전진환', q1: 51, q2: 53 },
  { id: '1ca3e604-be73-42f8-95ab-cad06f202333', name: '정예린', q1: 56, q2: 64 },
  { id: '3f6250fa-91a7-4719-8b30-3abd7d94b37d', name: '채정석', q1: 80, q2: 67 },
  { id: '6503f5a9-d91a-4729-a5d9-3345aa2af448', name: '최대원', q1: 81, q2: 75 },
  { id: '2ac2a82b-7b1e-4238-9c22-a019e3995569', name: '최성욱', q1: 47, q2: 60 },
  { id: '1af5e5c1-2f6b-4fce-9e26-0c36b1266842', name: '최인영', q1: 96, q2: 92 },
  { id: '84310db5-c5c5-4f56-8fb1-7780dec1a30b', name: '홍지윤', q1: 76, q2: 78 },
  { id: HWANG_SUBIN_ID, name: '황수빈', q1: 100, q2: 96 },
  { id: '02b388be-68fa-44b0-9050-14890cf419d1', name: '황호순', q1: 76, q2: 96 },
]

export const ROSTER_BY_ID = new Map(REAL_ROSTER.map((s) => [s.id, s]))

/** 이름 기반 결정론 시드 — 재실행·재렌더에도 같은 값이 나오게 한다. */
export function rosterSeed(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 100_000
  return h
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))
const r1 = (v: number) => Math.round(v * 10) / 10

/** 실측 퀴즈 평균에서 6축을 파생 — 평가 시스템이 없는 축은 평균 주변 결정론 변주. */
export function rosterAxisScores(entry: RosterEntry) {
  const avg = r1((entry.q1 + entry.q2) / 2)
  const seed = rosterSeed(entry.name)
  const wiggle = (k: number, spread: number) =>
    r1(clamp(avg + (((seed >> k) % (spread * 2 + 1)) - spread), 40, 99))
  return {
    // 인증 프로젝트가 없어 30% 항이 0 — 실측 산식 그대로.
    기술: r1(avg * 0.7),
    소통: wiggle(2, 8),
    문제해결: wiggle(4, 10),
    책임감: wiggle(6, 6),
    // 출석(HRD 100%) 기본 70점 + 결정론 가산.
    학습지속성: r1(clamp(70 + ((seed >> 3) % 21), 70, 95)),
    성취도: avg,
  }
}

export function rosterOverall(entry: RosterEntry) {
  const a = rosterAxisScores(entry)
  const values = [a.기술, a.소통, a.문제해결, a.책임감, a.학습지속성, a.성취도]
  return r1(values.reduce((s, v) => s + v, 0) / values.length)
}

/** 로스터 학생 점수 — 황수빈은 리치 스텁, 나머지는 실측 파생 generic. */
export function createRosterScore(studentId: string): CertificateScoreResult {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    return createParkSujinScore(studentId)
  }
  const base = createParkSujinScore(studentId)
  const a = rosterAxisScores(entry)
  const avg = r1((entry.q1 + entry.q2) / 2)
  const scoreOf: Record<string, number> = {
    '기술·기술기여': a.기술,
    '소통·협업·팀워크': a.소통,
    문제해결: a.문제해결,
    책임감: a.책임감,
    학습지속성: a.학습지속성,
    '성취도 평가': a.성취도,
  }
  const detailOf: Record<string, string> = {
    '기술·기술기여': `역량 점검 평균 ${avg} × 0.7 (인증 프로젝트 0/1)`,
    '소통·협업·팀워크': '멘토링·Q&A 활동 기반 산정 전 — 데모 추정치',
    문제해결: '인증 트러블슈팅 없음 — 데모 추정치',
    책임감: '출석률 100 × 0.6 + 학습 기록 × 0.4 — 데모 추정치',
    학습지속성: '출석 70점 + 학습 기록 가산 — 데모 추정치',
    '성취도 평가': `역량 점검 2회 평균 ${avg}점 · 1차 ${entry.q1} / 2차 ${entry.q2}`,
  }
  const axes = base.axes.map((axis) => ({
    ...axis,
    score: scoreOf[axis.key] ?? axis.score,
    detail: detailOf[axis.key] ?? axis.detail,
    evidence: [
      {
        key: 'rosterDemo',
        label: `${axis.key} 산정`,
        value: scoreOf[axis.key] ?? 0,
        unit: '점' as const,
        numerator: null,
        denominator: null,
        weightPercent: 100,
        appliedScore: scoreOf[axis.key] ?? 0,
        detail: detailOf[axis.key] ?? '',
      },
    ],
  }))
  const overall = rosterOverall(entry)
  return {
    ...base,
    student: {
      ...base.student,
      studentId,
      studentName: entry.name,
    },
    overallScore: overall,
    grade: overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : 'D',
    axes,
    metrics: base.metrics.map((m) => {
      if (m.key === 'assessment')
        return {
          ...m,
          value: avg,
          detail: `역량 점검 2회 · ${entry.q1}점 / ${entry.q2}점`,
        }
      if (m.key === 'attendance') return m // 전원 HRD 100% 동일
      // 프로젝트·문제해결·자격증·블로그는 이 학생에게 아직 없다.
      if (m.key === 'blog')
        return { ...m, value: 0, detail: '제출 이력 없음', status: 'NOT_READY' as const }
      if (m.key === 'certifiedProject')
        return { ...m, value: 0, detail: '인증 프로젝트 없음' }
      if (m.key === 'certifiedTroubleshooting')
        return { ...m, value: 0, detail: '인증 사례 없음' }
      if (m.key === 'certifiedCertificate')
        return { ...m, value: 0, detail: '승인 자격증 없음' }
      return m
    }),
  }
}

/** 로스터 학생 상세 탭 — 평가 이력은 실측 2건, 나머지는 빈 상태. */
export function createRosterDetailTabs(
  studentId: string,
): CertificateDetailTabsResult {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    return createParkSujinDetailTabs(studentId)
  }
  const base = createParkSujinDetailTabs(studentId)
  const avg = r1((entry.q1 + entry.q2) / 2)
  const assessments = [
    {
      id: `${entry.id}-assessment-1`,
      title: '1차 역량 점검 — Python 기초와 자료구조',
      assessmentType: 'ACHIEVEMENT' as const,
      category: 'Python',
      score: entry.q1,
      submittedAt: '2026-07-03T15:40:00',
      cohortAverageScore: 76.9,
      relativeScore: null,
      comparisonCount: 26,
    },
    {
      id: `${entry.id}-assessment-2`,
      title: '2차 역량 점검 — SQL과 관계형 데이터베이스',
      assessmentType: 'ACHIEVEMENT' as const,
      category: 'SQL',
      score: entry.q2,
      submittedAt: '2026-07-24T15:40:00',
      cohortAverageScore: 76.4,
      relativeScore: null,
      comparisonCount: 26,
    },
  ]
  return {
    ...base,
    tech: {
      ...base.tech,
      averageScore: avg,
      categories: assessments.map((a) => ({
        assessmentType: a.assessmentType,
        label: a.category,
        score: a.score,
        attemptCount: 1,
        topPercent: null,
        populationSize: 26,
      })),
      assessments,
      certifications: [],
      assignments: [],
      limitations: ['자격증·과제 데이터가 아직 없습니다.'],
    },
    problem: {
      ...base.problem,
      certifiedCount: 0,
      independentRate: 0,
      averageDays: 0,
      categories: [],
      cases: [],
      peerEvaluatorCount: 0,
      peerTags: [],
      peerTagCases: [],
      limitations: ['인증된 트러블슈팅 사례가 아직 없습니다.'],
    },
    growth: {
      ...base.growth,
      peerEvaluationCount: 0,
      peerComments: [],
      limitations: ['동료 평가가 아직 수집되지 않았습니다.'],
    },
  }
}

/** 로스터 학생 AI 분석 — 황수빈은 리치, 나머지는 실측 근거만으로 최소 구성. */
export function createRosterAiAnalysis(studentId: string): AiAnalysis {
  const entry = ROSTER_BY_ID.get(studentId)
  if (!entry || entry.id === HWANG_SUBIN_ID) {
    return PARK_SUJIN_AI_ANALYSIS
  }
  const base = PARK_SUJIN_AI_ANALYSIS
  const avg = r1((entry.q1 + entry.q2) / 2)
  const a = rosterAxisScores(entry)
  const fit = clamp(Math.round(avg * 0.9), 40, 95)
  const role = {
    rank: 1,
    role: '데이터 분석' as const,
    jobLabel: '데이터 분석가',
    roleLabel: '기초 역량 축적 단계',
    workType: '기초 다지기형',
    fitScore: fit,
    confidence: 'MEDIUM' as const,
    summary: `역량 점검 평균 ${avg}점(1차 ${entry.q1} · 2차 ${entry.q2})을 근거로 한 초기 분석입니다. 인증 프로젝트·문제해결 사례가 쌓이면 정밀해집니다.`,
    evidence: [`역량 점검 평균 ${avg}점`, '인증 프로젝트 0건', '인증 문제해결 0건'],
    fitEvidence: {
      projectRoles: [],
      troubleshooting: {
        certifiedCaseCount: 0,
        independentCaseCount: 0,
        independentRate: null,
        tags: [],
      },
      highAchievements: [
        { category: 'Python', score: entry.q1 },
        { category: 'SQL', score: entry.q2 },
      ],
    },
    theoryUnderstanding: {
      status: 'READY' as const,
      score: avg,
      level: (avg >= 85 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM',
      label: avg >= 85 ? '높음' : avg >= 65 ? '보통' : '보완 필요',
      summary: `Python·SQL 역량 점검 2회 평균 ${avg}점 기준입니다.`,
      categories: [
        { key: 'PYTHON', category: 'Python·자료구조', score: entry.q1, weightPercent: 50 },
        { key: 'WEB_DATA', category: 'SQL·관계형 DB', score: entry.q2, weightPercent: 50 },
      ],
    },
    evidenceCodes: [],
    limitations: ['인증 프로젝트·문제해결 사례가 쌓이면 직무 후보를 다시 분석합니다.'],
  }
  return {
    ...base,
    jobFit: {
      ...base.jobFit,
      summary: `${entry.name} — 역량 점검 실측만으로 산출한 초기 직무 분석입니다.`,
      primaryRole: role,
      roleCandidates: [role],
      sourceData: {
        interestedJobs: [],
        skillTags: ['Python', 'SQL'],
        projectDomains: [],
        assessments: [
          { assessmentType: 'ACHIEVEMENT', category: 'Python', score: entry.q1 },
          { assessmentType: 'ACHIEVEMENT', category: 'SQL', score: entry.q2 },
        ],
        theoryCategories: role.theoryUnderstanding.categories,
        certifications: [],
      },
      confidence: 'MEDIUM',
      limitations: ['프로필·프로젝트 데이터가 쌓이면 정밀 분석으로 바뀝니다.'],
    },
    axisAlignment: {
      ...base.axisAlignment,
      summary: `${entry.name}의 축 점수와 실측 근거가 일치합니다.`,
      axes: base.axisAlignment.axes.map((axis) => {
        const score =
          axis.key === '성취도 평가'
            ? a.성취도
            : axis.key === '기술·기술기여'
              ? a.기술
              : axis.key === '소통·협업·팀워크'
                ? a.소통
                : axis.key === '문제해결'
                  ? a.문제해결
                  : axis.key === '책임감'
                    ? a.책임감
                    : a.학습지속성
        return {
          ...axis,
          axisScore: score,
          evidenceScore: score,
          summary: `${axis.key} ${score}점`,
          reason: [],
          evidence: [],
        }
      }),
    },
    projects: {
      ...base.projects,
      status: 'NOT_READY',
      summary: '인증 완료된 프로젝트가 아직 없습니다.',
      groups: [],
      projects: [],
      recruiterSummary: {
        headline: '분석할 인증 프로젝트가 없습니다',
        summary: '프로젝트가 강사 인증을 받으면 분석이 시작됩니다.',
        strengths: [],
        evidenceCodes: [],
        generatedBy: 'FALLBACK',
      },
      aggregateAnalysis: {
        ...base.projects.aggregateAnalysis,
        summary: ['인증 완료된 프로젝트가 쌓이면 수행 스타일을 분석합니다.'],
        rolePatterns: [],
        commonTasks: [],
        selfReviewStatements: [],
        contribution: {
          totalBoardTaskCount: 0,
          assignedTaskCount: 0,
          completedAssignedTaskCount: 0,
          summary: ['담당 업무 데이터가 아직 없습니다.'],
        },
        peerAxes: [],
        projectGrowth: [],
        strengths: [],
        evaluationSource: 'PEER_ONLY',
      },
      projectCount: 0,
      evidenceCodes: [],
      confidence: 'LOW',
      limitations: ['인증 완료된 프로젝트가 없습니다.'],
    },
    troubleshooting: {
      ...base.troubleshooting,
      status: 'NOT_READY',
      summary: '인증된 문제해결 사례가 아직 없습니다.',
      certifiedCaseCount: 0,
      independentCaseCount: 0,
      independentRate: 0,
      sourceData: {
        categories: [],
        cases: [],
        averageDays: 0,
        medianDays: 0,
        independentCaseCount: 0,
        supportedCaseCount: 0,
      },
      axes: [],
      groups: [],
      limitations: ['인증된 사례가 쌓이면 분석합니다.'],
    },
    sentiment: {
      ...base.sentiment,
      status: 'NOT_READY',
      noteCount: 0,
      phases: [],
      bubbles: [],
      trend: '',
      confidence: 'LOW',
      limitations: ['상담·회고 기록이 아직 없습니다.'],
    },
    ontology: {
      ...base.ontology,
      status: 'NOT_READY',
      summary: '학습 이력이 쌓이면 역량 맵을 그립니다.',
      counts: { self: 0, subject: 0, skill: 0, method: 0, project: 0, domain: 0 },
      nodes: [],
      edges: [],
      limitations: [],
    },
  }
}
