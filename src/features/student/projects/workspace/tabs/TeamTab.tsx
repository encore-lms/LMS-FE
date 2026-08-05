import { useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import type { WorkspaceData, WsMember } from '../../types'
import { Avatar, SectionHead } from '../components/ws-shared'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'
import {
  useInviteMember,
  useRemoveMember,
  useUpdateMember,
  wsWriteError,
} from '../../../api/projects'
import { EditMemberModal } from './team/EditMemberModal'
import { InviteMemberModal } from './team/InviteMemberModal'
import { MemberProfileModal } from './team/MemberProfileModal'

export function TeamTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  // 표시 이름만 실명(/users/peers + 본인)으로 — 렌더 시점 매핑(peers 비동기 로드 반영).
  const nameOf = useMemberNames()
  const inviteM = useInviteMember(d.id)
  const removeM = useRemoveMember(d.id)
  const updateM = useUpdateMember(d.id)
  // 서버 데이터 단일 원천 — 로컬 복제(useState) 없이 워크스페이스 재조회(invalidate)로 갱신한다.
  const members = d.members
  const [inviting, setInviting] = useState(false)
  const [openMember, setOpenMember] = useState<WsMember | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  // 본인 = 첫 멤버(작성자·PM, PM 위임해도 목록 인덱스 0 유지).
  const SELF_INDEX = 0

  // 팀 구성 변경 가드 — 서버와 같은 기준으로 미리 막고 이유를 보여준다.
  //  · PM 아님: 팀원 누구나 남을 넣고 뺄 수 있으면 PM 이 모르는 사이 팀이 바뀐다.
  //  · 상호평가 진행 중: 대상이 바뀌면 이미 낸 평가가 갈 곳을 잃는다.
  //  · 종료된 프로젝트: 하지도 않은 협업이 증명서 근거가 된다(초대만 막고 정리는 허용).
  const notPm = d.isOwner !== true
  const peerOpen = d.peerEvalEnabled
  const closed = d.status === 'completed' || d.status === 'certified'
  const inviteBlocked = notPm
    ? 'PM만 팀원을 초대할 수 있어요'
    : peerOpen
      ? '상호평가가 진행 중이라 팀원을 바꿀 수 없어요'
      : closed
        ? '종료된 프로젝트에는 팀원을 초대할 수 없어요'
        : null
  const removeBlocked = notPm
    ? 'PM만 팀원을 삭제할 수 있어요'
    : peerOpen
      ? '상호평가가 진행 중이라 팀원을 바꿀 수 없어요'
      : null

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="팀원 관리"
        action="팀원 초대"
        onAction={() => setInviting(true)}
        actionBlockedReason={inviteBlocked}
      />
      {inviteBlocked && (
        <p className="text-fg-muted text-[12px]">{inviteBlocked}</p>
      )}
      <section className={cn(card, 'flex flex-col py-2')}>
        {members.map((m, i) => (
          <div
            key={m.name}
            className={cn(
              'flex items-center gap-4 py-5',
              i > 0 && 'border-divider border-t',
            )}
          >
            <Avatar name={nameOf(m.userId, m.name)} tone={m.avatarTone} />
            {/* 고정 w-40 칸 — 배지는 줄이지 않고 이름·역할만 말줄임한다 */}
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-fg truncate text-[13px] font-bold"
                  title={nameOf(m.userId, m.name)}
                >
                  {nameOf(m.userId, m.name)}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                    m.kind === 'PM'
                      ? 'bg-accent-bg text-accent-strong'
                      : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {m.kind}
                </span>
                {i === SELF_INDEX && (
                  <span className="bg-brand/10 text-brand shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold">
                    본인
                  </span>
                )}
              </div>
              <span
                className="text-fg-subtle truncate text-[11px]"
                title={m.role}
              >
                {m.role}
              </span>
            </div>
            <div className="flex-1" />
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setOpenMember(m)}
                className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
              >
                상세
              </button>
              <button
                type="button"
                onClick={() => setEditing(i)}
                className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => setRemoving(i)}
                disabled={m.kind === 'PM' || !!removeBlocked}
                title={
                  m.kind === 'PM'
                    ? 'PM은 삭제할 수 없어요. 다른 팀원에게 PM을 위임한 뒤 삭제하세요.'
                    : (removeBlocked ?? undefined)
                }
                className="border-border text-danger hover:bg-danger-bg rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </section>
      {openMember && (
        <MemberProfileModal
          member={openMember}
          d={d}
          onClose={() => setOpenMember(null)}
        />
      )}
      {editing !== null && members[editing] && (
        <EditMemberModal
          member={members[editing]}
          canDelegate={d.isOwner === true}
          saving={updateM.isPending}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            const target = members[editing]
            updateM.mutate(
              {
                memberId: target.memberId ?? '',
                specialty: patch.role,
                // PM 위임 — 다른 멤버를 PM으로 지정하면 BE가 기존 PM을 팀원으로 강등.
                makePm: patch.kind === 'PM' && target.kind !== 'PM',
              },
              {
                onSuccess: () => {
                  setEditing(null)
                  toast.success('팀원 정보를 수정했습니다')
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '팀원 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      {removing !== null && members[removing] && (
        <Modal
          open
          onClose={() => setRemoving(null)}
          title="팀원 삭제"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setRemoving(null)}
                className={buttonClass({ variant: 'secondary', size: 'sm' })}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = members[removing]
                  const name = nameOf(target.userId, target.name)
                  removeM.mutate(
                    { memberId: target.memberId ?? '' },
                    {
                      onSuccess: () => {
                        // 목록 갱신은 invalidate(워크스페이스 재조회)가 담당 — 로컬 복제 없음.
                        setRemoving(null)
                        toast.success(`${name} 님을 팀에서 삭제했습니다`)
                      },
                      onError: (e) =>
                        toast.danger(
                          wsWriteError(e, '팀원 삭제에 실패했어요.'),
                        ),
                    },
                  )
                }}
                className={buttonClass({ variant: 'danger', size: 'md' })}
              >
                삭제
              </button>
            </>
          }
        >
          <p className="text-fg-muted text-[13px] leading-6">
            <span className="text-fg font-bold">{members[removing].name}</span>{' '}
            ({members[removing].role}) 님을 팀에서 삭제할까요? 삭제하면 상호평가
            대상에서 제외됩니다.
          </p>
        </Modal>
      )}
      {inviting && (
        <InviteMemberModal
          existingUserIds={
            members.map((m) => m.userId).filter(Boolean) as string[]
          }
          onClose={() => setInviting(false)}
          onInvite={(userId, role, label) => {
            inviteM.mutate(
              { userId, role },
              {
                onSuccess: () => {
                  setInviting(false)
                  toast.success(
                    `${label} 님에게 초대를 보냈어요 · 수락하면 팀원이 됩니다`,
                  )
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '팀원 초대에 실패했어요.')),
              },
            )
          }}
        />
      )}
    </div>
  )
}
