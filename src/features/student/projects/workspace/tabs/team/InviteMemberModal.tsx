// 팀원 초대 모달 — 같은 기수 동료(usePeers) 중 선택해 역할과 함께 초대.
import { useState } from 'react'
import { buttonClass } from '@/components/ui/buttonClass'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { usePeers } from '../../../../api/peers'
import { RoleSelect } from './RoleSelect'

export function InviteMemberModal({
  existingUserIds,
  onClose,
  onInvite,
}: {
  existingUserIds: string[]
  onClose: () => void
  onInvite: (userId: string, role: string, label: string) => void
}) {
  const { data } = usePeers()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('백엔드')
  // 같은 기수 동료 중 이미 팀에 있는 사람 제외
  const candidates = (data?.items ?? []).filter(
    (p) => !existingUserIds.includes(p.userId),
  )
  const picked = candidates.find((c) => c.userId === userId)
  const submit = () => {
    if (!userId || !role.trim()) return
    onInvite(userId, role.trim(), picked?.name ?? '팀원')
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 초대"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!userId || !role.trim()}
            className={buttonClass({ size: 'sm' })}
          >
            초대
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">
            팀원 선택{' '}
            <span className="text-fg-subtle font-normal">(같은 기수 동료)</span>
          </span>
          {candidates.length === 0 ? (
            <span className="text-fg-subtle text-[12px]">
              초대 가능한 동료가 없어요.
            </span>
          ) : (
            <Select
              aria-label="팀원 선택"
              value={userId}
              onChange={setUserId}
              options={[
                { value: '', label: '동료를 선택하세요' },
                ...candidates.map((c) => ({
                  value: c.userId,
                  label: c.name,
                })),
              ]}
              className="h-10 w-full"
            />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">역할</span>
          <RoleSelect value={role} onChange={setRole} />
        </div>
      </div>
    </Modal>
  )
}
