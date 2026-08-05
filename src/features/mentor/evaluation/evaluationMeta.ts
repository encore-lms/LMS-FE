import {
  CheckCircle2,
  ChevronUp,
  Command,
  Send,
  type LucideIcon,
} from 'lucide-react'

// 평가 작성 화면 메타 — 2026-08-05 4축 개편(기술/기술기여 · 소통·협업·팀워크 · 문제해결 · 책임감).
// 겹치던 소통·협업·팀워크를 한 축으로 합치고 단기 프로젝트에서 관찰 불가한 '성장'은 제외.
// 진술문(desc)은 인성검사식 — 사람이 아니라 행동에 답하게 해 관대화를 줄인다.
// 저장은 1~5 유지(집계·증명서 호환), UI만 리커트 그리드(낮음/보통/높음 앵커).

export interface EvaluationAxisMeta {
  label: string
  /** 콤팩트 표기(추천 후보 카드 등 좁은 자리) */
  short: string
  /** 진술문 — "이 사람은 ~했다"에 대한 동의 정도를 묻는다 */
  desc: string
  icon: LucideIcon
  /** 축 텍스트 색 */
  text: string
  /** 축 틴트 bg(기준 칩·아이콘 박스) */
  tint: string
  /** 선택 세그먼트 fill */
  fill: string
}

/** 고정 4축(2026-08-05 개편) — 순서 = EvaluationScoreTuple 인덱스(BE scores4 매핑과 1:1). */
export const EVALUATION_AXES: EvaluationAxisMeta[] = [
  {
    label: '기술/기술기여',
    short: '기술',
    desc: '맡은 몫을 결과물로 구현해 냈다',
    icon: Command,
    text: 'text-brand',
    tint: 'bg-brand/10',
    fill: 'bg-brand',
  },
  {
    label: '소통·협업·팀워크',
    short: '소통·협업',
    desc: '의견을 나누고 팀이 같이 일하기 좋았다',
    icon: Send,
    text: 'text-info',
    tint: 'bg-info-bg',
    fill: 'bg-info',
  },
  {
    label: '문제해결',
    short: '문제해결',
    desc: '막힌 문제를 스스로 뚫거나 팀을 도왔다',
    icon: ChevronUp,
    text: 'text-accent-strong',
    tint: 'bg-accent-bg',
    fill: 'bg-accent-strong',
  },
  {
    label: '책임감',
    short: '책임감',
    desc: '맡은 일을 기한 안에 끝까지 해냈다',
    icon: CheckCircle2,
    text: 'text-success',
    tint: 'bg-success-bg',
    fill: 'bg-success',
  },
]

/** 리커트 앵커 — 라벨은 3개(낮음·보통·높음), 선택지는 1~5 다섯 개(저장값 1~5 유지). */
export const LIKERT_ANCHORS = ['낮음', '보통', '높음'] as const
/** 선택지 원 크기(px) — 인성검사식 양끝 크게, 중앙으로 갈수록 작게. */
export const LIKERT_SIZES = [30, 24, 20, 24, 30] as const

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

// ── 고정 문구 ──
export const EVALUATION_CRITERIA_TITLE = '평가 기준 · 4축 고정'
export const EVALUATION_CRITERIA_CAPTION =
  '고정 4축 · 1~5 척도(낮음~높음) · 줄글 평가 필수'
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
  '팀원 전체 4축 점수와 줄글 평가 코멘트를 제출합니다. 제출 후에도 재제출로 수정할 수 있으며, 마지막 제출본이 평판·증명서에 반영됩니다.'
export const EVALUATION_SUBMITTED_TOAST =
  '평가가 제출되었습니다. 팀원별 평가 이력에 반영됩니다.'
