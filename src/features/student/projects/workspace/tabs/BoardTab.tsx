import { useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import {
  useAddTask,
  useEditTask,
  useDeleteTask,
  useUpdateTaskStatus,
  wsWriteError,
} from '../../../api/projects'
import type { WorkspaceData, WsColumn, WsMember, WsTask } from '../../types'
import { SectionHead, TaskCard } from '../components/ws-shared'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'

export function BoardTab({
  d,
  readOnly = false,
}: {
  d: WorkspaceData
  /** 검토자(매니저·강사) 열람 — 추가·수정·삭제·드래그 이동 미노출(2026-08-04). */
  readOnly?: boolean
}) {
  const toast = useToast()
  const columns = d.columns
  const [addCol, setAddCol] = useState<number | null>(null)
  const drag = useRef<{ col: number; task: number } | null>(null)
  const addTaskM = useAddTask(d.id)
  const editTaskM = useEditTask(d.id)
  const deleteTaskM = useDeleteTask(d.id)
  const updateStatusM = useUpdateTaskStatus(d.id)
  const nameOf = useMemberNames()
  // 수정 중인 작업(열 위치까지 알아야 상태를 유지한 채 저장한다).
  const [editing, setEditing] = useState<{ col: number; task: WsTask } | null>(
    null,
  )
  const [deleting, setDeleting] = useState<WsTask | null>(null)

  const drop = (toCol: number) => {
    const from = drag.current
    drag.current = null
    if (!from || from.col === toCol) return
    const moved = columns[from.col]?.tasks[from.task]
    if (!moved?.id) {
      toast.danger('상태를 변경할 수 없는 작업이에요.')
      return
    }
    updateStatusM.mutate(
      { taskId: moved.id, status: columns[toCol].key },
      {
        onSuccess: () => toast.info('작업 상태를 변경했습니다'),
        onError: (e) =>
          toast.danger(wsWriteError(e, '상태 변경에 실패했어요.')),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="보드"
        action={readOnly ? undefined : '작업 추가'}
        onAction={readOnly ? undefined : () => setAddCol(0)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col, ci) => (
          <section
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(ci)}
            className={cn(card, 'flex flex-col gap-3')}
          >
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">
                {col.label}{' '}
                <span className="text-fg-subtle text-[12px]">
                  {col.tasks.length}
                </span>
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => setAddCol(ci)}
                  className="text-fg-muted hover:bg-surface-muted rounded-md px-2 py-1 text-[12px] font-semibold"
                >
                  + 작업
                </button>
              )}
            </div>
            {col.tasks.map((t, ti) => (
              <div
                key={t.id ?? ti}
                draggable={!readOnly}
                onDragStart={() => {
                  if (readOnly) return
                  drag.current = { col: ci, task: ti }
                }}
                className={cn(
                  !readOnly && 'cursor-grab active:cursor-grabbing',
                )}
              >
                <TaskCard
                  t={t}
                  onEdit={
                    !readOnly && t.id
                      ? () => setEditing({ col: ci, task: t })
                      : undefined
                  }
                  onDelete={
                    !readOnly && t.id ? () => setDeleting(t) : undefined
                  }
                />
              </div>
            ))}
            {col.tasks.length === 0 && (
              <div className="border-border text-fg-subtle rounded-[12px] border border-dashed py-6 text-center text-[11px]">
                {readOnly ? '작업 없음' : '여기로 드래그'}
              </div>
            )}
          </section>
        ))}
      </div>
      {addCol !== null && (
        <AddTaskModal
          columns={columns}
          initialCol={addCol}
          members={d.members}
          nameOf={nameOf}
          period={{ start: d.startDate, end: d.endDate }}
          onClose={() => setAddCol(null)}
          onAdd={(colIdx, task, startAt, endAt, assigneeMemberIds) => {
            addTaskM.mutate(
              {
                title: task.title,
                status: columns[colIdx].key,
                startAt,
                dueAt: endAt,
                assigneeMemberIds,
              },
              {
                onSuccess: () => {
                  toast.success('작업을 추가했습니다')
                  setAddCol(null)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '작업 추가에 실패했어요.')),
              },
            )
          }}
        />
      )}
      {editing && (
        <AddTaskModal
          columns={columns}
          initialCol={editing.col}
          members={d.members}
          nameOf={nameOf}
          period={{ start: d.startDate, end: d.endDate }}
          editing={editing.task}
          onClose={() => setEditing(null)}
          onAdd={(colIdx, task, startAt, endAt, assigneeMemberIds) => {
            editTaskM.mutate(
              {
                taskId: editing.task.id!,
                title: task.title,
                status: columns[colIdx].key,
                startAt,
                dueAt: endAt,
                assigneeMemberIds,
              },
              {
                onSuccess: () => {
                  toast.success('작업을 수정했습니다')
                  setEditing(null)
                },
                onError: (e) =>
                  toast.danger(wsWriteError(e, '작업 수정에 실패했어요.')),
              },
            )
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleting}
        title="작업 삭제"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting?.id) return
          deleteTaskM.mutate(
            { taskId: deleting.id },
            {
              onSuccess: () => {
                toast.success('작업을 삭제했습니다')
                setDeleting(null)
              },
              onError: (e) =>
                toast.danger(wsWriteError(e, '작업 삭제에 실패했어요.')),
            },
          )
        }}
      >
        <p className="text-fg-muted text-[13px]">
          '{deleting?.title ?? ''}' 작업을 삭제할까요? 되돌릴 수 없어요.
        </p>
      </ConfirmDialog>
    </div>
  )
}

