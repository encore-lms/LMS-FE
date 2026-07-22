// 팀원 프로필 — 워크스페이스 데이터에서 담당 작업·이슈 집계, 상호평가 협업 태그.
import { ListChecks, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { Modal } from '@/components/ui/Modal'
import type { WorkspaceData, WsMember } from '../../../types'
import { Chip, StatBox } from '../../components/ws-shared'
import { TONE_SOLID } from '@/shared/lib/tone'

export function MemberProfileModal({
  member,
  d,
  onClose,
}: {
  member: WsMember
  d: WorkspaceData
  onClose: () => void
}) {
  // 본인(PM)은 보드/내 할 일에서 '나'로 기재되므로 별칭으로 함께 집계.
  const aliases =
    member.kind === 'PM' ? new Set([member.name, '나']) : new Set([member.name])
  const boardTasks = d.columns.reduce(
    (acc, col) => acc + col.tasks.filter((t) => aliases.has(t.assignee)).length,
    0,
  )
  const myTaskCount =
    member.kind === 'PM'
      ? d.myTasks.filter((t) => aliases.has(t.assignee)).length
      : 0
  const taskCount = boardTasks + myTaskCount
  const issueCount = d.issues.filter((it) =>
    it.meta.includes(member.name),
  ).length
  const peer = d.peerTargets.find((p) => p.name === member.name)
  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 프로필"
      footer={
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ variant: 'secondary', size: 'sm' })}
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-full text-[24px] font-bold text-white',
              TONE_SOLID[member.avatarTone],
            )}
          >
            {member.name.slice(0, 1)}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-fg text-[18px] font-bold">
                {member.name}
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  member.kind === 'PM'
                    ? 'bg-accent-bg text-accent-strong'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {member.kind}
              </span>
            </div>
            <span className="text-fg-muted text-[12px]">{member.role}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={ListChecks}
            label="담당 작업"
            value={`${taskCount}건`}
          />
          <StatBox
            icon={TriangleAlert}
            label="담당 이슈"
            value={`${issueCount}건`}
          />
        </div>

        {peer && peer.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-fg-subtle text-[11px] font-semibold">
              상호평가 협업 태그
            </span>
            <div className="flex flex-wrap gap-1.5">
              {peer.tags.map((tg, i) => (
                <Chip key={i} badge={tg} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
