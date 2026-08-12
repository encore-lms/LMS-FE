// 팀 상세 할 일·경고 스트립 — 상황 요약 문장 칩 목록. TeamDetailBody에서 분리.
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClockAlert,
  FileText,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { type AssignmentDisplayStatus } from './statusMeta'
import type { AdminMentoringTeamDetail } from './types'

export function TeamAlertStrip({
  d,
  displayStatus,
  isInProgress,
  remaining,
}: {
  d: AdminMentoringTeamDetail
  displayStatus: AssignmentDisplayStatus
  isInProgress: boolean
  remaining: number | null
}) {
  const uncertified = d.logs.filter((l) => l.status !== 'valid').length

  // 할 일·경고 스트립 — 상황 요약 문장.
  type Alert = {
    tone: 'critical' | 'warning' | 'info' | 'positive'
    icon: typeof Clock
    text: string
  }
  const alerts: Alert[] = []
  if (!d.mentor)
    alerts.push({
      tone: 'critical',
      icon: AlertTriangle,
      text: '멘토가 배정되지 않았습니다.',
    })
  if (uncertified > 0)
    alerts.push({
      tone: 'warning',
      icon: ClockAlert,
      text: `미인증 일지 ${uncertified}건 — 검토가 필요합니다.`,
    })
  if (displayStatus === 'early_ended')
    alerts.push({
      tone: 'warning',
      icon: AlertTriangle,
      text: '조기 종료된 멘토링입니다 — 평가 가능 상태입니다.',
    })
  else if (displayStatus === 'n_hours_done')
    alerts.push({
      tone: 'positive',
      icon: CheckCircle2,
      // 'N시간' 리터럴 노출 방지 — 실제 배정 시간으로 표기(2026-08-04 QA).
      text: `배정 시간 ${d.allocatedHours ?? 0}h를 모두 채웠습니다.`,
    })
  else if (isInProgress && remaining !== null && remaining > 0)
    alerts.push({
      tone: 'info',
      icon: Clock,
      text: `배정 시간까지 ${remaining}h 남았습니다.`,
    })
  if (d.logs.length === 0)
    alerts.push({
      tone: 'info',
      icon: FileText,
      text: '아직 작성된 일지가 없습니다.',
    })
  if (alerts.length === 0)
    alerts.push({
      tone: 'positive',
      icon: CheckCircle2,
      text: '특이사항 없이 진행 중입니다.',
    })

  const ALERT_TONE: Record<Alert['tone'], string> = {
    critical: 'bg-danger-bg text-danger',
    warning: 'bg-warning-bg text-warning',
    info: 'bg-info-bg text-info',
    positive: 'bg-success-bg text-success',
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {alerts.map((a, i) => {
        const Icon = a.icon
        return (
          <span
            key={i}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold',
              ALERT_TONE[a.tone],
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {a.text}
          </span>
        )
      })}
    </div>
  )
}
