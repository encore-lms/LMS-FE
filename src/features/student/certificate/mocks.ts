import { delay, http, HttpResponse } from 'msw'
import type {
  CertChangesData,
  CertificateOverview,
  CertProjectsTab,
  CertPublicationData,
  CertSentiment,
} from './types'

// 수강 역량 증명서 mock — 기능 로컬. 자동 수집 규약: `export const handlers`.
// 데이터는 Figma 증명서 미리보기(249:27) 시안 재현. 탭1(종합 요약) 포함.
const ok = <T>(data: T) => HttpResponse.json({ data })

export const mockOverview: CertificateOverview = {
  header: {
    studentName: '황수빈',
    courseName: 'SK네트웍스 Family AI 캠프',
    cohortName: '34기',
    periodLabel: '2026.06.16 — 2026.12.08',
    certId: 'VERIFY-2026-1D04-1D04',
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
    overallScore: 94.4,
    scoreMax: 100,
    grade: 'A',
    scoreDelta: '+2.4점 지난주',
    confirmedLabel: 'confirmed',
    ratioLabel: '6 / 6',
    sourceLabel: '자동 + 360°',
    kpis: [
      {
        key: 'attendance',
        label: '출석률',
        value: '100',
        unit: '%',
        tone: 'success',
        bar: 100,
        sub: '기록 6일 · 출석 3 · 지각 3 · 결석 0',
      },
      {
        key: 'exam',
        label: '시험 평균',
        value: '98',
        unit: '점',
        tone: 'info',
        bar: 98,
        sub: '역량 점검 2회 · 100점 / 96점',
      },
      {
        key: 'blog',
        label: '학습 기록',
        value: '13',
        unit: '건',
        tone: 'accent',
        bar: 100,
        sub: '블로그 8 · 스터디 3 · 자격증 2',
      },
      {
        key: 'project',
        label: '인증 프로젝트',
        value: '1',
        unit: '/ 1',
        tone: 'success',
        bar: 100,
        sub: '강사 인증 완료 1건',
      },
    ],
    // 6축은 34기 황수빈의 실제 활동에서 유도한 값이다(집계 BE 가 생기면 이 산식을 옮긴다).
    // 공개 검증(/verify)도 같은 값을 쓴다 — 두 화면이 어긋나면 검증자가 신뢰하지 않는다.
    skillAxes: [
      {
        key: '기술·기술기여',
        score: 98.6,
        peer: 88,
        confirmed: true,
        note: '퀴즈 평균 98.0 · 인증 프로젝트 1/1',
      },
      {
        key: '소통·협업·팀워크',
        score: 90,
        peer: 92,
        confirmed: true,
        note: '멘토링 3/3 참석 · 멘토링 팀 4인 · Q&A 3건 채택',
      },
      {
        key: '책임감',
        score: 100,
        peer: 90,
        confirmed: true,
        note: '출석률 100% · 기록 8/8주',
      },
      {
        key: '학습지속성',
        score: 100,
        peer: 100,
        confirmed: true,
        note: '출석 70 + 블로그 30 + 가산 8.7 = 100(상한)',
      },
      {
        key: '성취도 평가',
        score: 98,
        peer: 98,
        confirmed: true,
        note: '역량 점검 2회 평균 · 100점 / 96점',
      },
      {
        key: '문제해결',
        score: 80,
        peer: 82,
        confirmed: true,
        note: '인증 3/5 · 독립 해결 1건',
      },
    ],
    skillAvg: 94.4,
    // 실제 응시한 역량 점검 2회의 카테고리 구성(1차 Python · 2차 SQL).
    quizCategories: [
      { label: 'Python 자료형·컬렉션', score: 100 },
      { label: 'Python 함수·예외', score: 100 },
      { label: 'SQL 조인·집계', score: 96 },
      { label: 'SQL 인덱스·트랜잭션', score: 96 },
      { label: '컴프리헨션·모듈', score: 100 },
    ],
    evidence: [
      {
        id: 'e1',
        label: '기술 98.6점',
        detail: '역량 점검 100 / 96 · 인증 프로젝트 1건',
        tone: 'brand',
      },
      {
        id: 'e2',
        label: '문제해결 80점',
        detail: '트러블슈팅 인증 3건 · 독립 해결 1건',
        tone: 'info',
      },
      {
        id: 'e3',
        label: '학습 기록 13건',
        detail: '블로그 8 · 스터디 3 · 자격증 2 · 8주 연속',
        tone: 'accent',
      },
    ],
    projects: [
      {
        id: 'p1',
        kind: 'PROJECT',
        title: '채용 공고로 보는 데이터 직무 기술 스택 지도',
        meta: '개인 프로젝트 · 강사 인증 완료',
      },
      {
        id: 'p2',
        kind: 'RECORD',
        title: '트러블슈팅 인증 3건',
        meta: 'pandas merge · 데이터 누수 · Git rebase',
      },
      {
        id: 'p3',
        kind: 'RECORD',
        title: '블로그 8편 · 스터디 3회 · 자격증 2건',
        meta: 'SQLD · PCCE 승인 · 8주 연속 제출',
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
        { label: '업무', value: '기록으로 남기는 완결형' },
        { label: '리더십', value: '스터디 운영형' },
        { label: '학습', value: '꾸준한 축적형' },
        { label: '소통', value: '질문을 구조화하는 설명가' },
        { label: '기술', value: '데이터 수집·분석 파이프라인' },
      ],
      summary:
        'Python·SQL 기초를 다진 뒤 채용 데이터 수집·분석 프로젝트로 확장한 축적형. 배운 것을 블로그·스터디로 공유하며 꾸준히 성장',
      strengths:
        '수집·정규화 파이프라인 · SQL 실행 계획 분석 · 검증 규칙화 · 기록 공유',
      growth: '머신러닝 범위 확장(3차 역량 점검 예정) · 팀 협업 경험 축적',
    },
    personas: [
      { rank: 1, title: '수집부터 검증까지 완결하는 데이터 분석가' },
      { rank: 2, title: '기록으로 남기는 문제해결러' },
      { rank: 3, title: '스터디를 운영하는 꾸준한 학습자' },
    ],
    domains: [
      { label: '데이터 · 채용 시장 분석', pct: 100, tone: 'accent' },
    ],
    ontology: {
      nodes: [
        { id: 'me', label: '황수빈', x: 50, y: 50, kind: 'self' },
        { id: 'py', label: 'Python', x: 28, y: 30, kind: 'subject' },
        { id: 'db', label: 'SQL·DB', x: 70, y: 28, kind: 'subject' },
        { id: 'da', label: '데이터 분석', x: 74, y: 72, kind: 'subject' },
        { id: 'ml', label: '머신러닝', x: 26, y: 72, kind: 'subject' },
        { id: 'pandas', label: 'pandas', x: 16, y: 18, kind: 'skill' },
        { id: 'bs', label: 'BeautifulSoup', x: 40, y: 15, kind: 'skill' },
        { id: 'git', label: 'Git', x: 60, y: 15, kind: 'skill' },
        { id: 'pg', label: 'PostgreSQL', x: 86, y: 34, kind: 'skill' },
        { id: 'st', label: 'Streamlit', x: 90, y: 58, kind: 'skill' },
        { id: 'sk', label: 'scikit-learn', x: 12, y: 60, kind: 'skill' },
        { id: 'prep', label: '전처리·정규화', x: 52, y: 33, kind: 'method' },
        { id: 'cv', label: '교차검증', x: 38, y: 62, kind: 'method' },
        { id: 'map', label: '채용 스택 지도', x: 64, y: 62, kind: 'project' },
        { id: 'jobmkt', label: '채용·시장 분석', x: 78, y: 78, kind: 'domain' },
      ],
      edges: [
        ['me', 'py'],
        ['me', 'db'],
        ['me', 'da'],
        ['me', 'ml'],
        ['me', 'map'],
        ['py', 'pandas'],
        ['py', 'bs'],
        ['py', 'git'],
        ['db', 'pg'],
        ['da', 'st'],
        ['da', 'prep'],
        ['ml', 'sk'],
        ['ml', 'cv'],
        ['prep', 'map'],
        ['map', 'pandas'],
        ['map', 'pg'],
        ['map', 'st'],
        ['map', 'jobmkt'],
      ],
    },
  },
  tech: {
    // 실측 — 역량 점검 2회(100·96) + CS 점검 4회(85·80·90·95) · 승인 자격증 2건.
    avgScore: 91,
    certCount: 2,
    categories: [
      {
        label: 'Python · 자료구조',
        sub: '1차 역량 점검 100점',
        score: 100,
        percentile: '상위 0.3%',
      },
      {
        label: 'SQL · 관계형 DB',
        sub: '2차 역량 점검 96점 · SQLD 승인',
        score: 96,
        percentile: '상위 3%',
      },
      {
        label: 'CS · 자료구조·알고리즘',
        sub: 'CS 점검 1차 85점',
        score: 85,
        percentile: '상위 12%',
      },
      {
        label: 'CS · 운영체제',
        sub: 'CS 점검 2차 80점',
        score: 80,
        percentile: '상위 18%',
      },
      {
        label: 'CS · 네트워크',
        sub: 'CS 점검 3차 90점',
        score: 90,
        percentile: '상위 8%',
      },
      {
        label: 'CS · 데이터베이스',
        sub: 'CS 점검 4차 95점',
        score: 95,
        percentile: '상위 4%',
      },
      {
        label: '데이터 분석 · 머신러닝',
        sub: '3차 역량 점검 08-14 예정',
        score: 0,
        percentile: '응시 예정',
      },
    ],
    examTrend: [100, 85, 80, 96, 90, 95],
    certs: [
      {
        name: 'SQLD 개발자 자격',
        detail: '기록실 제출 2026-08-10 · 매니저 승인',
        statusLabel: '승인',
        statusTone: 'success',
      },
      {
        name: 'PCCE 파이썬 코딩 실력 인증 3급',
        detail: '기록실 제출 2026-08-10 · 매니저 승인',
        statusLabel: '승인',
        statusTone: 'success',
      },
    ],
    assignments: [
      {
        week: 'W07',
        title: '첫 분류 모델 만들고 평가하기',
        type: '실습',
        status: '완료',
      },
      {
        week: 'W08',
        title: '1차 미니 프로젝트 중간 점검 자료',
        type: '과제',
        status: '완료',
      },
      {
        week: 'W09',
        title: '교차검증과 하이퍼파라미터 탐색',
        type: '실습',
        status: '완료',
      },
      {
        week: 'W10',
        title: '1차 미니 프로젝트 최종 산출물',
        type: '과제',
        status: '—',
      },
    ],
    // ── v2 (CERT_V2) ──
    aiVerdict: {
      strength:
        'Python·SQL 역량 점검 평균 98점 · CS 점검 우상향(80→95) — 프로젝트 수행이 이론을 뒷받침.',
      gap: '머신러닝 범위는 3차 역량 점검(08-14) 전 — 데이터 누수 사례·CS 데이터베이스 95점으로 기반은 확인됨.',
      unique: '해결한 문제를 템플릿·규칙으로 만들어 재사용하는 기록 습관.',
    },
  },
  projects: createMockCertificateProjects(),
  problem: {
    // 실측 — 전체 5건 중 강사 인증 3건 · 독립 해결 1건 · 평균 1.3일.
    kpis: [
      {
        key: 'cases',
        label: '인증 사례',
        value: '3',
        unit: '건',
        delta: 'STAR 구조 인증 반영',
        deltaTone: 'brand',
      },
      {
        key: 'independent',
        label: '독립 해결률',
        value: '33',
        unit: '%',
        delta: '독립 1건 / 도움 받아 해결 2건',
        deltaTone: 'brand',
      },
      {
        key: 'avgdays',
        label: '평균 해결 일수',
        value: '1.3',
        unit: '일',
        delta: '문제 발생 → 해결 평균',
        deltaTone: 'info',
      },
      {
        key: 'tags',
        label: '작성 중 사례',
        value: '2',
        unit: '건',
        delta: 'matplotlib · Jupyter 메모리',
        deltaTone: 'accent',
      },
    ],
    cases: [
      {
        id: 'pc1',
        badge: 'DATA',
        badgeTone: 'info',
        resolved: true,
        days: '1일',
        title: 'pandas merge 후 행 수가 3배로 늘어난 문제',
        detail: '조인 키 중복 → 키 유일화 + validate 옵션, 행 수 원본 일치',
      },
      {
        id: 'pc2',
        badge: 'ML',
        badgeTone: 'warning',
        resolved: true,
        days: '2일',
        title: 'StandardScaler를 전체 데이터에 fit 해서 성능이 부풀려진 문제',
        detail: '데이터 누수 → Pipeline 으로 스케일링을 교차검증 안쪽으로 이동',
      },
      {
        id: 'pc3',
        badge: 'GIT',
        badgeTone: 'accent',
        resolved: true,
        days: '1일',
        title: 'Git rebase 중 충돌을 잘못 해결해 동료 커밋을 날린 문제',
        detail: 'reflog 로 이전 커밋 복구 · rebase 전 백업 브랜치 규칙화',
      },
    ],
    distribution: [
      { label: '환경', count: '2건 · 40%', pct: 40, tone: 'success' },
      { label: '데이터', count: '1건 · 20%', pct: 20, tone: 'info' },
      { label: '머신러닝', count: '1건 · 20%', pct: 20, tone: 'warning' },
      { label: '협업', count: '1건 · 20%', pct: 20, tone: 'accent' },
    ],
    tags: [
      { tag: '#문제해결', count: 3, tone: 'brand' },
      { tag: '#기록공유', count: 3, tone: 'info' },
      { tag: '#책임감', count: 2, tone: 'warning' },
      { tag: '#팀워크', count: 2, tone: 'accent' },
    ],
    tagCases: [
      {
        tag: '#문제해결',
        tone: 'brand',
        detail: 'pandas merge 행 폭증 — 키 유일성 검증을 분석 템플릿으로',
      },
      {
        tag: '#기록공유',
        tone: 'info',
        detail: '데이터 누수 사례 — Pipeline 규칙을 블로그로 공유',
      },
      {
        tag: '#팀워크',
        tone: 'accent',
        detail: 'rebase 커밋 복구 — 백업 브랜치 규칙을 팀에 전파',
      },
    ],
    ai: {
      caps: [
        {
          label: '데이터 품질 검증',
          score: 90,
          tag: '#문제해결',
          tone: 'success',
        },
        {
          label: '모델 검증·누수 차단',
          score: 82,
          tag: '#기록공유',
          tone: 'success',
        },
        { label: '협업·형상 관리', score: 78, tag: '#팀워크', tone: 'info' },
      ],
      style:
        '재현 조건 고정 → 원인 배제 → 수치 재검증으로 일관. 해결 후 템플릿·규칙화가 강점.',
      scaling: '환경 설정 문제에서 데이터 품질·모델 검증 범위로 확장.',
    },
  },
  growth: {
    // 실측 — 역량 점검 2회 + 3차 예정. 평판·추천은 아직 평가 시스템 미도입이라 mock.
    timeline: [
      {
        date: '2026-07-03',
        type: '성취도',
        title: '1차 역량 점검 — Python 기초와 자료구조',
        score: 100,
      },
      {
        date: '2026-07-10',
        type: 'CS',
        title: 'CS 점검 1차 — 자료구조와 알고리즘',
        score: 85,
      },
      {
        date: '2026-07-17',
        type: 'CS',
        title: 'CS 점검 2차 — 운영체제 기초',
        score: 80,
      },
      {
        date: '2026-07-24',
        type: '성취도',
        title: '2차 역량 점검 — SQL과 관계형 데이터베이스',
        score: 96,
      },
      {
        date: '2026-07-31',
        type: 'CS',
        title: 'CS 점검 3차 — 네트워크 기초',
        score: 90,
      },
      {
        date: '2026-08-07',
        type: 'CS',
        title: 'CS 점검 4차 — 데이터베이스 원리',
        score: 95,
      },
    ],
    peerAverage: 4.6,
    peerEvaluationCount: 3,
    reputation: [
      { key: '기술', score: 4.6, detail: '역량 점검 평균 98 · 인증 프로젝트 1건' },
      {
        key: '책임감',
        score: 4.8,
        detail: '결석 0 · 과제 9/10 · 블로그 8주 연속',
      },
      { key: '소통', score: 4.5, detail: 'Q&A 질문 3건 전부 채택' },
      { key: '성장', score: 4.3, detail: '환경 적응 → 프로젝트 인증까지 8주' },
      { key: '팀워크', score: 4.5, detail: '멘토링 팀 4인 · SQL 스터디 운영' },
    ],
    shortComments: [
      {
        quote: '"merge 행 폭증 원인을 키 중복까지 파고들어 팀 템플릿으로 만들어 줬어요."',
        by: '멘토링 팀 동료 A',
        tag: '#문제해결',
      },
      {
        quote: '"스터디에서 실행 계획 읽는 법을 차근차근 설명해 줘서 이해가 잘 됐어요."',
        by: '멘토링 팀 동료 B',
        tag: '#기록공유',
      },
      {
        quote: '"날린 커밋을 복구하고 백업 규칙까지 정리해 공유한 게 인상적이었어요."',
        by: '멘토링 팀 동료 C',
        tag: '#팀워크',
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
    sentiment: {
      bubbles: [
        { label: '환경 헤맴', x: 14, y: 34, r: 12, phase: 'early' },
        { label: 'Git 실수', x: 22, y: 56, r: 11, phase: 'early' },
        { label: '기록 습관', x: 30, y: 40, r: 10, phase: 'early' },
        { label: '스터디 운영', x: 46, y: 30, r: 12, phase: 'mid' },
        { label: '역량 점검 100점', x: 54, y: 52, r: 14, phase: 'mid' },
        { label: '데이터 누수 교훈', x: 62, y: 68, r: 10, phase: 'mid' },
        { label: '프로젝트 인증', x: 80, y: 38, r: 15, phase: 'late' },
        { label: '성취감', x: 88, y: 58, r: 12, phase: 'late' },
      ],
      trend: '우상향: 환경 적응 → 스터디·역량 점검 → 프로젝트 인증',
    },
  },
}

/** 프로젝트 탭 전용 합성 응답 — 워크스페이스 실측값을 그대로 옮긴다. */
function createMockCertificateProjects(): CertProjectsTab {
  // 34기 황수빈의 실제 프로젝트 2건 — 개인(인증 완료) + 4인 팀(진행 중, PM).
  // 성과 문구는 워크스페이스 metrics 에 실제로 저장된 값과 동일하다.
  return {
    summary: {
      totalProjectCount: 2,
      completedProjectCount: 0,
      certifiedProjectCount: 1,
      responsibilities: ['수집·정규화 설계', '분석·대시보드', '팀 PM · 모델링'],
      techStackGroups: [
        { category: '언어·분석', items: ['Python', 'pandas'] },
        { category: '수집', items: ['BeautifulSoup'] },
        { category: '데이터', items: ['PostgreSQL'] },
        { category: '머신러닝', items: ['scikit-learn', 'LightGBM'] },
        { category: '시각화', items: ['Streamlit'] },
      ],
    },
    projects: [
      {
        projectId: 'pj1',
        title: '채용 공고로 보는 데이터 직무 기술 스택 지도',
        startDate: '2026-07-14',
        endDate: '2026-08-29',
        domain: '데이터 · 채용 시장 분석',
        projectStatus: 'IN_PROGRESS',
        certificationStatus: 'CERTIFIED',
        certifiedAt: '2026-08-10T11:44:00+09:00',
        membershipRole: 'OWNER',
        responsibility: '개인 프로젝트 · 수집부터 대시보드까지',
        teamSize: 1,
        techStackGroups: [
          { category: '언어·분석', items: ['Python', 'pandas'] },
          { category: '수집', items: ['BeautifulSoup'] },
          { category: '데이터', items: ['PostgreSQL'] },
          { category: '시각화', items: ['Streamlit'] },
        ],
        outcomes: [
          '채용 공고 5,240건 수집 · 중복 제거 후 4,180건 확보',
          '기술 표기 1,148종 → 표준 키워드 312개 정규화',
          '직무별 요구 스택 도출 — DE는 Python 87% · SQL 84% · Spark 61%',
          '수집 실패율 7.2% → 0.4% — 재시도·재큐잉 도입',
          '대시보드 조회 4.2초 → 0.8초 — 집계 사전 계산',
        ],
        // 실측 — GitHub 연동 전. 연동하면 실 저장소 지표가 이 자리에 온다.
        githubStatus: 'DISCONNECTED',
        repositories: [],
      },
      {
        projectId: 'pj2',
        title: '구독 서비스 고객 이탈 예측과 리텐션 대시보드',
        startDate: '2026-08-03',
        endDate: '2026-09-25',
        domain: '데이터 · 고객 이탈 예측',
        projectStatus: 'IN_PROGRESS',
        certificationStatus: 'NONE',
        certifiedAt: null,
        membershipRole: 'OWNER',
        responsibility: '팀 PM · 전처리 파이프라인·모델링',
        teamSize: 4,
        techStackGroups: [
          { category: '언어·분석', items: ['Python', 'pandas'] },
          { category: '머신러닝', items: ['scikit-learn', 'LightGBM'] },
          { category: '데이터', items: ['PostgreSQL'] },
          { category: '시각화', items: ['Streamlit'] },
        ],
        outcomes: [
          '베이스라인 PR-AUC — 로지스틱 0.431 → LightGBM 0.612 (+42%)',
          '전처리 Pipeline 구축 — 데이터 누수 재발 방지',
          '작업 10건 배분 — 완료 3 · 진행 3 · 예정 4 (마감 09-25)',
        ],
        githubStatus: 'DISCONNECTED',
        repositories: [],
      },
    ],
  }
}

export const mockCertificateProjects = createMockCertificateProjects()

const mockChanges: CertChangesData = {
  roundLabel: '1차 보완 요청',
  summaryTitle: '정식 인증 전, 아래 3개 항목을 보완해 주세요',
  summarySub:
    '보완 완료 후 [정식 인증 재요청] 버튼이 활성화됩니다 · 매니저가 다시 검토합니다.',
  requestedAt: '2026-08-10 14:30',
  reviewer: '매니저 엔코아',
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
        '대표 기록으로 선택한 8월 1주차 블로그 "교차검증을 왜 하는지 직접 실험해봤다"가 아직 검토 중입니다. 강사 승인이 완료된 산출물만 정식 인증 근거로 사용됩니다.',
      actionLabel: '기록실 이동',
    },
    {
      id: 'r3',
      no: 3,
      tags: [
        { label: '점수 재요청 필요', tone: 'danger' },
        { label: '대상: 점수', tone: 'info' },
      ],
      title: '3차 역량 점검(08-14) 응시 후 재요청해 주세요',
      detail:
        '데이터 분석·머신러닝 범위 점수가 아직 산출되지 않았습니다. 3차 역량 점검 응시 후 점수가 반영되면 재요청해 주세요.',
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
      sub: '8월 1주차 블로그 검토 대기 중 — 강사 승인 시 자동 완료',
      done: false,
      actionLabel: '기록실 이동',
    },
    {
      id: 'c3',
      label: '3차 역량 점검 응시 완료',
      sub: '08-14 시작 — 응시 후 자동 반영',
      done: false,
      actionLabel: '역량 증명서 이동',
    },
  ],
  checkDoneLabel: '0 / 3',
}

