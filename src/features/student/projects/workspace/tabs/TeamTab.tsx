import { useState } from 'react'
import { ListChecks, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import type { WorkspaceData, WsMember } from '../../types'
import { Avatar, Chip, SectionHead, StatBox } from '../components/ws-shared'
import { TONE_SOLID } from '@/shared/lib/tone'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'
import {
  useInviteMember,
  useRemoveMember,
  wsWriteError,
} from '../../../api/projects'
import { usePeers } from '../../../api/peers'

export function TeamTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  // 표시 이름만 실명(/users/peers + 본인)으로 — 렌더 시점 매핑(peers 비동기 로드 반영).
  const nameOf = useMemberNames()
  const inviteM = useInviteMember(d.id)
  const removeM = useRemoveMember(d.id)
  const [members, setMembers] = useState(d.members)
  const [inviting, setInviting] = useState(false)
  const [openMember, setOpenMember] = useState<WsMember | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  // 본인 = 첫 멤버(작성자·PM, PM 위임해도 목록 인덱스 0 유지).
  const SELF_INDEX = 0
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="팀원 관리"
        action="팀원 초대"
        onAction={() => setInviting(true)}
      />
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
            <div className="flex w-40 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-fg text-[13px] font-bold">
                  {nameOf(m.userId, m.name)}
                </span>
                <span
                  className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-bold',
                    m.kind === 'PM'
                      ? 'bg-accent-bg text-accent-strong'
                      : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {m.kind}
                </span>
                {i === SELF_INDEX && (
                  <span className="bg-brand/10 text-brand rounded px-1.5 py-0.5 text-[10px] font-bold">
                    본인
                  </span>
                )}
              </div>
              <span className="text-fg-subtle text-[11px]">{m.role}</span>
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
                disabled={m.kind === 'PM'}
                title={
                  m.kind === 'PM'
                    ? 'PM은 삭제할 수 없어요. 다른 팀원에게 PM을 위임한 뒤 삭제하세요.'
                    : undefined
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
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            setMembers((prev) =>
              prev.map((mm, idx) => {
                if (idx === editing) return { ...mm, ...patch }
                // PM 위임 — 다른 멤버를 PM으로 지정하면 기존 PM은 팀원으로 강등.
                if (patch.kind === 'PM' && mm.kind === 'PM')
                  return { ...mm, kind: '팀원' }
                return mm
              }),
            )
            setEditing(null)
            toast.success('팀원 정보를 수정했습니다')
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
                        setMembers((prev) =>
                          prev.filter((_, idx) => idx !== removing),
                        )
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
                  toast.success(`${label} 님을 초대했습니다`)
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

// 역할 객관식 — 프리셋 선택 + '기타' 직접 입력. value가 프리셋이 아니면 기타로 간주.
const ROLE_PRESETS = [
  '프론트엔드',
  '백엔드',
  '풀스택',
  'PM',
  '데브옵스',
  '기획',
  '디자인',
]
const fieldCls = inputClass()

function RoleSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const isPreset = ROLE_PRESETS.includes(value)
  const selectValue = isPreset ? value : '기타'
  return (
    <div className="flex flex-col gap-2">
      <Select
        value={selectValue}
        onChange={(v) => onChange(v === '기타' ? '' : v)}
        aria-label="역할 선택"
        options={[
          ...ROLE_PRESETS.map((r) => ({ value: r, label: r })),
          { value: '기타', label: '기타 (직접 입력)' },
        ]}
        className="h-10 w-full"
      />
      {selectValue === '기타' && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="역할을 직접 입력하세요"
          aria-label="역할 직접 입력"
          className={fieldCls}
        />
      )}
    </div>
  )
}

function InviteMemberModal({
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

// 팀원 정보 수정 — 역할·구분(PM 위임).
function EditMemberModal({
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

// 팀원 프로필 — 워크스페이스 데이터에서 담당 작업·이슈 집계, 상호평가 협업 태그.
function MemberProfileModal({
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
