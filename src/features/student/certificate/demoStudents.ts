import type { CertificateDetailTabsResult, CertificateScoreResult } from './ai'
import type {
  CertificateOverview,
  CertGrowthTimelinePoint,
  CertRecommendation,
  CertReputation,
  CertShortComment,
} from './types'

export type DemoRecommendationState =
  | 'BOTH'
  | 'MENTOR_ONLY'
  | 'INSTRUCTOR_ONLY'
  | 'NONE'

type ProjectReviewState =
  | 'CERTIFIED'
  | 'REVIEWING'
  | 'REQUESTED'
  | 'CHANGES_REQUESTED'

export interface CertificateDemoStudent {
  id: string
  name: string
  cohortName: string
  periodLabel: string
  overallScore: number
  profileLabel: string
  profileSummary: string
  recommendationState: DemoRecommendationState
  highlights: string[]
  timeline: CertGrowthTimelinePoint[]
  reputation: CertReputation[]
  shortComments: CertShortComment[]
  recommendations: CertRecommendation[]
  projectRole: string
  projectContribution: number
  projectStates: ProjectReviewState[]
  finalProjectTitle: string
  projectTags: string[]
  pendingTroubleshootingCount: number
}

export const DEFAULT_CERTIFICATE_DEMO_STUDENT_ID =
  'd9552119-7a27-5be5-b2a4-1d82a709cfb9'

const instructorRecommendation = (
  name: string,
  quote: string,
): CertRecommendation => ({
  role: '강사',
  name: '김현수 강사',
  meta: `${name} 과정 성취도·프로젝트 검증`,
  quote,
  date: '과정 종료 시점 작성',
})

const mentorRecommendation = (
  name: string,
  quote: string,
): CertRecommendation => ({
  role: '멘토',
  name: '윤다정 멘토',
  meta: `${name} 최종 프로젝트 멘토링`,
  quote,
  date: '최종 멘토링 후 작성',
})

