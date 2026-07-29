// 온라인 교육(KDC: K-디지털 기초역량훈련) 도메인 계약 — 기능 로컬(공유 파일 미오염). BE 합류 시 페어가 정합.
// 자기주도 온라인 학습 대시보드(/student/course 진입, trainingType=KDC)가 소비하는 모델.
// 강의 홈(KDT)의 course/types.ts와 도메인이 달라 별도 정의(assignments/types.ts와 동일한 기능 로컬 패턴).

/** 과정 강사(멘토) — 좌측 과정 정보 카드 */
export interface OnlineMentor {
  name: string // "박서연"
  role: string // "강사"
  org?: string // "AI캠프"
}

/** 차시 진행 상태 — 완료 / 학습 중(현재 차시) / 예정(미시청) */
export type OnlineChapterStatus = 'done' | 'learning' | 'upcoming'

/** 차시(챕터) 한 개 — 좌측 차시 목록 + 중앙 진도율 카드가 함께 소비 */
export interface OnlineChapter {
  id: string
  no: number
  title: string
  durationLabel: string // 총 재생시간 "35:00"
  status: OnlineChapterStatus
  progressPct: number // 진도율 0~100
  watchedLabel: string // 마지막 시청 위치 "23:32" (예정은 "00:00")
  lastVisitLabel: string // "어제 09:30" | "미시청"
  videoUrl: string // 강의 영상 경로(public 기준, 예: "/video/01. ….mp4")
  posterUrl: string // 영상 첫 화면 썸네일(플레이어 커버 배경)
}

/**
 * 런타임 파생 차시 뷰 — 실제 시청 진행에 맞춰 progressPct·watchedLabel 을 덮어쓴 값에
 * 완료/잠금 상태를 더한 것. 페이지가 계산해 각 컴포넌트에 내려준다.
 *   completed: 끝까지(≈95%) 시청해 수강 완료 → 영상 자유 탐색 허용
 *   locked: 현재 주차(currentWeek)보다 뒤 차시 → 아직 열리지 않음(재생 불가)
 */
export interface OnlineChapterView extends OnlineChapter {
  completed: boolean
  locked: boolean
}

/** 수료 현황 — 우측 패널. KDC는 수료 기준 진도율(예: 80%) 충족이 핵심 */
export interface OnlineCompletion {
  overallPct: number // 전체 진도율(수료 진척) 0~100
  requiredPct: number // 수료 기준 진도율 (예: 80)
  completedChapters: number
  totalChapters: number
  totalDurationLabel: string // 총 학습시간 "3시간 53분"
  watchedDurationLabel: string // 누적 시청시간 "1시간 00분"
  statusLabel: string // "수료 기준까지 48% 남음"
  metStandard: boolean // 수료 기준 진도율 충족 여부
}

export type OnlineNoticeTone = 'urgent' | 'notice' | 'normal'

/** 학습 공지 한 줄 — 우측 패널 */
export interface OnlineNotice {
  id: string
  tone: OnlineNoticeTone
  tagLabel: string // "긴급" | "공지" | "일반"
  title: string
  timeAgo: string // "1시간 전"
}

/** 온라인 교육 전체 응답 — GET /student/course/online */
export interface OnlineCourse {
  trackLabel: string // "K-DIGITAL 기초역량훈련"
  courseName: string // "파이썬 데이터 분석 입문"
  mentor: OnlineMentor
  description: string // 과정 설명(문단 구분은 \n\n)
  currentChapterId: string // 현재 학습 중 차시(중앙 플레이어 대상)
  currentWeek: number // 현재 수강 주차 — n주차까지의 차시(no ≤ n)가 열린다(주차별 1강 해제)
  chapters: OnlineChapter[]
  completion: OnlineCompletion
  notices: OnlineNotice[]
}
