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

const CALCULATED_AT = '2026-08-10'
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

const assessmentRelative = readyRelative(98, 'COHORT', '시험 평균 98점', 82)

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
    source: '수강역량증명서 실측 기반 mock',
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
    score: 98.6,
    peerScore: 92,
    mentorScore: 96,
    instructorScore: 98,
    managerScore: 94,
    detail: '역량 점검 평균 98.0 × 0.7 + 인증 프로젝트 1/1 × 0.3',
    evidenceLabel: '기술 역량',
    evidenceDetail: '1차 100점 · 2차 96점 · 인증 프로젝트 1건',
  }),
  axis({
    key: '소통·협업·팀워크',
    score: 90,
    peerScore: 92,
    mentorScore: 90,
    instructorScore: 88,
    managerScore: 88,
    detail: '멘토링 3/3 참석 · 멘토링 팀 4인 · Q&A 질문 3건 채택',
    evidenceLabel: '팀워크 역량',
    evidenceDetail: '멘토링 팀 4인 · SQL 스터디 2회 운영 · Q&A 질문 3건 전부 채택',
  }),
  axis({
    key: '문제해결',
    score: 80,
    peerScore: 82,
    mentorScore: 80,
    instructorScore: 80,
    managerScore: 78,
    detail: '인증 3/5 사례 · 독립 해결 1건 · 평균 1.3일',
    evidenceLabel: '문제해결 역량',
    evidenceDetail: 'pandas merge · 데이터 누수 · Git rebase 인증 3건',
  }),
  axis({
    key: '책임감',
    score: 100,
    peerScore: 96,
    mentorScore: 96,
    instructorScore: 98,
    managerScore: 96,
    detail: '출석률 100 × 0.6 + 학습 기록 8/8주 × 0.4',
    evidenceLabel: '책임감 역량',
    evidenceDetail: '출석 인정 6/6일 · 결석 0 · 8주 연속 학습 기록 제출',
  }),
  axis({
    key: '학습지속성',
    score: 100,
    peerScore: null,
    detail:
      '출석 70점 + 블로그 30점 + 과제·스터디·멘토링 가산점 8.7점 = 108.7점 → 100점(상한)',
    evidenceLabel: '성장 역량',
    evidenceDetail: '8주 연속 학습 기록 · 멘토링 전회 참석',
    evidence: [
      {
        // HRD-Net 실측(2026-08-10) — 기록 6일 · 출석 3 · 지각 3 · 결석 0, 인정률 100%.
        key: 'attendance',
        label: '출석률',
        value: 100,
        unit: '%',
        numerator: 6,
        denominator: 6,
        weightPercent: 70,
        appliedScore: 70,
        detail: '6일 중 지각 3 · 결석 0 · 70점 반영',
      },
      {
        key: 'blog',
        label: '블로그 제출률',
        value: 100,
        unit: '%',
        numerator: 8,
        denominator: 8,
        weightPercent: 30,
        appliedScore: 30,
        detail: '8/8주 · 30점 반영',
      },
      {
        // 10주차 최종 산출물은 아직 진행 중 — 9/10 제출. 가산점은 제출률 × 3점.
        key: 'assignment',
        label: '과제 제출률',
        value: 90,
        unit: '%',
        numerator: 9,
        denominator: 10,
        weightPercent: null,
        appliedScore: 2.7,
        detail: '9/10건 · 90% · +2.7점',
      },
      {
        key: 'study',
        label: '스터디 참여율',
        value: 100,
        unit: '%',
        numerator: 3,
        denominator: 3,
        weightPercent: null,
        appliedScore: 3,
        detail: '3/3회 · 100% · +3점',
      },
      {
        key: 'mentoring',
        label: '멘토링 참석률',
        value: 100,
        unit: '%',
        numerator: 3,
        denominator: 3,
        weightPercent: null,
        appliedScore: 3,
        detail: '3/3회 · 100% · +3점',
      },
    ],
  }),
  axis({
    key: '성취도 평가',
    score: 98,
    peerScore: null,
    detail: '역량 점검 2회 평균 98점 · 1차 100 / 2차 96',
    evidenceLabel: '시험 평균',
    evidenceDetail: '채점 완료된 역량 점검 2회의 평균',
    relative: assessmentRelative,
    evidence: [
      {
        key: 'achievementAssessment',
        label: '성취도 평가 전체 평균',
        value: 98,
        unit: '점',
        numerator: 2,
        denominator: 2,
        weightPercent: 100,
        appliedScore: 98,
        detail: '1차 Python 100점 · 2차 SQL 96점',
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
      studentName: '황수빈',
      courseName: 'SK네트웍스 Family AI 캠프',
      cohortName: '34기',
      cohortStartedAt: '2026-06-16',
      cohortEndedAt: '2026-12-08',
    },
    status: 'READY',
    // 6축 평균 = (98.6 + 90 + 80 + 100 + 100 + 98) / 6 = 94.4
    overallScore: 94.4,
    grade: 'A',
    overallRelative: readyRelative(94.4, 'ALL_STUDENTS', '종합점수 94.4점', 97),
    axes: scoreAxes,
    metrics: [
      {
        key: 'attendance',
        label: '출석률',
        value: 100,
        maximum: 100,
        unit: '%',
        status: 'READY',
        detail: '기록 6일 · 출석 3 · 지각 3 · 결석 0',
      },
      {
        key: 'assessment',
        label: '시험 평균',
        value: 98,
        maximum: 100,
        unit: '점',
        status: 'READY',
        detail: `역량 점검 2회 · 100점 / 96점 · 상위 ${assessmentRelative.topPercent}%`,
      },
      {
        key: 'blog',
        label: '블로그 제출률',
        value: 100,
        maximum: 100,
        unit: '%',
        status: 'READY',
        detail: '8 / 8주 제출 완료',
      },
      {
        key: 'certifiedProject',
        label: '인증 프로젝트',
        value: 1,
        maximum: 1,
        unit: '건',
        status: 'READY',
        detail: '강사 인증 완료 1건',
      },
      {
        key: 'certifiedTroubleshooting',
        label: '인증 문제해결',
        value: 3,
        maximum: null,
        unit: '건',
        status: 'READY',
        detail: 'STAR 구조 인증 사례 3건 · 독립 해결 1건',
      },
      {
        key: 'certifiedCertificate',
        label: '승인 자격증',
        value: 2,
        maximum: null,
        unit: '건',
        status: 'READY',
        detail: 'SQLD · PCCE 승인 2건',
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
        detail: '멘토링 팀 4인 동료평 평균',
      },
      {
        key: '소통',
        score: 4.5,
        status: 'READY',
        detail: 'Q&A 질문 3건 전부 답변 채택',
      },
      {
        key: '책임감',
        score: 4.8,
        status: 'READY',
        detail: '과제 9/10 제출 · 결석 0',
      },
      {
        key: '문제해결',
        score: 4.1,
        status: 'READY',
        detail: '트러블슈팅 인증 3건',
      },
      {
        key: '기술기여',
        score: 4.6,
        status: 'READY',
        detail: '역량 점검 평균 98점 · 인증 프로젝트 1건',
      },
    ],
    projectNavigation: {
      issuesProjectId: 'pj1',
      peerEvaluationProjectId: 'pj1',
    },
    // 인증 완료 프로젝트 1건(채용 공고 스택 지도)의 도메인 — 실측.
    domainExperience: [
      { label: '데이터 · 채용 시장 분석', projectCount: 1, percentage: 100 },
    ],
    warnings: [],
  }
}

// 실측 — 34기 역량 점검 응시 이력. 3차(데이터 분석·머신러닝)는 08-14 예정이라 미반영.
const parkSujinAssessments = [
  {
    title: '1차 역량 점검 — Python 기초와 자료구조',
    assessmentType: 'ACHIEVEMENT' as const,
    category: 'Python',
    score: 100,
    submittedAt: '2026-07-03T15:40:00',
  },
  {
    title: '2차 역량 점검 — SQL과 관계형 데이터베이스',
    assessmentType: 'ACHIEVEMENT' as const,
    category: 'SQL',
    score: 96,
    submittedAt: '2026-07-24T15:40:00',
  },
]

const parkSujinCategoryAverage =
  parkSujinAssessments.reduce((sum, assessment) => sum + assessment.score, 0) /
  parkSujinAssessments.length

type TroubleshootingCaseInput = Omit<
  CertificateProblemDetail['cases'][number],
  'summary'
>

function verifiedTroubleshootingCase(
  input: TroubleshootingCaseInput,
): CertificateProblemDetail['cases'][number] {
  const expandOriginal = (
    section: '문제 상황' | '해결 과정' | '결과',
    summary: string,
  ) => {
    const lines: Record<typeof section, string[]> = {
      '문제 상황': [
        `발견 당시 증상은 "${summary}"로 정리했습니다.`,
        `영향 범위를 확인하기 위해 ${input.category} 관련 기능과 로그를 함께 점검했습니다.`,
        '일시적인 현상과 구조적인 문제를 구분하려고 동일 조건의 재현 절차를 만들었습니다.',
        '재현 과정에서는 입력값, 실행 순서, 요청량, 실행 환경을 고정했습니다.',
        '오류 로그와 지표를 시간 순서로 비교해 최초 이상 시점을 확인했습니다.',
        '사용자 화면에서 보이는 증상과 서버 내부에서 발생한 원인을 분리해 기록했습니다.',
        `최종적으로 "${input.title}"을 해결해야 할 핵심 문제로 확정했습니다.`,
      ],
      '해결 과정': [
        `핵심 해결 방향은 "${summary}"입니다.`,
        '변경 전에 정상 동작 기준과 실패 재현 기준을 먼저 문서로 고정했습니다.',
        '영향 범위를 작게 유지하도록 원인과 직접 관련된 설정과 코드부터 수정했습니다.',
        '수정 과정에서 기존 기능의 동작이 달라지지 않도록 회귀 조건을 함께 만들었습니다.',
        '같은 입력과 부하 조건으로 변경 전후의 로그와 지표를 반복 비교했습니다.',
        '예외 상황과 재시작 시나리오도 추가해 일회성 성공이 아닌지 확인했습니다.',
        '적용한 판단 기준과 재현 방법을 팀원이 다시 실행할 수 있도록 정리했습니다.',
      ],
      결과: [
        `검증 결과는 "${summary}"로 확인했습니다.`,
        '최초 문제를 재현했던 동일 조건에서 오류가 다시 발생하지 않는지 확인했습니다.',
        '정상 시나리오와 실패 시나리오를 모두 실행해 부작용 여부를 점검했습니다.',
        '수정 전후의 수치와 로그를 비교해 개선 효과가 실제로 유지되는지 확인했습니다.',
        '연속 실행과 재시작 상황에서도 같은 결과가 나오는지 반복 검증했습니다.',
        '재발을 빠르게 감지할 수 있도록 모니터링 기준과 회귀 테스트를 남겼습니다.',
        '검증 과정과 결과 근거를 트러블슈팅 기록에 첨부하고 강사 인증을 완료했습니다.',
      ],
    }

    return lines[section].join('\n')
  }

  const summarize = (
    section: '문제 상황' | '해결 과정' | '결과',
    primary: string,
  ) => {
    const supportingFact = {
      '문제 상황': `${input.category} 관련 로그와 실행 조건을 비교해 재현 범위와 최초 이상 시점을 확인했습니다.`,
      '해결 과정':
        '정상·실패 기준을 고정한 뒤 같은 조건에서 변경 전후 로그와 지표를 비교했습니다.',
      결과: '동일 조건의 회귀·반복 테스트로 재발과 부작용이 없는지 확인했습니다.',
    }[section]

    return `${primary} ${supportingFact}`
  }

  return {
    ...input,
    situation: expandOriginal('문제 상황', input.situation),
    resolution: expandOriginal('해결 과정', input.resolution),
    result: expandOriginal('결과', input.result),
    summary: {
      policyVersion: '2026.08.05-park-sujin-troubleshooting-summary-v1',
      situation: summarize('문제 상황', input.situation),
      resolution: summarize('해결 과정', input.resolution),
      result: summarize('결과', input.result),
      generatedBy: 'AI',
    },
  }
}

// 실측 — 트러블슈팅 강사 인증 3건(전체 5건 중 환경 2건은 작성 중이라 제외).
const parkSujinTroubleshootingCases: CertificateProblemDetail['cases'] = [
  verifiedTroubleshootingCase({
    id: 'pc1',
    title: 'pandas merge 후 행 수가 3배로 늘어난 문제',
    category: '데이터',
    independent: true,
    days: 1,
    situation:
      '주문·회원 테이블 merge 후 집계값이 원본의 3배로 부풀어 분석 결과를 신뢰할 수 없었습니다.',
    resolution:
      '조인 키 중복을 확인해 회원 테이블을 키 기준으로 유일화한 뒤 validate 옵션으로 재발을 차단했습니다.',
    result:
      '행 수가 원본과 일치했고 merge 전 키 유일성 검증을 분석 템플릿에 추가했습니다.',
    createdAt: '2026-08-10T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc2',
    title: 'StandardScaler를 전체 데이터에 fit 해서 성능이 부풀려진 문제',
    category: '머신러닝',
    independent: false,
    days: 2,
    situation:
      '검증 점수가 비정상적으로 높아 확인해 보니 스케일러를 train·test 전체에 fit 한 데이터 누수였습니다.',
    resolution:
      '멘토 피드백을 받아 Pipeline 으로 스케일링을 교차검증 안쪽으로 옮기고 전후 점수를 비교했습니다.',
    result:
      '부풀려진 점수를 걷어낸 실제 성능을 확인했고 전처리는 Pipeline 에 넣는 규칙을 세웠습니다.',
    createdAt: '2026-08-10T18:00:00',
  }),
  verifiedTroubleshootingCase({
    id: 'pc3',
    title: 'Git rebase 중 충돌을 잘못 해결해 동료 커밋을 날린 문제',
    category: '협업',
    independent: false,
    days: 1,
    situation:
      'rebase 충돌을 내 코드만 남기고 해결해 동료가 추가한 함수 두 개가 지워진 채 push 됐습니다.',
    resolution:
      'git reflog 로 rebase 이전 커밋을 찾아 백업 브랜치를 만들고 지워진 파일을 복구했습니다.',
    result:
      '동료 커밋을 모두 복구했고 rebase 전 백업 브랜치 생성을 팀 규칙으로 만들었습니다.',
    createdAt: '2026-08-10T18:00:00',
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
      averageScore: parkSujinCategoryAverage,
      assessmentAverageTopPercent: assessmentRelative.topPercent,
      assessmentAveragePopulationSize: RELATIVE_MOCK_POPULATION_SIZE,
      categories: parkSujinAssessments.map((assessment, index) => ({
        assessmentType: assessment.assessmentType,
        label: assessment.category,
        score: assessment.score,
        attemptCount: 1,
        topPercent: readyRelative(
          assessment.score,
          'COHORT',
          assessment.category,
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
      // 실측 — 기록실 자격증 2건, 매니저 승인 완료(2026-08-10).
      certifications: [
        {
          name: 'SQLD 개발자 자격',
          score: null,
          grade: '최종합격',
          status: 'APPROVED',
          scheduledAt: null,
          submittedAt: '2026-08-10',
          issuedAt: '2026-08-10',
          registrationSource: '기록실 제출 · 매니저 승인',
        },
        {
          name: 'PCCE 파이썬 코딩 실력 인증 3급',
          score: null,
          grade: '3급',
          status: 'APPROVED',
          scheduledAt: null,
          submittedAt: '2026-08-10',
          issuedAt: '2026-08-10',
          registrationSource: '기록실 제출 · 매니저 승인',
        },
      ],
      // 실측 — 과제 10건, 9건 제출(10주차 최종 산출물만 진행 중).
      assignments: [
        ['W01', '개발 환경 구축과 Git 기초', '실습', '완료'],
        ['W02', 'Python 자료구조로 로그 집계하기', '실습', '완료'],
        ['W03', '함수와 예외 처리로 CSV 검증기 만들기', '실습', '완료'],
        ['W04', 'SQL 기초 쿼리 20제', '실습', '완료'],
        ['W05', '실행 계획 읽고 쿼리 튜닝하기', '실습', '완료'],
        ['W06', 'pandas 로 공공데이터 전처리', '실습', '완료'],
        ['W07', '첫 분류 모델 만들고 평가하기', '실습', '완료'],
        ['W08', '1차 미니 프로젝트 중간 점검 자료', '과제', '완료'],
        ['W09', '교차검증과 하이퍼파라미터 탐색', '실습', '완료'],
        ['W10', '1차 미니 프로젝트 최종 산출물', '과제', '—'],
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
      // 실측 — 인증 3건(pandas merge · StandardScaler · Git rebase), 독립 해결 1건, 평균 1.3일.
      certifiedCount: 3,
      independentRate: 33,
      averageDays: 1.3,
      categories: [
        { label: '데이터', count: 1, percentage: 34 },
        { label: '머신러닝', count: 1, percentage: 33 },
        { label: '협업', count: 1, percentage: 33 },
      ],
      cases: parkSujinTroubleshootingCases,
      peerEvaluatorCount: 3,
      peerTags: [
        { label: '문제해결', count: 3 },
        { label: '기록공유', count: 3 },
        { label: '책임감', count: 2 },
        { label: '팀워크', count: 2 },
      ],
      peerTagCases: [
        {
          tag: '문제해결',
          caseId: 'pc1',
          caseTitle: 'pandas merge 후 행 수가 3배로 늘어난 문제',
        },
        {
          tag: '기록공유',
          caseId: 'pc2',
          caseTitle: 'StandardScaler를 전체 데이터에 fit 해서 성능이 부풀려진 문제',
        },
        {
          tag: '팀워크',
          caseId: 'pc3',
          caseTitle: 'Git rebase 중 충돌을 잘못 해결해 동료 커밋을 날린 문제',
        },
      ],
      limitations: [],
    },
    growth: {
      status: 'READY',
      growthTimelineStatus: 'NOT_READY',
      peerEvaluationCount: 3,
      peerReputation: [
        { key: '협업', score: 4.5 },
        { key: '소통', score: 4.5 },
        { key: '책임감', score: 4.8 },
        { key: '문제해결', score: 4.1 },
        { key: '기술기여', score: 4.6 },
      ],
      peerComments: [
        {
          comment: 'merge 행 폭증 원인을 키 중복까지 파고들어 팀 템플릿으로 만들어 줌.',
          submittedAt: '2026-08-08T18:00:00',
        },
        {
          comment: '스터디에서 실행 계획 읽는 법을 차근차근 설명해 줘서 이해가 잘 됐음.',
          submittedAt: '2026-08-05T18:00:00',
        },
        {
          comment: '날린 커밋을 복구하고 rebase 백업 규칙까지 정리해 공유한 게 인상적.',
          submittedAt: '2026-08-01T18:00:00',
        },
      ],
      mentorEvaluation: {
        averageScore: 4.3,
        submittedAt: '2026-08-08T18:00:00',
      },
      limitations: [],
    },
  }
}

const projectEvidenceCodes = ['HWANG-SUBIN-PJ1']

const alignmentAxes: AiAxisAlignmentAxis[] = scoreAxes.map((item) => ({
  key: item.key,
  status: 'READY',
  axisScore: item.score,
  evidenceScore: item.score,
  difference: 0,
  relation: 'ALIGNED',
  summary: `${item.key} ${item.score}점으로 실측 근거와 일치합니다.`,
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

// 실측 — 34기 학습 이력(퀴즈·과제·블로그)과 인증 프로젝트에서 뽑은 그래프.
const ontologyNodes: OntologyNode[] = [
  ['me', '황수빈', 50, 50, 'self'],
  ['py', 'Python', 28, 30, 'subject'],
  ['db', 'SQL·DB', 70, 28, 'subject'],
  ['da', '데이터 분석', 74, 72, 'subject'],
  ['ml', '머신러닝', 26, 72, 'subject'],
  ['pandas', 'pandas', 16, 18, 'skill'],
  ['bs', 'BeautifulSoup', 40, 15, 'skill'],
  ['pg', 'PostgreSQL', 86, 34, 'skill'],
  ['st', 'Streamlit', 90, 58, 'skill'],
  ['sk', 'scikit-learn', 12, 60, 'skill'],
  ['git', 'Git', 60, 15, 'skill'],
  ['prep', '전처리·정규화', 52, 33, 'method'],
  ['cv', '교차검증', 38, 62, 'method'],
  ['map', '채용 스택 지도', 64, 62, 'project'],
  ['jobmkt', '채용·시장 분석', 78, 78, 'domain'],
].map(([id, label, x, y, kind]) => ({
  id: String(id),
  label: String(label),
  x: Number(x),
  y: Number(y),
  kind: kind as OntologyNode['kind'],
  weight: kind === 'self' ? 1 : 0.8,
  evidenceCount: 1,
  evidence: [`학습 이력 실측 · ${String(label)}`],
  confidence: 'HIGH',
}))

const ontologyEdges: OntologyEdge[] = [
  ['me', 'py', 'LEARNED'],
  ['me', 'db', 'LEARNED'],
  ['me', 'da', 'LEARNED'],
  ['me', 'ml', 'LEARNED'],
  ['me', 'map', 'PARTICIPATED'],
  ['py', 'pandas', 'FOLLOWED_BY'],
  ['py', 'bs', 'FOLLOWED_BY'],
  ['py', 'git', 'FOLLOWED_BY'],
  ['db', 'pg', 'FOLLOWED_BY'],
  ['da', 'st', 'FOLLOWED_BY'],
  ['da', 'prep', 'FOLLOWED_BY'],
  ['ml', 'sk', 'FOLLOWED_BY'],
  ['ml', 'cv', 'FOLLOWED_BY'],
  ['map', 'prep', 'APPLIED'],
  ['map', 'pandas', 'USED'],
  ['map', 'bs', 'USED'],
  ['map', 'pg', 'USED'],
  ['map', 'st', 'USED'],
  ['map', 'jobmkt', 'BELONGS_TO'],
].map(([source, target, type]) => ({
  source,
  target,
  type: type as OntologyEdge['type'],
  strength: 0.8,
  evidence: ['학습 이력과 인증 프로젝트에서 확인된 연결'],
}))

// 직무 적합도 — 실측 근거(역량 점검 2회 · 인증 프로젝트 1건 · 인증 문제해결 3건) 기반.
const parkSujinPrimaryRole: AiJobFitRoleCandidate = {
  rank: 1,
  role: '데이터 분석',
  jobLabel: '데이터 분석가',
  workType: '수집부터 검증까지 잇는 완결형',
  roleLabel: '채용·시장 데이터 분석',
  fitScore: 88,
  confidence: 'HIGH',
  summary:
    '채용 공고 4,180건을 직접 수집·정규화해 직무별 스택 지도를 만든 인증 프로젝트가 분석 직무와 정확히 겹칩니다.',
  evidence: ['역량 점검 평균 98점', '인증 프로젝트 1건', '인증 문제해결 3건'],
  fitEvidence: {
    projectRoles: [
      { label: '수집·정규화 설계', taskCount: 4, projectCount: 1 },
      { label: '분석·대시보드', taskCount: 3, projectCount: 1 },
    ],
    troubleshooting: {
      certifiedCaseCount: 3,
      independentCaseCount: 1,
      independentRate: 33,
      tags: [
        { label: '데이터', count: 1 },
        { label: '머신러닝', count: 1 },
        { label: '협업', count: 1 },
      ],
    },
    highAchievements: [
      { category: 'Python', score: 100 },
      { category: 'SQL', score: 96 },
    ],
  },
  theoryUnderstanding: {
    status: 'READY',
    score: 98,
    level: 'HIGH',
    label: '높음',
    summary:
      'Python·SQL 역량 점검 2회를 평균 98점으로 통과해 분석 직무의 기초 이론을 안정적으로 이해하고 있습니다.',
    categories: [
      { key: 'PYTHON', category: 'Python·자료구조', score: 100, weightPercent: 50 },
      { key: 'WEB_DATA', category: 'SQL·관계형 DB', score: 96, weightPercent: 50 },
    ],
  },
  evidenceCodes: projectEvidenceCodes,
  limitations: [],
}

const parkSujinAiServiceRole: AiJobFitRoleCandidate = {
  rank: 2,
  role: '데이터 엔지니어',
  jobLabel: '데이터 엔지니어',
  roleLabel: '수집·적재 파이프라인',
  workType: '파이프라인 구축형',
  fitScore: 82,
  confidence: 'MEDIUM',
  summary:
    '크롤러 → 정규화 → PostgreSQL 적재 → 대시보드로 이어지는 파이프라인을 혼자 완성했고, 메모리·중복 문제를 직접 해결했습니다.',
  evidence: ['수집 파이프라인 구축', '키워드 정규화 312개', 'PostgreSQL 적재'],
  fitEvidence: {
    projectRoles: [
      { label: '수집·적재 파이프라인 구축', taskCount: 3, projectCount: 1 },
    ],
    troubleshooting: {
      certifiedCaseCount: 1,
      independentCaseCount: 1,
      independentRate: 100,
      tags: [
        { label: 'pandas', count: 1 },
        { label: '메모리 최적화', count: 1 },
      ],
    },
    highAchievements: [{ category: 'SQL', score: 96 }],
  },
  theoryUnderstanding: {
    status: 'READY',
    score: 96,
    level: 'HIGH',
    label: '높음',
    summary: 'SQL·관계형 DB 역량 점검 96점으로 적재·조회 설계의 기초가 확인됩니다.',
    categories: [
      { key: 'WEB_DATA', category: 'SQL·관계형 DB', score: 96, weightPercent: 100 },
    ],
  },
  evidenceCodes: ['HWANG-SUBIN-PJ1', 'pc1'],
  limitations: [],
}

const parkSujinDevOpsRole: AiJobFitRoleCandidate = {
  rank: 3,
  role: 'ML·AI',
  jobLabel: '머신러닝 엔지니어',
  roleLabel: '모델 학습·검증',
  workType: '검증 중심 학습형',
  fitScore: 74,
  confidence: 'MEDIUM',
  summary:
    '교차검증·데이터 누수 사례로 검증 감각은 확인되지만, 머신러닝 범위의 평가는 3차 역량 점검(08-14 예정) 이후에 보강됩니다.',
  evidence: ['데이터 누수 인증 사례 1건', '교차검증·HPO 과제 제출'],
  fitEvidence: {
    projectRoles: [],
    troubleshooting: {
      certifiedCaseCount: 1,
      independentCaseCount: 0,
      independentRate: null,
      tags: [
        { label: 'scikit-learn', count: 1 },
        { label: '데이터 누수', count: 1 },
      ],
    },
    highAchievements: [],
  },
  theoryUnderstanding: {
    status: 'NOT_READY',
    score: null,
    level: 'NOT_READY',
    label: '분석 준비 중',
    summary:
      '머신러닝 범위 역량 점검(3차)이 아직 응시 전이라 인증 사례와 과제 제출 근거로만 해석했습니다.',
    categories: [],
  },
  evidenceCodes: ['pc2'],
  limitations: ['3차 역량 점검(데이터 분석·머신러닝) 응시 후 다시 분석합니다.'],
}

export const PARK_SUJIN_AI_ANALYSIS: AiAnalysis = {
  policyVersion: '2026.08.05-park-sujin-mock-v1',
  jobFit: {
    policyVersion: '2026.08.05-job-fit-v3',
    status: 'READY',
    summary: '수집부터 검증까지 스스로 완결하는 데이터 분석가 역량이 가장 선명합니다.',
    primaryRole: parkSujinPrimaryRole,
    roleCandidates: [
      parkSujinPrimaryRole,
      parkSujinAiServiceRole,
      parkSujinDevOpsRole,
    ],
    sourceData: {
      // 이력서 2종(백엔드 개발자 지원용 · AI 엔지니어 지원용)의 희망 직무 — 실측.
      interestedJobs: ['AI 엔지니어', '백엔드 개발자'],
      skillTags: [
        'Python',
        'pandas',
        'BeautifulSoup',
        'PostgreSQL',
        'Streamlit',
        'scikit-learn',
      ],
      projectDomains: ['데이터 · 채용 시장 분석'],
      assessments: parkSujinAssessments.map((assessment) => ({
        assessmentType: assessment.assessmentType,
        category: assessment.category,
        score: assessment.score,
      })),
      theoryCategories:
        parkSujinPrimaryRole.theoryUnderstanding?.categories ?? [],
      certifications: ['SQLD 개발자 자격', 'PCCE 파이썬 코딩 실력 인증 3급'],
    },
    confidence: 'HIGH',
    limitations: [],
    sourcePolicies: ['PARK_SUJIN_CERTIFICATE_MOCK'],
    generatedBy: 'FALLBACK',
  },
  axisAlignment: {
    policyVersion: '2026.08.05-axis-alignment-v1',
    status: 'READY',
    summary: '종합 역량 축과 실측 근거가 일치합니다.',
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
      '채용 공고 데이터를 수집·정규화해 직무별 기술 스택 지도를 만든 개인 프로젝트 1건을 인증했습니다.',
    groups: [
      {
        key: 'CONTINUITY',
        label: '수집 → 분석 → 시각화 완결',
        summary:
          '크롤링·정규화·적재·분석·대시보드를 한 사람이 끝까지 연결했습니다.',
        projectIds: ['pj1'],
        projectNames: ['채용 공고로 보는 데이터 직무 기술 스택 지도'],
        evidenceCodes: ['HWANG-SUBIN-PJ1'],
        confidence: 'HIGH',
        limitations: [],
      },
    ],
    status: 'READY',
    projects: [
      {
        projectId: 'pj1',
        order: 1,
        name: '채용 공고로 보는 데이터 직무 기술 스택 지도',
        period: { startedAt: '2026-07-14', endedAt: '2026-08-29' },
        certificationStatus: 'CERTIFIED',
        status: 'READY',
        membershipRole: 'OWNER',
        teamContext: {
          domain: '데이터 · 채용 시장 분석',
          scope: '개인 프로젝트',
          techStacks: [
            'Python',
            'pandas',
            'BeautifulSoup',
            'PostgreSQL',
            'Streamlit',
          ],
          outcomes: [
            '채용 공고 5,240건 수집 · 중복 제거 후 4,180건 확보',
            '기술 표기 1,148종 → 표준 키워드 312개 정규화',
            '대시보드 조회 4.2초 → 0.8초',
          ],
        },
        personalEvidence: {
          tasks: [
            '채용 사이트 구조 분석 및 수집 대상 확정',
            '크롤러 구현 (요청 간격 1초, 재시도 3회)',
            '기술 스택 표기 정규화',
            'Streamlit 대시보드 구현',
          ],
          workCategories: ['수집·정규화 설계', '분석·대시보드'],
          technologies: [
            'Python',
            'pandas',
            'BeautifulSoup',
            'PostgreSQL',
            'Streamlit',
          ],
          peerObservations: [],
          troubleshootingCases: [
            'pandas merge 후 행 수가 3배로 늘어난 문제',
          ],
          artifacts: ['성과 지표 3건', '작업 보드 7/8 완료'],
        },
        analysis:
          '수집 규모와 정규화 커버리지를 수치로 남기며 분석 결과의 신뢰를 스스로 검증했습니다.',
        recruiterInsight: {
          role: '개인 프로젝트 · 수집부터 대시보드까지',
          challenge: '표기가 제각각인 기술 키워드 1,148종과 merge 행 폭증',
          action:
            '동의어 사전으로 312개 표준 키워드로 정규화하고, 조인 키 유일성 검증을 템플릿화했습니다.',
          outcome:
            '공고 4,180건 기반 직무별 스택 지도를 완성하고 대시보드 조회를 0.8초로 만들었습니다.',
          strength: '수집·정규화·검증을 혼자 완결하는 실행력',
          summary:
            '데이터 수집부터 시각화까지 전 과정을 검증 가능한 수치로 남긴 개인 프로젝트입니다.',
          evidenceCodes: ['HWANG-SUBIN-PJ1'],
          generatedBy: 'FALLBACK',
        },
        evidenceCodes: ['HWANG-SUBIN-PJ1'],
        limitations: [],
        generatedBy: 'FALLBACK',
      },
    ],
    overview: {
      experienceScope: '채용 공고 수집부터 직무 스택 대시보드까지',
      workingStyle: '수치 검증과 기록 공유를 연결하는 완결형',
      overall:
        '개인 프로젝트 1건으로 데이터 파이프라인 전 구간을 경험했습니다.',
    },
    recruiterSummary: {
      headline: '수집부터 검증까지 혼자 완결하는 데이터 분석가',
      summary: '인증 프로젝트 1건에서 개인 수행 범위와 검증 결과가 확인됩니다.',
      strengths: ['수집 파이프라인 구축', '키워드 정규화', '대시보드 시각화'],
      evidenceCodes: projectEvidenceCodes,
      generatedBy: 'FALLBACK',
    },
    aggregateAnalysis: {
      summary: [
        '인증 프로젝트에서 수집·정규화·분석·시각화 전 구간을 혼자 수행하고 성과를 수치로 남겼습니다.',
        '블로그·트러블슈팅 기록에서 해결 과정을 문서로 공유하는 스타일이 일관되게 나타납니다.',
      ],
      rolePatterns: [
        { label: '수집·정규화 설계', projectCount: 1, taskCount: 4 },
        { label: '분석·대시보드', projectCount: 1, taskCount: 3 },
      ],
      commonTasks: [
        '수집 대상 구조 분석',
        '데이터 정규화·적재',
        '직무별 빈도 분석',
        '대시보드 구현과 결과 검증',
      ],
      selfReviewStatements: [
        '채용 사이트 구조를 분석해 수집 파이프라인을 만들고 키워드 정규화 기준을 세웠습니다.',
        '직무별 스택 빈도를 분석해 Streamlit 대시보드로 공개했습니다.',
      ],
      contribution: {
        totalBoardTaskCount: 8,
        assignedTaskCount: 8,
        completedAssignedTaskCount: 7,
        summary: [
          '개인 프로젝트 보드 업무 8개를 모두 스스로 계획하고 담당했습니다.',
          '7개를 완료했고 발표자료 작성 1건이 진행 중입니다(마감 08-29).',
        ],
      },
      peerAxes: [
        {
          key: '기술/기술기여',
          score: 4.6,
          summary: [
            '역량 점검 평균 98점의 기초 위에 수집·분석 파이프라인을 직접 구현합니다.',
            '해결한 문제를 템플릿·규칙으로 만들어 재사용 가능하게 남깁니다.',
          ],
        },
        {
          key: '소통·협업·팀워크',
          score: 4.5,
          summary: [
            'Q&A 질문 3건이 전부 답변 채택될 만큼 질문을 구체적으로 정리합니다.',
            'SQL 스터디를 2회 운영하며 배운 내용을 팀과 나눕니다.',
          ],
        },
        {
          key: '문제해결',
          score: 4.1,
          summary: [
            '행 폭증·데이터 누수처럼 결과를 왜곡하는 문제를 원인까지 파고들어 해결합니다.',
            '해결 후 검증 규칙을 만들어 재발을 차단하는 성향이 나타납니다.',
          ],
        },
        {
          key: '책임감',
          score: 4.8,
          summary: [
            '결석 0에 과제 9/10 제출, 블로그 8주 연속 제출로 꾸준함이 확인됩니다.',
            '맡은 프로젝트 작업 8건을 스스로 계획하고 7건을 완료했습니다.',
          ],
        },
      ],
      projectGrowth: [
        {
          projectId: 'pj1',
          projectName: '채용 공고로 보는 데이터 직무 기술 스택 지도',
          summary: [
            '주차 실습에서 배운 크롤링·전처리·SQL을 하나의 파이프라인으로 통합했습니다.',
            '수집 데이터의 품질 문제(중복·표기 불일치)를 직접 겪고 검증 규칙으로 만들었습니다.',
          ],
        },
      ],
      strengths: [
        '수집부터 시각화까지 전 구간을 혼자 완결하는 실행력',
        '문제를 해결한 뒤 템플릿·규칙으로 재발을 막는 습관',
        '블로그·스터디·Q&A로 학습을 공유하는 꾸준함',
      ],
      evaluationSource: 'PEER_ONLY',
    },
    projectCount: 1,
    period: { startedAt: '2026-07-14', endedAt: '2026-08-29' },
    evidenceCodes: projectEvidenceCodes,
    confidence: 'HIGH',
    limitations: [],
    generatedBy: 'FALLBACK',
  },
  troubleshooting: {
    policyVersion: '2026.08.05-troubleshooting-analysis-v2',
    status: 'READY',
    summary:
      '결과가 이상하면 먼저 재현 조건을 고정하고 원인 후보를 하나씩 배제합니다.\n원인을 찾으면 최소 변경으로 수정한 뒤 같은 조건에서 수치로 재검증합니다.\n해결 과정을 기록실·팀 규칙으로 남겨 같은 문제가 반복되지 않게 합니다.',
    certifiedCaseCount: 3,
    independentCaseCount: 1,
    independentRate: 33,
    sourceData: {
      categories: [
        { label: '데이터', count: 1 },
        { label: '머신러닝', count: 1 },
        { label: '협업', count: 1 },
        { label: '환경', count: 2 },
      ],
      cases: parkSujinTroubleshootingCases.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        situation: item.summary?.situation ?? item.situation,
        resolution: item.summary?.resolution ?? item.resolution,
        result: item.summary?.result ?? item.result,
        days: item.days,
        independent: item.independent,
      })),
      averageDays: 1.3,
      medianDays: 1,
      independentCaseCount: 1,
      supportedCaseCount: 2,
    },
    period: { startedAt: '2026-07-20', endedAt: '2026-08-10' },
    axes: [
      {
        key: 'DATA_PROCESSING',
        label: '데이터 처리',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 1,
        evidence: ['pandas merge 행 폭증 — 키 유일성 검증으로 해결'],
        evidenceCodes: ['pc1'],
        limitations: [],
      },
      {
        key: 'MODEL_TUNING',
        label: '모델 검증',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 1,
        evidence: ['StandardScaler 데이터 누수 — Pipeline 으로 교정'],
        evidenceCodes: ['pc2'],
        limitations: [],
      },
      {
        key: 'INFRA_DEPLOYMENT',
        label: '협업·환경',
        status: 'PARTIAL',
        score: null,
        certifiedCaseCount: 1,
        evidence: ['Git rebase 커밋 유실 — reflog 복구와 백업 규칙'],
        evidenceCodes: ['pc3'],
        limitations: [],
      },
    ],
    steps: [
      {
        key: 'FRAME',
        label: '문제 구조화',
        summary: '재현 조건을 고정하고 원인 후보를 좁힙니다.',
      },
      {
        key: 'APPLY',
        label: '해결 적용',
        summary: '원인에 맞는 최소 변경을 적용합니다.',
      },
      {
        key: 'VERIFY',
        label: '결과 검증',
        summary: '같은 조건에서 수치와 재발 여부를 확인합니다.',
      },
    ],
    groups: [
      {
        label: '데이터',
        certifiedCaseCount: 1,
        solutionSummary: '조인 키 유일성 검증을 분석 템플릿에 넣었습니다.',
        tags: [{ label: 'pandas', count: 1 }],
        caseIds: ['pc1'],
        caseTitles: ['pandas merge 후 행 수가 3배로 늘어난 문제'],
        evidence: ['행 수 원본 일치 · validate 옵션 적용'],
      },
      {
        label: '머신러닝',
        certifiedCaseCount: 1,
        solutionSummary: '전처리를 Pipeline 안으로 옮겨 누수를 차단했습니다.',
        tags: [{ label: 'scikit-learn', count: 1 }],
        caseIds: ['pc2'],
        caseTitles: [
          'StandardScaler를 전체 데이터에 fit 해서 성능이 부풀려진 문제',
        ],
        evidence: ['부풀려진 검증 점수 교정'],
      },
      {
        label: '협업',
        certifiedCaseCount: 1,
        solutionSummary: 'reflog 복구 후 rebase 백업 규칙을 만들었습니다.',
        tags: [{ label: 'Git', count: 1 }],
        caseIds: ['pc3'],
        caseTitles: ['Git rebase 중 충돌을 잘못 해결해 동료 커밋을 날린 문제'],
        evidence: ['동료 커밋 2건 복구 · 팀 규칙 공유'],
      },
    ],
    growth: {
      status: 'READY',
      summary:
        '환경 설정 문제에서 데이터 품질·모델 검증 문제로 해결 범위를 넓혔습니다.',
      newDomains: ['데이터 품질', '모델 검증'],
      repeatedDomains: ['분석 환경'],
      newTechnologies: ['scikit-learn Pipeline', 'pandas validate'],
      repeatedTechnologies: ['Python', 'Git'],
      confidence: 'MEDIUM',
    },
    limitations: [],
  },
  sentiment: {
    policyVersion: '2026.08.05-park-sujin-sentiment-v1',
    status: 'READY',
    noteCount: 8,
    phases: [
      {
        phase: 'early',
        label: '초반',
        period: { startedAt: '2026-06-16', endedAt: '2026-07-05' },
        noteCount: 3,
        summary: '환경 구축과 Git 에서 헤맸지만 기록으로 정리하며 적응했습니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'mid',
        label: '중반',
        period: { startedAt: '2026-07-06', endedAt: '2026-07-31' },
        noteCount: 3,
        summary: 'SQL 스터디를 직접 운영하며 역량 점검 2회를 안정적으로 통과했습니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'late',
        label: '현재',
        period: { startedAt: '2026-08-01', endedAt: '2026-08-10' },
        noteCount: 2,
        summary: '개인 프로젝트가 강사 인증을 받으며 성취감이 높아졌습니다.',
        confidence: 'HIGH',
      },
    ],
    bubbles: [
      ['환경 헤맴', 14, 34, 12, 'early', 'CONCERN'],
      ['Git 실수', 22, 56, 11, 'early', 'CONCERN'],
      ['기록 습관', 30, 40, 10, 'early', 'POSITIVE'],
      ['스터디 운영', 46, 30, 12, 'mid', 'POSITIVE'],
      ['역량 점검 100점', 54, 52, 14, 'mid', 'POSITIVE'],
      ['데이터 누수 교훈', 62, 68, 10, 'mid', 'NEUTRAL'],
      ['프로젝트 인증', 80, 38, 15, 'late', 'POSITIVE'],
      ['성취감', 88, 58, 12, 'late', 'POSITIVE'],
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
    trend: '우상향: 환경 적응 → 스터디·역량 점검 → 프로젝트 인증',
    confidence: 'HIGH',
    limitations: [],
  },
  ontology: {
    policyVersion: '2026.08.05-park-sujin-ontology-v1',
    status: 'READY',
    summary:
      '황수빈의 Python·SQL·데이터 분석 학습과 채용 스택 지도 프로젝트의 연결을 보여줍니다.',
    counts: {
      self: 1,
      subject: 4,
      skill: 6,
      method: 2,
      project: 1,
      domain: 1,
    },
    omittedCounts: {},
    nodes: ontologyNodes,
    edges: ontologyEdges,
    limitations: [],
  },
}
