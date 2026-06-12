import { Modal } from '@/components/ui/Modal'

// 평가·추천 최종 제출 확인 모달 — Figma 3150:1928 / 3150:2526 공통 문법.
// Figma 모달은 raw Tailwind gray 드리프트 — 기확정 매핑으로 conform(#111827→fg/brand-deep ·
// #4b5563→fg-muted · #f9fafb→surface-muted · #e5e7eb/#d1d5db→border · #6d5df6→accent-strong).
// '최종 제출' 라벨의 fg 토큰 오바인딩(다크-온-다크 비가시 버그)은 on-color 로 교정한다.

/** 정책 안내 박스 원문 — 두 모달 공통(운영자 조회 전용, 05-26 확정). */
export const OPERATOR_READONLY_NOTICE =
  '운영자는 통계 및 평가 결과만 조회할 수 있으며, 제출된 평가·추천을 수정하거나 반려하지 않습니다.'

export function ConfirmSubmitModal({
  open,
  onClose,
  onConfirm,
  eyebrow,
  title,
  body,
  pending = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  eyebrow: string
  title: string
  body: string
  pending?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} size="md">
      <div className="flex flex-col gap-3 py-1">
        <span className="text-accent-strong text-xs font-semibold">
          {eyebrow}
        </span>
        <h2 className="text-fg text-[28px] leading-9 font-bold">{title}</h2>
        <p className="text-fg-muted text-base leading-[1.45]">{body}</p>
        <div className="bg-surface-muted border-border rounded-xl border p-4">
          <p className="text-fg-muted text-sm leading-[1.45] font-medium">
            {OPERATOR_READONLY_NOTICE}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="border-border text-fg-muted bg-surface hover:bg-surface-muted h-11 rounded-[10px] border px-7 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="bg-brand-deep text-on-color hover:bg-brand-deep/90 h-11 rounded-[10px] px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            최종 제출
          </button>
        </div>
      </div>
    </Modal>
  )
}
