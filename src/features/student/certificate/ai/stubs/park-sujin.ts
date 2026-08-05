import type {
  AiAnalysis,
  AiAxisAlignmentAxis,
  AiJobFitRoleCandidate,
  CertificateAxisKey,
  CertificateAxisScore,
  CertificateDetailTabsResult,
  CertificateProblemDetail,
  CertificateRelativePosition,
  CertificateScoreResult,
  OntologyEdge,
  OntologyNode,
} from '../types'

const CALCULATED_AT = '2026-10-26'
const RELATIVE_MOCK_POPULATION_SIZE = 300

function mockPopulationScores(seed: number) {
  return Array.from(
    { length: RELATIVE_MOCK_POPULATION_SIZE - 1 },
    (_, index) => {
      const first = ((index * 73 + seed * 37) % 101) / 100
      const second = ((index * 47 + seed * 19 + 17) % 101) / 100
      const third = ((index * 29 + seed * 43 + 31) % 101) / 100
      return Number((48 + ((first + second + third) / 3) * 48).toFixed(1))
    },
  )
}

function readyRelative(
  score: number,
  scope: CertificateRelativePosition['scope'],
  label: string,
  seed: number,
): CertificateRelativePosition {
  const population = mockPopulationScores(seed)
  const higherCount = population.filter((value) => value > score).length
  const atOrBelowCount = population.filter((value) => value <= score).length + 1
  const percentile = Number(
    ((atOrBelowCount / RELATIVE_MOCK_POPULATION_SIZE) * 100).toFixed(1),
  )
  const topPercent = Number(
    (((higherCount + 1) / RELATIVE_MOCK_POPULATION_SIZE) * 100).toFixed(1),
  )

  return {
    status: 'READY',
    scope,
    percentile,
    topPercent,
    populationSize: RELATIVE_MOCK_POPULATION_SIZE,
    detail: `${label} 기준 프론트 mock 비교 표본 300명 중 상위 ${topPercent}%입니다.`,
  }
}

function mockPopulationAverage(seed: number) {
  const population = mockPopulationScores(seed)
  return Number(
    (
      population.reduce((sum, score) => sum + score, 0) / population.length
    ).toFixed(1),
  )
}

const assessmentRelative = readyRelative(82, 'COHORT', '시험 평균 82점', 82)

const axisRelativeSeeds: Record<CertificateAxisKey, number> = {
  '기술·기술기여': 11,
  '소통·협업·팀워크': 23,
  문제해결: 37,
  책임감: 41,
  학습지속성: 53,
  '성취도 평가': 67,
}

type AxisInput = {
  key: CertificateAxisKey
  score: number
  peerScore: number | null
  mentorScore?: number | null
  instructorScore?: number | null
  managerScore?: number | null
  detail: string
  evidenceLabel: string
  evidenceDetail: string
  relative?: CertificateRelativePosition
  evidence?: CertificateAxisScore['evidence']
}

function axis({
  key,
  score,
  peerScore,
  mentorScore = null,
  instructorScore = null,
  managerScore = null,
  detail,
  evidenceLabel,
  evidenceDetail,
  relative,
  evidence,
}: AxisInput): CertificateAxisScore {
  const evaluatorScores = [
    ['peerEvaluation', '동료 평가', peerScore],
    ['mentorEvaluation', '멘토 평가', mentorScore],
    ['instructorEvaluation', '강사 평가', instructorScore],
    ['managerEvaluation', '운영 평가', managerScore],
  ] as const
  const evaluatorEvidence = evaluatorScores.flatMap(
    ([evidenceKey, label, evaluatorScore]) =>
      evaluatorScore === null
        ? []
        : [
            {
              key: evidenceKey,
              label,
              value: evaluatorScore / 20,
              unit: '점' as const,
              numerator: null,
              denominator: null,
              weightPercent: 25,
              appliedScore: evaluatorScore / 4,
              detail: `${label} mock ${evaluatorScore / 20}/5`,
            },
          ],
  )
  const resolvedEvidence =
    evidence ??
    (evaluatorEvidence.length > 0
      ? evaluatorEvidence
      : [
          {
            key: 'parkSujinMock',
            label: evidenceLabel,
            value: score,
            unit: '점',
            numerator: null,
            denominator: null,
            weightPercent: 100,
            appliedScore: score,
            detail: evidenceDetail,
          },
        ])

  return {
    key,
    score,
    status: 'READY',
    source: '수강역량증명서 박수진 mock',
    detail,
    relative:
      relative ??
      readyRelative(
        score,
        'ALL_STUDENTS',
        `${key} ${score}점`,
        axisRelativeSeeds[key],
      ),
    comparison: {
      peerScore,
      mentorScore,
      instructorScore,
      managerScore,
    },
    evidence: resolvedEvidence,
  }
}

