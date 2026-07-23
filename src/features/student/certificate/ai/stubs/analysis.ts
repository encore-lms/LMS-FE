// AI 분석 출력 stub (개발용) — 통찰형(교차 종합) 예시. 나중에 생성 계층(LLM)으로 교체.
// 각 서술은 '최소 2소스 연결' 톤. FE에서 LMS-AI로 이전(계산 SSOT).
import type {
  AiAnalysis,
  SentimentBubble,
  SentimentPhase,
  SentimentPolarity,
} from '../types'

const STUB_SENTIMENT_PHASE_CENTER: Record<SentimentPhase, number> = {
  early: 60,
  mid: 112,
  late: 164,
}
const STUB_SENTIMENT_LAYOUT: Record<
  number,
  readonly { x: number; y: number }[]
> = {
  1: [{ x: 0, y: 50 }],
  2: [
    { x: -10, y: 43 },
    { x: 10, y: 57 },
  ],
  3: [
    { x: 0, y: 27 },
    { x: -11, y: 56 },
    { x: 15, y: 54 },
  ],
  4: [
    { x: 0, y: 24 },
    { x: -16, y: 50 },
    { x: 16, y: 48 },
    { x: 1, y: 75 },
  ],
  5: [
    { x: 0, y: 22 },
    { x: -13, y: 47 },
    { x: 14, y: 45 },
    { x: -9, y: 73 },
    { x: 14, y: 72 },
  ],
}

interface SentimentStubInput {
  label: string
  phase: SentimentPhase
  polarity: SentimentPolarity
  weight: number
  evidenceCount: number
}

function sentimentStubBubbles(items: SentimentStubInput[]): SentimentBubble[] {
  return items.map((item, itemIndex) => {
    const peers = items.filter((candidate) => candidate.phase === item.phase)
    const phaseIndex = items
      .slice(0, itemIndex)
      .filter((candidate) => candidate.phase === item.phase).length
    const layout =
      STUB_SENTIMENT_LAYOUT[Math.min(5, peers.length)] ??
      STUB_SENTIMENT_LAYOUT[5]
    const point = layout[phaseIndex] ?? layout.at(-1)!
    return {
      ...item,
      x: STUB_SENTIMENT_PHASE_CENTER[item.phase] + point.x,
      y: point.y,
      r: Number(
        Math.max(
          6,
          item.weight * 2 - 4 + Math.min(1.2, item.evidenceCount * 0.3),
        ).toFixed(1),
      ),
    }
  })
}

