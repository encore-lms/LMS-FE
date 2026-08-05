// 평판 관리 상태 메타·라벨 상수(배지 톤·푸시 라벨·5축 라벨)와 푸시 액션 타입 — ReputationPage에서 분리.
import type { BadgeTone } from '@/components/ui/StatusBadge'
import type { ActionModalSpec } from '../settings/ActionModal'
import type { ReputationPushInput } from './api'
import type { EndorsementStatus, MentorEvalStatus, PushTarget } from './types'

export const ENDORSEMENT_META: Record<
  EndorsementStatus,
  { label: string; tone: BadgeTone }
> = {
  collected: { label: '수집됨', tone: 'success' },
  not_collected: { label: '미수집', tone: 'neutral' },
  requesting: { label: '요청 중', tone: 'warning' },
}

export const MENTOR_EVAL_META: Record<
  MentorEvalStatus,
  { label: string; tone: BadgeTone }
> = {
  recommended: { label: '평가 완료 · 추천', tone: 'success' },
  not_recommended: { label: '평가 완료 · 추천 안 함', tone: 'success' },
  pending: { label: '평가 대기', tone: 'neutral' },
  not_eligible: { label: '평가 대상 외', tone: 'neutral' },
  in_progress: { label: '평가 진행 중', tone: 'info' },
}

export const PUSH_LABEL: Record<PushTarget, string> = {
  instructor: '강사 푸시',
  mentor: '멘토 푸시',
  peer: '동료 푸시',
}

// 테이블 액션 버튼용 축약 — 3개까지 한 줄에 들어가야 해 대상만 쓴다(전체 라벨은 title).
export const PUSH_SHORT: Record<PushTarget, string> = {
  instructor: '강사',
  mentor: '멘토',
  peer: '동료',
}

// 멘토 5축 축 라벨(BE scoresOf 순서와 동일). SHORT 는 테이블 인라인 칩용 축약.
// 2026-08-05 4축 개편 — BE MentorEvaluationEntry.scores4 순서와 1:1.
export const AXIS_LABELS = [
  '기술/기술기여',
  '소통·협업·팀워크',
  '문제해결',
  '책임감',
]
export const AXIS_SHORT = ['기', '소', '문', '책']

/** 푸시 확인 모달 스펙 + 성공 토스트 문구 + 요청 payload 묶음(단건·일괄 공용). */
export type ReputationPushAction = {
  spec: ActionModalSpec
  result: string
  payload: ReputationPushInput
}
