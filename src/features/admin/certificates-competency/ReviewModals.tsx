import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'

interface Student {
  name: string
  cohort: string
}

// 단일 선택 칩 그룹.
function ChipGroup({
  options,
  value,
  onChange,
  activeClass = 'bg-fg text-on-color',
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
  activeClass?: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium',
            value === o
              ? activeClass
              : 'bg-surface-muted text-fg-muted hover:text-fg',
          )}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

const REASON_CODES = [
  'missing_evidence',
  'wrong_profile',
  'unapproved_artifact',
  'privacy_risk',
  'score_review_needed',
  'other',
]
const SECTIONS = [
  'profile',
  'metric',
  'score',
  'record',
  'project',
  'privacy',
  'ai_summary',
  'other',
]

// 보완 요청 모달 — reviewing → changes_requested.
export function ChangesRequestModal({
  open,
  onClose,
  student,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  student: Student
  onSubmitted?: () => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [section, setSection] = useState('')
  const [comment, setComment] = useState('')
  const [due, setDue] = useState('')
  const canSubmit = !!reason && !!section && comment.trim().length > 0

  const submit = () => {
    toast.warning('보완 요청 전송 — reviewing → changes_requested')
    onSubmitted?.()
    onClose()
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
          <Button disabled={!canSubmit} onClick={submit}>
            보완 요청 전송
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-fg-subtle text-xs">
          {student.name} · {student.cohort} · 수강생에게 그대로 노출
        </p>
        <div>
          <p className="text-fg text-sm font-bold">
            사유 코드 <span className="text-danger">*</span>
          </p>
          <p className="text-fg-subtle mb-2 text-xs">enum 6종 — 하나 선택</p>
          <ChipGroup
            options={REASON_CODES}
            value={reason}
            onChange={setReason}
            activeClass="bg-danger text-on-color"
          />
        </div>
        <div>
          <p className="text-fg text-sm font-bold">
            대상 섹션 <span className="text-danger">*</span>
          </p>
          <p className="text-fg-subtle mb-2 text-xs">
            보완해야 할 영역 — enum 8종
          </p>
          <ChipGroup options={SECTIONS} value={section} onChange={setSection} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-fg text-sm font-bold">
              코멘트 <span className="text-danger">*</span>
            </p>
            <span className="text-fg-subtle text-xs">
              {comment.length} / 500
            </span>
          </div>
          <p className="text-fg-subtle mb-2 text-xs">
            수강생에게 그대로 노출되는 사유 설명
          </p>
          <textarea
            value={comment}
            maxLength={500}
            rows={4}
            onChange={(e) => setComment(e.target.value)}
            placeholder="보완이 필요한 항목과 조치 방법을 구체적으로 적어주세요."
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface w-full rounded-lg border p-3 text-sm outline-none"
          />
        </div>
        <div>
          <p className="text-fg text-sm font-bold">권장 기한</p>
          <p className="text-fg-subtle mb-2 text-xs">
            미입력 시 14일 자동 적용
          </p>
          <DateTimePicker
            mode="date"
            value={due}
            onChange={setDue}
            ariaLabel="권장 기한"
            placeholder="날짜 선택"
          />
        </div>
        <div className="bg-info-bg text-fg-muted rounded-lg p-3 text-xs">
          <p className="text-fg font-medium">
            수강생 요청 상세에 동일 내용이 표시됩니다
          </p>
          <p className="mt-0.5">사유 코드 · 대상 섹션 · 코멘트 · 권장 기한</p>
        </div>
      </div>
    </Modal>
  )
}

const APPROVE_META = [
  { k: 'CertificateSnapshot', v: 'snr_8b2a0f3' },
  { k: 'publicToken', v: 'vfy_kp8q4r2nv0' },
  { k: 'verificationId', v: 'ver_202602_512' },
  { k: 'snapshotHash', v: 'sha256:a3f8…07e' },
]
const APPROVE_CHECKS = [
  '공개 payload에 민감정보 없음 확인',
  '6축 confirmed · 산출물 강사·매니저 승인 확인',
  '승인 직후 mart 스냅샷 동결 · 되돌리기 불가 확인',
]

// 정식 인증 승인 확인 모달 — reviewing → certified.
export function ApproveModal({
  open,
  onClose,
  student,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  student: Student
  onSubmitted?: () => void
}) {
  const toast = useToast()
  const [checks, setChecks] = useState([false, false, false])
  const allChecked = checks.every(Boolean)

  const submit = () => {
    toast.success('정식 인증 승인 — CertificateSnapshot 생성·동결')
    onSubmitted?.()
    onClose()
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
          <Button disabled={!allChecked} onClick={submit}>
            정식 인증 승인
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="bg-success-bg flex items-center justify-between rounded-lg p-3">
          <span className="text-fg text-sm font-medium">
            {student.name} · {student.cohort}
          </span>
          <StatusBadge label="6 / 6 충족" tone="success" />
        </div>
        <div>
          <p className="text-fg mb-2 text-sm font-bold">생성 항목</p>
          <ul className="flex flex-col gap-2">
            {APPROVE_META.map((m) => (
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

