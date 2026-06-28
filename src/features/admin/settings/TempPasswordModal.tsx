import { useEffect, useState } from 'react'
import { Copy, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import type { OpsAccount } from '@/shared/types'
import { useResetOpsPassword } from '../api/settings'

interface TempPasswordModalProps {
  /** non-null이면 해당 계정 기준으로 모달이 열린다. */
  account: OpsAccount | null
  onClose: () => void
}

// 비밀번호 초기화 모달 — 서버(POST /auth/accounts/{userId}/password/reset)에서 임시 비밀번호를 발급한다.
// '새로 발급'을 누를 때마다 서버 비밀번호가 재설정되고 직전 값은 즉시 무효가 된다(1회 표시).
export function TempPasswordModal({
  account,
  onClose,
}: TempPasswordModalProps) {
  const toast = useToast()
  const [pw, setPw] = useState('')
  const resetPw = useResetOpsPassword()

  // 계정이 바뀌어 모달이 열릴 때마다 서버에서 임시 비밀번호를 발급.
  useEffect(() => {
    if (!account) {
      setPw('')
      return
    }
    let cancelled = false
    setPw('')
    resetPw
      .mutateAsync(account.id)
      .then((r) => {
        if (!cancelled) setPw(r.temporaryPassword)
      })
      .catch(() => {
        if (!cancelled) toast.danger('임시 비밀번호 발급에 실패했어요')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  const reissue = () => {
    if (!account) return
    resetPw
      .mutateAsync(account.id)
      .then((r) => setPw(r.temporaryPassword))
      .catch(() => toast.danger('임시 비밀번호 발급에 실패했어요'))
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pw)
      toast.success('임시 비밀번호를 복사했어요')
    } catch {
      toast.danger('복사하지 못했어요 — 직접 선택해 복사해 주세요')
    }
  }

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title="비밀번호 초기화"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={reissue}>
            <RefreshCw className="h-4 w-4" /> 새로 발급
          </Button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-4 text-sm">
        이 계정의 임시 비밀번호를 발급합니다. 발급된 비밀번호로 로그인한 뒤
        비밀번호를 재설정하도록 안내하세요.
      </p>

      {/* 임시 비밀번호 표시 */}
      <div className="border-border rounded-xl border p-4">
        <p className="text-fg-subtle text-xs font-medium">임시 비밀번호</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="bg-surface-muted text-fg flex-1 rounded-lg px-3 py-2.5 font-mono text-lg tracking-wider select-all">
            {pw || (resetPw.isPending ? '발급 중…' : '—')}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label="임시 비밀번호 복사"
            className="border-border text-fg-muted hover:bg-surface-muted flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 명시 — 누를 때마다 바뀐다(매니저 인지용) */}
      <div className="bg-warning-bg mt-4 flex items-start gap-2 rounded-lg p-3">
        <Info className="text-warning mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-fg-muted text-xs">
          <span className="text-fg font-semibold">
            ‘새로 발급’을 누를 때마다 임시 비밀번호가 새로 생성
          </span>
          되며, 직전에 발급한 비밀번호는 즉시 무효가 됩니다. 비밀번호 원문은 이
          화면에서 1회만 표시되고 닫은 뒤에는 다시 볼 수 없습니다.
        </p>
      </div>
    </Modal>
  )
}