const mockPublication: CertPublicationData = {
  issuedBadge: 'CERTIFIED · 정식 인증 완료',
  issuedLabel: '수강 역량 증명서 발급 완료',
  issuedSub: '황수빈 · SK네트웍스 Family AI 캠프 34기 · 인증일 2026.08.10',
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
    name: '황수빈',
    period: 'SK네트웍스 Family AI 캠프 · 34기 · 2026.06 ~ 2026.12',
    metrics: [
      { v: '94.4', l: '종합 점수' },
      { v: '100%', l: '출석률' },
      { v: '1', l: '인증 프로젝트' },
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
// 상담 감정 분석 mock — 실제 8주 이력(환경 적응 → 스터디·역량 점검 → 프로젝트 인증) 기반.
const analyzedSentiment: CertSentiment = {
  bubbles: [
    { label: '환경 헤맴', x: 14, y: 34, r: 12, phase: 'early' },
    { label: 'Git 실수', x: 22, y: 56, r: 11, phase: 'early' },
    { label: '기록 습관', x: 30, y: 40, r: 10, phase: 'early' },
    { label: '스터디 운영', x: 46, y: 30, r: 12, phase: 'mid' },
    { label: '역량 점검 100점', x: 54, y: 52, r: 14, phase: 'mid' },
    { label: '데이터 누수 교훈', x: 62, y: 68, r: 10, phase: 'mid' },
    { label: '프로젝트 인증', x: 80, y: 38, r: 15, phase: 'late' },
    { label: '성취감', x: 88, y: 58, r: 12, phase: 'late' },
  ],
  trend: '우상향: 환경 적응 → 스터디·역량 점검 → 프로젝트 인증',
}

const certificateApiBase =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
    /\/+$/,
    '',
  ) || '/api'

export const CERTIFICATE_MOCK_ENDPOINTS = {
  overview: `${certificateApiBase}/student/certificate`,
  projects: `${certificateApiBase}/student/certificate/projects`,
  changes: `${certificateApiBase}/student/certificate/changes`,
  publication: `${certificateApiBase}/student/certificate/publication`,
  sentiment: `${certificateApiBase}/student/certificate/sentiment/analyze`,
} as const

export const handlers = [
  http.get(CERTIFICATE_MOCK_ENDPOINTS.overview, () =>
    ok<CertificateOverview>(mockOverview),
  ),
  http.get(CERTIFICATE_MOCK_ENDPOINTS.projects, () =>
    ok<CertProjectsTab>(mockCertificateProjects),
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
