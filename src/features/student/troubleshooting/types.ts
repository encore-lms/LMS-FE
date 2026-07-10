// 수강생 트러블슈팅 도메인 계약 — 기능 로컬(공유 파일 미오염). Figma 360:1297 외.
// 사례 목록 · 상세 · 새 작성 · 변경 제안 · 인증 요청 모달.

import type { Tone } from '@/shared/lib/tone'
export type { Tone }
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
  completed?: boolean // 작성 완료(인증 요청 준비) 여부 — draft 사례에만 의미
  independent: boolean // 독립 해결
  days: string // "3일"
  accentTone: Tone
  title: string
  createdAt: string
  updatedAt: string
  situation: string
  resolution: string
  result: string
  tags: string[]
  actionLabel: string // "사례 열기" | "이어 작성"
  // 검토 출처 — 검토 중(reviewing) 진입이 인증 요청인지 변경 제안인지. 반려 시 모달 종류 결정.
  reviewFrom?: 'cert' | 'change'
  // 강사 반려 — 인증 요청/변경 제안이 반려되면 사유를 보관하고 '이어 작성'으로 되돌린다.
  rejectionReason?: string
  rejectionFrom?: 'cert' | 'change' // 반려 출처(인증 요청 / 변경 제안)
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
  completed: boolean // 작성 완료(인증 요청 준비) 여부 — draft 사례에만 의미
  independent: boolean
  days: string
  situation: string
  resolution: string
  result: string
  attachments: TsAttachment[]
  checklist: TsCheck[]
  timeline: TsTimeline[]
  // 인증 요청 모달
  certProject: string // 인증 모달 표시용 — 연결된 프로젝트명(없으면 안내 문구)
  certReviewer: string // "클라우드 배포 · 강사 검토"
  certChecklist: string[]
  // 프로젝트 연결 — 없으면 미연결. 연결 단위는 프로젝트(이슈 단위 연결은 제외).
  projectLink?: TsProjectLink | null
  // 강사 반려 사유(있으면 반려 안내 모달 노출). 인증 요청/변경 제안 반려 시 설정.
  rejectionReason?: string
  rejectionFrom?: 'cert' | 'change'
}

/**
 * 사례 ↔ 프로젝트 연결. 연결 단위는 "프로젝트"(이슈 단위 연결은 제외).
 * projectTitle 은 표시용 비정규화 값.
 */
export interface TsProjectLink {
  projectId: string
  projectTitle: string
}

/** 연결 모달 선택지 — 추후 /student/projects 워크스페이스로 대체될 정적 카탈로그. */
export interface TsLinkableProject {
  id: string
  title: string
  kindLabel: string // "팀" | "개인"
  desc: string // 짧은 설명(부제)
}
export const TS_LINKABLE_PROJECTS: TsLinkableProject[] = [
  {
    id: 'p1',
    title: '주문 관리 MSA 백엔드',
    kindLabel: '팀',
    desc: '주문·결제 도메인 마이크로서비스',
  },
  {
    id: 'p2',
    title: '실시간 채팅 서버',
    kindLabel: '팀',
    desc: 'WebSocket 기반 실시간 채팅 인프라',
  },
  {
    id: 'p3',
    title: '포트폴리오 REST API',
    kindLabel: '개인',
    desc: '개인 포트폴리오 백엔드 API',
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
