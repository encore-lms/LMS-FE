// 수강생 프로젝트 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 337:930 외.
// 프로젝트 목록 · 생성 4단계 마법사 · 워크스페이스(10탭) · 변경 제안.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'

export type ProjectStatus = 'certified' | 'reviewing' | 'draft'
export type ProjectKind = 'team' | 'personal'

/** 목록 상단 통계 카드 */
export interface ProjectStat {
  key: string
  label: string
  value: string
  unit: string
  sub: string
  tone: Tone
}

/** 목록 필터 탭 */
export interface ProjectFilter {
  key: string
  label: string
  count: number
}

/** 목록 프로젝트 카드 */
export interface ProjectSummary {
  id: string
  kind: ProjectKind
  kindLabel: string // "팀" | "개인"
  status: ProjectStatus
  statusLabel: string // "인증 완료" | "검토 중" | "작성 중"
  representative: boolean // 대표 후보
  accentTone: Tone // 좌측 바 색
  title: string
  pm: string // "예칼 PM"
  teamLabel: string // "팀 4명" | "개인 프로젝트"
  period: string // "2026-04-01 ~ 2026-05-30 · 80일 · 종료"
  tags: string[]
  outcomes: string[]
  actionLabel: string // "워크스페이스 열기" | "검토 상태 보기"
}

export interface ProjectListData {
  headerTitle: string // "프로젝트 — 백엔드 부트캠프 · 3기"
  headerSub: string
  stats: ProjectStat[]
  filters: ProjectFilter[]
  projects: ProjectSummary[]
  shownLabel: string
}

// ── 생성 마법사 카탈로그(정적) ──
export interface StackGroup {
  label: string // "백엔드 언어 / 프레임워크"
  tone: Tone
  items: string[]
}
export const STACK_CATALOG: StackGroup[] = [
  {
    label: '백엔드 언어 / 프레임워크',
    tone: 'success',
    items: [
      'Java 17',
      'Kotlin',
      'Python',
      'Node.js',
      'Go',
      'Spring Boot',
      'Django',
      'Express',
      'NestJS',
    ],
  },
  {
    label: '데이터베이스 / 캐시',
    tone: 'info',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'ElasticSearch'],
  },
  {
    label: '인프라 / DevOps',
    tone: 'brand',
    items: [
      'Docker',
      'Kubernetes',
      'AWS',
      'GCP',
      'Terraform',
      'Jenkins',
      'GitHub Actions',
    ],
  },
  {
    label: '메시징 / 스트리밍',
    tone: 'warning',
    items: ['Apache Kafka', 'RabbitMQ', 'gRPC', 'WebSocket'],
  },
]
export const DOMAINS: string[] = [
  '커머스',
  '핀테크',
  '미디어·콘텐츠',
  '교육·학습',
  '헬스케어',
  '소셜·커뮤니티',
  '생산성 도구',
  '기타',
]
export const DELIVERABLES: string[] = [
  'GitHub 리포지토리',
  '배포 URL',
  '기술 문서·회고',
  '발표 자료',
  '데모 영상',
]

/** 팀원 초대 후보 */
export interface TeamCandidate {
  id: string
  name: string
  meta: string // "백엔드 · 3팀"
  avatarTone: Tone
}
export interface ProjectWizardData {
  cohortLabel: string // "백엔드 부트캠프 3기"
  pmName: string // "김수강"
  pmMeta: string
  candidates: TeamCandidate[]
}

// ── 워크스페이스(10탭) ──
export type WsTab =
  | 'home'
  | 'board'
  | 'calendar'
  | 'meetings'
  | 'docs'
  | 'issues'
  | 'team'
  | 'outcomes'
  | 'peer-evaluation'
  | 'certification'

export interface Badge {
  label: string
  tone: Tone
}
export interface WsTask {
  title: string
  assignee: string
  due: string // "D-1"
  tags: Badge[]
}
export interface WsColumn {
  key: string
  label: string
  tasks: WsTask[]
}
export interface WsCalEvent {
  day: number
  label: string
  tone: Tone
}
export interface WsUpcoming {
  date: string
  label: string
  tone: Tone
}
export interface WsMeeting {
  title: string
  meta: string
  summary: string
  status: Badge
}
export interface WsDoc {
  title: string
  meta: string
  status: Badge
  category: string // docCategories('API 명세'·'설계 문서'·'발표 자료'·'첨부 파일'·'위키') 중 하나
}
export interface WsIssue {
  title: string
  meta: string
  priority: Badge
  status: Badge
}
export interface WsMember {
  name: string
  role: string // "백엔드·인프라"
  kind: 'PM' | '팀원'
  contrib: number // 40
  avatarTone: Tone
}
export interface WsMetric {
  label: string
  before: string
  after: string
  delta: string
  good: boolean
}
export interface WsPeerTarget {
  name: string
  role: string
  axes: { key: string; score: number }[]
  tags: Badge[]
}
export interface WsCheck {
  label: string
  status: Badge
}
export interface WsActivity {
  who: string
  action: string
  when: string
  kind?: '작업' | '회의록' | '산출물' | '이슈' // 활동 종류 칩/아이콘
}
export interface WorkspaceData {
  id: string
  title: string
  meta: string // "팀 프로젝트 · 4명 · 2026-04-01 ~ 2026-05-30 · PM 김민웅"
  /** 프로젝트 라이프사이클 — 완료 배너·상호평가·인증 UI 게이트. draft=작성 중(완료 확정 전) */
  status: ProjectStatus
  banner?: string // 완료 확정 이후 상단 안내(상호평가 등)
  // home
  stats: {
    label: string
    value: string
    unit: string
    sub: string
    tone: Tone
  }[]
  myTasks: WsTask[]
  activities: WsActivity[]
  // board
  columns: WsColumn[]
  // calendar
  calMonth: string
  calEvents: WsCalEvent[]
  upcoming: WsUpcoming[]
  // meetings
  meetings: WsMeeting[]
  // docs
  docCategories: string[]
  docs: WsDoc[]
  // issues
  issues: WsIssue[]
  // team
  members: WsMember[]
  rolePolicy: string[]
  // outcomes
  metrics: WsMetric[]
  stack: string[]
  // peer
  peerDue: string
  peerMyStatus: Badge
  peerTeamStatus: Badge
  peerTargets: WsPeerTarget[]
  // certification
  certChecklist: WsCheck[]
  certStatus: Badge
  certRecentChange: { label: string; status: Badge; date: string }
  /** 인증 요청 진행 정보(검토 중일 때) — 홈 인증 상태 카드. 없으면 최근 변경 제안으로 폴백. */
  certInfo?: { requestedAt: string; reviewer: string; eta: string }
}
