import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { OpsAccount, OpsAccountStatus, OpsRole } from '@/shared/types'

export interface AccountEditValues {
  role: OpsRole
  status: OpsAccountStatus
}

// 담당 매니저는 강사/멘토만 수정 — 매니저 권한 부여 기능이 아니므로 매니저 옵션 제외.
const ROLE_OPTIONS: { value: OpsRole; label: string }[] = [
  { value: 'INSTRUCTOR', label: '강사' },
  { value: 'MENTOR', label: '멘토' },
]
const STATUS_OPTIONS: { value: OpsAccountStatus; label: string }[] = [
  { value: 'active', label: '활성' },
  { value: 'invited', label: '초대 전' },
  { value: 'inactive', label: '비활성' },
]

interface AccountEditModalProps {
  account: OpsAccount | null
  /** override 반영된 현재 역할·상태 */
  role: OpsRole
  status: OpsAccountStatus
  onClose: () => void
  onSave: (account: OpsAccount, values: AccountEditValues) => void
}

// 운영 계정 수정 모달 — 담당 매니저가 같은 과정·기수의 강사/멘토 역할·상태를 변경(낙관).
// 진입 권한 게이트(담당 매니저·과정·기수)는 호출부(AccountsPage.canEdit)에서 판정한다.
export function AccountEditModal({
  account,
  role,
  status,
  onClose,
  onSave,
}: AccountEditModalProps) {
  const [r, setR] = useState<OpsRole>(role)
  const [s, setS] = useState<OpsAccountStatus>(status)

  // 대상/현재값이 바뀌면 폼 동기화.
  useEffect(() => {
    if (account) {
      setR(role)
      setS(status)
    }
  }, [account, role, status])

  const dirty = r !== role || s !== status

  const submit = () => {
    if (!account || !dirty) return
    onSave(account, { role: r, status: s })
  }

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title="운영 계정 수정"
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
            disabled={!dirty}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            저장
          </button>
        </>
      }
    >
      {account && (
        <div className="flex flex-col gap-4">
          <div className="border-border rounded-xl border px-4 py-3">
            <p className="text-fg text-sm font-bold">{account.name}</p>
            <p className="text-fg-subtle text-xs">{account.email}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="acc-edit-role"
              className="text-fg-muted text-xs font-bold"
            >
              역할
            </label>
            <select
              id="acc-edit-role"
              value={r}
              onChange={(e) => setR(e.target.value as OpsRole)}
              className="border-border bg-surface text-fg focus:border-brand h-10 rounded-lg border px-3 text-sm outline-none"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="acc-edit-status"
              className="text-fg-muted text-xs font-bold"
            >
              상태
            </label>
            <select
              id="acc-edit-status"
              value={s}
              onChange={(e) => setS(e.target.value as OpsAccountStatus)}
              className="border-border bg-surface text-fg focus:border-brand h-10 rounded-lg border px-3 text-sm outline-none"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-info-bg flex items-start gap-2 rounded-lg p-3">
            <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-fg-muted text-xs">
              담당 범위는 표의 담당 범위 셀에서 변경합니다. 저장 시
              role_assignment_updated 감사 로그가 기록됩니다.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