const STU_001: AiAnalysis = {
  // 블록1 — 정규화 증명서 원천이 없는 레거시 ID용 명시적 준비 상태
  verdict: {
    policyVersion: '2026.07.23-technical-verdict-v1',
    strength:
      '서로 다른 원천에서 교차 확인되는 기술 강점을 아직 산출할 수 없습니다.',
    growth:
      '완료된 성취도 평가가 더 쌓이면 카테고리별 점수 변화와 심화 학습 흐름을 성장 포인트로 확인할 수 있습니다.',
    gap: '평가된 범위에서 보완 방향을 정할 직접 근거가 아직 충분하지 않습니다.',
    unique:
      '기초와 적용 사이의 차이나 반복 패턴을 설명할 근거가 아직 충분하지 않습니다.',
    details: {
      strength: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
      growth: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
      gap: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
      unique: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
    },
    confidence: 'LOW',
    limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
    generatedBy: 'FALLBACK',
  },

  // 블록2 — 프로파일링 (5축 라벨은 생성값, 여기선 mock)
  profile: {
    rows: [
      { label: '업무', value: '계획형' },
      { label: '리더십', value: '서포터형' },
      { label: '학습', value: '가속형' },
      { label: '소통', value: '논리설명형' },
      { label: '기술', value: '백엔드 심화형' },
    ],
    summary: '계획을 세워 성능 문제를 파고드는 백엔드 실무형',
    strengths:
      '책임감 상위 5% + 상호평가 "문서화" 다수 + 응답속도 60%→95% 개선을 함께 달성했습니다.',
    growth:
      '하위인 소통 축은 팀 발표·리뷰 경험을 늘리면 빠르게 오를 여지가 있습니다.',
  },

  // 블록3 — 페르소나 TOP3 (풍부 표시 title + 고정 base + 부연 호버 활동 근거)
  personas: [
    {
      rank: 1,
      title: '분산 시스템에 강한 백엔드 엔지니어',
      subtitle:
        '주문 관리 MSA 프로젝트에서 실시간 처리를 맡았고, "성능" 트러블슈팅 5건을 인증받았습니다.',
      baseCategory: '백엔드',
      fitScore: 0,
      confidence: 'LOW',
      evidence: ['정규화 증명서 원천 연결 전 기존 mock 분석'],
      limitations: ['결정 근거 적합도는 아직 산출하지 않음'],
    },
    {
      rank: 2,
      title: '실행형 트러블슈터',
      subtitle:
        '배포·인프라 트러블슈팅 4건을 평균 소요일 단축(3일→1.5일)으로 해결했습니다.',
      baseCategory: 'DevOps·인프라',
      fitScore: 0,
      confidence: 'LOW',
      evidence: ['정규화 증명서 원천 연결 전 기존 mock 분석'],
      limitations: ['결정 근거 적합도는 아직 산출하지 않음'],
    },
    {
      rank: 3,
      title: '비즈니스 임팩트 드리븐 설계자',
      subtitle:
        '커머스·핀테크 도메인에서 개선 지표(전환율·응답속도)를 앞세워 설계했습니다.',
      baseCategory: '풀스택',
      fitScore: 0,
      confidence: 'LOW',
      evidence: ['정규화 증명서 원천 연결 전 기존 mock 분석'],
      limitations: ['결정 근거 적합도는 아직 산출하지 않음'],
    },
  ],

  // 블록4 — 정규화 증명서 원천이 없는 레거시 ID용 명시적 준비 상태
  projects: {
    policyVersion: '2026.07.23-project-analysis-v2',
    summary:
      '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
    groups: [],
    status: 'NOT_READY',
    projects: [],
    projectCount: 0,
    period: null,
    evidenceCodes: [],
    confidence: 'LOW',
    overview: {
      experienceScope: '분석할 인증 완료 프로젝트가 없습니다.',
      workingStyle: '개인 수행 방식을 설명할 프로젝트 근거가 없습니다.',
      overall:
        '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
    },
    limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
    generatedBy: 'FALLBACK',
  },

  // 블록5 — 정규화 증명서 원천이 없는 레거시 ID용 명시적 준비 상태
  problem: {
    policyVersion: '2026.07.23-problem-collaboration-v1',
    status: 'NOT_READY',
    mappingVersion: '2026.07.23-troubleshooting-axis-v1',
    caps: [
      {
        key: 'DATA_PROCESSING',
        label: '데이터 처리',
        status: 'NOT_READY',
        score: null,
        certifiedCaseCount: 0,
        evidence: [],
        evidenceCodes: [],
        limitations: ['구조화 인증 평가가 없어 역량 점수는 산출하지 않음'],
      },
      {
        key: 'MODEL_TUNING',
        label: '모델 튜닝',
        status: 'NOT_READY',
        score: null,
        certifiedCaseCount: 0,
        evidence: [],
        evidenceCodes: [],
        limitations: ['구조화 인증 평가가 없어 역량 점수는 산출하지 않음'],
      },
      {
        key: 'INFRA_DEPLOYMENT',
        label: '인프라·배포',
        status: 'NOT_READY',
        score: null,
        certifiedCaseCount: 0,
        evidence: [],
        evidenceCodes: [],
        limitations: ['구조화 인증 평가가 없어 역량 점수는 산출하지 않음'],
      },
    ],
    style:
      '서로 다른 유효 평가자가 충분하지 않아 협업 방식을 아직 설명할 수 없습니다.',
    scaling:
      '인증 문제해결 사례가 더 쌓이면 분야와 기술 범위의 변화를 설명할 수 있습니다.',
    collaboration: {
      status: 'NOT_READY',
      label: '협업 근거 산출 전',
      summary:
        '서로 다른 유효 평가자가 충분하지 않아 협업 방식을 아직 설명할 수 없습니다.',
      evaluatorCount: 0,
      projectCount: 0,
      behaviorSignals: [],
      tagStats: [],
      behaviorStats: [],
      projectEvaluations: [],
      evidence: [],
      evidenceCodes: [],
      confidence: 'LOW',
      limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
      generatedBy: 'FALLBACK',
    },
    growth: {
      status: 'NOT_READY',
      confidence: 'LOW',
      summary:
        '인증 문제해결 사례가 더 쌓이면 분야와 기술 범위의 변화를 설명할 수 있습니다.',
      certifiedCaseCount: 0,
      period: null,
      newDomains: [],
      repeatedDomains: [],
      newTechnologies: [],
      repeatedTechnologies: [],
      evidence: [],
      evidenceCodes: [],
      limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
      generatedBy: 'FALLBACK',
    },
    certifiedCaseCount: 0,
    peerEvaluationCount: 0,
    period: null,
    troubleshooting: {
      label: '역량 산출 전',
      problemSolvingSummary:
        '강사 인증이 완료된 트러블슈팅의 상황·해결·결과 본문이 없어 문제를 해결해 나가는 방식을 아직 서술하지 않습니다.',
      problemSolvingSteps: [],
      problemGroups: [],
      evidence: [],
      confidence: 'LOW',
      limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
    },
    unmappedCaseCount: 0,
    limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
  },

  // 블록6 — 감성·키워드 버블 (mock)
  sentiment: {
    policyVersion: '2026.07.18-counseling-sentiment-v5',
    status: 'READY',
    noteCount: 6,
    phases: [
      {
        phase: 'early',
        label: '초기',
        period: { startedAt: '2024-04-22', endedAt: '2024-06-21' },
        noteCount: 2,
        summary: '초기 상담에서는 진로 불안과 학습 지속이 함께 확인됩니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'mid',
        label: '중기',
        period: { startedAt: '2024-06-22', endedAt: '2024-08-21' },
        noteCount: 2,
        summary: '중기 상담에서는 복습 조정과 수업 몰입이 함께 확인됩니다.',
        confidence: 'MEDIUM',
      },
      {
        phase: 'late',
        label: '후기',
        period: { startedAt: '2024-08-22', endedAt: '2024-10-20' },
        noteCount: 2,
        summary: '후기 상담에서는 준비 부담과 방향 구체화가 함께 확인됩니다.',
        confidence: 'MEDIUM',
      },
    ],
    bubbles: sentimentStubBubbles([
      {
        label: '진로 불안',
        phase: 'early',
        polarity: 'CONCERN',
        weight: 9,
        evidenceCount: 2,
      },
      {
        label: '학습 지속',
        phase: 'early',
        polarity: 'POSITIVE',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '직무 거리감',
        phase: 'early',
        polarity: 'CONCERN',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '과정 탐색',
        phase: 'early',
        polarity: 'NEUTRAL',
        weight: 6,
        evidenceCount: 2,
      },
      {
        label: '성취 확인',
        phase: 'early',
        polarity: 'POSITIVE',
        weight: 7,
        evidenceCount: 1,
      },
      {
        label: '복습 조정',
        phase: 'mid',
        polarity: 'NEUTRAL',
        weight: 9,
        evidenceCount: 2,
      },
      {
        label: '수업 몰입',
        phase: 'mid',
        polarity: 'POSITIVE',
        weight: 8,
        evidenceCount: 1,
      },
      {
        label: '일정 부담',
        phase: 'mid',
        polarity: 'CONCERN',
        weight: 7,
        evidenceCount: 1,
      },
      {
        label: '준비 실행',
        phase: 'mid',
        polarity: 'POSITIVE',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '역할 수행',
        phase: 'mid',
        polarity: 'NEUTRAL',
        weight: 7,
        evidenceCount: 2,
      },
      {
        label: '설명 부담',
        phase: 'late',
        polarity: 'CONCERN',
        weight: 9,
        evidenceCount: 2,
      },
      {
        label: '준비 실행',
        phase: 'late',
        polarity: 'POSITIVE',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '결과물 정리',
        phase: 'late',
        polarity: 'NEUTRAL',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '방향 구체화',
        phase: 'late',
        polarity: 'POSITIVE',
        weight: 8,
        evidenceCount: 2,
      },
      {
        label: '실전 적용',
        phase: 'late',
        polarity: 'POSITIVE',
        weight: 7,
        evidenceCount: 1,
      },
    ]),
    trend:
      '초기(진로 불안·학습 지속) → 중기(복습 조정·수업 몰입) → 후기(설명 부담·방향 구체화) 순으로 상담의 감성·주제 중심이 이동했습니다.',
    confidence: 'MEDIUM',
    limitations: [
      '상담 기록에 표현된 감성·주제만 해석하며 심리 상태를 진단하지 않음',
      '상담 원문과 개인정보는 분석 응답에 포함하지 않음',
    ],
  },

  // 온톨로지 (가능한 노드는 실데이터 경로, 방법론만 mock)
  ontology: {
    policyVersion: '2026.07.21-competency-ontology-v2',
    status: 'READY',
    summary:
      '본인을 중심으로 과목, 프로젝트, 기술, 방법론, 도메인을 근거 관계로 연결했습니다.',
    counts: { self: 1, subject: 1, skill: 2, method: 1, project: 1, domain: 1 },
    omittedCounts: {},
    nodes: [
      {
        id: 'self',
        label: '김수강',
        x: 8,
        y: 50,
        kind: 'self',
        weight: 1,
        evidenceCount: 1,
        evidence: ['수강생 프로필'],
        confidence: 'HIGH',
      },
      {
        id: 'subj-java',
        label: 'Java/Spring',
        x: 25,
        y: 50,
        kind: 'subject',
        weight: 0.82,
        evidenceCount: 1,
        evidence: ['확정 평가로 학습 이력 확인'],
        confidence: 'MEDIUM',
      },
      {
        id: 'proj-1',
        label: '주문 MSA',
        x: 43,
        y: 50,
        kind: 'project',
        weight: 0.88,
        evidenceCount: 2,
        evidence: ['완료 프로젝트', '본인 담당 과업'],
        confidence: 'HIGH',
      },
      {
        id: 'skill-spring',
        label: 'Spring',
        x: 61,
        y: 35,
        kind: 'skill',
        weight: 0.86,
        evidenceCount: 2,
        evidence: ['주문 MSA 팀 기술스택', '본인 과업 교차 확인'],
        confidence: 'HIGH',
      },
      {
        id: 'skill-redis',
        label: 'Redis',
        x: 61,
        y: 65,
        kind: 'skill',
        weight: 0.7,
        evidenceCount: 1,
        evidence: ['주문 MSA 팀 기술스택'],
        confidence: 'MEDIUM',
      },
      {
        id: 'method-review',
        label: '코드 리뷰',
        x: 79,
        y: 50,
        kind: 'method',
        weight: 0.76,
        evidenceCount: 2,
        evidence: ['본인 과업', '동료평가'],
        confidence: 'HIGH',
      },
      {
        id: 'dom-commerce',
        label: '커머스',
        x: 94,
        y: 50,
        kind: 'domain',
        weight: 0.8,
        evidenceCount: 1,
        evidence: ['주문 MSA 프로젝트 도메인'],
        confidence: 'MEDIUM',
      },
    ],
    edges: [
      {
        source: 'self',
        target: 'subj-java',
        type: 'LEARNED',
        strength: 0.82,
        evidence: ['확정 평가'],
      },
      {
        source: 'self',
        target: 'proj-1',
        type: 'PARTICIPATED',
        strength: 0.88,
        evidence: ['본인 담당 과업'],
      },
      {
        source: 'subj-java',
        target: 'proj-1',
        type: 'FOLLOWED_BY',
        strength: 0.82,
        evidence: ['Java/Spring 과목 이수 후 주문 MSA 프로젝트 수행'],
      },
      {
        source: 'proj-1',
        target: 'skill-spring',
        type: 'USED',
        strength: 0.86,
        evidence: ['팀 기술스택'],
      },
      {
        source: 'proj-1',
        target: 'skill-redis',
        type: 'USED',
        strength: 0.7,
        evidence: ['팀 기술스택'],
      },
      {
        source: 'proj-1',
        target: 'method-review',
        type: 'APPLIED',
        strength: 0.76,
        evidence: ['본인 과업'],
      },
      {
        source: 'proj-1',
        target: 'dom-commerce',
        type: 'BELONGS_TO',
        strength: 0.8,
        evidence: ['프로젝트 도메인'],
      },
    ],
    limitations: [
      '기술스택은 팀 프로젝트 맥락이며 본인 과업 근거가 있으면 관계 강도만 높임',
      '노드·관계의 수와 크기는 숙련도 점수가 아님',
    ],
  },
}

export const ANALYSIS_STUBS: Record<string, AiAnalysis> = {
  'stu-001': STU_001,
}
