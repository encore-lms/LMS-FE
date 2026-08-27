import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Student {
  name: string
  cohort: string
}

// 보완 요청 모달 — reviewing → changes_requested.
// 사유 코드·대상 섹션·권장 기한은 두지 않는다(2026-08-07 결정: 코멘트만, 길이 제한 없음).
export function ChangesRequestModal({
  open,
  onClose,
  student,
  pending,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  student: Student
  pending?: boolean
  onSubmit: (comment: string) => void
}) {
  const [comment, setComment] = useState('')

  const submit = () => {
    if (!comment.trim()) return
    onSubmit(comment.trim())
    setComment('')
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title={
        <span className="flex items-center gap-2">
          보완 요청{' '}
          <StatusBadge label="changes_requested 전이" tone="warning" />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button disabled={!comment.trim() || pending} onClick={submit}>
            {pending ? '전송 중…' : '보완 요청 전송'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-subtle text-xs">
          {student.name} · {student.cohort} · 수강생에게 그대로 노출
        </p>
        <div>
          <p className="text-fg text-sm font-bold">
            코멘트 <span className="text-danger">*</span>
          </p>
          <p className="text-fg-subtle mb-2 text-xs">
            무엇을 어떻게 고쳐야 하는지 적어 주세요 — 수강생에게 이 글이 그대로
            보입니다
          </p>
          <textarea
            value={comment}
            rows={8}
            onChange={(e) => setComment(e.target.value)}
            placeholder="보완이 필요한 항목과 조치 방법을 구체적으로 적어주세요."
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface w-full rounded-lg border p-3 text-sm outline-none"
          />
        </div>
      </div>
    </Modal>
  )
}

const APPROVE_CHECKS = [
  '공개 payload에 민감정보 없음 확인',
  '현재 원천 버전의 7개 탭 READY 확인',
  '승인 직후 증명서 스냅샷 동결 · 되돌리기 불가 확인',
]

// 정식 인증 승인 확인 모달 — reviewing → certified.
export function ApproveModal({
  open,
  onClose,
  student,
  analysis,
  pending,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  student: Student
  analysis: {
    sourceVersion: string | null
    analysisVersion: string | null
    runId: string | null
  }
  pending?: boolean
  onSubmit: () => void
}) {
  const [checks, setChecks] = useState([false, false, false])
  const allChecked = checks.every(Boolean)
  const approveMeta = [
    { k: '원천 버전', v: analysis.sourceVersion ?? '-' },
    { k: '분석 버전', v: analysis.analysisVersion ?? '-' },
    { k: '분석 실행 ID', v: analysis.runId ?? '-' },
  ]

  const submit = () => {
    onSubmit()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      closeOnBackdrop={false}
      title={
        <span className="flex items-center gap-2">
          정식 인증 승인 확인{' '}
          <StatusBadge label="certified 전이" tone="success" />
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button disabled={!allChecked || pending} onClick={submit}>
            {pending ? '승인 중…' : '정식 인증 승인'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="bg-success-bg flex items-center justify-between rounded-lg p-3">
          <span className="text-fg text-sm font-medium">
            {student.name} · {student.cohort}
          </span>
          <StatusBadge label="7개 탭 READY" tone="success" />
        </div>
        <div>
          <p className="text-fg mb-2 text-sm font-bold">생성 항목</p>
          <ul className="flex flex-col gap-2">
            {approveMeta.map((m) => (
              <li
                key={m.k}
                className="border-border flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <span className="text-fg-muted text-xs">{m.k}</span>
                <span className="text-fg font-mono text-xs">{m.v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-info-bg text-fg-muted rounded-lg p-3 text-xs">
          기본 공개 범위 — isPublic = false. 수강생이 공개 설정에서 켜야 외부
          검증 URL이 활성화됩니다.
        </div>
        <div>
          <p className="text-fg mb-2 text-sm font-bold">최종 확인 (필수)</p>
          <ul className="flex flex-col gap-2">
            {APPROVE_CHECKS.map((c, i) => (
              <li key={c}>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checks[i]}
                    onChange={(e) =>
                      setChecks((prev) =>
                        prev.map((v, j) => (j === i ? e.target.checked : v)),
                      )
                    }
                    className="mt-0.5"
                  />
                  <span className="text-fg-muted">{c}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
