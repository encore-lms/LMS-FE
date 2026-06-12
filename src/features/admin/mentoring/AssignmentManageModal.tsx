import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import {
  apiErrorOf,
  useChangeAssignmentMentor,
  useCreateMentorAssignment,
  useUpdateAllocatedHours,
} from './api'
import type { MentorAssignmentRow, MentorAssignmentsData } from './types'

const FIELD_LABEL = 'text-fg-muted text-xs font-bold'
const INPUT_CLASS =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand h-10 w-full rounded-lg border px-3 text-sm outline-none'
const SECTION_BTN =
  'bg-brand-deep text-on-color hover:bg-brand-deep/90 shrink-0 rounded-lg px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50'

interface AssignmentManageModalProps {
  open: boolean
  onClose: () => void
  row: MentorAssignmentRow
  data: MentorAssignmentsData
}

/**
 * 배정 수정 모달 — N시간 수정(언제든) + 멘토 교체.
 * 멘토 교체는 일지 작성 전에만 PATCH — 일지 존재 시 409 MENTOR_ASSIGNMENT_HAS_LOGS 응답을
 * 받아 '기존 배정 보존(일지·인정 시간·평가 책임) + 새 배정 생성' 경로로 안내한다(§29 덮어쓰기 금지).
 */
export function AssignmentManageModal({
  open,
  onClose,
  row,
  data,
}: AssignmentManageModalProps) {
  const toast = useToast()
  const updateHours = useUpdateAllocatedHours()
  const changeMentor = useChangeAssignmentMentor()
  const createAssignment = useCreateMentorAssignment()
  const [hoursInput, setHoursInput] = useState(String(row.allocatedHours ?? ''))
  const [mentorId, setMentorId] = useState(row.mentor?.mentorId ?? '')
  // 409 MENTOR_ASSIGNMENT_HAS_LOGS 수신 후 새 배정 생성 안내 노출
  const [replaceGuide, setReplaceGuide] = useState(false)

  if (!row.assignmentId) return null
  const assignmentId = row.assignmentId

  const saveHours = () => {
    const allocatedHours = Number(hoursInput)
    if (
      !hoursInput.trim() ||
      Number.isNaN(allocatedHours) ||
      allocatedHours <= 0
    ) {
      toast.danger('배정 N시간은 0보다 커야 합니다.')
      return
    }
    updateHours.mutate(
      { assignmentId, allocatedHours },
      {
        onSuccess: (updated) => {
          toast.success(
            `N시간 수정 — ${updated.teamName} · ${updated.allocatedHours}h (감소 시 기존 인정 유지 · 증가 시 재계산)`,
          )
        },
        onError: (error) =>
          toast.danger(apiErrorOf(error).message ?? 'N시간 수정에 실패했어요.'),
      },
    )
  }

  const saveMentor = () => {
    if (!mentorId || mentorId === row.mentor?.mentorId) return
    changeMentor.mutate(
      { assignmentId, mentorId },
      {
        onSuccess: (updated) => {
          toast.success(
            `멘토 교체 — ${updated.teamName} · ${updated.mentor?.name}`,
          )
          setReplaceGuide(false)
        },
        onError: (error) => {
          const { code, message } = apiErrorOf(error)
          if (code === 'MENTOR_ASSIGNMENT_HAS_LOGS') {
            // 덮어쓰기 금지 — 새 배정 생성 안내로 전환
            setReplaceGuide(true)
          } else {
            toast.danger(message ?? '멘토 교체에 실패했어요.')
          }
        },
      },
    )
  }

  // 새 배정 생성(교체) — 기존 배정·일지·인정 시간·평가 책임 보존, 새 멘토·현 N시간·현 템플릿.
  const createReplacement = () => {
    createAssignment.mutate(
      {
        teamId: row.teamId,
        mentorId,
        allocatedHours: Number(hoursInput) || row.allocatedHours || 0,
        logTemplateId:
          row.logTemplateId ??
          data.templates.find((t) => t.isDefault)?.templateId ??
          '',
      },
      {
        onSuccess: (updated) => {
          toast.success(
            `기존 배정 보존 · 새 배정 생성 — ${updated.teamName} · ${updated.mentor?.name}`,
          )
          onClose()
        },
        onError: (error) =>
          toast.danger(
            apiErrorOf(error).message ?? '새 배정 생성에 실패했어요.',
          ),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`배정 수정 — ${row.teamName}`}
      closeOnBackdrop={false}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-fg-subtle text-xs">
          {row.cohortLabel} · {row.courseName} · 팀원 {row.memberCount}명 · 누적
          인정 {row.recognizedHours ?? 0}h
        </p>

        <section className="flex flex-col gap-1.5">
          <label htmlFor="manage-hours" className={FIELD_LABEL}>
            배정 N시간 수정
          </label>
          <div className="flex gap-2">
            <input
              id="manage-hours"
              type="number"
              min={0.5}
              step={0.5}
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value)}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={saveHours}
              disabled={updateHours.isPending}
              className={SECTION_BTN}
            >
              저장
            </button>
          </div>
          <p className="text-fg-subtle text-xs">
            감소 — 기존 인정 시간 유지(새 기준 충족 시 즉시 완료) · 증가 — 최신
            유효 일지 기준 재계산(완료 팀도 진행 중 복귀)
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <label htmlFor="manage-mentor" className={FIELD_LABEL}>
            멘토 교체
          </label>
          <div className="flex gap-2">
            <select
              id="manage-mentor"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className={INPUT_CLASS}
            >
              {data.mentors.map((m) => (
                <option key={m.mentorId} value={m.mentorId}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveMentor}
              disabled={
                changeMentor.isPending || mentorId === row.mentor?.mentorId
              }
              className={SECTION_BTN}
            >
              교체
            </button>
          </div>
          <p className="text-fg-subtle text-xs">
            일지 작성 전에만 기존 배정을 수정할 수 있어요.
          </p>
          {replaceGuide && (
            <div className="bg-warning-bg border-warning/40 mt-1 flex flex-col gap-2 rounded-lg border p-3">
              <p className="text-warning text-xs font-bold">
                일지가 있는 배정은 수정할 수 없어요 (덮어쓰기 금지)
              </p>
              <p className="text-fg-muted text-xs">
                기존 배정·일지·인정 시간·평가 책임을 보존하고 새 배정을
                생성합니다.
              </p>
              <button
                type="button"
                onClick={createReplacement}
                disabled={createAssignment.isPending}
                className="border-warning text-warning hover:bg-warning/10 self-start rounded-lg border bg-white px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                기존 배정 보존 · 새 배정 생성
              </button>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
