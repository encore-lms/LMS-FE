import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  /** 하단 액션 영역 (확인/취소 버튼 등) */
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** 배경 클릭으로 닫기 허용 (기본 true). 입력 중 실수 방지가 필요하면 false */
  closeOnBackdrop?: boolean
}

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

/**
 * 공통 모달. 포털로 body 에 렌더, ESC·배경 클릭으로 닫고, 열려 있는 동안 body 스크롤을 잠근다.
 * 확인 다이얼로그·폼 모달·미리보기 등 화면 구현 목록의 모달 후보 전반에 재사용한다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // onClose는 부모에서 인라인 함수로 넘어와 매 렌더 신원이 바뀐다.
  // effect deps에 직접 넣으면 입력마다 effect가 재실행돼 panelRef.focus()가
  // 입력 포커스를 빼앗으므로(한 글자만 입력됨), ref로 최신값만 참조한다.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="bg-brand-deep/40 fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'bg-surface flex max-h-[90vh] w-full flex-col rounded-2xl shadow-xl outline-none',
          sizes[size],
        )}
      >
        {title && (
          <div className="border-divider flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-fg text-lg font-bold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-fg-subtle hover:text-fg hover:bg-surface-muted rounded-md p-1 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="text-fg flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="border-divider flex justify-end gap-2 border-t px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
