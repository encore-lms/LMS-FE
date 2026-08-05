import { delay, http, HttpResponse } from 'msw'
import type {
  CertChangesData,
  CertificateOverview,
  CertPublicationData,
  CertSentiment,
} from './types'

// 수강 역량 증명서 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 증명서 미리보기(249:27) 시안 재현. 탭1(종합 요약) 포함.
const ok = <T>(data: T) => HttpResponse.json({ data })

// 프로젝트별 커밋 잔디밭 mock — 결정론적 패턴(요일·주차 기반). 지표는 그리드에서 산출해 일관성 보장.
function buildActivity(
  meta: {
    id: string
    name: string
    period: string
    weeksLabel: string
    certified: boolean
    contrib: string
  },
  weeks: number,
  shape: (w: number, d: number) => number,
) {
  const grid = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => Math.max(0, shape(w, d))),
  )
  const flat = grid.flat()
  const totalCommits = flat.reduce((a, b) => a + b, 0)
  const activeDays = flat.filter((c) => c > 0).length
  let s = 0
  let best = 0
  for (const c of flat) {
    if (c > 0) {
      s += 1
      best = Math.max(best, s)
    } else s = 0
  }
  return {
    ...meta,
    grid,
    totalCommits,
    activeDays,
    totalDays: flat.length,
    longestStreak: best,
    weeklyAvg: Math.round((totalCommits / weeks) * 10) / 10,
  }
}

const mockCommitActivity = [
  buildActivity(
    {
      id: 'pj1',
      name: 'Encore Mart — 마이크로서비스 백엔드',
      period: '2026.07.06 ~ 2026.09.18',
      weeksLabel: '11주',
      certified: true,
      contrib: '38%',
    },
    11,
    (w, d) => {
      if (d === 6) return 0 // 일요일 휴식
      const mid = w >= 2 && w <= 8 ? 1 : 0 // 중반 집중
      const base = (w + d) % 4 === 0 ? 0 : 1 + ((w * 2 + d) % 3)
      return base + mid
    },
  ),
  buildActivity(
    {
      id: 'pj2',
      name: '한국어 회의록 요약 LLM 파이프라인',
      period: '2026.05.04 ~ 2026.06.12',
      weeksLabel: '6주',
      certified: true,
      contrib: '100%',
    },
    6,
    (w, d) => {
      if (d === 6 && w % 2 === 0) return 0
      return 1 + ((w * 3 + d) % 4) // 단독 100% — 빡센 패턴
    },
  ),
  buildActivity(
    {
      id: 'pj3',
      name: 'MSA 도서 추천 — 시스템 설계',
      period: '2026.09.21 ~ 2026.10.16',
      weeksLabel: '3주',
      certified: false,
      contrib: '25%',
    },
    3,
    (w, d) => {
      if (d >= 5) return d === 6 ? 0 : 1
      return 2 + ((w + d) % 3) // 짧지만 밀도 높음
    },
  ),
]

