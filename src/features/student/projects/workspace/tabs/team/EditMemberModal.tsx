// 팀원 정보 수정 — 역할·구분(PM 위임).
import { useState } from 'react'
import { buttonClass } from '@/components/ui/buttonClass'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { WsMember } from '../../../types'
import { Avatar } from '../../components/ws-shared'
import { RoleSelect } from './RoleSelect'

export function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: WsMember
  onClose: () => void
  onSave: (patch: { role: string; kind: WsMember['kind'] }) => void
}) {
  // 기존 역할이 '백엔드 · 팀원'처럼 결합형이면 앞 전문분야만 취해 객관식과 맞춘다.
  const [role, setRole] = useState(member.role.split(' · ')[0])
  const [kind, setKind] = useState<WsMember['kind']>(member.kind)
  const submit = () => {
    if (!role.trim()) return
    onSave({ role: role.trim(), kind })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 정보 수정"
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
            disabled={!role.trim()}
            className={buttonClass({ size: 'sm' })}
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="bg-surface-muted flex items-center gap-3 rounded-xl p-3">
          <Avatar name={member.name} tone={member.avatarTone} />
          <span className="text-fg text-[14px] font-bold">{member.name}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">역할</span>
          <RoleSelect value={role} onChange={setRole} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">구분</span>
          <Select
            aria-label="구분"
            value={kind}
            onChange={(v) => setKind(v as WsMember['kind'])}
            options={[
              { value: '팀원', label: '팀원' },
              { value: 'PM', label: 'PM (위임 시 기존 PM은 팀원으로 변경)' },
            ]}
            className="h-10 w-full"
          />
        </div>
      </div>
    </Modal>
  )
}
