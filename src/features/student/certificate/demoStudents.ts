import type {
  CertificateOverview,
  CertGrowthTimelinePoint,
  CertRecommendation,
  CertReputation,
  CertShortComment,
} from './types'
import { certifiedProjectsOf, rosterOverall } from './ai/stubs/roster'

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
  'f074a93b-5ad7-4234-ba35-4e260d9272ea'

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


// 34기 실제 로스터 기반 — 이름·역량 점검 점수는 배포 BE 실측(2026-08-11).
// 나머지 표시값(평판·코멘트·프로젝트 상태)은 점수에서 결정론 파생한 데모 표현이다.
function seedOf(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 100_000
  return h
}

function buildRosterDemoStudent(
  id: string,
  name: string,
  q1: number,
  q2: number,
  blogs: number,
  assigns: number,
): CertificateDemoStudent {
  const avg = Math.round(((q1 + q2) / 2) * 10) / 10
  const seed = seedOf(name)
  // 관리자 목록 점수와 미리보기(6축 평균)가 같은 값을 보이도록 산식을 공유한다.
  const overall = rosterOverall({ id, name, q1, q2, blogs, assigns })
  const tier = avg >= 90 ? 3 : avg >= 75 ? 2 : avg >= 60 ? 1 : 0
  const profile = [
    { label: '기초 보완형', summary: '기초 개념을 다시 다지며 따라오는 단계' },
    { label: '꾸준 성장형', summary: '주차 학습을 꾸준히 따라가며 성장 중' },
    { label: '안정 수행형', summary: '기초 역량이 안정적으로 자리잡은 단계' },
    { label: '상위 성취형', summary: '역량 점검 상위권의 성취를 보이는 단계' },
  ][tier]
  const rep = (k: number, spread: number) =>
    Math.round((3.2 + (avg / 100) * 1.4 + (((seed >> k) % (spread * 2 + 1)) - spread) / 10) * 10) / 10
  return {
    id,
    name,
    cohortName: '34기',
    periodLabel: '2026.06.16 — 2026.12.08',
    overallScore: overall,
    profileLabel: profile.label,
    profileSummary: `${profile.summary} — 역량 점검 평균 ${avg}점`,
    recommendationState:
      tier >= 3 ? 'BOTH' : tier === 2 ? 'INSTRUCTOR_ONLY' : 'NONE',
    highlights: [
      `역량 점검 평균 ${avg}점`,
      `블로그 ${blogs}주 · 과제 ${assigns}건 제출`,
      `팀 프로젝트 ${certifiedProjectsOf(name).length}건 인증`,
    ],
    timeline: [
      {
        date: '2026-07-03',
        type: '성취도',
        title: '1차 역량 점검 — Python 기초와 자료구조',
        score: q1,
      },
      {
        date: '2026-07-24',
        type: '성취도',
        title: '2차 역량 점검 — SQL과 관계형 데이터베이스',
        score: q2,
      },
    ],
    reputation: [
      { key: '기술기여', score: rep(1, 2), detail: `역량 점검 평균 ${avg}점` },
      { key: '책임감', score: rep(3, 2), detail: `출석 100% · 과제 ${assigns}건 제출` },
      { key: '소통', score: rep(5, 2), detail: '기수 활동 기반 데모 추정' },
      { key: '성장', score: rep(7, 2), detail: `1차 ${q1} → 2차 ${q2}` },
      { key: '팀워크', score: rep(9, 2), detail: '팀 활동 수집 전' },
    ],
    shortComments: [],
    recommendations:
      tier >= 2
        ? [
            instructorRecommendation(
              name,
              `"역량 점검 두 회차(${q1}·${q2}점)에서 기초 개념을 안정적으로 확인했습니다."`,
            ),
            ...(tier >= 3
              ? [
                  mentorRecommendation(
                    name,
                    '"질문의 재현 조건을 정리해 오는 습관이 좋습니다. 프로젝트에서 성장이 기대됩니다."',
                  ),
                ]
              : []),
          ]
        : [],
    projectRole: '프로젝트 배정 전',
    projectContribution: 0,
    projectStates: [],
    finalProjectTitle: '1차 미니 프로젝트 준비 중',
    projectTags: ['Python', 'SQL'],
    pendingTroubleshootingCount: 0,
  }
}

