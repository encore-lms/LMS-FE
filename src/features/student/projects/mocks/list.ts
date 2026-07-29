// 프로젝트 목록 mock — mockList 본문과 데모 페이지네이션용 보충 카드(PROJECT_FILLERS).
import type { ProjectKind, ProjectListData, ProjectSummary } from '../types'

export const mockList: ProjectListData = {
  headerTitle: '프로젝트 — 백엔드 부트캠프 · 3기',
  headerSub:
    '참여 중인 팀·개인 프로젝트와 인증 상태, 산출물을 정리하고 인증을 요청하세요.',
  stats: [
    {
      key: 'joined',
      label: '참여 프로젝트',
      value: '3',
      unit: '건',
      sub: '팀 2건 · 개인 1건',
      tone: 'brand',
    },
    {
      key: 'certified',
      label: '인증 완료',
      value: '1',
      unit: '건',
      sub: '대표 후보 1건',
      tone: 'success',
    },
    {
      key: 'reviewing',
      label: '검토 중',
      value: '1',
      unit: '건',
      sub: 'D+9 감사 검토 대기',
      tone: 'warning',
    },
    {
      key: 'draft',
      label: '작성 중',
      value: '1',
      unit: '건',
      sub: '개인 프로젝트 진행 중',
      tone: 'accent',
    },
  ],
  filters: [
    { key: 'all', label: '전체', count: 3 },
    { key: 'certified', label: '인증 완료', count: 1 },
    { key: 'reviewing', label: '검토 중', count: 1 },
    { key: 'draft', label: '작성 중', count: 1 },
    { key: 'representative', label: '대표 후보', count: 1 },
  ],
  projects: [
    {
      id: 'p1',
      kind: 'team',
      kindLabel: '팀',
      status: 'certified',
      statusLabel: '인증 완료',
      representative: true,
      accentTone: 'success',
      title: '주문 관리 MSA 백엔드',
      pm: '예칼 PM',
      teamLabel: '팀 4명',
      period: '2026-04-01 ~ 2026-05-30 · 80일 · 종료',
      tags: ['Spring Boot', 'JPA', 'Kafka', 'Docker', 'PostgreSQL'],
      outcomes: [
        '주문/결제 도메인 분리 · 트랜잭션 정합성 정리',
        'Kafka 이벤트 라우팅 · 결제 실패율 8% → 0.4%',
        'API P95 320ms → 145ms (-55%)',
      ],
      actionLabel: '워크스페이스 열기',
    },
    {
      id: 'p2',
      kind: 'team',
      kindLabel: '팀',
      status: 'reviewing',
      statusLabel: '검토 중',
      representative: false,
      accentTone: 'warning',
      title: '실시간 채팅 서버',
      pm: '예칼 팀장',
      teamLabel: '팀 3명',
      period: '2026-03-20 ~ 2026-04-25 · 36일 · 종료',
      tags: ['Spring Boot', 'WebSocket', 'Redis', 'Nginx'],
      outcomes: [
        'WebSocket session sticky · 동시 5천명 안정 운영',
        'Redis Pub/Sub 채번 적용',
        '장애 복구 평균 32s → 8s',
      ],
      actionLabel: '검토 상태 보기',
    },
    {
      id: 'p3',
      kind: 'personal',
      kindLabel: '개인',
      status: 'draft',
      statusLabel: '작성 중',
      representative: false,
      accentTone: 'accent',
      title: '포트폴리오 REST API',
      pm: '예칼 PM',
      teamLabel: '개인 프로젝트',
      period: '2026-05-02 ~ 진행 중 · 24일째 진행 중',
      tags: ['Spring Boot', 'JPA', 'PostgreSQL', 'Spring Security'],
      outcomes: [
        'JWT 인증·인가 + Refresh Token rotation',
        'ERD 정규화 3NF · 인덱스 튜닝',
        'CI/CD GitHub Actions + Docker Compose',
      ],
      actionLabel: '워크스페이스 열기',
    },
  ],
  shownLabel: '3건 모두 표시 · 인증 완료 1 / 검토 중 1 / 작성 중 1',
}

// ── 데모 페이지네이션용 프로젝트 보충 ──
// 기본 3건이라 목록이 1페이지뿐 → 1·2·3 페이지가 실제로 동작하도록 작성 중 프로젝트를 보충(총 9건).
// 앞쪽(p1~p3)이 1페이지에 그대로 노출되고, 상세는 아래 workspaces에 작성 중 워크스페이스로 등록한다.
const PROJECT_FILLERS: {
  title: string
  kind: ProjectKind
  tags: string[]
  outcomes: string[]
}[] = [
  {
    title: '쿠폰·프로모션 정산 배치',
    kind: 'team',
    tags: ['Spring Batch', 'JPA', 'MySQL', 'Redis'],
    outcomes: [
      '정산 배치 처리량 3배 개선',
      '중복 정산 0건 · 멱등 처리',
      '야간 배치 40분 → 12분',
    ],
  },
  {
    title: '알림 발송 게이트웨이',
    kind: 'team',
    tags: ['Spring Boot', 'Kafka', 'FCM', 'Redis'],
    outcomes: [
      '발송 성공률 99.7%',
      '대량 발송 큐 분리',
      '재시도·실패 정책 표준화',
    ],
  },
  {
    title: '상품 검색 API',
    kind: 'personal',
    tags: ['Spring Boot', 'Elasticsearch', 'JPA'],
    outcomes: ['검색 응답 P95 90ms', '형태소 분석 적용', '오타 보정 추가'],
  },
  {
    title: '회원 등급 관리 서비스',
    kind: 'team',
    tags: ['Spring Boot', 'JPA', 'PostgreSQL'],
    outcomes: [
      '등급 산정 규칙 엔진화',
      '정합성 검증 자동화',
      '관리자 대시보드 연동',
    ],
  },
  {
    title: '파일 업로드 스토리지 모듈',
    kind: 'personal',
    tags: ['Spring Boot', 'AWS S3', 'Spring Security'],
    outcomes: [
      '프리사인드 URL 적용',
      '업로드 실패율 2% → 0.1%',
      '용량 정책 분리',
    ],
  },
  {
    title: '결제 웹훅 수신 서버',
    kind: 'team',
    tags: ['Spring Boot', 'Kafka', 'MySQL', 'Docker'],
    outcomes: ['웹훅 멱등 처리', '이벤트 유실 0건', '재처리 콘솔 구축'],
  },
]

mockList.projects = [
  ...mockList.projects,
  ...PROJECT_FILLERS.map((f, i): ProjectSummary => {
    const kind = f.kind
    return {
      id: `pf${i + 1}`,
      kind,
      kindLabel: kind === 'team' ? '팀' : '개인',
      status: 'draft',
      statusLabel: '작성 중',
      representative: false,
      accentTone: 'accent',
      title: f.title,
      pm: '예칼 PM',
      teamLabel: kind === 'team' ? '팀 3명' : '개인 프로젝트',
      period: '2026-05-01 ~ 진행 중 · 작성 중',
      tags: f.tags,
      outcomes: f.outcomes,
      actionLabel: '워크스페이스 열기',
    }
  }),
]
