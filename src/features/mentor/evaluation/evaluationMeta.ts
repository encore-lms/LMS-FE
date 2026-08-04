import {
  CheckCircle2,
  ChevronUp,
  Command,
  Flag,
  Send,
  type LucideIcon,
} from 'lucide-react'

// 평가 작성 화면 메타 — Figma 2553:4279 / 3150:1928 / 2582:6400 원문.
// 5축 색 체계 고정(스펙 sharedPatterns): 기술=brand · 책임감=success · 소통=info ·
// 성장=accent-strong · 팀워크=warning. 틴트는 @theme 토큰만(#e8f7f7→brand/10 ·
// #d6f2e8→success-bg · #e0edfc→info-bg · #f0edfa→accent-bg · 팀워크=warning-bg).

export interface EvaluationAxisMeta {
  label: string
  desc: string
  icon: LucideIcon
  /** 축 텍스트 색 */
  text: string
  /** 축 틴트 bg(기준 칩·아이콘 박스) */
  tint: string
  /** 선택 세그먼트 fill */
  fill: string
}

/** 고정 5축(운영 커스터마이즈 없음, 05-26 확정) — 순서 = EvaluationScoreTuple 인덱스. */
export const EVALUATION_AXES: EvaluationAxisMeta[] = [
  {
    label: '기술',
    desc: '구현 능력·완성도',
    icon: Command,
    text: 'text-brand',
    tint: 'bg-brand/10',
    fill: 'bg-brand',
  },
  {
    label: '책임감',
    desc: '맡은 일 + 마감 준수',
    icon: CheckCircle2,
    text: 'text-success',
    tint: 'bg-success-bg',
    fill: 'bg-success',
  },
  {
    label: '소통',
    desc: '의사 전달·경청',
    icon: Send,
    text: 'text-info',
    tint: 'bg-info-bg',
    fill: 'bg-info',
  },
  {
    label: '성장',
    desc: '학습 의지·적응',
    icon: ChevronUp,
    text: 'text-accent-strong',
    tint: 'bg-accent-bg',
    fill: 'bg-accent-strong',
  },
  {
    label: '팀워크',
    desc: '협업 태도·지원',
    icon: Flag,
    text: 'text-warning',
    tint: 'bg-warning-bg',
    fill: 'bg-warning',
  },
]

/**
 * 멤버 아바타 색 — Figma 5인 시안 순서 매핑(#5c4fd9 · #29b5b0→brand · #3b82f5 ·
 * #f59e0a→warning · #f04545). 역할 고정/임의 배정 규칙 미확정(openQuestion) — 순번 순환.
 */
export const MEMBER_AVATAR_BG = [
  'bg-accent-strong',
  'bg-brand',
  'bg-info',
  'bg-warning',
  'bg-danger',
] as const

export const memberAvatarBg = (index: number) =>
  MEMBER_AVATAR_BG[index % MEMBER_AVATAR_BG.length]

/** 줄글 평가 코멘트 글자수 한도 — 길이 정책 미확정(Figma 카운터 500 기준) TODO. */
export const EVALUATION_COMMENT_LIMIT = 500

/** 자동 저장 디바운스(ms) — 주기·트리거 미확정(openQuestion), 입력 멈춤 기준 보수값. */
export const AUTOSAVE_DELAY_MS = 1500

// ── 고정 문구(Figma textContent 원문) ──
// 기준 카피 '0~5점 필수'는 UI 1~5 세그먼트와 충돌(0점 입력 부재 openQuestion) — 원문 유지.
export const EVALUATION_CRITERIA_TITLE = '평가 기준 · 5축 고정'
export const EVALUATION_CRITERIA_CAPTION =
  '고정 5축 · 0~5점 필수 · 줄글 평가 필수'
export const EVALUATION_COMMENT_PLACEHOLDER =
  '이 수강생의 강점·관찰 근거·다음 단계를 적어주세요'
// 정책 완화(2026-08-04) — 멘토링 시작부터 상시 작성, 제출 후에도 재제출로 수정 가능.
export const EVALUATION_NEXT_BANNER_TITLE =
  '추천 선택은 별도 단계에서 언제든 진행할 수 있습니다'
export const EVALUATION_NEXT_BANNER_DESC =
  '추천 선택은 평가와 독립 · 추천 대상자만 증명서용 간략 요약 필수 · 제출 후에도 재제출로 수정 가능'
export const EVALUATION_ACTION_CAPTION =
  '팀원 전체 평가 완료 시 제출 활성 · 제출 후에도 재제출로 수정 가능 · 미작성은 대시보드와 평가 목록에 노출'
export const EVALUATION_CONFIRM_EYEBROW = 'MENTOR EVALUATION'
export const EVALUATION_CONFIRM_TITLE = '평가를 제출할까요?'
export const EVALUATION_CONFIRM_BODY =
  '팀원 전체 5축 점수와 줄글 평가 코멘트를 제출합니다. 제출 후에도 재제출로 수정할 수 있으며, 마지막 제출본이 평판·증명서에 반영됩니다.'
export const EVALUATION_SUBMITTED_TOAST =
  '평가가 제출되었습니다. 팀원별 평가 이력에 반영됩니다.'