function growthTimeline(
  startDate: string,
  scores: number[],
): CertGrowthTimelinePoint[] {
  const dayOffsets = [37, 60, 94, 120, 149, 170]
  const types: CertGrowthTimelinePoint['type'][] = [
    '성취도',
    'CS',
    '성취도',
    '성취도',
    'CS',
    '성취도',
  ]
  const titles = [
    '기초·데이터 처리 성취도 평가',
    '자료구조·운영체제 CS 평가',
    '웹 개발 통합 성취도 평가',
    '머신러닝·딥러닝 성취도 평가',
    '네트워크·데이터베이스 CS 평가',
    'LLM·RAG·배포 성취도 평가',
  ]

  return scores.map((score, index) => {
    const date = new Date(`${startDate}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + dayOffsets[index])
    return {
      date: date.toISOString().slice(0, 10),
      type: types[index],
      title: titles[index],
      score,
    }
  })
}

export const CERTIFICATE_DEMO_STUDENTS: CertificateDemoStudent[] = [
  {
    id: DEFAULT_CERTIFICATE_DEMO_STUDENT_ID,
    name: '박준서',
    cohortName: 'SKN 4기',
    periodLabel: '2024.03.11 — 2024.09.08 · 시연 데이터',
    overallScore: 78.4,
    profileLabel: '기존 기준형',
    profileSummary: '기술은 매우 강하고 협업 역량은 보완 중인 기준 프로필',
    recommendationState: 'BOTH',
    highlights: ['기술 95.4', '출석 91.7%', '프로젝트 인증 5건'],
    timeline: growthTimeline('2024-03-11', [64, 65, 72, 74, 75, 78.4]),
    reputation: [
      { key: '기술기여', score: 4.7, detail: '동료평가 기술기여 평균' },
      { key: '책임감', score: 3.8, detail: '마감·테스트 수행 평가' },
      { key: '소통', score: 3.6, detail: '근거 공유 방식 보완 중' },
      { key: '팀워크', score: 4, detail: '프로젝트 5회 협업' },
      { key: '문제해결', score: 4.4, detail: '인증 사례와 동료평가' },
    ],
    shortComments: [
      {
        quote: '“막힌 작업의 재현 조건을 먼저 정리하고 팀에 공유했습니다.”',
        by: '프로젝트 동료',
        tag: '#문제해결',
      },
      {
        quote: '“설계 근거를 문서로 더 남기면 인수인계가 좋아질 것 같습니다.”',
        by: '프로젝트 동료',
        tag: '#성장제안',
      },
    ],
    recommendations: [
      instructorRecommendation(
        '박준서',
        '“성취도 평가와 인증 문제해결에서 높은 기술 깊이를 일관되게 확인했습니다.”',
      ),
      mentorRecommendation(
        '박준서',
        '“초반보다 후반에 근거와 로그를 함께 제시하며 팀 의사결정에 기여했습니다.”',
      ),
    ],
    projectRole: '핵심 API 구현',
    projectContribution: 38,
    projectStates: [
      'CERTIFIED',
      'CERTIFIED',
      'CERTIFIED',
      'CERTIFIED',
      'CERTIFIED',
    ],
    finalProjectTitle: 'LLM 활용 대화형 상품추천 시스템',
    projectTags: ['API', 'RAG', '테스트', '배포'],
    pendingTroubleshootingCount: 1,
  },
  {
    id: '37b48417-d976-5d3a-ab5d-65c10a8c9b5b',
    name: '박채원',
    cohortName: 'SKN 1기',
    periodLabel: '2024.01.08 — 2024.07.07 · 시연 데이터',
    overallScore: 87.4,
    profileLabel: '고성취 완성형',
    profileSummary: '기술·협업·문제해결과 성장 흐름이 함께 확인되는 완성형',
    recommendationState: 'BOTH',
    highlights: ['책임감 99', '문제해결 83.3', '인증 TS 5건'],
    timeline: growthTimeline('2024-01-08', [68, 70, 80, 83, 84, 87.4]),
    reputation: [
      { key: '기술기여', score: 4.2, detail: '서비스 구현 기여 평가' },
      { key: '책임감', score: 5, detail: '책임감 절대점수 99' },
      { key: '소통', score: 3.8, detail: '사용자 시나리오 기준 조율' },
      { key: '팀워크', score: 4.4, detail: '팀워크 절대점수 87' },
      { key: '문제해결', score: 4.5, detail: '인증 트러블슈팅 5건' },
    ],
    shortComments: [
      {
        quote: '“사용자 시나리오를 기준으로 팀의 우선순위를 정리했습니다.”',
        by: '최종 프로젝트 동료',
        tag: '#조율',
      },
      {
        quote: '“실패 조건과 검증 결과를 함께 남겨 재현이 쉬웠습니다.”',
        by: '프로젝트 동료',
        tag: '#검증',
      },
    ],
    recommendations: [
      instructorRecommendation(
        '박채원',
        '“성취도와 문제해결뿐 아니라 책임감 있는 검증 과정을 통해 결과를 완성했습니다.”',
      ),
      mentorRecommendation(
        '박채원',
        '“기술 선택의 장단점을 비교하고 팀이 실행할 수 있는 기준으로 전환했습니다.”',
      ),
    ],
    projectRole: '사용자 시나리오·품질 검증',
    projectContribution: 41,
    projectStates: [
      'REQUESTED',
      'CHANGES_REQUESTED',
      'CERTIFIED',
      'CERTIFIED',
      'CERTIFIED',
    ],
    finalProjectTitle: 'LLM 활용 대화형 상품추천 시스템',
    projectTags: ['사용자 검증', 'LLM API', '품질', '조율'],
    pendingTroubleshootingCount: 10,
  },
  {
    id: 'f7cfd86d-80e0-5269-953e-dae23ba157ca',
    name: '강다은',
    cohortName: 'SKN 3기',
    periodLabel: '2024.02.19 — 2024.08.18 · 시연 데이터',
    overallScore: 77,
    profileLabel: '협업 성장형',
    profileSummary: '기술 성취보다 조율·소통·책임감에서 강점이 선명한 프로필',
    recommendationState: 'MENTOR_ONLY',
    highlights: ['소통 90.4', '책임감 87.2', '출석 91.7%'],
    timeline: growthTimeline('2024-02-19', [62, 62, 70, 74, 74, 77]),
    reputation: [
      { key: '기술기여', score: 3, detail: '기술 영역은 성장 중' },
      { key: '책임감', score: 4.4, detail: '책임감 절대점수 87.2' },
      { key: '소통', score: 4.5, detail: '소통 절대점수 90.4' },
      { key: '팀워크', score: 4, detail: '의견을 실행 항목으로 전환' },
      { key: '문제해결', score: 3.2, detail: '인증 사례 3건' },
    ],
    shortComments: [
      {
        quote: '“다른 구성원의 의견을 정리해 실행 항목으로 바꾸었습니다.”',
        by: '최종 프로젝트 동료',
        tag: '#소통',
      },
      {
        quote:
          '“초반보다 후기 상담에서 협업 안정감과 준비 방향이 뚜렷해졌습니다.”',
        by: '멘토',
        tag: '#성장',
      },
    ],
    recommendations: [
      mentorRecommendation(
        '강다은',
        '“회의 의견을 실행 항목으로 정리하고 팀의 협업 흐름을 안정적으로 유지했습니다.”',
      ),
    ],
    projectRole: '협업 조율·문서화',
    projectContribution: 34,
    projectStates: [
      'CHANGES_REQUESTED',
      'CERTIFIED',
      'REQUESTED',
      'REQUESTED',
      'CERTIFIED',
    ],
    finalProjectTitle: 'LLM 활용 인공지능 인플루언서 플랫폼',
    projectTags: ['조율', '문서화', 'LLM 평가', '발표'],
    pendingTroubleshootingCount: 3,
  },
  {
    id: '9422c8a3-ecb8-522d-bd9a-075537cd9140',
    name: '황하은',
    cohortName: 'SKN 11기',
    periodLabel: '2024.08.05 — 2025.02.05 · 시연 데이터',
    overallScore: 72.6,
    profileLabel: '기술 집중형',
    profileSummary: '기술 성취는 매우 높지만 소통·팀워크 보완이 필요한 프로필',
    recommendationState: 'INSTRUCTOR_ONLY',
    highlights: ['기술 97.5', '시험 평균 100', '인증 TS 3건'],
    timeline: growthTimeline('2024-08-05', [66, 75, 73, 70, 82, 72.6]),
    reputation: [
      { key: '기술기여', score: 4.8, detail: '기술 절대점수 97.5' },
      { key: '책임감', score: 3.2, detail: '책임감 절대점수 63' },
      { key: '소통', score: 2.6, detail: '설명 전달 방식 보완 필요' },
      { key: '팀워크', score: 3.6, detail: '팀워크 절대점수 72.3' },
      { key: '문제해결', score: 3.3, detail: '인증 사례 3건' },
    ],
    shortComments: [
      {
        quote: '“핵심 기능을 빠르게 복구하고 기술 원인을 명확히 설명했습니다.”',
        by: '담당 강사',
        tag: '#기술검증',
      },
      {
        quote:
          '“좋은 해결 결과를 팀이 따라갈 수 있도록 더 일찍 공유하면 좋겠습니다.”',
        by: '프로젝트 동료',
        tag: '#성장제안',
      },
    ],
    recommendations: [
      instructorRecommendation(
        '황하은',
        '“성취도 평가와 구현 검증에서 매우 높은 기술 완성도를 확인했습니다.”',
      ),
    ],
    projectRole: '모델·API 구현',
    projectContribution: 36,
    projectStates: [
      'REVIEWING',
      'REQUESTED',
      'CERTIFIED',
      'REVIEWING',
      'CERTIFIED',
    ],
    finalProjectTitle: 'LLM 활용 내부고객 업무 효율화 문서검색 시스템',
    projectTags: ['모델링', 'API', '회귀 테스트', '복구'],
    pendingTroubleshootingCount: 2,
  },
  {
    id: '2b2fab70-b982-590a-a659-94befc8c7b39',
    name: '전우진',
    cohortName: 'SKN 7기',
    periodLabel: '2024.05.13 — 2024.11.10 · 시연 데이터',
    overallScore: 58,
    profileLabel: '협업 보완형',
    profileSummary: '출석 기준은 충족했지만 소통과 팀워크를 보완할 사례',
    recommendationState: 'NONE',
    highlights: ['출석 82.5%', '소통 28', '팀워크 50'],
    timeline: growthTimeline('2024-05-13', [61, 54, 58, 55, 50, 58]),
    reputation: [
      { key: '기술기여', score: 4.8, detail: '동료평가 기술기여 4.8' },
      { key: '책임감', score: 3.6, detail: '동료평가 책임감 3.6' },
      { key: '소통', score: 2.2, detail: '동료평가 소통 2.2' },
      { key: '팀워크', score: 3, detail: '동료평가 협업 3.0' },
      { key: '문제해결', score: 4.3, detail: '동료평가 문제해결 4.3' },
    ],
    shortComments: [
      {
        quote:
          '“진행 상황을 조금 더 일찍 공유하면 협업 흐름이 좋아질 것 같습니다.”',
        by: '프로젝트 동료',
        tag: '#소통보완',
      },
      {
        quote:
          '“리뷰 요청 범위를 더 작게 나누면 피드백 속도가 빨라질 것 같습니다.”',
        by: '프로젝트 동료',
        tag: '#협업보완',
      },
    ],
    recommendations: [],
    projectRole: '화면·API 연동',
    projectContribution: 18,
    projectStates: [
      'CHANGES_REQUESTED',
      'CHANGES_REQUESTED',
      'REQUESTED',
      'CERTIFIED',
      'REQUESTED',
    ],
    finalProjectTitle: 'LLM 활용 대화형 상품추천 시스템',
    projectTags: ['화면 연동', 'API', '보완 요청'],
    pendingTroubleshootingCount: 3,
  },
]

export const CERTIFICATE_DEMO_STUDENT_BY_ID = new Map(
  CERTIFICATE_DEMO_STUDENTS.map((student) => [student.id, student]),
)

export function getCertificateDemoStudent(studentId: string | null) {
  if (studentId) {
    const selected = CERTIFICATE_DEMO_STUDENT_BY_ID.get(studentId)
    if (selected) return selected
  }
  return CERTIFICATE_DEMO_STUDENT_BY_ID.get(
    DEFAULT_CERTIFICATE_DEMO_STUDENT_ID,
  )!
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function applyCertificateDemoStudent(
  overview: CertificateOverview,
  student: CertificateDemoStudent,
): CertificateOverview {
  return {
    ...overview,
    header: {
      ...overview.header,
      studentName: student.name,
      cohortName: student.cohortName,
      periodLabel: student.periodLabel,
      certId: `DEMO-${student.cohortName.replace(/\D/g, '') || '0'}-${student.id.slice(0, 4).toUpperCase()}`,
    },
    growth: {
      ...overview.growth,
      timeline: student.timeline,
      peerAverage: Number(
        average(student.reputation.map((item) => item.score)).toFixed(1),
      ),
      reputation: student.reputation,
      shortComments: student.shortComments,
      recommendations: student.recommendations,
    },
  }
}

const HIGH_ACHIEVER_STUDENT_ID = '37b48417-d976-5d3a-ab5d-65c10a8c9b5b'

export function applyCertificateDemoScore(
  score: CertificateScoreResult,
  studentId: string,
): CertificateScoreResult {
  if (studentId !== HIGH_ACHIEVER_STUDENT_ID) return score

  const axes = score.axes.map((axis) =>
    axis.key === '기술'
      ? {
          ...axis,
          score: 80.6,
          detail: '내부 인증 완료 6건 평균 82점, 외부 인증 코딩테스트 15점',
        }
      : axis,
  )
  const readyAxisScores = axes.flatMap((axis) =>
    axis.score === null ? [] : [axis.score],
  )
  const overallScore = Number(average(readyAxisScores).toFixed(1))

  return {
    ...score,
    overallScore,
    axes,
    metrics: score.metrics.map((metric) =>
      metric.key === 'assessment'
        ? { ...metric, value: 82, detail: '채점 완료 6/6건' }
        : metric,
    ),
  }
}

export function applyCertificateDemoDetailTabs(
  detail: CertificateDetailTabsResult,
  studentId: string,
): CertificateDetailTabsResult {
  if (studentId !== HIGH_ACHIEVER_STUDENT_ID) return detail

  const assessmentSeed = [
    ['파이썬', '파이썬 기초·데이터 처리 성취도 평가', 68, 70, '2024-03-20'],
    ['SQL·Pandas', 'SQL·Pandas 데이터 분석 성취도 평가', 72, 71, '2024-04-11'],
    ['프론트엔드', '프론트엔드 웹 구현 성취도 평가', 81, 73, '2024-05-07'],
    ['Django', 'Django API 개발 성취도 평가', 88, 75, '2024-05-15'],
    ['머신러닝', '머신러닝 모델링 성취도 평가', 90, 77, '2024-06-05'],
    ['LLM·배포', 'LLM 서비스·배포 성취도 평가', 93, 79, '2024-06-26'],
  ] as const

  return {
    ...detail,
    tech: {
      ...detail.tech,
      averageScore: 82,
      assessmentAverageTopPercent: 12.5,
      assessmentAveragePopulationSize: 24,
      categories: assessmentSeed.map(([label, , score], index) => ({
        label,
        score,
        attemptCount: 1,
        topPercent: null,
        populationSize: 20 + index,
      })),
      assessments: assessmentSeed.map(
        ([category, title, score, cohortAverageScore, submittedAt], index) => ({
          id: `${studentId}-demo-assessment-${index + 1}`,
          title,
          category,
          score,
          cohortAverageScore,
          relativeScore: Number(
            Math.min(100, 50 + (score - cohortAverageScore) * 2).toFixed(1),
          ),
          comparisonCount: 20 + index,
          submittedAt: `${submittedAt}T16:30:00`,
        }),
      ),
      certifications: [
        {
          name: 'PCCE',
          score: 790,
          grade: 'LV.3',
          status: 'APPROVED',
          scheduledAt: null,
          submittedAt: '2024-03-12',
          issuedAt: '2024-03-25',
          registrationSource: '자가 등록 · 운영 승인',
        },
        {
          name: 'PCCP',
          score: 700,
          grade: 'LV.3',
          status: 'PENDING',
          scheduledAt: null,
          submittedAt: '2024-06-28',
          issuedAt: null,
          registrationSource: '자가 등록 · 검토 중',
        },
        {
          name: 'PCSQL',
          score: 550,
          grade: 'LV.2',
          status: 'APPROVED',
          scheduledAt: null,
          submittedAt: '2024-05-22',
          issuedAt: '2024-06-03',
          registrationSource: '자가 등록 · 운영 승인',
        },
      ],
      limitations: [
        ...detail.tech.limitations.filter(
          (limitation) => !limitation.includes('전체 시험 평균'),
        ),
        '시연 프로필의 성취도 평가 3회와 자격 검토 상태는 테스트 오버레이',
      ],
    },
    problem: {
      ...detail.problem,
      limitations: [
        ...detail.problem.limitations,
        '검토 중·보완 요청·반려 트러블슈팅 10건은 인증 사례 통계에서 제외',
      ],
    },
  }
}