const scoreAxes: CertificateAxisScore[] = [
  axis({
    key: '기술·기술기여',
    score: 88,
    peerScore: 92,
    mentorScore: 88,
    instructorScore: 86,
    managerScore: 86,
    detail: '기술 88점 · 동료·멘토·강사·운영 평가 평균',
    evidenceLabel: '기술 역량',
    evidenceDetail: '백엔드 기초와 트러블슈팅 역량을 반영한 박수진 mock 값',
  }),
  axis({
    key: '소통·협업·팀워크',
    score: 82,
    peerScore: 90,
    mentorScore: 80,
    instructorScore: 78,
    managerScore: 80,
    detail: '팀워크 82점 · 소통 84점 · 동료·멘토·강사·운영 평가 평균',
    evidenceLabel: '팀워크 역량',
    evidenceDetail: '동료평 평균 4.5점과 논리적 설득 태그 10회',
  }),
  axis({
    key: '문제해결',
    score: 79,
    peerScore: 82,
    mentorScore: 78,
    instructorScore: 76,
    managerScore: 80,
    detail: '문제해결 79점 · 인증 사례 12건 · 4개 평가자 그룹 반영',
    evidenceLabel: '문제해결 역량',
    evidenceDetail: '독립 해결 10건과 대표 트러블슈팅 3건',
  }),
  axis({
    key: '책임감',
    score: 90,
    peerScore: 96,
    mentorScore: 88,
    instructorScore: 88,
    managerScore: 88,
    detail: '책임감 90점 · 동료·멘토·강사·운영 평가 평균',
    evidenceLabel: '책임감 역량',
    evidenceDetail: '리더십 평가와 동료 평가 5인의 일관된 기록',
  }),
  axis({
    key: '학습지속성',
    score: 100,
    peerScore: null,
    detail:
      '출석 66.5점 + 블로그 24점 + 과제·스터디·멘토링 가산점 9.5점 = 100점',
    evidenceLabel: '성장 역량',
    evidenceDetail: '성취도·CS 평가의 지속 상승을 반영한 박수진 mock 값',
    evidence: [
      {
        key: 'attendance',
        label: '출석률',
        value: 96,
        unit: '%',
        numerator: 768,
        denominator: 800,
        weightPercent: 70,
        appliedScore: 66.5,
        detail: '768/800시간 · 66.5점 반영',
      },
      {
        key: 'blog',
        label: '블로그 제출률',
        value: 81,
        unit: '%',
        numerator: 21,
        denominator: 26,
        weightPercent: 30,
        appliedScore: 24,
        detail: '21/26회 · 24점 반영',
      },
      {
        key: 'assignment',
        label: '과제 제출률',
        value: 60,
        unit: '%',
        numerator: 6,
        denominator: 10,
        weightPercent: null,
        appliedScore: 3.5,
        detail: '6/10건 · 60% · +3.5점',
      },
      {
        key: 'study',
        label: '스터디 참여율',
        value: 50,
        unit: '%',
        numerator: 4,
        denominator: 8,
        weightPercent: null,
        appliedScore: 3,
        detail: '4/8회 · 50% · +3점',
      },
      {
        key: 'mentoring',
        label: '멘토링 참석률',
        value: 50,
        unit: '%',
        numerator: 4,
        denominator: 8,
        weightPercent: null,
        appliedScore: 3,
        detail: '4/8회 · 50% · +3점',
      },
    ],
  }),
  axis({
    key: '성취도 평가',
    score: 82,
    peerScore: null,
    detail: '시험 평균 82점 · 퀴즈 12회 · 상위 18%',
    evidenceLabel: '시험 평균',
    evidenceDetail: '박수진 mock의 퀴즈 12회 평균',
    relative: assessmentRelative,
    evidence: [
      {
        key: 'achievementAssessment',
        label: '성취도 평가 전체 평균',
        value: 82,
        unit: '점',
        numerator: 12,
        denominator: 12,
        weightPercent: 100,
        appliedScore: 82,
        detail: '채점 완료 퀴즈 12회의 최신 유효 점수 전체 평균',
      },
    ],
  }),
]

export function createParkSujinScore(
  studentId: string,
): CertificateScoreResult {
  return {
    policyVersion: '2026.08.05-six-axis-four-rater-v2',
    calculatedAt: CALCULATED_AT,
    student: {
      studentId,
      studentName: '박수진',
      courseName: 'SK네트웍스 Family AI 캠프',
      cohortName: 'SKN 32기',
      cohortStartedAt: '2026-04-28',
      cohortEndedAt: '2026-10-26',
    },
    status: 'READY',
    overallScore: 86,
    grade: 'A',
    overallRelative: readyRelative(86, 'ALL_STUDENTS', '종합점수 86점', 97),
    axes: scoreAxes,
    metrics: [
      {
        key: 'attendance',
        label: '출석률',
        value: 96,
        maximum: 100,
        unit: '%',
        status: 'READY',
        detail: '768 / 800시간 · 지각 2회',
      },
      {
        key: 'assessment',
        label: '시험 평균',
        value: 82,
        maximum: 100,
        unit: '점',
        status: 'READY',
        detail: `퀴즈 12회 · 상위 ${assessmentRelative.topPercent}%`,
      },
      {
        key: 'blog',
        label: '블로그 제출률',
        value: 81,
        maximum: 100,
        unit: '%',
        status: 'READY',
        detail: '21 / 26 제출 완료',
      },
      {
        key: 'certifiedProject',
        label: '인증 프로젝트',
        value: 2,
        maximum: 3,
        unit: '건',
        status: 'READY',
        detail: '강사 인증 완료 2건',
      },
      {
        key: 'certifiedTroubleshooting',
        label: '인증 문제해결',
        value: 12,
        maximum: null,
        unit: '건',
        status: 'READY',
        detail: 'STAR 구조 인증 사례 12건',
      },
      {
        key: 'certifiedCertificate',
        label: '승인 자격증',
        value: 1,
        maximum: null,
        unit: '건',
        status: 'READY',
        detail: 'PCCE 승인 1건',
      },
      {
        key: 'evaluatorAverage',
        label: '동료평 평균',
        value: 4.6,
        maximum: 5,
        unit: '점',
        status: 'READY',
        detail: '동료 평가 12건 평균',
      },
    ],
    peerEvaluation: [
      {
        key: '협업',
        score: 4.5,
        status: 'READY',
        detail: '팀워크 동료평 평균',
      },
      { key: '소통', score: 4.5, status: 'READY', detail: '논리적 설득 10회' },
      { key: '책임감', score: 4.8, status: 'READY', detail: '리더십 평가 1위' },
      {
        key: '문제해결',
        score: 4.1,
        status: 'READY',
        detail: '문제해결 비교 82점',
      },
      {
        key: '기술기여',
        score: 4.6,
        status: 'READY',
        detail: 'PR 22건 · 코드 리뷰 평균 4.6',
      },
    ],
    projectNavigation: {
      issuesProjectId: 'pj1',
      peerEvaluationProjectId: 'pj1',
    },
    domainExperience: [
      { label: '커머스 · 주문/결제', projectCount: 2, percentage: 40 },
      { label: '추천 · LLM 파이프라인', projectCount: 2, percentage: 30 },
      { label: '인프라 · DevOps', projectCount: 1, percentage: 20 },
      { label: '데이터 · 분석', projectCount: 1, percentage: 10 },
    ],
    warnings: [],
  }
}