/* ── 작업 추가·수정 모달 ── */
function AddTaskModal({
  columns,
  initialCol,
  members,
  nameOf,
  period,
  editing,
  onClose,
  onAdd,
}: {
  columns: WsColumn[]
  initialCol: number
  members: WsMember[]
  nameOf: (userId: string | undefined, fallback: string) => string
  /** 프로젝트 기간 — 이 밖의 날짜는 고를 수 없다. */
  period: { start?: string | null; end?: string | null }
  /** 주면 수정 모드 — 기존 값으로 채워 시작한다. */
  editing?: WsTask
  onClose: () => void
  onAdd: (
    colIdx: number,
    task: WsTask,
    startAt: string,
    endAt: string,
    assigneeMemberIds: string[],
  ) => void
}) {
  const [colIdx, setColIdx] = useState(initialCol)
  const [title, setTitle] = useState(editing?.title ?? '')
  // 담당자(멀티) — 현재 프로젝트 팀원 중 선택(ProjectMember.id 집합)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(
    editing?.assigneeMemberIds ?? [],
  )
  const toggleAssignee = (id: string) =>
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  // 시작일 기본=오늘, 종료일 기본=시작일 다음날.
  const today = todayISO()
  const [startAt, setStartAt] = useState(editing?.startDate ?? today)
  const [endAt, setEndAt] = useState(
    editing?.endDate ?? editing?.due ?? nextDayISO(today),
  )
  const field = inputClass()

  const submit = () => {
    if (!title.trim()) return
    // assigneeIds = ProjectMember.id 목록. 표시 이름은 멤버의 userId로 실명 매핑.
    const names = assigneeIds.map((mid) => {
      const m = members.find((mm) => mm.memberId === mid)
      return nameOf(m?.userId, m?.name ?? '팀원')
    })
    onAdd(
      colIdx,
      {
        title: title.trim(),
        assignee: names.length ? names.join(', ') : '미지정',
        due: endAt,
        startDate: startAt,
        endDate: endAt,
        assigneeMemberIds: assigneeIds,
        tags: [],
      },
      startAt,
      endAt,
      assigneeIds,
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? '작업 수정' : '작업 추가'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ variant: 'secondary', size: 'sm' })}
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className={buttonClass({ size: 'sm' })}
          >
            {editing ? '저장' : '추가'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">컬럼</span>
          <Select
            aria-label="컬럼"
            value={String(colIdx)}
            onChange={(v) => setColIdx(Number(v))}
            options={columns.map((c, i) => ({
              value: String(i),
              label: c.label,
            }))}
            className="h-10 w-full"
          />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작업 제목"
            className={field}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">
            담당자{' '}
            <span className="text-fg-subtle font-normal">
              (팀원 중 선택 · 복수 가능)
            </span>
          </span>
          {members.length === 0 ? (
            <span className="text-fg-subtle text-[12px]">팀원이 없어요.</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {members.map((m, i) => {
                const mid = m.memberId ?? ''
                const on = assigneeIds.includes(mid)
                return (
                  <button
                    key={mid || `m-${i}`}
                    type="button"
                    disabled={!mid}
                    onClick={() => mid && toggleAssignee(mid)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
                      on
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-fg-muted hover:border-brand/50',
                      !mid &&
                        'hover:border-border cursor-not-allowed opacity-40',
                    )}
                  >
                    {on && '✓ '}
                    {nameOf(m.userId, m.name)}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">시작일</span>
            <input
              type="date"
              value={startAt}
              // 프로젝트 기간 밖은 고를 수 없다 — 기간 밖 작업은 이 프로젝트의 일이 아니다.
              min={period.start ?? undefined}
              max={period.end ?? undefined}
              onChange={(e) => {
                const v = e.target.value
                setStartAt(v)
                // 종료일이 시작일보다 빠르면 시작일 다음날로 보정(프로젝트 종료일은 넘지 않는다)
                if (v && (!endAt || endAt <= v)) {
                  const next = nextDayISO(v)
                  setEndAt(period.end && next > period.end ? period.end : next)
                }
              }}
              className={field}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">종료일</span>
            <input
              type="date"
              value={endAt}
              min={startAt || (period.start ?? undefined)}
              max={period.end ?? undefined}
              onChange={(e) => setEndAt(e.target.value)}
              className={field}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}

// 오늘(YYYY-MM-DD, 로컬)
function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// 다음날(YYYY-MM-DD)
function nextDayISO(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const nx = new Date(y, m - 1, d + 1)
  return `${nx.getFullYear()}-${String(nx.getMonth() + 1).padStart(2, '0')}-${String(nx.getDate()).padStart(2, '0')}`
}
