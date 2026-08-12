import {
  CheckCircle2,
  ChevronUp,
  Command,
  Send,
  type LucideIcon,
} from 'lucide-react'
import { EVALUATION_AXIS_LABELS } from '@/shared/constants'

// 평가 4축 UI 메타 — 멘토 평가(evaluationMeta)에서 승격(2026-08-06, 상호평가 4축 통일).
// 라벨 정본은 shared EVALUATION_AXIS_LABELS(순서 = BE scores4 인덱스 계약), 여기는 표시 메타만 더한다.
// 진술문(desc)은 인성검사식 — 사람이 아니라 행동에 답하게 해 관대화를 줄인다.

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

/** 고정 4축 — 순서 = EVALUATION_AXIS_LABELS = BE scores4. */
export const EVALUATION_AXES: EvaluationAxisMeta[] = [
  {
    label: EVALUATION_AXIS_LABELS[0],
    short: '기술',
    desc: '맡은 몫을 결과물로 구현해 냈다',
    icon: Command,
    text: 'text-brand',
    tint: 'bg-brand/10',
    fill: 'bg-brand',
  },
  {
    label: EVALUATION_AXIS_LABELS[1],
    short: '소통·협업',
    desc: '의견을 나누고 팀이 같이 일하기 좋았다',
    icon: Send,
    text: 'text-info',
    tint: 'bg-info-bg',
    fill: 'bg-info',
  },
  {
    label: EVALUATION_AXIS_LABELS[2],
    short: '문제해결',
    desc: '막힌 문제를 스스로 뚫거나 팀을 도왔다',
    icon: ChevronUp,
    text: 'text-accent-strong',
    tint: 'bg-accent-bg',
    fill: 'bg-accent-strong',
  },
  {
    label: EVALUATION_AXIS_LABELS[3],
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
