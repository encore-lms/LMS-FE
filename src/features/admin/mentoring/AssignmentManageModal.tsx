import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import {
  apiErrorOf,
  useChangeAssignmentMentor,
  useCreateMentorAssignment,
  useDeleteAssignment,
  useRenameTeam,
  useUpdateAllocatedHours,
} from './api'
import type { MentorAssignmentRow, MentorAssignmentsData } from './types'

const FIELD_LABEL = 'text-fg-muted text-xs font-bold'
const INPUT_CLASS = inputClass()
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
  const renameTeam = useRenameTeam()
  const deleteAssignment = useDeleteAssignment()
  const [teamName, setTeamName] = useState(row.teamName)
  const [hoursInput, setHoursInput] = useState(String(row.allocatedHours ?? ''))
  const [mentorId, setMentorId] = useState(row.mentor?.mentorId ?? '')
  // 409 MENTOR_ASSIGNMENT_HAS_LOGS 수신 후 새 배정 생성 안내 노출
  const [replaceGuide, setReplaceGuide] = useState(false)
  // 배정 삭제 인라인 확인(파괴적이라 즉시 삭제 방지)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!row.assignmentId) return null
  const assignmentId = row.assignmentId

  // 배정(팀) 삭제 — 활동 이력이 있으면 BE가 409로 거부하므로 그 메시지를 그대로 보여준다.
  const removeAssignment = () => {
    deleteAssignment.mutate(row.teamId, {
      onSuccess: () => {
        toast.success('배정을 삭제했어요')
        setConfirmDelete(false)
        onClose()
      },
      onError: (err) =>
        toast.danger(apiErrorOf(err)?.message ?? '배정 삭제에 실패했어요'),
    })
  }

  const saveTeamName = () => {
    const name = teamName.trim()
    if (!name) {
      toast.danger('팀명을 입력해 주세요.')
      return
    }
    if (name === row.teamName) return
    renameTeam.mutate(
      { teamId: row.teamId, name },
      {
        onSuccess: (updated) =>
          toast.success(`팀명 수정 — ${updated.teamName}`),
        onError: (error) =>
          toast.danger(apiErrorOf(error).message ?? '팀명 수정에 실패했어요.'),
      },
    )
  }

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
          undefined,
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
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-fg-subtle text-xs">
          팀원 {row.memberCount}명 · 누적 인정 {row.recognizedHours ?? 0}h
        </p>

        <section className="flex flex-col gap-1.5">
          <label htmlFor="manage-name" className={FIELD_LABEL}>
            팀명 수정
          </label>
          <div className="flex gap-2">
            <input
              id="manage-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="팀명"
              className={INPUT_CLASS}
            />
            <Button
              onClick={saveTeamName}
              disabled={
                renameTeam.isPending || teamName.trim() === row.teamName
              }
              className="shrink-0"
            >
              저장
            </Button>
          </div>
        </section>

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
            <Button
              onClick={saveHours}
              disabled={updateHours.isPending}
              className="shrink-0"
            >
              저장
            </Button>
          </div>
          <p className="text-fg-subtle text-xs">
            감소 — 기존 인정 시간 유지(새 기준 충족 시 즉시 완료) · 증가 — 최신
            유효 일지 기준 재계산(완료 팀도 진행 중 복귀)
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <label className={FIELD_LABEL}>멘토 교체</label>
          <div className="flex gap-2">
            <Select
              aria-label="멘토 교체"
              value={mentorId}
              onChange={(v) => setMentorId(v)}
              options={data.mentors.map((m) => ({
                value: m.mentorId,
                label: m.name,
              }))}
              className="h-10 w-full"
            />
            <Button
              onClick={saveMentor}
              disabled={
                changeMentor.isPending || mentorId === row.mentor?.mentorId
              }
              className="shrink-0"
            >
              교체
            </Button>
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
                className="border-warning text-warning hover:bg-warning/10 bg-surface self-start rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                기존 배정 보존 · 새 배정 생성
              </button>
            </div>
          )}
        </section>

        {/* 배정 삭제 — 잘못 만든 배정 취소용. 활동 이력(일지·평가·추천서·예약)이 있으면 BE가 409로 거부한다. */}
        <section className="border-danger/30 flex flex-col gap-2 rounded-xl border p-4">
          <p className="text-fg text-sm font-bold">배정 삭제</p>
          <p className="text-fg-subtle text-xs">
            잘못 만든 배정을 취소합니다. 일지·평가·추천서·예약이 하나라도 있으면
            삭제할 수 없어요(기록 보호).
          </p>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="border-danger/40 text-danger hover:bg-danger-bg bg-surface self-start rounded-lg border px-3 py-1.5 text-xs font-bold"
            >
              배정 삭제
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-danger text-xs font-bold">
                팀·배정·멘티 명단을 삭제할까요?
              </span>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                취소
              </button>
              <button
                type="button"
                onClick={removeAssignment}
                disabled={deleteAssignment.isPending}
                className="bg-danger rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {deleteAssignment.isPending ? '삭제 중…' : '삭제'}
              </button>
            </div>
          )}
        </section>
      </div>
    </Modal>
  )
}
