import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export interface ActionModalSpec {
  title: string
  subtitle: string
  /** 처리 요약 행 (Figma 운영 액션 모달 v2 공통) */
  rows: { label: string; value: string }[]
  confirmLabel: string // 저장 / 확인 / 등록 / 버리기
}

interface ActionModalProps {
  spec: ActionModalSpec | null
  onClose: () => void
  // memo 인자는 하위 호환용(현재 입력란 없음 → 항상 빈 문자열).
  onConfirm: (memo: string) => void
}

// 운영 액션 모달 v2 공통 — 처리 요약 확인.
// 계정 수정·키 이력 상세·과정 등록·과정 설정 저장/취소가 같은 골격을 공유한다.
export function ActionModal({ spec, onClose, onConfirm }: ActionModalProps) {
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
          <Button onClick={() => onConfirm('')}>{spec?.confirmLabel}</Button>
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
    </Modal>
  )
}
