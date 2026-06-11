import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export interface ActionModalSpec {
  title: string
  subtitle: string
  /** 처리 요약 4행 (Figma 운영 액션 모달 v2 공통) */
  rows: { label: string; value: string }[]
  confirmLabel: string // 저장 / 확인 / 등록 / 버리기
}

interface ActionModalProps {
  spec: ActionModalSpec | null
  onClose: () => void
  onConfirm: (memo: string) => void
}

// 운영 액션 모달 v2 공통 — 처리 요약 + 매니저 메모 + 권한 확인 notice.
// 계정 수정(1306:8221)·키 이력 상세(1306:8257)·과정 등록(1306:8293)·
// 과정 설정 저장/취소(1306:8574·8643)가 같은 골격을 공유한다.
export function ActionModal({ spec, onClose, onConfirm }: ActionModalProps) {
  const [memo, setMemo] = useState('')

  // 다른 액션으로 모달이 바뀌면 입력 중이던 메모를 비운다.
  useEffect(() => {
    setMemo('')
  }, [spec?.title])

  return (
    <Modal
      open={!!spec}
      onClose={onClose}
      title={spec?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onConfirm(memo)}>{spec?.confirmLabel}</Button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-4 text-sm">{spec?.subtitle}</p>

      <div className="border-border rounded-xl border p-4">
        <p className="text-fg text-sm font-bold">처리 요약</p>
        <p className="text-fg-subtle mt-0.5 text-xs">
          실행 전 확인할 주요 항목입니다.
        </p>
        <dl className="mt-3 flex flex-col gap-2">
          {(spec?.rows ?? []).map((r) => (
            <div key={r.label} className="flex gap-3 text-sm">
              <dt className="text-fg-muted w-24 shrink-0">{r.label}</dt>
              <dd className="text-fg">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={3}
        aria-label="매니저 메모"
        placeholder="매니저 메모 (선택) — 처리 사유를 남기면 감사 로그에 함께 기록됩니다"
        className="border-border focus:border-brand text-fg placeholder:text-fg-subtle mt-4 w-full rounded-lg border bg-white p-3 text-sm outline-none"
      />

      <div className="bg-info-bg mt-4 flex items-start gap-2 rounded-lg p-3">
        <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-fg text-xs font-medium">권한 확인</p>
          <p className="text-fg-muted text-xs">
            현재 매니저 권한으로 실행 가능하며 결과는 감사 로그에 남습니다.
          </p>
        </div>
      </div>
    </Modal>
  )
}