const REAL_ROSTER_SCORES: [string, string, number, number, number, number][] = [
  ['173c1f4a-8f1a-4347-9313-a616928c747e', '김건우', 84, 86, 6, 6],
  ['c83424f0-3657-464d-8755-ffbf0bdd4300', '김기호', 93, 94, 5, 6],
  ['36b5abd6-20b7-4371-8333-0884806535d2', '김대호', 83, 72, 3, 4],
  ['8fda7ecf-ab02-4c70-b6cb-f99252b97208', '김동섭', 92, 83, 5, 6],
  ['3e8122dc-2fcd-4965-9482-1461a40071d1', '김재현', 63, 60, 2, 2],
  ['7a63e4f0-a5cb-4bfb-96d2-d13f3c9eac40', '김진화', 82, 90, 5, 6],
  ['fcc3ae0a-a921-4f3a-9a32-0992a225dbee', '김태윤', 84, 92, 5, 6],
  ['cc416cf9-ee44-4568-9298-d72e13fbb3f9', '김현지', 94, 92, 5, 6],
  ['b8f5bec7-a8e1-4b95-b646-481aeda7acac', '노민환', 70, 76, 3, 4],
  ['84333024-ae0e-46a1-8199-96c667b95157', '문성호', 90, 72, 3, 4],
  ['bbc694f0-9325-426c-a85d-dca6cd4f39bb', '송승재', 96, 97, 5, 6],
  ['d9748c45-3779-428a-9509-344272e385f3', '윤성호', 65, 72, 2, 2],
  ['75130370-ad62-4a2b-b0b3-25d3c9f4995a', '이성민', 50, 47, 1, 2],
  ['27652d16-2c51-444e-80e9-378e7d88da36', '이현준', 90, 78, 3, 4],
  ['3745ede2-1a35-4a25-9f50-870b6e256883', '이홍규', 64, 74, 4, 2],
  ['bcb748bf-4649-4414-b6bf-cccdbad3d8e6', '임형준', 76, 60, 2, 2],
  ['272cc951-d4f9-49df-b4b7-900fa5e2478b', '전진영', 82, 74, 3, 4],
  ['7d369529-546c-4ac3-ba23-bc2bb762e8aa', '전진환', 51, 53, 5, 2],
  ['1ca3e604-be73-42f8-95ab-cad06f202333', '정예린', 56, 64, 4, 2],
  ['3f6250fa-91a7-4719-8b30-3abd7d94b37d', '채정석', 80, 67, 2, 4],
  ['6503f5a9-d91a-4729-a5d9-3345aa2af448', '최대원', 81, 75, 3, 4],
  ['2ac2a82b-7b1e-4238-9c22-a019e3995569', '최성욱', 47, 60, 3, 2],
  ['1af5e5c1-2f6b-4fce-9e26-0c36b1266842', '최인영', 96, 92, 5, 6],
  ['84310db5-c5c5-4f56-8fb1-7780dec1a30b', '홍지윤', 76, 78, 3, 4],
  ['02b388be-68fa-44b0-9050-14890cf419d1', '황호순', 76, 96, 3, 6],
]

// 황수빈(데모 계정) — 증명서 본인 화면(park-sujin 스텁)과 같은 값의 리치 엔트리.
const HWANG_SUBIN: CertificateDemoStudent = {
  id: 'f074a93b-5ad7-4234-ba35-4e260d9272ea',
  name: '황수빈',
  cohortName: '34기',
  periodLabel: '2026.06.16 — 2026.12.08',
  overallScore: 94.4,
  profileLabel: '수집·검증 완결형',
  profileSummary: '채용 데이터 수집부터 검증까지 혼자 완결하는 데이터 분석가형',
  recommendationState: 'BOTH',
  highlights: ['역량 점검 평균 98점', '인증 프로젝트 1건', '인증 문제해결 3건'],
  timeline: [
    { date: '2026-07-03', type: '성취도', title: '1차 역량 점검 — Python 기초와 자료구조', score: 100 },
    { date: '2026-07-10', type: 'CS', title: 'CS 점검 1차 — 자료구조와 알고리즘', score: 85 },
    { date: '2026-07-17', type: 'CS', title: 'CS 점검 2차 — 운영체제 기초', score: 80 },
    { date: '2026-07-24', type: '성취도', title: '2차 역량 점검 — SQL과 관계형 데이터베이스', score: 96 },
    { date: '2026-07-31', type: 'CS', title: 'CS 점검 3차 — 네트워크 기초', score: 90 },
    { date: '2026-08-07', type: 'CS', title: 'CS 점검 4차 — 데이터베이스 원리', score: 95 },
  ],
  reputation: [
    { key: '기술기여', score: 4.6, detail: '역량 점검 평균 98 · 인증 프로젝트 1건' },
    { key: '책임감', score: 4.8, detail: '결석 0 · 과제 9/10 · 블로그 8주 연속' },
    { key: '소통', score: 4.5, detail: 'Q&A 질문 3건 전부 채택' },
    { key: '성장', score: 4.3, detail: '환경 적응 → 프로젝트 인증까지 8주' },
    { key: '팀워크', score: 4.5, detail: '멘토링 팀 4인 · SQL 스터디 운영' },
  ],
  shortComments: [
    {
      quote: '"merge 행 폭증 원인을 키 중복까지 파고들어 팀 템플릿으로 만들어 줬어요."',
      by: '멘토링 팀 동료',
      tag: '#문제해결',
    },
    {
      quote: '"스터디에서 실행 계획 읽는 법을 차근차근 설명해 줘서 이해가 잘 됐어요."',
      by: '멘토링 팀 동료',
      tag: '#기록공유',
    },
  ],
  recommendations: [
    {
      role: '강사',
      name: '박지훈 강사',
      meta: '담당 강사 · 34기',
      quote:
        '"채용 공고 프로젝트에서 수집·정규화·검증을 혼자 완결했습니다. 문제를 만나면 기록으로 남기고 규칙을 만드는 습관이 돋보입니다."',
      date: '2026-08-10 작성',
    },
    {
      role: '멘토',
      name: '정민재 멘토',
      meta: '데이터 직무 스택 지도 팀 · 멘토링 3회',
      quote:
        '"데이터 누수 사례를 함께 짚었을 때 하루 만에 Pipeline 으로 교정하고 팀에 공유했습니다. 피드백 흡수가 빠릅니다."',
      date: '2026-08-08 작성',
    },
  ],
  projectRole: '개인 프로젝트 · 수집부터 대시보드까지',
  projectContribution: 100,
  projectStates: ['CERTIFIED'],
  finalProjectTitle: '채용 공고로 보는 데이터 직무 기술 스택 지도',
  projectTags: ['Python', 'pandas', 'PostgreSQL', 'Streamlit'],
  pendingTroubleshootingCount: 2,
}

export const CERTIFICATE_DEMO_STUDENTS: CertificateDemoStudent[] = [
  HWANG_SUBIN,
  ...REAL_ROSTER_SCORES.map(([id, name, q1, q2, blogs, assigns]) =>
    buildRosterDemoStudent(id, name, q1, q2, blogs, assigns),
  ),
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