const parkSujinAssessments = [
  {
    title: '파이썬 기초·데이터 처리 성취도 평가',
    assessmentType: 'ACHIEVEMENT' as const,
    category: '파이썬 기초·데이터 처리',
    score: 54,
    submittedAt: '2026-06-04T18:00:00',
  },
  {
    title: '자료구조·운영체제 CS 평가',
    assessmentType: 'CS' as const,
    category: '자료구조·운영체제',
    score: 58,
    submittedAt: '2026-06-27T18:00:00',
  },
  {
    title: 'SQL·Pandas·웹 개발 통합 성취도 평가',
    assessmentType: 'ACHIEVEMENT' as const,
    category: 'SQL·Pandas·웹 개발',
    score: 68,
    submittedAt: '2026-07-31T18:00:00',
  },
  {
    title: '머신러닝·딥러닝 모델링 성취도 평가',
    assessmentType: 'ACHIEVEMENT' as const,
    category: '머신러닝·딥러닝 모델링',
    score: 75,
    submittedAt: '2026-08-26T18:00:00',
  },
  {
    title: '네트워크·데이터베이스 CS 평가',
    assessmentType: 'CS' as const,
    category: '네트워크·데이터베이스',
    score: 80,
    submittedAt: '2026-09-24T18:00:00',
  },
  {
    title: 'LLM·RAG·AWS 배포 성취도 평가',
    assessmentType: 'ACHIEVEMENT' as const,
    category: 'LLM·RAG·AWS 배포',
    score: 86,
    submittedAt: '2026-10-15T18:00:00',
  },
]

type TroubleshootingCaseInput = Omit<
  CertificateProblemDetail['cases'][number],
  'summary'
>

function verifiedTroubleshootingCase(
  input: TroubleshootingCaseInput,
): CertificateProblemDetail['cases'][number] {
  return {
    ...input,
    summary: {
      policyVersion: '2026.08.05-park-sujin-troubleshooting-summary-v1',
      situation: input.situation,
      resolution: input.resolution,
      result: input.result,
      generatedBy: 'FALLBACK',
    },
  }
}

const parkSujinTroubleshootingCases: CertificateProblemDetail['cases'] = [
  verifiedTroubleshootingCase({
    id: 'pc1',
    title: 'PostgreSQL 데드락 — 결제 트랜잭션 격리 수준',
    category: 'DB / SQL',
    independent: true,
    days: 3,
    situation:
      '동시 결제 100건 재현 테스트에서 PostgreSQL 데드락과 8% 실패율이 발생했습니다.',
    resolution:
      '락 획득 순서를 통일하고 트랜잭션 격리 범위를 줄인 뒤 동일 부하로 재검증했습니다.',
    result: '결제 실패율을 8%에서 0.2%로 낮추고 재현 테스트를 통과했습니다.',
    createdAt: '2026-08-12T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc2',
    title: 'Kafka 컨슈머 ack 미반영 — 메시지 중복 발생',
    category: '배포 / 인프라',
    independent: true,
    days: 2,
    situation:
      '컨슈머 재시작 시 결제 이벤트가 중복 소비되어 주문 상태가 두 번 갱신됐습니다.',
    resolution:
      'enable.auto.commit=false와 멱등 키를 적용하고 실패·재시작 시나리오를 반복 실행했습니다.',
    result:
      '중복 처리를 제거하고 결제 실패 이벤트의 자동 재처리를 95% 안정화했습니다.',
    createdAt: '2026-08-28T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc3',
    title: 'N+1 쿼리 — 사용자 주문 목록 응답 7초',
    category: '성능 / 메모리',
    independent: true,
    days: 1,
    situation:
      '주문 1,000건 조회 시 연관 엔티티별 추가 쿼리로 응답에 7초가 걸렸습니다.',
    resolution:
      '@EntityGraph와 fetch join을 적용하고 쿼리 수와 실행 계획을 전후 비교했습니다.',
    result:
      '응답 시간을 7초에서 380ms로 94% 단축하고 회귀 테스트를 통과했습니다.',
    createdAt: '2026-09-08T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc4',
    title: 'RAG 검색 API — 임베딩 차원 불일치',
    category: '네트워크 / API',
    independent: true,
    days: 2,
    situation:
      '문서와 질문의 임베딩 차원이 달라 검색 API가 500 오류를 반환했습니다.',
    resolution:
      '임베딩 모델과 벡터 차원을 단일 설정으로 통일하고 인덱스를 다시 생성했습니다.',
    result:
      '검증 질문 35건이 정상 응답했고 검색 API 계약 테스트가 모두 통과했습니다.',
    createdAt: '2026-05-20T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc5',
    title: 'Whisper 입력 — 오디오 샘플링 레이트 불일치',
    category: '기타',
    independent: false,
    days: 3,
    situation:
      '모바일 녹음 파일 일부가 44.1kHz로 들어와 Whisper 전사 결과가 비어 있었습니다.',
    resolution:
      '멘토 피드백을 반영해 입력을 16kHz mono로 정규화하고 파일 형식 검증을 추가했습니다.',
    result:
      '실패 파일 12건을 모두 전사하고 입력 검증 자동 테스트를 추가했습니다.',
    createdAt: '2026-05-28T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc6',
    title: 'KoBART 요약 — GPU 메모리 부족',
    category: '성능 / 메모리',
    independent: true,
    days: 2,
    situation:
      '긴 회의록을 일괄 요약할 때 GPU 메모리 부족으로 프로세스가 종료됐습니다.',
    resolution:
      '문장 단위 청킹과 배치 크기 제한을 적용하고 길이별 메모리 사용량을 측정했습니다.',
    result:
      '최대 60분 회의록까지 중단 없이 처리하고 평균 처리 시간을 12초로 유지했습니다.',
    createdAt: '2026-06-05T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc7',
    title: 'PostgreSQL 인덱스 — 주문 검색 지연',
    category: 'DB / SQL',
    independent: true,
    days: 2,
    situation:
      '기간·상태 복합 조건의 주문 검색이 전체 테이블 스캔으로 2.8초가 걸렸습니다.',
    resolution:
      '실행 계획을 기준으로 복합 인덱스 순서를 조정하고 동일 데이터로 비교했습니다.',
    result:
      '검색 응답을 2.8초에서 190ms로 줄이고 인덱스 회귀 기준을 문서화했습니다.',
    createdAt: '2026-08-19T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc8',
    title: 'Redis 캐시 키 — 사용자별 장바구니 충돌',
    category: 'DB / SQL',
    independent: true,
    days: 3,
    situation:
      '캐시 키에 사용자 식별자가 없어 다른 사용자의 장바구니 결과가 재사용됐습니다.',
    resolution:
      '사용자·버전 정보를 포함한 키 규칙과 만료 정책을 적용하고 격리 테스트를 추가했습니다.',
    result:
      '사용자 간 캐시 충돌을 제거하고 200개 병렬 요청 검증을 통과했습니다.',
    createdAt: '2026-09-02T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc9',
    title: 'Flyway 마이그레이션 — 컬럼 제약조건 충돌',
    category: 'DB / SQL',
    independent: true,
    days: 2,
    situation:
      '기존 주문 데이터의 null 값 때문에 NOT NULL 마이그레이션이 배포 단계에서 실패했습니다.',
    resolution:
      '백필과 제약조건 적용을 두 단계로 분리하고 운영 복제 데이터로 사전 검증했습니다.',
    result:
      '데이터 손실 없이 마이그레이션을 완료하고 롤백 시나리오까지 검증했습니다.',
    createdAt: '2026-09-10T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc10',
    title: 'Docker 환경변수 — 프로필 설정 누락',
    category: '배포 / 인프라',
    independent: true,
    days: 2,
    situation:
      '스테이징 컨테이너에서 Spring 프로필이 누락되어 로컬 DB 주소로 접속했습니다.',
    resolution:
      '환경별 필수 변수 검증과 시작 전 설정 확인 스크립트를 배포 파이프라인에 추가했습니다.',
    result:
      '환경 오접속을 차단하고 스테이징 배포 및 헬스 체크를 연속 5회 통과했습니다.',
    createdAt: '2026-09-21T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc11',
    title: 'AWS 헬스 체크 — 롤링 배포 중 502 응답',
    category: '배포 / 인프라',
    independent: false,
    days: 3,
    situation:
      '롤링 배포 중 준비되지 않은 인스턴스로 트래픽이 전달되어 502 응답이 발생했습니다.',
    resolution:
      '강사 리뷰를 반영해 readiness 경로와 grace period를 분리하고 배포 순서를 조정했습니다.',
    result:
      '무중단 배포 3회를 완료하고 배포 구간 502 응답이 0건임을 확인했습니다.',
    createdAt: '2026-09-29T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc12',
    title: 'OAuth 콜백 — CORS 사전 요청 실패',
    category: '네트워크 / API',
    independent: true,
    days: 3,
    situation:
      '운영 도메인의 OAuth 콜백 전 OPTIONS 요청이 차단되어 로그인이 완료되지 않았습니다.',
    resolution:
      '허용 origin과 자격증명 정책을 명시하고 프론트·API 도메인 조합별 계약 테스트를 만들었습니다.',
    result:
      '운영·스테이징 로그인 시나리오 8건을 모두 통과하고 재발 방지 문서를 남겼습니다.',
    createdAt: '2026-10-08T18:00:00',
  }),
]

