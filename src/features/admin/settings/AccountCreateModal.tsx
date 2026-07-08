import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import type { OpsRole } from '@/shared/types'

export interface AccountCreateValues {
  name: string
  email: string
  role: OpsRole
}

const ROLE_OPTIONS: { value: OpsRole; label: string }[] = [
  { value: 'MANAGER', label: '매니저' },
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'MENTOR', label: '멘토' },
]

// 간단 이메일 형식 검증 (mock — 서버 검증은 BE 연동 시).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface AccountCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (values: AccountCreateValues) => void
}

// 새 운영 계정 추가 폼 모달 — 이름·이메일·역할 입력 후 초대 발송(mock, 낙관적 반영).
// 담당 범위는 생성 후 표의 담당 범위에서 배정. (피그마 프레임은 Phase 2 신규 예정)
export function AccountCreateModal({
  open,
  onClose,
  onCreate,
}: AccountCreateModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OpsRole>('MANAGER')

  // 모달이 열릴 때마다 입력값 초기화.
  useEffect(() => {
    if (open) {
      setName('')
      setEmail('')
      setRole('MANAGER')
    }
  }, [open])

  const emailValid = EMAIL_RE.test(email.trim())
  const canSubmit = name.trim().length > 0 && emailValid

  const submit = () => {
    if (!canSubmit) return
    onCreate({ name: name.trim(), email: email.trim(), role })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="새 계정 추가"
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            계정 추가
          </button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-4 text-sm">
        운영진 계정을 새로 만들고 이메일 초대를 보냅니다. 첫 로그인 시
        활성화됩니다.
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="acc-create-name"
            className="text-fg-muted text-xs font-bold"
          >
            이름 <span className="text-danger">*</span>
          </label>
          <input
            id="acc-create-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 김운영"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="acc-create-email"
            className="text-fg-muted text-xs font-bold"
          >
            이메일 <span className="text-danger">*</span>
          </label>
          <input
            id="acc-create-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@playdata.io"
            className="border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none"
          />
          {email.trim() && !emailValid && (
            <p className="text-danger text-xs">이메일 형식이 올바르지 않아요</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-fg-muted text-xs font-bold">역할</span>
          <Select
            aria-label="역할"
            value={role}
            onChange={(v) => setRole(v as OpsRole)}
            options={ROLE_OPTIONS}
           
          />
        </div>

        <div className="bg-info-bg flex items-start gap-2 rounded-lg p-3">
          <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-fg-muted text-xs">
            담당 범위는 생성 후 표의 담당 범위 컬럼에서 배정합니다. 생성 시 감사
            로그가 기록됩니다.
          </p>
        </div>
      </div>
    </Modal>
  )
}
