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
  presentationLinked: boolean // 발표 연결
  independent: boolean
  days: string
  situation: string
  resolution: string
  result: string
  attachments: TsAttachment[]
  checklist: TsCheck[]
  timeline: TsTimeline[]
  // 인증 요청 모달
  certPresentation: string // "Final LMS 프로젝트 · 중간 발표"
  certReviewer: string // "클라우드 배포 · 강사 검토"
  certChecklist: string[]
}

/** 변경 제안 변경 항목 */
export const TS_CHANGE_ITEMS = [
  '제목',
  '카테고리',
  '상황',
  '해결',
  '결과',
  '태그',
]
