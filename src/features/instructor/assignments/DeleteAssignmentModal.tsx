import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { InstructorAssignmentRow } from '@/shared/types'

// 과제·실습 삭제 확인 (Figma 2750:1673) — 제출 기록 동반 삭제 영향 고지 후 확정.
export function DeleteAssignmentModal({
  assignment,
  onClose,
  onConfirm,
}: {
  assignment: InstructorAssignmentRow | null
  onClose: () => void
  onConfirm: (assignment: InstructorAssignmentRow) => void
}) {
  const submissionCount = assignment
    ? assignment.counts.submitted + assignment.counts.reviewDone
    : 0
  return (
    <Modal
      open={!!assignment}
      onClose={onClose}
      title="과제·실습을 삭제할까요?"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
           
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            className="bg-danger hover:bg-danger/90"
            onClick={() => assignment && onConfirm(assignment)}
          >
            삭제
          </Button>
        </>
      }
    >
      <p className="text-fg-muted text-sm">
        삭제하면 과제 정보와 제출 기록이 함께 삭제됩니다. 이 작업은 되돌릴 수
        없습니다.
      </p>
      <span className="border-border bg-surface-muted text-fg-muted mt-4 inline-flex rounded-lg border px-3.5 py-1.5 text-xs font-semibold">
        제출 기록 {submissionCount}건 함께 삭제
      </span>
    </Modal>
  )
}
