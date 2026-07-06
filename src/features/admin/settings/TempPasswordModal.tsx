import { useEffect, useRef, useState } from 'react'
import { Copy, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { useResetAccountPassword } from '../api/settings'

export interface TempPasswordTarget {
  /** 초기화 API 대상 계정 ID */
  userId: string
  name: string
  /** 이메일·학생 UUID 등 보조 식별 표기 */
  detail?: string
}

interface TempPasswordModalProps {
  /** non-null이면 해당 계정 기준으로 모달이 열린다. */
  target: TempPasswordTarget | null
  onClose: () => void
  /** true면 매니저 메모 입력을 노출한다(학생 관리 — 감사 로그 기록용). */
  withMemo?: boolean
  /** 최초 발급 성공 시 1회 호출 — 감사 로그 기록 등 부가 처리. */
  onIssued?: (memo: string) => void
}

// 비밀번호 초기화 모달 — 서버(POST /auth/accounts/{userId}/password/reset)에서 임시 비밀번호를 발급한다.
// 운영 계정(설정)·학생 계정(학생 관리) 공용. 파괴적 액션이므로 모달 오픈만으로는
// 재설정하지 않고, 확인 → 발급 2단계를 거친다.
// 발급 시마다 서버 비밀번호가 재설정되고 직전 값은 즉시 무효가 된다(1회 표시).
export function TempPasswordModal({
  target,
  onClose,
  withMemo = false,
  onIssued,
}: TempPasswordModalProps) {
  const toast = useToast()
  const [pw, setPw] = useState('')
  const [issued, setIssued] = useState(false)
  const [memo, setMemo] = useState('')
  const resetPw = useResetAccountPassword()
  // 응답 도착 시점의 유효 대상 판별용 — 닫힘/대상 전환 후 늦게 온 응답을 무시한다.
  const activeUserId = useRef<string | null>(null)

  // 대상 계정이 바뀌면 확인 단계부터 다시 시작(이전 계정의 비밀번호·메모 잔상 제거).
  // deps는 스칼라 id — 호출부가 target을 인라인 객체로 만들어도 리렌더마다 리셋되지 않는다.
  const targetUserId = target?.userId ?? null
  useEffect(() => {
    activeUserId.current = targetUserId
    setPw('')
    setIssued(false)
    setMemo('')
  }, [targetUserId])

  const issue = () => {
    if (!target || resetPw.isPending) return
    const requestFor = target.userId
    resetPw
      .mutateAsync(requestFor)
      .then((r) => {
        if (activeUserId.current !== requestFor) return
        setPw(r.temporaryPassword)
        if (!issued) onIssued?.(memo)
        setIssued(true)
      })
      .catch(() => {
        if (activeUserId.current !== requestFor) return
        toast.danger('임시 비밀번호 발급에 실패했어요')
      })
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
      open={!!target}
      onClose={onClose}
      title="비밀번호 초기화"
      footer={
        issued ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button onClick={issue} disabled={resetPw.isPending}>
              <RefreshCw className="h-4 w-4" />
              {resetPw.isPending ? '발급 중…' : '새로 발급'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button onClick={issue} disabled={resetPw.isPending}>
              {resetPw.isPending ? '발급 중…' : '초기화하고 발급'}
            </Button>
          </>
        )
      }
    >
      {issued ? (
        <>
          <p className="text-fg-muted -mt-1 mb-4 text-sm">
            발급된 비밀번호로 로그인한 뒤 비밀번호를 재설정하도록 안내하세요.
          </p>

          {/* 임시 비밀번호 표시 */}
          <div className="border-border rounded-xl border p-4">
            <p className="text-fg-subtle text-xs font-medium">임시 비밀번호</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="bg-surface-muted text-fg flex-1 rounded-lg px-3 py-2.5 font-mono text-lg tracking-wider select-all">
                {pw || '—'}
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
              되며, 직전에 발급한 비밀번호는 즉시 무효가 됩니다. 비밀번호 원문은
              이 화면에서 1회만 표시되고 닫은 뒤에는 다시 볼 수 없습니다.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-fg-muted -mt-1 mb-4 text-sm">
            <span className="text-fg font-semibold">{target?.name}</span>
            {target?.detail ? `(${target.detail})` : ''} 계정의 비밀번호를
            초기화하고 임시 비밀번호를 발급합니다.
          </p>
          <div className="bg-warning-bg flex items-start gap-2 rounded-lg p-3">
            <Info className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-fg-muted text-xs">
              발급 즉시{' '}
              <span className="text-fg font-semibold">
                기존 비밀번호는 무효가 되며 되돌릴 수 없습니다.
              </span>{' '}
              대상 계정 사용자가 로그인 중이더라도 다음 로그인부터 임시
              비밀번호가 필요합니다.
            </p>
          </div>
          {withMemo && (
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              aria-label="매니저 메모"
              placeholder="매니저 메모 (선택) — 처리 사유를 남기면 감사 로그에 함께 기록됩니다"
              className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface mt-4 w-full rounded-lg border p-3 text-sm outline-none"
            />
          )}
        </>
      )}
    </Modal>
  )
}
