import { AlertTriangle, Check, Clock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type {
  MentorTeamAssignment,
  MentorTeamStatus,
  MentoringLogStatus,
} from '../types'
import { TEAM_STATUS_META } from './statusMeta'

// 코호트 칩 — 기수 트랙별 고정색(AI=accent · DA=info 가정, Figma 칩 색 혼용은 info로 통일).
// 틴트 매핑: #f0edfa→accent-bg · #e0edfc→info-bg.
export function CohortChip({
  label,
  mini = false,
}: {
  label: string
  mini?: boolean
}) {
  const tone = label.startsWith('AI')
    ? 'bg-accent-bg text-accent-strong'
    : label.startsWith('DA')
      ? 'bg-info-bg text-info'
      : 'bg-surface-muted text-fg-muted'
  return (
    <span
      className={cn(
        'inline-flex font-bold whitespace-nowrap',
        mini
          ? 'rounded px-[5px] py-px text-[10px]'
          : 'rounded-[5px] px-2 py-[3px] text-[11px]',
        tone,
      )}
    >
      {label}
    </span>
  )
}

// 팀 상태 칩 — 아이콘 + 라벨(진행 중/평가 필요/수정 요청/완료 …).
export function TeamStatusChip({ status }: { status: MentorTeamStatus }) {
  const meta = TEAM_STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap',
        meta.chip,
      )}
    >
      <Icon className="h-[11px] w-[11px]" />
      {meta.label}
    </span>
  )
}

// 'N시간 완료'·'초과 멘토링' 보조 태그 — 상태가 아닌 부가 라벨(팀명 옆 9px).
// 틴트 매핑: #d6f2e8→success-bg · #f0edfa→accent-bg.
export function TeamSubTag({ team }: { team: MentorTeamAssignment }) {
  if (team.excessHours > 0) {
    return (
      <span className="bg-accent-bg text-accent-strong inline-flex rounded px-[5px] py-px text-[9px] font-bold whitespace-nowrap">
        초과 멘토링 {team.excessHours}h
      </span>
    )
  }
  if (team.nHoursDone) {
    return (
      <span className="bg-success-bg text-success inline-flex rounded px-[5px] py-px text-[9px] font-bold whitespace-nowrap">
        ✓ N시간 완료
      </span>
    )
  }
  return null
}

// 일지 상태 칩 — 제출 시 승인 대기(submitted) → 매니저 승인 후 유효(valid).
// 운영이 검토 모달에서 승인(POST /admin/mentoring/logs/:id/approve)하거나 수정 요청한다.
// (mock은 승인 흐름 미배선이라 제출을 즉시 valid로 단순화 — 실 BE 연동 시 승인 대기 경유.)
export function LogStatusChip({
  status,
  note,
}: {
  status: MentoringLogStatus
  note?: string
}) {
  if (status === 'valid') {
    return (
      <span className="bg-success-bg text-success inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
        <Check className="h-[11px] w-[11px]" />
        유효
      </span>
    )
  }
  if (status === 'change_requested') {
    const chip = (
      <span className="bg-danger-bg text-danger inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
        <AlertTriangle className="h-[11px] w-[11px] shrink-0" />
        수정 요청
      </span>
    )
    if (!note) return chip
    // 사유를 칩 안에 이어 붙이면(nowrap) 칩이 상태 컬럼(140px)을 밀어내 표가
    // 가로 스크롤된다. 사유는 칩 아래 별도 줄에 말줄임으로 둔다.
    return (
      <span className="inline-flex flex-col items-start gap-0.5">
        {chip}
        <span
          className="text-fg-subtle max-w-[108px] truncate text-[10px] font-medium"
          title={note}
        >
          {note}
        </span>
      </span>
    )
  }
  if (status === 'submitted') {
    return (
      <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
        <Clock className="h-[11px] w-[11px]" />
        승인 대기
      </span>
    )
  }
  return (
    <span className="bg-surface-muted text-fg-muted inline-flex items-center rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
      초안
    </span>
  )
}
