// 수강생 "나의 과정" 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 강의 홈(/student/course)·자료실(/student/course/materials)이 소비하는 모델만 정의.
// 퀴즈(목록/응시/결과)는 @/shared/types(quiz)를 재사용하므로 여기서 정의하지 않는다.

/** 강의 홈 상단 히어로 — 과정/기수·진행률 */
export interface CourseHero {
  trackLabel: string // 예: "BACKEND BOOTCAMP"
  courseName: string // "백엔드 부트캠프"
  cohortName: string // "3기"
  periodStart: string // "2026.03.04"
  periodEnd: string // "2026.09.12"
  currentWeek: number
  totalWeeks: number
  progressPct: number // 0~100
  progressLabel: string // "주차별 진행 · 10주차 학습 중"
  progressSubLabel: string // "28주 강의 중 9주 완료 · 1주 진행 중"
}

export type CourseKpiTone = 'warning' | 'danger' | 'info' | 'accent'

/** 강의 홈 KPI 카드 — 진행 바(%)·델타 배지·보조 문구 */
export interface CourseKpi {
  key: string
  label: string
  value: number
  unit: string // "건"
  tone: CourseKpiTone
  barPct: number // 진행 바 채움 0~100
  badge?: string // "D-1" | "NEW" 등 (없으면 미표시)
  caption: string
}

export type WeekStatus = 'done' | 'learning' | 'upcoming'

/** 주차별 학습 한 줄 */
export interface CourseWeek {
  weekNo: number
  title: string
  periodStart: string // "2026-04-22"
  periodEnd: string // "2026-04-28"
  status: WeekStatus
}

/** 사이드 미니 리스트(미응시 퀴즈/마감 임박 과제/새 자료) 공통 행 */
export interface CourseMiniRow {
  id: string
  title: string
  meta?: string // 보조 문구(부제)
  badge?: string // "응시 →" | "D-2" | "5/13" 등 우측 배지
}

export type CourseMiniTone = 'warning' | 'danger' | 'info'

/** 사이드 미니 카드 */
export interface CourseMiniCard {
  key: string
  title: string
  count: number
  tone: CourseMiniTone
  action: string // "퀴즈 →"
  rows: CourseMiniRow[]
}

export type NoticeTone = 'urgent' | 'notice' | 'normal'

/** 공지 한 줄 */
export interface CourseNotice {
  id: string
  tone: NoticeTone
  tagLabel: string // "긴급" | "공지" | "일반"
  title: string
  timeAgo: string // "1시간 전"
}

/** 강의 홈 전체 응답 */
export interface CourseHome {
  hero: CourseHero
  kpis: CourseKpi[]
  weeks: CourseWeek[]
  weeksTitle: string
  weeksSubtitle: string
  sideCards: CourseMiniCard[]
  notices: CourseNotice[]
  // 탭 카운트(나의 과정 탭바)
  tabCounts: { quizzes: number; materials: number; assignments: number }
}

// ── 자료실(/student/course/materials) ──

/** 파일 형식 — 아이콘/형식 배지·미리보기 가능 여부 판정에 사용 */
export type MaterialFileType = 'PDF' | 'DOC' | 'ZIP' | 'LINK' | 'IMG' | 'VIDEO'

/** 자료 분류 — 카테고리 칩/배지 */
export type MaterialCategory = 'lecture' | 'practice' | 'reference' | 'shared'

/** 자료 한 건 */
export interface MaterialItem {
  id: string
  fileType: MaterialFileType
  category: MaterialCategory
  title: string
  author: string // "강사 박지수" | "김수강"
  timeAgo: string // "2일 전"
  downloadCount?: number // LINK는 없음
  sizeLabel?: string // "2.4MB" — LINK는 없음
  favorited: boolean
  canPreview: boolean // PDF/이미지면 '미리보기' 노출
  isExternalLink?: boolean // LINK면 '다운로드' 대신 '링크 열기'
}

/** 카테고리 칩 1개 (전체 + 4분류) */
export interface MaterialCategoryCount {
  key: 'all' | MaterialCategory
  label: string
  count: number
}

/** 자료실 전체 응답 */
export interface CourseMaterials {
  totalCount: number
  shownCount: number // "24건 중 8건 표시"
  categories: MaterialCategoryCount[]
  items: MaterialItem[]
}
