import { Mail, Users } from 'lucide-react'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { useAnswerInvitation, useProjectInvitations } from '../../api/projects'

/**
 * 내가 받은 프로젝트 초대.
 *
 * <p>초대는 제안이라 받아들이기 전에는 프로젝트 목록에 나타나지 않는다 — 아직 팀이 아니다.
 * 그래서 목록 맨 위에 따로 세워 둔다. 알림을 지워도 여기로 돌아올 수 있어야 한다.</p>
 */
export function InvitationCard() {
  const { data: invitations } = useProjectInvitations()
  const answer = useAnswerInvitation()
  const toast = useToast()

  if (!invitations || invitations.length === 0) return null

  const respond = (
    projectId: string,
    title: string,
    kind: 'accept' | 'decline',
  ) =>
    answer.mutate(
      { projectId, answer: kind },
      {
        onSuccess: () =>
          kind === 'accept'
            ? toast.success(`‘${title}’ 팀에 참여했어요`)
            : toast.info(`‘${title}’ 초대를 거절했어요`),
        onError: () =>
          toast.danger('응답하지 못했어요. 잠시 후 다시 시도해 주세요'),
      },
    )

  return (
    <section className="bg-accent-bg/60 flex flex-col gap-3 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Mail className="text-accent-strong size-[18px]" aria-hidden="true" />
        <h2 className="text-fg text-[15px] font-bold">받은 초대</h2>
        <span className="bg-accent-strong rounded-full px-2 py-0.5 text-[11px] font-bold text-white">
          {invitations.length}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {invitations.map((inv) => (
          <li
            key={inv.projectId}
            className="bg-surface flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-fg truncate text-[14px] font-bold">
                {inv.title}
              </span>
              <span className="text-fg-subtle flex items-center gap-2 text-[12px]">
                {inv.invitedBy && <span>{inv.invitedBy} 님이 초대</span>}
                <span className="inline-flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden="true" />
                  팀원 {inv.memberCount}명
                </span>
                {inv.invitedAt && <span>{inv.invitedAt}</span>}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={answer.isPending}
                onClick={() => respond(inv.projectId, inv.title, 'decline')}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                거절
              </button>
              <button
                type="button"
                disabled={answer.isPending}
                onClick={() => respond(inv.projectId, inv.title, 'accept')}
                className={buttonClass({ size: 'sm' })}
              >
                수락
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-fg-subtle text-[11px]">
        수락하면 그때부터 팀원이 되고 워크스페이스가 열립니다.
      </p>
    </section>
  )
}
