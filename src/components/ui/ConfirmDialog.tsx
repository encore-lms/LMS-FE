import { type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  /** 확인 버튼 라벨 (기본 '확인') */
  confirmLabel?: string
  /** 취소 버튼 라벨 (기본 '취소') */
  cancelLabel?: string
  /** 확인 버튼 색 — 삭제·되돌릴 수 없는 액션은 'danger', 일반 확정은 'primary'(기본) */
  tone?: 'danger' | 'primary'
  /** 확인 버튼 비활성 (제출 중 등). 비활성 시 opacity-60 */
  confirmDisabled?: boolean
  size?: 'sm' | 'md'
  /** 본문 — 설명 문단이나 정보 박스 등. 호출부 마크업을 그대로 넘겨 표시를 보존한다. */
  children: ReactNode
}

// 확인 다이얼로그 — 제목 + 본문 + 취소/확인(취소는 아웃라인, 확인은 tone별 solid).
// 공통 Modal 위에 표준 footer 버튼 2개만 얹은 경량 래퍼. 삭제 확인 등 반복되는
// "제목·단문·취소/확인" 모달의 껍데기 중복을 없앤다. 본문은 children으로 받아
// 문단·정보 박스 등 화면별 내용을 그대로 보존한다.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel = '확인',
  cancelLabel = '취소',
  tone = 'primary',
  confirmDisabled = false,
  size = 'sm',
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size={size}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={cn(
              'h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white disabled:opacity-60',
              tone === 'danger' ? 'bg-danger' : 'bg-brand-deep',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  )
}
