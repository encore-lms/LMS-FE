import { useState } from 'react'
import { Copy, UserPlus } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import {
  useCreateTestStudent,
  type TestStudentAccount,
} from '../api/students'

// 시연·검증용 수강생 계정 생성 — 촬영 중 계정이 하나 더 필요할 때 쓴다.
// 로그인 ID·비밀번호는 서버가 만들고 이 응답에서만 평문으로 내려오므로,
// 만들고 나면 닫기 전에 받아 적을 수 있도록 화면에 그대로 남긴다.
export function TestStudentModal({
  open,
  cohortId,
  cohortLabel,
  onClose,
}: {
  open: boolean
  /** 계정을 배정할 기수 — 화면에서 선택 중인 기수를 그대로 쓴다. */
  cohortId: string | null
  cohortLabel: string
  onClose: () => void
}) {
  const toast = useToast()
  const create = useCreateTestStudent()
  const [name, setName] = useState('')
  const [created, setCreated] = useState<TestStudentAccount | null>(null)

  const close = () => {
    setName('')
    setCreated(null)
    onClose()
  }

  const submit = () => {
    if (!name.trim() || !cohortId || create.isPending) return
    create.mutate(
      { name: name.trim(), cohortId },
      {
        onSuccess: (account) => {
          setCreated(account)
          toast.success('테스트 계정을 만들었어요')
        },
        onError: () => toast.danger('테스트 계정 생성에 실패했어요'),
      },
    )
  }

  const copy = async () => {
    if (!created) return
    await navigator.clipboard.writeText(
      `${created.loginId} / ${created.password}`,
    )
    toast.success('로그인 정보를 복사했어요')
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={close}
      onConfirm={created ? close : submit}
      size="md"
      title={created ? '테스트 계정을 만들었어요' : '테스트 계정 만들기'}
      confirmLabel={
        created ? '닫기' : create.isPending ? '만드는 중…' : '계정 만들기'
      }
      confirmDisabled={!created && (!name.trim() || !cohortId)}
    >
      {created ? (
        <div className="flex flex-col gap-4">
          <p className="text-fg-muted text-[13px] leading-6">
            아래 정보로 로그인할 수 있어요. 창을 닫으면 비밀번호는 다시 볼 수
            없으니 지금 복사해 두세요.
          </p>
          <div className="bg-surface-muted/60 flex flex-col gap-2 rounded-[12px] p-4">
            <Row label="이름" value={created.name} />
            <Row label="로그인 ID" value={created.loginId} mono />
            <Row label="비밀번호" value={created.password} mono />
          </div>
          <button
            type="button"
            onClick={copy}
            className="border-border text-fg-muted hover:bg-surface-muted flex w-fit items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
          >
            <Copy className="size-3.5" />
            로그인 정보 복사
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-fg-muted text-[13px] leading-6">
            시연·검증용 계정입니다. 수강생에게는 동료 평가 대상이나 멘토링 팀원
            명단에 보이지 않고, 언제든 목록에서 삭제할 수 있어요.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
              placeholder="예: 촬영용 수강생"
              maxLength={100}
              className={inputClass()}
            />
          </label>
          <div className="flex items-center gap-2 text-[12px]">
            <UserPlus className="text-fg-subtle size-3.5" />
            <span className="text-fg-muted">
              배정 기수 <span className="text-fg font-bold">{cohortLabel}</span>
              {' · '}로그인 ID와 비밀번호는 자동으로 만들어져요
            </span>
          </div>
        </div>
      )}
    </ConfirmDialog>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-fg-subtle text-[12px]">{label}</span>
      <span
        className={
          mono
            ? 'text-fg font-mono text-[13px] font-bold'
            : 'text-fg text-[13px] font-bold'
        }
      >
        {value}
      </span>
    </div>
  )
}
