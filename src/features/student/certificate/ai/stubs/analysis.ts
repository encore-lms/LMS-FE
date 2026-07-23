// AI 분석 출력 stub (개발용) — 정규화 원천이 없는 레거시 ID는 준비 상태를 명시한다.

import type { AiAnalysis } from '../types'

const STU_001: AiAnalysis = {
  // 블록1 — 정규화 증명서 원천이 없는 레거시 ID용 명시적 준비 상태
  verdict: {
    strength:
      '서로 다른 원천에서 교차 확인되는 기술 강점을 아직 산출할 수 없습니다.',
    gap: '평가된 범위에서 보완 방향을 정할 직접 근거가 아직 충분하지 않습니다.',
    unique:
      '기초와 적용 사이의 차이나 반복 패턴을 설명할 근거가 아직 충분하지 않습니다.',
    details: {
      strength: { status: 'NOT_READY', evidence: [], evidenceCodes: [] },
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
    summary:
      '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
    groups: [],
    status: 'NOT_READY',
    projects: [],
    overview: {
      experienceScope: '분석할 인증 완료 프로젝트가 없습니다.',
      workingStyle: '개인 수행 방식을 설명할 프로젝트 근거가 없습니다.',
      overall:
        '인증 완료 프로젝트 원천과 연결되면 프로젝트 경험을 분석할 수 있습니다.',
    },
    limitations: ['정규화 증명서 원천과 연결되지 않은 레거시 mock 학생'],
    generatedBy: 'FALLBACK',
  },

  // 블록5 — 문제해결·협업 (caps 3축 + style + scaling)
  problem: {
    caps: [
      { label: '데이터처리', score: 70, tag: 'DB', tone: 'info' },
      { label: '모델튜닝', score: 40, tag: '성능', tone: 'warning' },
      { label: '인프라·배포', score: 85, tag: '배포', tone: 'accent' },
    ],
    style:
      '혼자 파고들기보다 팀에 공유하며 푸는 편(상호평가 "공유" 태그 + 협업 84점)입니다.',
    scaling:
      '후반 과목에서도 성취를 유지하고 트슈 소요일이 줄어, 더 어려운 문제로 확장 중입니다.',
  },

  // 블록6 — 감성·키워드 버블 (mock)
  sentiment: {
    bubbles: [
      { label: '불안', x: 20, y: 30, r: 8, phase: 'early' },
      { label: '적응', x: 48, y: 42, r: 6, phase: 'mid' },
      { label: '몰입', x: 62, y: 30, r: 7, phase: 'mid' },
      { label: '성장', x: 78, y: 36, r: 9, phase: 'late' },
    ],
    trend: 'V자 변동형: 초반 불안 → 중기 적응 → 후반 몰입·성장',
  },

  // 온톨로지 (가능한 노드는 실데이터 경로, 방법론만 mock)
  ontology: {
    nodes: [
      { id: 'self', label: '김수강', x: 50, y: 50, kind: 'self' },
      { id: 'subj-java', label: 'Java/Spring', x: 30, y: 30, kind: 'subject' },
      { id: 'skill-spring', label: 'Spring', x: 40, y: 20, kind: 'skill' },
      { id: 'skill-redis', label: 'Redis', x: 62, y: 22, kind: 'skill' },
      { id: 'proj-1', label: '주문 MSA', x: 70, y: 44, kind: 'project' },
      { id: 'dom-commerce', label: '커머스', x: 82, y: 62, kind: 'domain' },
    ],
    edges: [
      ['self', 'subj-java'],
      ['self', 'skill-spring'],
      ['self', 'proj-1'],
      ['proj-1', 'skill-spring'],
      ['proj-1', 'skill-redis'],
      ['proj-1', 'dom-commerce'],
    ],
  },
}

export const ANALYSIS_STUBS: Record<string, AiAnalysis> = {
  'stu-001': STU_001,
}
