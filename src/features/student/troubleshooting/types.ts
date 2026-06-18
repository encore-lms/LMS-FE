// 수강생 트러블슈팅 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 360:1297 외.
// 사례 목록 · 상세 · 새 작성 · 변경 제안 · 인증 요청 모달.

export type Tone =
  | 'brand'
  | 'info'
  | 'warning'
  | 'danger'
  | 'accent'
  | 'success'
export type TsStatus = 'draft' | 'reviewing' | 'certified' // 작성 중 / 검토 중 / 인증 완료

export interface Badge {
  label: string
  tone: Tone
}

/** 카테고리 카탈로그(정적) */
export const TS_CATEGORIES: { key: string; tone: Tone }[] = [
  { key: 'DB', tone: 'info' },
  { key: '배포·인프라', tone: 'accent' },
  { key: '성능', tone: 'warning' },
  { key: '네트워크·API', tone: 'brand' },
  { key: '보안', tone: 'danger' },
  { key: '기타', tone: 'success' },
]

/** 목록 통계 카드 */
export interface TsStat {
  key: string
  label: string
  value: string
  unit: string
  sub: string
  tone: Tone
  barPct?: number // 통계카드 진행 트랙바(0~100, Figma 360:1297)
}
export interface TsFilter {
  key: string
  label: string
  count: number
  tone?: Tone // 상태 필터칩 색점(인증완료/검토중/작성중)
}

/** 목록 사례 카드 */
export interface TsCase {
  id: string
  category: string
  categoryKey: string // 필터 칩 키(all 제외): DB·deploy·perf·net·etc
  categoryTone: Tone
  status: TsStatus
  statusLabel: string
  independent: boolean // 독립 해결
  days: string // "3일"
  repLinked: boolean // 대표 연결
  accentTone: Tone
  title: string
  createdAt: string
  updatedAt: string
  situation: string
  resolution: string
  result: string
  tags: string[]
  actionLabel: string // "사례 열기" | "이어 작성"
}

export interface TsListData {
  stats: TsStat[]
  filters: TsFilter[]
  statusFilters: TsFilter[] // 우측 상태 칩(인증완료·검토중·작성중)
  cases: TsCase[]
  shownLabel: string
}

/** 상세 */
export interface TsAttachment {
  label: string
  kind: 'file' | 'link'
}
export interface TsCheck {
  label: string
  status: Badge
}
export interface TsTimeline {
  key: string
  label: string // "작성 중 (draft)"
  sub: string
  state: 'done' | 'current' | 'todo'
}
export interface TsCaseDetail {
  id: string
  title: string
  category: string
  categoryTone: Tone
  status: TsStatus
  statusLabel: string
  projectLinked: boolean // 프로젝트 연결
  independent: boolean
  days: string
  situation: string
  resolution: string
  result: string
  attachments: TsAttachment[]
  checklist: TsCheck[]
  timeline: TsTimeline[]
  // 인증 요청 모달
  certProject: string // "주문 관리 MSA 백엔드 · 결제 실패 재시도 이슈"
  certReviewer: string // "클라우드 배포 · 강사 검토"
  certChecklist: string[]
  // 프로젝트(이슈 단위) 연결 — TS_PROJECT_LINK 플래그 뒤에서만 사용. 없으면 미연결.
  projectLink?: TsProjectLink | null
}

/**
 * 사례 ↔ 프로젝트 연결. 연결 단위는 프로젝트 안의 "이슈" — issueId 까지 지정하면
 * 발생(이슈) → 해결(사례) → 증빙(인증)이 한 줄로 추적된다. issueId 없이 프로젝트만
 * 연결하는 것도 허용(느슨한 연결). projectTitle·issueTitle 은 표시용 비정규화 값.
 */
export interface TsProjectLink {
  projectId: string
  projectTitle: string
  issueId?: string
  issueTitle?: string
}

/** 연결 모달 선택지 — 추후 /student/projects + 워크스페이스 issues 로 대체될 정적 카탈로그. */
export interface TsLinkableIssue {
  id: string
  title: string
  meta: string // "성능 · 담당 박지호"
}
export interface TsLinkableProject {
  id: string
  title: string
  kindLabel: string // "팀" | "개인"
  issues: TsLinkableIssue[]
}
export const TS_LINKABLE_PROJECTS: TsLinkableProject[] = [
  {
    id: 'p1',
    title: '주문 관리 MSA 백엔드',
    kindLabel: '팀',
    issues: [
      {
        id: 'iss-p1-1',
        title: 'Kafka 컨슈머 지연',
        meta: '성능 · 담당 박지호',
      },
      {
        id: 'iss-p1-2',
        title: '결제 실패 재시도 중복 실행',
        meta: '버그 · 담당 김민웅',
      },
      {
        id: 'iss-p1-3',
        title: 'Docker 배포 환경변수 누락',
        meta: '배포 · 담당 이서연',
      },
      {
        id: 'iss-p1-4',
        title: 'API 응답 코드 정책 불일치',
        meta: '설계 · 담당 최유나',
      },
      {
        id: 'iss-p1-5',
        title: '주문 조회 정렬 오류',
        meta: '버그 · 담당 김민웅',
      },
    ],
  },
  {
    id: 'p2',
    title: '실시간 채팅 서버',
    kindLabel: '팀',
    issues: [
      {
        id: 'iss-p2-1',
        title: 'WebSocket 재연결 폭주',
        meta: '성능 · 담당 한지우',
      },
      {
        id: 'iss-p2-2',
        title: '세션 sticky 라우팅 실패',
        meta: '인프라 · 담당 윤도현',
      },
    ],
  },
  {
    id: 'p3',
    title: '포트폴리오 REST API',
    kindLabel: '개인',
    issues: [
      {
        id: 'iss-p3-1',
        title: 'CORS 프리플라이트 차단',
        meta: '네트워크·API · 담당 나',
      },
    ],
  },
]

/** 변경 제안 변경 항목 */
export const TS_CHANGE_ITEMS = [
  '제목',
  '카테고리',
  '상황',
  '해결',
  '결과',
  '태그',
]