/** 증명서 화면 기본 데이터 — 매니저 상세도 이 값을 데모 인물로 덮어 쓴다. */
export const mockOverview: CertificateOverview = {
  header: {
    studentName: '박수진',
    courseName: 'SK네트웍스 Family AI 캠프',
    cohortName: 'SKN 32기',
    periodLabel: '2026.04.28 — 2026.10.26',
    certId: 'abc-1234',
    isPublic: false,
    status: 'changes_requested',
  },
  changeFlags: [
    {
      id: 'f1',
      badge: '필수',
      badgeTone: 'danger',
      title: '필수 데이터 누락',
      detail: '외부 URL 2건 미입력 (GitHub · 블로그)',
      cta: '프로필 이동',
    },
    {
      id: 'f2',
      badge: '주의',
      badgeTone: 'warning',
      title: '미승인 산출물',
      detail: '8주차 회고 블로그 — 검토 대기 중',
      cta: '기록실 이동',
    },
    {
      id: 'f3',
      badge: '주의',
      badgeTone: 'warning',
      title: '개인정보 위험',
      detail: '프로젝트 카드에 전화번호가 노출됨',
      cta: '공개 항목 수정',
    },
  ],
  requestChecklist: [
    {
      id: 'rc1',
      pass: true,
      label: '필수 프로필 존재',
      sub: '이름, 과정, 외부 URL 형식 검증 완료',
    },
    {
      id: 'rc2',
      pass: false,
      label: '핵심 지표 산정 가능',
      sub: '외부 URL 2건 미입력 — 프로젝트 카드 인증 누락 위험',
      cta: '프로필 이동',
    },
    {
      id: 'rc3',
      pass: true,
      label: '대표 프로젝트 / 기록 승인',
      sub: '프로젝트 2건 · 기록 12건 강사 승인 완료',
    },
    {
      id: 'rc4',
      pass: true,
      label: '개인정보 위험 없음',
      sub: '프로젝트 카드 전화번호 자동 마스킹 적용',
    },
    {
      id: 'rc5',
      pass: true,
      label: '마트 최신성',
      sub: 'StudentSkillAxisMart · 2026-05-14 03:12 갱신',
    },
  ],
  summary: {
    overallScore: 86,
    scoreMax: 100,
    grade: 'A',
    scoreDelta: '+4점 지난주',
    confirmedLabel: 'confirmed',
    ratioLabel: '4 / 5',
    sourceLabel: '자동 + 360°',
    kpis: [
      {
        key: 'attendance',
        label: '출석률',
        value: '96',
        unit: '%',
        tone: 'success',
        bar: 96,
        sub: '768 / 800 시간 · 지각 2회',
      },
      {
        key: 'exam',
        label: '시험 평균',
        value: '82',
        unit: '점',
        tone: 'info',
        bar: 82,
        sub: '퀴즈 12회 · 상위 18%',
      },
      {
        key: 'blog',
        label: '블로그 제출률',
        value: '81',
        unit: '%',
        tone: 'accent',
        bar: 81,
        sub: '21 / 26 제출 완료',
      },
      {
        key: 'project',
        label: '인증 프로젝트',
        value: '2',
        unit: '/ 3',
        tone: 'success',
        bar: 66,
        sub: '강사 인증 완료 2건',
      },
    ],
    skillAxes: [
      { key: '기술', score: 88, peer: 92, confirmed: true },
      {
        key: '성장',
        score: 85,
        peer: 86,
        confirmed: true,
        note: '최근 8주 +17점',
      },
      {
        key: '팀워크',
        score: 82,
        peer: 90,
        confirmed: true,
        note: '동료평 평균 4.5',
      },
      {
        key: '책임감',
        score: 90,
        peer: 96,
        confirmed: true,
        note: 'PeerTag #리더십',
      },
      {
        key: '소통',
        score: 84,
        peer: 90,
        confirmed: true,
        note: 'PeerTag #논리적설득 10회',
      },
      {
        key: '문제해결',
        score: 79,
        peer: 82,
        confirmed: true,
        note: 'TS 케이스 9건 해결',
      },
    ],
    skillAvg: 84.7,
    quizCategories: [
      { label: '백엔드 기초', score: 92 },
      { label: 'DB / SQL', score: 84 },
      { label: '네트워크', score: 78 },
      { label: '컨테이너', score: 71 },
      { label: '자료구조', score: 86 },
    ],
    evidence: [
      {
        id: 'e1',
        label: '기술 82점',
        detail: '프로젝트 v0.3 산출물 + 강사 코멘트 3건',
        tone: 'brand',
      },
      {
        id: 'e2',
        label: '소통 88점',
        detail: 'PR 리뷰 28건 + 멘토 평가',
        tone: 'info',
      },
      {
        id: 'e3',
        label: '기록 12건',
        detail: 'PeerReputation 5건 평균 · 회의록 12',
        tone: 'accent',
      },
    ],
    projects: [
      {
        id: 'p1',
        kind: 'PROJECT',
        title: 'Encore Mart — 마이크로서비스 백엔드',
        meta: '주문 도메인 · 강사 승인 · 5/35',
      },
      {
        id: 'p2',
        kind: 'PROJECT',
        title: '운영 LLM 추천 파이프라인',
        meta: '추천 시스템 팀 · 진행 67%',
      },
      {
        id: 'p3',
        kind: 'RECORD',
        title: '블로그 12편 일괄 · 자격증 1건',
        meta: 'PCCE 승인 · 5/13',
      },
    ],
    checklist: [
      {
        id: 'c1',
        label: '점수 재산정 반영',
        sub: '재응시 점수가 역량 증명서에 반영됨',
        done: true,
      },
      {
        id: 'c2',
        label: '핵심 지표 산정 가능',
        sub: '교육시간·출석률·시험평균 산정 가능',
        done: true,
        actionLabel: '리포트 보기',
      },
      {
        id: 'c3',
        label: '대표 프로젝트 1건 강사 승인',
        sub: '프로젝트 v0.3 강사 승인 완료',
        done: true,
      },
      {
        id: 'c4',
        label: '개인정보 점검',
        sub: '공개 payload 민감정보 없음',
        done: true,
      },
      {
        id: 'c5',
        label: '대표 기록 강사 승인',
        sub: '8주차 블로그 승인 대기',
        done: false,
        actionLabel: '기록실 이동',
      },
    ],
    checkDoneLabel: '4 / 5',
    // ── v2 (CERT_V2) ──
    aiProfile: {
      rows: [
        { label: '업무', value: '체계적 플래너형' },
        { label: '리더십', value: '서번트 리더' },
        { label: '학습', value: '가속 학습형' },
        { label: '소통', value: '논리적 설명가' },
        { label: '기술', value: '마이크로서비스 백엔드 엔지니어' },
      ],
      summary:
        '프론트 경험 위에 백엔드·분산 시스템을 쌓은 가속 학습형. 체계적 문제해결과 팀원 지원을 즐기며 후반부에 폭발 성장',
      strengths:
        '데이터 기반 문제해결 · 트랜잭션/분산 설계 · 코드 리뷰 리딩 · 프론트+백엔드 크로스',
      growth: '새 기술 초기 시행착오 · 리더 역할 스트레스 관리',
    },
    personas: [
      { rank: 1, title: '분산 시스템에 강한 백엔드 엔지니어' },
      { rank: 2, title: '실행형 트러블슈터' },
      { rank: 3, title: '비즈니스 임팩트 드리븐 설계자' },
    ],
    domains: [
      { label: '커머스 · 주문/결제', pct: 40, tone: 'info' },
      { label: '추천 · LLM 파이프라인', pct: 30, tone: 'success' },
      { label: '인프라 · DevOps', pct: 20, tone: 'warning' },
      { label: '데이터 · 분석', pct: 10, tone: 'accent' },
    ],
    ontology: {
      nodes: [
        { id: 'me', label: '김수강', x: 50, y: 50, kind: 'self' },
        { id: 'be', label: '백엔드', x: 28, y: 30, kind: 'subject' },
        { id: 'db', label: 'DB·SQL', x: 70, y: 28, kind: 'subject' },
        { id: 'cloud', label: '클라우드', x: 74, y: 72, kind: 'subject' },
        { id: 'algo', label: '알고리즘', x: 26, y: 72, kind: 'subject' },
        { id: 'java', label: 'Java', x: 16, y: 18, kind: 'skill' },
        { id: 'spring', label: 'Spring', x: 40, y: 15, kind: 'skill' },
        { id: 'kafka', label: 'Kafka', x: 60, y: 15, kind: 'skill' },
        { id: 'pg', label: 'PostgreSQL', x: 86, y: 34, kind: 'skill' },
        { id: 'docker', label: 'Docker', x: 90, y: 58, kind: 'skill' },
        { id: 'aws', label: 'AWS', x: 82, y: 86, kind: 'skill' },
        { id: 'msa', label: 'MSA', x: 52, y: 33, kind: 'method' },
        { id: 'tx', label: '트랜잭션', x: 62, y: 44, kind: 'method' },
        { id: 'mart', label: 'Encore Mart', x: 44, y: 64, kind: 'project' },
        { id: 'llm', label: 'LLM 추천', x: 64, y: 62, kind: 'project' },
        { id: 'commerce', label: '커머스', x: 38, y: 86, kind: 'domain' },
        { id: 'reco', label: '추천', x: 78, y: 78, kind: 'domain' },
      ],
      edges: [
        ['me', 'be'],
        ['me', 'db'],
        ['me', 'cloud'],
        ['me', 'algo'],
        ['me', 'msa'],
        ['me', 'tx'],
        ['me', 'mart'],
        ['me', 'llm'],
        ['be', 'java'],
        ['be', 'spring'],
        ['be', 'kafka'],
        ['db', 'pg'],
        ['cloud', 'docker'],
        ['cloud', 'aws'],
        ['msa', 'mart'],
        ['tx', 'mart'],
        ['mart', 'kafka'],
        ['mart', 'pg'],
        ['mart', 'commerce'],
        ['llm', 'db'],
        ['llm', 'reco'],
      ],
    },
  },
  tech: {
    avgScore: 83,
    certCount: 1,
    categories: [
      {
        label: '백엔드 기초 (Java · Spring)',
        sub: 'Quiz #1–4 평균 92.5',
        score: 92,
        percentile: '상위 6%',
      },
      {
        label: 'DB / SQL',
        sub: 'Quiz #5–7 평균 84.2 · PCSQL 응시 예정',
        score: 84,
        percentile: '상위 14%',
      },
      {
        label: '네트워크 · OS',
        sub: 'Quiz #8–9 평균 78.0',
        score: 78,
        percentile: '상위 22%',
      },
      {
        label: '알고리즘 · 자료구조',
        sub: 'Quiz #10–11 평균 71.5 — 보완 필요',
        score: 71,
        percentile: '상위 35%',
      },
      {
        label: '클라우드 · DevOps',
        sub: 'Quiz #12 80점 · 자격증 PCCE 1건',
        score: 80,
        percentile: '상위 19%',
      },
      {
        label: '트러블슈팅 · 디버깅',
        sub: '실습 검증 8건 · 코드 리뷰 12회',
        score: 88,
        percentile: '상위 9%',
      },
    ],
    examTrend: [70, 74, 72, 78, 75, 80, 82, 80, 85, 84, 88, 90],
    certs: [
      {
        name: 'PCCE — 파이썬 코딩 입문',
        detail: '발급 2026-06-12 · 검증 URL 보유',
        statusLabel: '승인',
        statusTone: 'success',
      },
      {
        name: 'PCCP — 파이썬 코딩 전문',
        detail: '제출 2026-08-14 · 운영자 검토 보기',
        statusLabel: '검토 중',
        statusTone: 'warning',
      },
      {
        name: 'PCSQL — SQL 개발자 1급',
        detail: '2026-10-10 응시 예정 · 자가 등록',
        statusLabel: '응시 예정',
        statusTone: 'info',
      },
    ],
    assignments: [
      {
        week: 'W08',
        title: 'Spring REST API + JWT 인증',
        type: '실습',
        status: '완료',
      },
      {
        week: 'W10',
        title: 'Kafka 이벤트 라우팅 미니 프로젝트',
        type: '과제',
        status: '완료',
      },
      {
        week: 'W12',
        title: '트랜잭션 격리 수준 비교 분석',
        type: '리포트',
        status: '—',
      },
      {
        week: 'W14',
        title: 'MSA 도서 추천 — 시스템 설계 발표',
        type: '실습',
        status: '완료',
      },
    ],
    // ── v2 (CERT_V2) ──
    aiVerdict: {
      strength:
        '백엔드 기초·트러블슈팅이 누적 상위 10% — 분산/트랜잭션 설계가 실전 뒷받침.',
      gap: '알고리즘(상위 35%)·네트워크가 상대적 약점, PCSQL 외부 인증으로 보완 중.',
      unique: '프론트 2년 경험 위 백엔드 전환 → 풀스택 E2E 설계 가능.',
    },
  },
  projects: {
    certifiedLabel: '2 / 3',
    contribAvg: '36%',
    projects: [
      {
        id: 'pj1',
        badge: 'PROJECT 1',
        certified: true,
        title: 'Encore Mart — 마이크로서비스 백엔드',
        period: '2026.07 — 2026.09',
        role: '팀 · 백엔드 리드',
        contrib: '38%',
        tags: ['Java 17', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Docker'],
        outcomes: [
          '주문/결제 도메인 분리 · 트랜잭션 격리 수준 정합',
          'Kafka 이벤트 라우팅 — 결제 실패 retry 95% 안정화',
          'API 응답 평균 320ms → 145ms (-55%)',
        ],
      },
      {
        id: 'pj2',
        badge: 'PROJECT 2',
        certified: true,
        title: '한국어 회의록 요약 LLM 파이프라인',
        period: '2026.05 — 2026.06',
        role: '개인 · 100%',
        contrib: '100%',
        tags: ['Python', 'Whisper', 'GPT-4', 'KoBART', 'FastAPI'],
        outcomes: [
          'Whisper STT + GPT-4 한국어 회의록 요약 자동화',
          'KoBART 추출 요약 ROUGE-L 0.873',
          '회의록 35건 검증 · 평균 처리 시간 12초',
        ],
      },
    ],
    matrix: Array.from({ length: 84 }, (_, i) => (i * 3 + 1) % 4),
    ai: {
      summary:
        '응답 320→145ms·결제 자동복구 95%는 Kafka 이벤트 라우팅 + 트랜잭션 격리 재설계의 결과. 배포·모니터링까지 이어져 E2E 운영 가능 수준을 입증.',
    },
    commitActivity: mockCommitActivity,
  },
  problem: {
    kpis: [
      {
        key: 'cases',
        label: '인증 사례',
        value: '12',
        unit: '건',
        delta: 'STAR 구조 인증 반영',
        deltaTone: 'brand',
      },
      {
        key: 'independent',
        label: '독립 해결률',
        value: '83',
        unit: '%',
        delta: '독립 10건 / 동료 도움 2건',
        deltaTone: 'brand',
      },
      {
        key: 'avgdays',
        label: '평균 해결 일수',
        value: '2.3',
        unit: '일',
        delta: '문제 발생 → 해결 평균',
        deltaTone: 'info',
      },
      {
        key: 'tags',
        label: '협업 태그',
        value: '37',
        unit: '회',
        delta: 'PeerTag 5종 누적',
        deltaTone: 'accent',
      },
    ],
    cases: [
      {
        id: 'pc1',
        badge: 'DB',
        badgeTone: 'info',
        resolved: true,
        days: '3일',
        title: 'PostgreSQL 데드락 — 결제 트랜잭션 격리 수준',
        detail: '결제 동시 처리 시 데드락 → 격리 수준 재설계, 실패율 8% → 0.2%',
      },
      {
        id: 'pc2',
        badge: 'DEPLOY',
        badgeTone: 'accent',
        resolved: true,
        days: '2일',
        title: 'Kafka 컨슈머 ack 미반영 — 메시지 중복 발생',
        detail:
          'ack 누락 → 컨슈머 재시작 시 중복 처리. enable.auto.commit=false 전환',
      },
      {
        id: 'pc3',
        badge: 'PERF',
        badgeTone: 'warning',
        resolved: true,
        days: '1일',
        title: 'N+1 쿼리 — 사용자 주문 목록 응답 7초',
        detail: '@EntityGraph + fetch join 설계, 응답 7s → 380ms (-94%)',
      },
    ],
    distribution: [
      { label: 'DB / SQL', count: '4건 · 33%', pct: 33, tone: 'info' },
      { label: '배포 / 인프라', count: '3건 · 25%', pct: 25, tone: 'accent' },
      { label: '성능 / 메모리', count: '2건 · 17%', pct: 17, tone: 'warning' },
      { label: '네트워크 / API', count: '2건 · 17%', pct: 17, tone: 'brand' },
      { label: '기타', count: '1건 · 8%', pct: 8, tone: 'success' },
    ],
    tags: [
      { tag: '#논리적설득', count: 10, tone: 'info' },
      { tag: '#문제해결', count: 7, tone: 'brand' },
      { tag: '#리더십', count: 6, tone: 'accent' },
      { tag: '#코드리뷰', count: 5, tone: 'success' },
      { tag: '#책임감', count: 4, tone: 'warning' },
      { tag: '#성장', count: 3, tone: 'info' },
      { tag: '#팀워크', count: 2, tone: 'accent' },
    ],
    tagCases: [
      {
        tag: '#논리적설득',
        tone: 'info',
        detail:
          'PostgreSQL 격리 수준 논의 — 팀 회의에서 isolation level 변경 설득',
      },
      {
        tag: '#문제해결',
        tone: 'brand',
        detail: 'Kafka 메시지 중복 — ack 처리 패턴 변경 후 7건 자동 복구',
      },
      {
        tag: '#리더십',
        tone: 'accent',
        detail: 'Encore Mart 도메인 분리 — 백엔드 4인 가이드',
      },
      {
        tag: '#코드리뷰',
        tone: 'success',
        detail: 'PR 22 · 동료 코드 리뷰 평균 4.8 / 5.0',
      },
    ],
    ai: {
      caps: [
        {
          label: '데이터·트랜잭션 처리',
          score: 95,
          tag: '#문제해결',
          tone: 'success',
        },
        {
          label: '장애 대응·디버깅',
          score: 90,
          tag: '#책임감',
          tone: 'success',
        },
        { label: '인프라·배포', score: 85, tag: '#팀워크', tone: 'info' },
      ],
      style:
        '개인 프로파일링 → 수치 검증 → 문서화로 일관. 해결 후 팀 전파(리뷰·일정 공유)가 강점.',
      scaling: '단일 모듈 디버깅 → 파이프라인·시스템 범위로 해결 영역 확장.',
    },
  },
  growth: {
    timeline: [
      {
        date: '2026-06-04',
        type: '성취도',
        title: '파이썬 기초·데이터 처리 성취도 평가',
        score: 54,
      },
      {
        date: '2026-06-27',
        type: 'CS',
        title: '자료구조·운영체제 CS 평가',
        score: 58,
      },
      {
        date: '2026-07-31',
        type: '성취도',
        title: 'SQL·Pandas·웹 개발 통합 성취도 평가',
        score: 68,
      },
      {
        date: '2026-08-26',
        type: '성취도',
        title: '머신러닝·딥러닝 모델링 성취도 평가',
        score: 75,
      },
      {
        date: '2026-09-24',
        type: 'CS',
        title: '네트워크·데이터베이스 CS 평가',
        score: 80,
      },
      {
        date: '2026-10-15',
        type: '성취도',
        title: 'LLM·RAG·AWS 배포 성취도 평가',
        score: 86,
      },
    ],
    peerAverage: 4.6,
    peerEvaluationCount: 12,
    reputation: [
      { key: '기술', score: 4.6, detail: 'PR 22 · 코드 리뷰 평균 4.6' },
      {
        key: '책임감',
        score: 4.8,
        detail: '리더십 평가 #1 · 동료 평가 5인 일관',
      },
      { key: '소통', score: 4.5, detail: '논리적설득 10회 · 코드리뷰 5회' },
      { key: '성장', score: 4.3, detail: '6개월 성취도·CS 점수 상승' },
      { key: '팀워크', score: 4.5, detail: 'Encore Mart 백엔드 4인 협업' },
    ],
    shortComments: [
      {
        quote: '"디버깅 접근이 논리적. 격리 수준 문제를 팀에 잘 설명함."',
        by: '백엔드 동료 A',
        tag: '#논리적설득',
      },
      {
        quote: '"PR 코드 리뷰 코멘트가 따뜻하고 구체적. 함께 일하기 좋음."',
        by: '백엔드 동료 B',
        tag: '#코드리뷰',
      },
      {
        quote: '"막힌 부분을 끝까지 파고듦. Kafka ack 처리 사례가 인상적."',
        by: '백엔드 동료 C',
        tag: '#문제해결',
      },
    ],
    recommendations: [
      {
        role: '강사',
        name: '이정훈 강사',
        meta: '백엔드 멘토링 · 6개월',
        quote:
          '"트랜잭션 격리 수준 문제를 팀 회의에서 끝까지 정리하며 합의를 끌어냈음. 협업 태도와 기술 깊이 모두 인상적."',
        date: '2026-05-10 작성',
      },
      {
        role: '멘토',
        name: '황설현 멘토',
        meta: '코드 리뷰 · 12회',
        quote:
          '"PR 코멘트 품질이 일관되게 높음. 단순 지적이 아닌 구조적 개선 제안이 많아 동료 4인의 코드 품질에 함께 영향을 줌."',
        date: '2026-05-08 작성',
      },
    ],
    sentiment: {
      bubbles: [
        { label: '학습 불안', x: 16, y: 36, r: 13, phase: 'early' },
        { label: '적응', x: 24, y: 58, r: 11, phase: 'early' },
        { label: '진로 고민', x: 11, y: 18, r: 8, phase: 'early' },
        { label: 'SQL 난관', x: 42, y: 28, r: 12, phase: 'mid' },
        { label: '스트레스', x: 47, y: 54, r: 14, phase: 'mid' },
        { label: '멘토링', x: 35, y: 44, r: 10, phase: 'mid' },
        { label: '자기효능감', x: 66, y: 28, r: 13, phase: 'late' },
        { label: '성취감', x: 73, y: 50, r: 15, phase: 'late' },
        { label: '코드리뷰 1위', x: 84, y: 36, r: 12, phase: 'late' },
        { label: '자신감', x: 88, y: 60, r: 10, phase: 'late' },
        { label: '성장 회고', x: 60, y: 64, r: 10, phase: 'late' },
      ],
      trend: 'V자 변동형: 위기(4주차) → 멘토링 → 급반등',
    },
  },
}

const mockChanges: CertChangesData = {
  roundLabel: '1차 보완 요청',
  summaryTitle: '정식 인증 전, 아래 3개 항목을 보완해 주세요',
  summarySub:
    '보완 완료 후 [정식 인증 재요청] 버튼이 활성화됩니다 · 매니저가 다시 검토합니다.',
  requestedAt: '2026-05-12 14:30',
  reviewer: '매니저 박지수',
  replyWithin: '1영업일 이내',
  reasons: [
    {
      id: 'r1',
      no: 1,
      tags: [
        { label: '근거 자료 누락', tone: 'warning' },
        { label: '대상: 마이 프로필', tone: 'info' },
      ],
      title: 'GitHub URL과 블로그 URL을 추가해 주세요',
      detail:
        '외부 검증자가 보는 메인 페이지로 학습 활동을 확인합니다. GitHub URL과 블로그 URL이 비어 있어 근거 확인이 어려우니, 입력 후 재요청 부탁드립니다.',
      actionLabel: '마이 프로필 이동',
    },
    {
      id: 'r2',
      no: 2,
      tags: [
        { label: '미승인 산출물', tone: 'accent' },
        { label: '대상: 기록실', tone: 'info' },
      ],
      title: '대표 기록의 강사 승인 완료 후 재요청해 주세요',
      detail:
        '대표 기록으로 선택한 8주차 블로그 "JPA 영속성 컨텍스트 정리"가 아직 검토 중입니다. 강사 승인이 완료된 산출물만 정식 인증 근거로 사용됩니다.',
      actionLabel: '기록실 이동',
    },
    {
      id: 'r3',
      no: 3,
      tags: [
        { label: '점수 재요청 필요', tone: 'danger' },
        { label: '대상: 점수', tone: 'info' },
      ],
      title: 'JPA 영속성 컨텍스트 퀴즈를 재응시해 주세요',
      detail:
        '해당 퀴즈 결과가 동료 평균보다 낮게 산출되어 역량 증명서가 갱신되지 않았습니다. 재응시 후 점수가 반영되면 재요청해 주세요.',
      actionLabel: '역량 증명서 이동',
    },
  ],
  relatedAreas: [
    {
      id: 'a1',
      letter: 'P',
      letterTone: 'accent',
      label: '프로필',
      status: '보완 항목 1건',
      done: false,
    },
    {
      id: 'a2',
      letter: 'S',
      letterTone: 'success',
      label: '점수',
      status: '보완 항목 1건',
      done: false,
    },
    {
      id: 'a3',
      letter: 'R',
      letterTone: 'info',
      label: '기록',
      status: '보완 항목 1건',
      done: false,
    },
    {
      id: 'a4',
      letter: 'Pj',
      letterTone: 'brand',
      label: '프로젝트',
      status: '보완 사항 없음',
      done: true,
    },
    {
      id: 'a5',
      letter: 'Pi',
      letterTone: 'brand',
      label: '개인정보',
      status: '보완 사항 없음',
      done: true,
    },
  ],
  checklist: [
    {
      id: 'c1',
      label: 'GitHub URL · 블로그 URL 입력 완료',
      sub: '프로필 마이페이지 — 마이 프로필에서 추가하세요',
      done: false,
      actionLabel: '프로필 이동',
    },
    {
      id: 'c2',
      label: '대표 기록 강사 승인 완료',
      sub: '8주차 블로그 검토 대기 중 — 강사 승인 시 자동 완료',
      done: false,
      actionLabel: '기록실 이동',
    },
    {
      id: 'c3',
      label: 'JPA 영속성 컨텍스트 퀴즈 재응시 완료',
      sub: '역량 증명서의 해당 카테고리에서 재응시 가능',
      done: false,
      actionLabel: '역량 증명서 이동',
    },
  ],
  checkDoneLabel: '0 / 3',
}

const mockPublication: CertPublicationData = {
  issuedBadge: 'CERTIFIED · 정식 인증 완료',
  issuedLabel: '수강 역량 증명서 발급 완료',
  issuedSub: '김수강 · 백엔드 부트캠프 3기 · 인증일 2026.05.14',
  verifyId: 'VERIFY-2026-BB23-K1234',
  urlIssueDate: '2026-05-15 · 다음날 자동 활성',
  // 토큰 경로(새 탭 이동) / 표시·복사용 URL은 publicUrl 별도.
  verifyUrl: '/verify/vfy_kp9q4r2nx0',
  publicUrl: 'https://verify.playdata.io/v/abc123ef9456',
  urlToggle: {
    id: 'url',
    label: '외부 검증 URL 공개',
    badge: '공개 가능',
    sub: '수료일 다음날 00:00 KST 이후 활성 · 운영자 최신화 이후 외부 반영',
    on: false,
    info: '현재 비공개 — 외부 검증자가 URL에 접근하면 비공개 안내만 표시됩니다. 정식 인증 마크는 유지됩니다.',
  },
  growthToggles: [
    {
      id: 'peer',
      label: 'PeerReputation (동료 5축 평균)',
      sub: '외부 공개 페이로드에 포함 시 검증자가 5축 점수 확인 가능',
      on: false,
    },
    {
      id: 'short',
      label: 'ShortComment',
      sub: '동료가 작성한 짧은 코멘트 최대 5개 공개 — 기본 OFF',
      on: false,
    },
  ],
  recommendRow: {
    label: '강사·멘토 추천서',
    tag: '자동 · 토글 없음',
    sub: '개별 토글 없음 — 인증 완료 + 최신화 이후 공개 스냅샷에 포함됨',
    chip: '최신화 이후 포함',
  },
  preview: {
    name: '수강 Kim',
    period: '백엔드 부트캠프 · 3기 · 2025.11 ~ 2026.05',
    metrics: [
      { v: '86', l: '종합 점수' },
      { v: '96%', l: '출석률' },
      { v: '2', l: '인증 프로젝트' },
      { v: 'A', l: '등급' },
    ],
  },
  onItems: [
    { mark: 'check', text: '증명서 헤더 (이름·과정·기간)' },
    { mark: 'check', text: '종합 점수 + 6축 레이더' },
    { mark: 'check', text: '대표 프로젝트·기록 (강사 인증 항목)' },
    { mark: 'check', text: '검증 QR + 검증 ID' },
    { mark: 'dot', text: 'PeerReputation / ShortComment (별도 토글)' },
  ],
  offItems: [
    { mark: 'dot', text: '검증 페이지 접근 시 비공개 안내만' },
    { mark: 'dot', text: '본문 데이터 노출 없음' },
    { mark: 'check', text: '정식 인증 마크는 유지' },
    { mark: 'check', text: '수강생 본인 페이지에서는 정상 확인' },
  ],
}

// AI 상담 감성 분석 결과(목) — 실제로는 녹음 음성→STT→키워드 추출 산출물.
// 정적 미리보기(mockOverview.sentiment)와 구분되게 "새로 분석된" 톤으로 구성.
const analyzedSentiment: CertSentiment = {
  bubbles: [
    { label: '진로 불안', x: 14, y: 30, r: 12, phase: 'early' },
    { label: '번아웃', x: 23, y: 54, r: 13, phase: 'early' },
    { label: '방향 고민', x: 10, y: 16, r: 8, phase: 'early' },
    { label: '협업 갈등', x: 40, y: 26, r: 11, phase: 'mid' },
    { label: '자료구조 난관', x: 48, y: 52, r: 13, phase: 'mid' },
    { label: '멘토 조언', x: 34, y: 42, r: 10, phase: 'mid' },
    { label: '루틴 회복', x: 64, y: 30, r: 12, phase: 'late' },
    { label: '성취감', x: 74, y: 52, r: 15, phase: 'late' },
    { label: '발표 자신감', x: 85, y: 36, r: 12, phase: 'late' },
    { label: '동료 신뢰', x: 88, y: 62, r: 10, phase: 'late' },
  ],
  trend: '하강 후 회복형: 번아웃(상담 초반) → 멘토 조언 → 후반 자신감 회복',
}

const certificateApiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  ) || '/api'

export const CERTIFICATE_MOCK_ENDPOINTS = {
  overview: `${certificateApiBase}/student/certificate`,
  changes: `${certificateApiBase}/student/certificate/changes`,
  publication: `${certificateApiBase}/student/certificate/publication`,
  sentiment: `${certificateApiBase}/student/certificate/sentiment/analyze`,
} as const

export const handlers = [
  http.get(CERTIFICATE_MOCK_ENDPOINTS.overview, () =>
    ok<CertificateOverview>(mockOverview),
  ),
  http.get(CERTIFICATE_MOCK_ENDPOINTS.changes, () =>
    ok<CertChangesData>(mockChanges),
  ),
  http.get(CERTIFICATE_MOCK_ENDPOINTS.publication, () =>
    ok<CertPublicationData>(mockPublication),
  ),
  // 녹음 업로드 → 분석. 실제 처리시간을 흉내내 약 2.2초 지연 후 결과 반환.
  http.post(CERTIFICATE_MOCK_ENDPOINTS.sentiment, async () => {
    await delay(2200)
    return ok<CertSentiment>(analyzedSentiment)
  }),
]
