import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'

/**
 * 인증 취소 확인 — 되돌릴 수 없는 조작이라 확인 문구를 그대로 입력해야 진행된다.
 *
 * <p>수강생 쪽에서는 인증이 사라지는 일이고(증명서·집계에 반영된다) 인증 이력도 지워지므로,
 * 버튼 한 번으로 처리되면 실수로 누른 것과 구분되지 않는다.</p>
 */
export const REVOKE_PHRASE = '인증 취소 하겠습니다.'

export function RevokeCertificationModal({
  open,
  targetName,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean
  /** 취소 대상 이름 — 무엇을 되돌리는지 눈으로 확인시킨다. */
  targetName: string
  busy?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [phrase, setPhrase] = useState('')
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!open) return
    setPhrase('')
    setReason('')
  }, [open])

  const phraseOk = phrase.trim() === REVOKE_PHRASE
  const reasonOk = reason.trim().length > 0
  const canSubmit = phraseOk && reasonOk && !busy

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="인증 취소"
      // 입력 중 배경 클릭으로 닫히면 적어 둔 사유가 날아간다.
      closeOnBackdrop={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <Button
            variant="danger"
            disabled={!canSubmit}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? '처리 중…' : '인증 취소'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="bg-danger-bg rounded-xl px-4 py-3.5">
          <p className="text-danger text-[13px] leading-[21px] font-medium">
            <span className="font-bold">{targetName}</span>
            의 인증을 취소합니다.
          </p>
          <p className="text-fg-muted mt-1 text-[12px] leading-[19px]">
            인증 기록(인증자·인증일)이 지워지고 검토 대기 상태로 돌아갑니다.
            수강생에게 알림이 갑니다.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[13px] font-semibold">취소 사유</span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="왜 취소하는지 적어 주세요. 수강생이 무엇을 고쳐야 할지 알 수 있게."
            className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-[84px] w-full rounded-[10px] border p-3.5 text-[13px] outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[13px] font-semibold">
            확인 문구{' '}
            <span className="text-fg-subtle font-normal">
              아래 문구를 그대로 입력하세요
            </span>
          </span>
          <span className="bg-surface-muted text-fg rounded-[8px] px-3 py-2 text-[13px] font-semibold select-all">
            {REVOKE_PHRASE}
          </span>
          <input
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder={REVOKE_PHRASE}
            className={inputClass({ invalid: phrase.length > 0 && !phraseOk })}
          />
          {phrase.length > 0 && !phraseOk && (
            <span className="text-danger text-[12px]">
              문구가 일치하지 않습니다.
            </span>
          )}
        </label>
      </div>
    </Modal>
  )
}