export function createParkSujinDetailTabs(
  studentId: string,
): CertificateDetailTabsResult {
  return {
    policyVersion: '2026.08.05-certificate-detail-tabs-v2',
    calculatedAt: CALCULATED_AT,
    studentId,
    tech: {
      status: 'READY',
      averageScore: 83,
      assessmentAverageTopPercent: assessmentRelative.topPercent,
      assessmentAveragePopulationSize: RELATIVE_MOCK_POPULATION_SIZE,
      categories: [
        ['ACHIEVEMENT', '백엔드 기초 (Java · Spring)', 92, 4],
        ['ACHIEVEMENT', 'DB / SQL', 84, 3],
        ['ACHIEVEMENT', '네트워크 · OS', 78, 2],
        ['ACHIEVEMENT', '알고리즘 · 자료구조', 71, 2],
        ['ACHIEVEMENT', '클라우드 · DevOps', 80, 1],
        ['ACHIEVEMENT', '트러블슈팅 · 디버깅', 88, 8],
        ['CS', '자료구조·운영체제', 58, 1],
        ['CS', '네트워크·데이터베이스', 80, 1],
      ].map(([assessmentType, label, score, attemptCount], index) => ({
        assessmentType: assessmentType as 'ACHIEVEMENT' | 'CS',
        label: String(label),
        score: Number(score),
        attemptCount: Number(attemptCount),
        topPercent: readyRelative(
          Number(score),
          'COHORT',
          String(label),
          120 + index,
        ).topPercent,
        populationSize: RELATIVE_MOCK_POPULATION_SIZE,
      })),
      assessments: parkSujinAssessments.map((assessment, index) => {
        const seed = 180 + index
        const relative = readyRelative(
          assessment.score,
          'COHORT',
          assessment.title,
          seed,
        )
        return {
          id: `park-sujin-assessment-${index + 1}`,
          ...assessment,
          cohortAverageScore: mockPopulationAverage(seed),
          relativeScore: relative.percentile,
          comparisonCount: RELATIVE_MOCK_POPULATION_SIZE,
        }
      }),
      certifications: [
        {
          name: 'PCCE — 파이썬 코딩 입문',
          score: null,
          grade: null,
          status: 'APPROVED',
          scheduledAt: null,
          submittedAt: null,
          issuedAt: '2026-06-12',
          registrationSource: '검증 URL',
        },
        {
          name: 'PCCP — 파이썬 코딩 전문',
          score: null,
          grade: null,
          status: 'PENDING',
          scheduledAt: null,
          submittedAt: '2026-08-14',
          issuedAt: null,
          registrationSource: '운영자 검토',
        },
        {
          name: 'PCSQL — SQL 개발자 1급',
          score: null,
          grade: null,
          status: 'SCHEDULED',
          scheduledAt: '2026-10-10',
          submittedAt: null,
          issuedAt: null,
          registrationSource: '자가 등록',
        },
      ],
      assignments: [
        ['W08', 'Spring REST API + JWT 인증', '실습', '완료'],
        ['W10', 'Kafka 이벤트 라우팅 미니 프로젝트', '과제', '완료'],
        ['W12', '트랜잭션 격리 수준 비교 분석', '리포트', '—'],
        ['W14', 'MSA 도서 추천 — 시스템 설계 발표', '실습', '완료'],
      ].map(([week, subjectName, type, submissionStatus], index) => ({
        id: `park-sujin-assignment-${index + 1}`,
        week,
        subjectName,
        type,
        reviewStatus: submissionStatus === '완료' ? 'APPROVED' : 'PENDING',
        submissionStatus,
      })),
      limitations: [],
    },
    problem: {
      status: 'READY',
      certifiedCount: 12,
      independentRate: 83,
      averageDays: 2.3,
      categories: [
        { label: 'DB / SQL', count: 4, percentage: 33 },
        { label: '배포 / 인프라', count: 3, percentage: 25 },
        { label: '성능 / 메모리', count: 2, percentage: 17 },
        { label: '네트워크 / API', count: 2, percentage: 17 },
        { label: '기타', count: 1, percentage: 8 },
      ],
      cases: parkSujinTroubleshootingCases,
      peerEvaluatorCount: 12,
      peerTags: [
        { label: '논리적설득', count: 10 },
        { label: '문제해결', count: 7 },
        { label: '리더십', count: 6 },
        { label: '코드리뷰', count: 5 },
        { label: '책임감', count: 4 },
        { label: '성장', count: 3 },
        { label: '팀워크', count: 2 },
      ],
      peerTagCases: [
        {
          tag: '논리적설득',
          caseId: 'pc1',
          caseTitle: 'PostgreSQL 데드락 — 결제 트랜잭션 격리 수준',
        },
        {
          tag: '문제해결',
          caseId: 'pc2',
          caseTitle: 'Kafka 컨슈머 ack 미반영 — 메시지 중복 발생',
        },
        {
          tag: '리더십',
          caseId: 'pc1',
          caseTitle: 'PostgreSQL 데드락 — 결제 트랜잭션 격리 수준',
        },
        {
          tag: '코드리뷰',
          caseId: 'pc3',
          caseTitle: 'N+1 쿼리 — 사용자 주문 목록 응답 7초',
        },
      ],
      limitations: [],
    },
    growth: {
      status: 'READY',
      growthTimelineStatus: 'NOT_READY',
      peerEvaluationCount: 12,
      peerReputation: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 4.8 },
        { key: '문제해결', score: 4.1 },
        { key: '기술기여', score: 4.6 },
      ],
      peerComments: [
        {
          comment: '디버깅 접근이 논리적. 격리 수준 문제를 팀에 잘 설명함.',
          submittedAt: '2026-05-10T18:00:00',
        },
        {
          comment: 'PR 코드 리뷰 코멘트가 따뜻하고 구체적. 함께 일하기 좋음.',
          submittedAt: '2026-05-08T18:00:00',
        },
        {
          comment: '막힌 부분을 끝까지 파고듦. Kafka ack 처리 사례가 인상적.',
          submittedAt: '2026-05-06T18:00:00',
        },
      ],
      mentorEvaluation: {
        averageScore: 4.3,
        submittedAt: '2026-10-16T18:00:00',
      },
      limitations: [],
    },
  }
}

