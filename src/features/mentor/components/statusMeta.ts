import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  Info,
  Timer,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { MentorTeamAssignment, MentorTeamStatus } from '../types'
import { MENTOR_TEAM_STATUS_LABEL } from '../types'

// 팀 상태 → 칩·진행률·상태 바 시각 매핑 — Figma 멘토 홈·팀(2553:3399/3554/3696) 정의.
// 색은 @theme 토큰만 사용(Figma raw 틴트 매핑 기확정):
//   #e8f7f7→brand/10 · #d6f2e8→success-bg · #f0edfa→accent-bg · #e0edfc→info-bg
//   카드 좌측 상태 바 #f59e0a → warning 토큰으로 conform.
interface MentorTeamStatusMeta {
  label: string
  icon: LucideIcon
  /** 상태 칩 bg + text */
  chip: string
  /** 진행률 바 fill — 인정 ÷ 배정 비율 */
  fill: string
  /** 내 배정 팀 카드 좌측 세로 상태 바 */
  bar: string
}

// Figma 미등장 상태(예약 대기·일지 필요·조기 종료)는 보수적 기본값 — 해당 화면 PR에서 확정.
export const TEAM_STATUS_META: Record<MentorTeamStatus, MentorTeamStatusMeta> =
  {
    in_progress: {
      label: MENTOR_TEAM_STATUS_LABEL.in_progress,
      icon: Timer,
      chip: 'bg-brand/10 text-brand',
      fill: 'bg-brand',
      bar: 'bg-brand',
    },
    reservation_waiting: {
      label: MENTOR_TEAM_STATUS_LABEL.reservation_waiting,
      icon: Calendar,
      chip: 'bg-info-bg text-info',
      fill: 'bg-brand',
      bar: 'bg-info',
    },
    log_needed: {
      label: MENTOR_TEAM_STATUS_LABEL.log_needed,
      icon: FileText,
      chip: 'bg-warning-bg text-warning',
      fill: 'bg-brand',
      bar: 'bg-warning',
    },
    change_requested: {
      label: MENTOR_TEAM_STATUS_LABEL.change_requested,
      icon: AlertTriangle,
      chip: 'bg-danger-bg text-danger',
      fill: 'bg-danger',
      bar: 'bg-danger',
    },
    evaluation_needed: {
      label: MENTOR_TEAM_STATUS_LABEL.evaluation_needed,
      icon: Info,
      chip: 'bg-warning-bg text-warning',
      fill: 'bg-success',
      bar: 'bg-warning',
    },
    completed: {
      label: MENTOR_TEAM_STATUS_LABEL.completed,
      icon: Check,
      chip: 'bg-success-bg text-success',
      fill: 'bg-success',
      bar: 'bg-success',
    },
    early_ended: {
      label: MENTOR_TEAM_STATUS_LABEL.early_ended,
      icon: XCircle,
      chip: 'bg-surface-muted text-fg-muted',
      fill: 'bg-success',
      bar: 'bg-fg-subtle',
    },
  }

export type TeamActionContext = 'card' | 'dashboard-table' | 'teams-table'

export interface TeamAction {
  label: string
  to: string
  /** Figma 상태→액션 매핑: outline / warning solid / danger solid */
  variant: 'outline' | 'warning' | 'danger'
}

/**
 * 상태별 다음 액션 — 진행 중→예약 보기(테이블 전체 보기 화면에선 팀 상세) ·
 * 평가 필요→평가 작성 · 수정 요청→일지 수정 · 완료→상세 보기.
 */
export function teamAction(
  team: MentorTeamAssignment,
  context: TeamActionContext,
): TeamAction {
  switch (team.status) {
    case 'evaluation_needed':
      return {
        label: '평가 작성',
        variant: 'warning',
        to: `/mentor/teams/${team.teamId}/evaluation`,
      }
    case 'change_requested':
      // 수정 대상 logId 직행 라우팅은 일지 PR에서 확정 — 우선 팀 필터 일지 목록으로.
      return {
        label: '일지 수정',
        variant: 'danger',
        to: `/mentor/mentoring-logs?teamId=${team.teamId}`,
      }
    case 'completed':
    case 'early_ended':
      return {
        label: '상세 보기',
        variant: 'outline',
        to: `/mentor/teams/${team.teamId}`,
      }
    default:
      return context === 'teams-table'
        ? {
            label: '팀 상세',
            variant: 'outline',
            to: `/mentor/teams/${team.teamId}`,
          }
        : {
            label: '예약 보기',
            variant: 'outline',
            to: `/mentor/mentoring-requests?teamId=${team.teamId}`,
          }
  }
}

/**
 * 잔여 인정 수치 강조색 — Figma 대표 데이터 기준(4h=brand · 0h=success · 4.5h=danger).
 * 잔여 위험 임계 규칙은 미확정 TODO — 현재는 수정 요청 팀을 위험으로 본다.
 */
export function remainingTone(team: MentorTeamAssignment): string {
  if (team.nHoursDone) return 'text-success'
  if (team.status === 'change_requested') return 'text-danger'
  return 'text-brand'
}