const projectEvidenceCodes = ['PARK-SUJIN-PJ1', 'PARK-SUJIN-PJ2']

const alignmentAxes: AiAxisAlignmentAxis[] = scoreAxes.map((item) => ({
  key: item.key,
  status: 'READY',
  axisScore: item.score,
  evidenceScore: item.score,
  difference: 0,
  relation: 'ALIGNED',
  summary: `${item.key} ${item.score}점으로 박수진 mock 근거와 일치합니다.`,
  reason: [item.detail],
  evidence: item.evidence.map((evidence) => ({
    key: evidence.key,
    label: evidence.label,
    value: evidence.value ?? 0,
    unit: evidence.unit,
    weightPercent: evidence.weightPercent ?? 100,
    detail: evidence.detail,
    sourceType: 'PARK_SUJIN_MOCK',
  })),
}))

const ontologyNodes: OntologyNode[] = [
  ['me', '박수진', 50, 50, 'self'],
  ['be', '백엔드', 28, 30, 'subject'],
  ['db', 'DB', 70, 28, 'subject'],
  ['cloud', '클라우드', 74, 72, 'subject'],
  ['algo', '알고리즘', 26, 72, 'subject'],
  ['java', 'Java', 16, 18, 'skill'],
  ['spring', 'Spring', 40, 15, 'skill'],
  ['kafka', 'Kafka', 60, 15, 'skill'],
  ['sql', 'SQL', 86, 34, 'skill'],
  ['docker', 'Docker', 90, 58, 'skill'],
  ['aws', 'AWS', 82, 86, 'skill'],
  ['msa', 'MSA', 52, 33, 'method'],
  ['tx', '트랜잭션', 62, 44, 'method'],
  ['mart', 'Encore Mart', 44, 64, 'project'],
  ['llm', 'LLM 추천', 64, 62, 'project'],
  ['commerce', '커머스', 38, 86, 'domain'],
  ['reco', '추천', 78, 78, 'domain'],
].map(([id, label, x, y, kind]) => ({
  id: String(id),
  label: String(label),
  x: Number(x),
  y: Number(y),
  kind: kind as OntologyNode['kind'],
  weight: kind === 'self' ? 1 : 0.8,
  evidenceCount: 1,
  evidence: [`박수진 수강역량증명서 mock · ${String(label)}`],
  confidence: 'HIGH',
}))

const ontologyEdges: OntologyEdge[] = [
  ['me', 'be', 'LEARNED'],
  ['me', 'db', 'LEARNED'],
  ['me', 'cloud', 'LEARNED'],
  ['me', 'algo', 'LEARNED'],
  ['me', 'mart', 'PARTICIPATED'],
  ['me', 'llm', 'PARTICIPATED'],
  ['be', 'java', 'FOLLOWED_BY'],
  ['be', 'spring', 'FOLLOWED_BY'],
  ['be', 'kafka', 'FOLLOWED_BY'],
  ['be', 'msa', 'FOLLOWED_BY'],
  ['db', 'sql', 'FOLLOWED_BY'],
  ['db', 'tx', 'FOLLOWED_BY'],
  ['cloud', 'docker', 'FOLLOWED_BY'],
  ['cloud', 'aws', 'FOLLOWED_BY'],
  ['mart', 'msa', 'APPLIED'],
  ['mart', 'tx', 'APPLIED'],
  ['mart', 'kafka', 'USED'],
  ['mart', 'sql', 'USED'],
  ['mart', 'commerce', 'BELONGS_TO'],
  ['llm', 'sql', 'USED'],
  ['llm', 'reco', 'BELONGS_TO'],
].map(([source, target, type]) => ({
  source,
  target,
  type: type as OntologyEdge['type'],
  strength: 0.8,
  evidence: ['박수진 수강역량증명서 mock의 온톨로지 연결'],
}))

const parkSujinPrimaryRole: AiJobFitRoleCandidate = {
  rank: 1,
  role: '백엔드',
  jobLabel: '백엔드 개발자',
  roleLabel: '마이크로서비스·분산 시스템',
  workType: '체계적 문제해결형',
  fitScore: 88,
  confidence: 'HIGH',
  summary:
    '백엔드 기초, 트랜잭션 설계, Kafka 기반 문제해결 경험이 같은 방향을 가리킵니다.',
  evidence: ['기술 88점', '인증 프로젝트 2건', '인증 문제해결 12건'],
  fitEvidence: {
    projectRoles: [
      { label: '백엔드 리드', taskCount: 3, projectCount: 1 },
      { label: 'LLM 파이프라인 개발', taskCount: 3, projectCount: 1 },
    ],
    troubleshooting: {
      certifiedCaseCount: 12,
      independentCaseCount: 10,
      independentRate: 83,
      tags: [
        { label: 'DB / SQL', count: 4 },
        { label: '배포 / 인프라', count: 3 },
        { label: '성능 / 메모리', count: 2 },
      ],
    },
    highAchievements: [
      { category: '백엔드 기초 (Java · Spring)', score: 92 },
      { category: '트러블슈팅 · 디버깅', score: 88 },
      { category: 'DB / SQL', score: 84 },
    ],
  },
  evidenceCodes: projectEvidenceCodes,
  limitations: [],
}

export const PARK_SUJIN_AI_ANALYSIS: AiAnalysis = {
  policyVersion: '2026.08.05-park-sujin-mock-v1',
  jobFit: {
    policyVersion: '2026.08.05-job-fit-v2',
    status: 'READY',
    summary: '분산 시스템에 강한 백엔드 엔지니어 역량이 가장 선명합니다.',
    primaryRole: parkSujinPrimaryRole,
    roleCandidates: [parkSujinPrimaryRole],
    confidence: 'HIGH',
    limitations: [],
    sourcePolicies: ['PARK_SUJIN_CERTIFICATE_MOCK'],
    generatedBy: 'FALLBACK',
  },
  axisAlignment: {
    policyVersion: '2026.08.05-axis-alignment-v1',
    status: 'READY',
    summary: '박수진 mock의 종합 역량 축과 근거가 일치합니다.',
    thresholds: { alignedMaxDifference: 10, divergentMinDifference: 25 },
    axes: alignmentAxes,
    highlights: {
      alignedAxes: alignmentAxes.map((item) => item.key),
      divergentAxes: [],
      largestGapAxis: null,
    },
    limitations: [],
  },
  projects: {
    policyVersion: '2026.08.05-project-recruiter-analysis-v2',
    summary:
      '커머스 백엔드와 한국어 회의록 LLM 파이프라인 프로젝트 2건을 인증했습니다.',
    groups: [
      {
        key: 'CONTINUITY',
        label: '백엔드 문제해결의 연속성',
        summary: '트랜잭션·Kafka·성능 개선을 설계부터 검증까지 연결했습니다.',
        projectIds: ['pj1'],
        projectNames: ['Encore Mart — 마이크로서비스 백엔드'],
        evidenceCodes: ['PARK-SUJIN-PJ1'],
        confidence: 'HIGH',
        limitations: [],
      },
      {
        key: 'EXPANSION',
        label: 'LLM 파이프라인으로의 확장',
        summary: '백엔드 경험을 STT·요약·API 파이프라인으로 확장했습니다.',
        projectIds: ['pj2'],
        projectNames: ['한국어 회의록 요약 LLM 파이프라인'],
        evidenceCodes: ['PARK-SUJIN-PJ2'],
        confidence: 'HIGH',
        limitations: [],
      },
    ],
    status: 'READY',
    projects: [
      {
        projectId: 'pj1',
        order: 1,
        name: 'Encore Mart — 마이크로서비스 백엔드',
        period: { startedAt: '2026-07-06', endedAt: '2026-09-18' },
        certificationStatus: 'CERTIFIED',
        status: 'READY',
        membershipRole: 'MEMBER',
        teamContext: {
          domain: '커머스 · 주문/결제',
          scope: '팀 프로젝트',
          techStacks: [
            'Java 17',
            'Spring Boot',
            'Kafka',
            'PostgreSQL',
            'Docker',
          ],
          outcomes: [
            '결제 실패 retry 95% 안정화',
            'API 응답 320ms에서 145ms로 단축',
          ],
        },
        personalEvidence: {
          tasks: [
            '주문·결제 도메인 분리',
            '트랜잭션 격리 수준 정합',
            'Kafka 이벤트 라우팅',
          ],
          workCategories: ['백엔드 리드'],
          technologies: [
            'Java 17',
            'Spring Boot',
            'Kafka',
            'PostgreSQL',
            'Docker',
          ],
          peerObservations: [
            'Encore Mart 도메인 분리에서 백엔드 4인을 가이드함',
          ],
          troubleshootingCases: [
            'PostgreSQL 데드락',
            'Kafka 메시지 중복',
            'N+1 쿼리',
          ],
          artifacts: ['프로젝트 v0.3 산출물', '강사 코멘트 3건'],
        },
        analysis: '주문·결제 도메인의 안정성과 응답 성능을 함께 개선했습니다.',
        recruiterInsight: {
          role: '백엔드 리드',
          challenge: '결제 데드락과 Kafka 메시지 중복',
          action:
            '격리 수준과 ack 처리 방식을 재설계하고 같은 조건으로 재검증했습니다.',
          outcome:
            '실패율 0.2%, retry 95% 안정화, API 응답 145ms를 달성했습니다.',
          strength: '분산 시스템 문제를 수치로 검증하는 실행력',
          summary:
            '트랜잭션·이벤트·성능 문제를 연결해 해결한 백엔드 경험입니다.',
          evidenceCodes: ['PARK-SUJIN-PJ1'],
          generatedBy: 'FALLBACK',
        },
        evidenceCodes: ['PARK-SUJIN-PJ1'],
        limitations: [],
        generatedBy: 'FALLBACK',
      },
      {
        projectId: 'pj2',
        order: 2,
        name: '한국어 회의록 요약 LLM 파이프라인',
        period: { startedAt: '2026-05-04', endedAt: '2026-06-12' },
        certificationStatus: 'CERTIFIED',
        status: 'READY',
        membershipRole: 'OWNER',
        teamContext: {
          domain: '추천 · LLM 파이프라인',
          scope: '개인 프로젝트',
          techStacks: ['Python', 'Whisper', 'GPT-4', 'KoBART', 'FastAPI'],
          outcomes: [
            'ROUGE-L 0.873',
            '회의록 35건 검증',
            '평균 처리 시간 12초',
          ],
        },
        personalEvidence: {
          tasks: [
            'Whisper STT 구성',
            '한국어 회의록 요약 자동화',
            'FastAPI 제공',
          ],
          workCategories: ['LLM 파이프라인 개발'],
          technologies: ['Python', 'Whisper', 'GPT-4', 'KoBART', 'FastAPI'],
          peerObservations: [],
          troubleshootingCases: [],
          artifacts: ['회의록 35건 검증 결과'],
        },
        analysis: 'STT부터 요약 API까지 개인이 전체 파이프라인을 구현했습니다.',
        recruiterInsight: {
          role: 'LLM 파이프라인 개발',
          challenge: '한국어 회의록의 자동 전사와 요약 품질 검증',
          action:
            'Whisper, GPT-4, KoBART를 연결하고 회의록 35건으로 검증했습니다.',
          outcome: 'ROUGE-L 0.873과 평균 처리 시간 12초를 기록했습니다.',
          strength: '모델 활용을 서비스 가능한 파이프라인으로 연결하는 역량',
          summary: 'LLM 기능을 API와 검증 지표까지 완결한 개인 프로젝트입니다.',
          evidenceCodes: ['PARK-SUJIN-PJ2'],
          generatedBy: 'FALLBACK',
        },
        evidenceCodes: ['PARK-SUJIN-PJ2'],
        limitations: [],
        generatedBy: 'FALLBACK',
      },
    ],
    overview: {
      experienceScope: '커머스 백엔드부터 LLM 파이프라인까지',
      workingStyle: '수치 검증과 문서화를 연결하는 체계적 문제해결형',
      overall: '분산 시스템 백엔드와 LLM 서비스 구현을 함께 경험했습니다.',
    },
    recruiterSummary: {
      headline: '분산 시스템 문제를 수치로 검증하는 백엔드 엔지니어',
      summary: '인증 프로젝트 2건에서 개인 역할과 검증 결과가 확인됩니다.',
      strengths: ['트랜잭션·Kafka 설계', '성능 개선', 'LLM 파이프라인 구현'],
      evidenceCodes: projectEvidenceCodes,
      generatedBy: 'FALLBACK',
    },
    projectCount: 2,
    period: { startedAt: '2026-05-04', endedAt: '2026-09-18' },
    evidenceCodes: projectEvidenceCodes,
    confidence: 'HIGH',
    limitations: [],
    generatedBy: 'FALLBACK',
  },
  troubleshooting: {
    policyVersion: '2026.08.05-troubleshooting-analysis-v2',
    status: 'READY',
    summary:
      '개인 프로파일링, 수치 검증, 문서화로 문제를 해결하고 팀에 전파합니다.',
    certifiedCaseCount: 12,
    independentCaseCount: 10,
    independentRate: 83,
    period: { startedAt: '2026-08-12', endedAt: '2026-10-08' },
    axes: [
      {
        key: 'DATA_PROCESSING',
        label: '데이터·트랜잭션 처리',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 4,
        evidence: ['PostgreSQL 데드락·인덱스·캐시·마이그레이션 해결'],
        evidenceCodes: ['pc1', 'pc7', 'pc8', 'pc9'],
        limitations: [],
      },
      {
        key: 'MODEL_TUNING',
        label: '장애 대응·디버깅',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 5,
        evidence: ['API·LLM·성능 문제 5건 해결'],
        evidenceCodes: ['pc3', 'pc4', 'pc5', 'pc6', 'pc12'],
        limitations: [],
      },
      {
        key: 'INFRA_DEPLOYMENT',
        label: '인프라·배포',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 3,
        evidence: ['Kafka·Docker·AWS 배포 문제 3건 해결'],
        evidenceCodes: ['pc2', 'pc10', 'pc11'],
        limitations: [],
      },
    ],
    steps: [
      {
        key: 'FRAME',
        label: '문제 구조화',
        summary: '재현 조건과 실패율을 먼저 고정합니다.',
      },
      {
        key: 'APPLY',
        label: '해결 적용',
        summary: '원인을 분리한 뒤 설계와 설정을 수정합니다.',
      },
      {
        key: 'VERIFY',
        label: '결과 검증',
        summary: '같은 조건에서 수치와 재발 여부를 확인합니다.',
      },
    ],
    groups: [
      {
        label: 'DB / SQL',
        certifiedCaseCount: 4,
        solutionSummary: '격리 수준과 조회 구조를 재설계했습니다.',
        tags: [
          { label: 'PostgreSQL', count: 3 },
          { label: 'Redis', count: 1 },
        ],
        caseIds: ['pc1', 'pc7', 'pc8', 'pc9'],
        caseTitles: [
          'PostgreSQL 데드락 — 결제 트랜잭션 격리 수준',
          'PostgreSQL 인덱스 — 주문 검색 지연',
          'Redis 캐시 키 — 사용자별 장바구니 충돌',
          'Flyway 마이그레이션 — 컬럼 제약조건 충돌',
        ],
        evidence: ['실패율 8% → 0.2%', '검색 2.8초 → 190ms'],
      },
      {
        label: '배포 / 인프라',
        certifiedCaseCount: 3,
        solutionSummary: '배포 전 검증과 준비 상태 확인 절차를 자동화했습니다.',
        tags: [
          { label: 'Kafka', count: 1 },
          { label: 'Docker', count: 1 },
          { label: 'AWS', count: 1 },
        ],
        caseIds: ['pc2', 'pc10', 'pc11'],
        caseTitles: [
          'Kafka 컨슈머 ack 미반영 — 메시지 중복 발생',
          'Docker 환경변수 — 프로필 설정 누락',
          'AWS 헬스 체크 — 롤링 배포 중 502 응답',
        ],
        evidence: ['결제 실패 retry 95% 안정화', '무중단 배포 3회'],
      },
      {
        label: '성능 / 메모리',
        certifiedCaseCount: 2,
        solutionSummary: '조회 구조와 LLM 배치 처리를 개선했습니다.',
        tags: [
          { label: 'N+1', count: 1 },
          { label: 'KoBART', count: 1 },
        ],
        caseIds: ['pc3', 'pc6'],
        caseTitles: [
          'N+1 쿼리 — 사용자 주문 목록 응답 7초',
          'KoBART 요약 — GPU 메모리 부족',
        ],
        evidence: ['7초 → 380ms', '60분 회의록 처리 완료'],
      },
      {
        label: '네트워크 / API',
        certifiedCaseCount: 2,
        solutionSummary: 'API 계약과 도메인 조합별 검증을 자동화했습니다.',
        tags: [
          { label: 'RAG API', count: 1 },
          { label: 'OAuth', count: 1 },
        ],
        caseIds: ['pc4', 'pc12'],
        caseTitles: [
          'RAG 검색 API — 임베딩 차원 불일치',
          'OAuth 콜백 — CORS 사전 요청 실패',
        ],
        evidence: ['검증 질문 35건 통과', '로그인 시나리오 8건 통과'],
      },
      {
        label: '기타',
        certifiedCaseCount: 1,
        solutionSummary: '오디오 입력을 표준 형식으로 정규화했습니다.',
        tags: [{ label: 'Whisper', count: 1 }],
        caseIds: ['pc5'],
        caseTitles: ['Whisper 입력 — 오디오 샘플링 레이트 불일치'],
        evidence: ['실패 파일 12건 전사 완료'],
      },
    ],
    growth: {
      status: 'READY',
      summary:
        '단일 모듈 디버깅에서 파이프라인·시스템 범위로 해결 영역을 확장했습니다.',
      newDomains: ['커머스', '추천'],
      repeatedDomains: ['주문·결제'],
      newTechnologies: ['Kafka', 'Whisper', 'KoBART'],
      repeatedTechnologies: ['Spring', 'PostgreSQL'],
      confidence: 'MEDIUM',
    },
    limitations: [],
  },
  sentiment: {
    policyVersion: '2026.08.05-park-sujin-sentiment-v1',
    status: 'READY',
    noteCount: 11,
    phases: [
      {
        phase: 'early',
        label: '초반',
        period: { startedAt: '2026-04-28', endedAt: '2026-06-27' },
        noteCount: 3,
        summary: '학습 불안과 진로 고민 속에서 적응을 시작했습니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'mid',
        label: '중반',
        period: { startedAt: '2026-06-28', endedAt: '2026-08-27' },
        noteCount: 3,
        summary: 'SQL 난관과 스트레스를 멘토링으로 조정했습니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'late',
        label: '후반',
        period: { startedAt: '2026-08-28', endedAt: '2026-10-26' },
        noteCount: 5,
        summary: '자기효능감과 성취감이 빠르게 높아졌습니다.',
        confidence: 'HIGH',
      },
    ],
    bubbles: [
      ['학습 불안', 16, 36, 13, 'early', 'CONCERN'],
      ['적응', 24, 58, 11, 'early', 'NEUTRAL'],
      ['진로 고민', 11, 18, 8, 'early', 'CONCERN'],
      ['SQL 난관', 42, 28, 12, 'mid', 'CONCERN'],
      ['스트레스', 47, 54, 14, 'mid', 'CONCERN'],
      ['멘토링', 35, 44, 10, 'mid', 'POSITIVE'],
      ['자기효능감', 66, 28, 13, 'late', 'POSITIVE'],
      ['성취감', 73, 50, 15, 'late', 'POSITIVE'],
      ['코드리뷰 1위', 84, 36, 12, 'late', 'POSITIVE'],
      ['자신감', 88, 60, 10, 'late', 'POSITIVE'],
      ['성장 회고', 60, 64, 10, 'late', 'POSITIVE'],
    ].map(([label, x, y, r, phase, polarity], index) => ({
      label: String(label),
      x: Number(x),
      y: Number(y),
      r: Number(r),
      phase: phase as 'early' | 'mid' | 'late',
      polarity: polarity as 'CONCERN' | 'NEUTRAL' | 'POSITIVE',
      weight: Number(r) / 15,
      evidenceCount: 1,
      evidence: [
        {
          code: `PARK-SUJIN-SENTIMENT-${index + 1}`,
          at: CALCULATED_AT,
          excerpt: String(label),
        },
      ],
    })),
    trend: 'V자 변동형: 위기(4주차) → 멘토링 → 급반등',
    confidence: 'HIGH',
    limitations: [],
  },
  ontology: {
    policyVersion: '2026.08.05-park-sujin-ontology-v1',
    status: 'READY',
    summary:
      '박수진의 백엔드·DB→SQL·클라우드 학습과 Encore Mart·LLM 추천 프로젝트 연결을 보여줍니다.',
    counts: {
      self: 1,
      subject: 4,
      skill: 6,
      method: 2,
      project: 2,
      domain: 2,
    },
    omittedCounts: {},
    nodes: ontologyNodes,
    edges: ontologyEdges,
    limitations: [],
  },
}
