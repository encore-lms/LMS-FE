import { useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { useAddTask, useUpdateTaskStatus } from '../../../api/projects'
import type { WorkspaceData, WsColumn, WsTask } from '../../types'
import { SectionHead, TaskCard } from '../components/ws-shared'
import { card } from '../components/ws-style'

export function BoardTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const columns = d.columns
  const [addCol, setAddCol] = useState<number | null>(null)
  const drag = useRef<{ col: number; task: number } | null>(null)
  const addTaskM = useAddTask(d.id)
  const updateStatusM = useUpdateTaskStatus(d.id)

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
        onError: () => toast.danger('상태 변경에 실패했어요.'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="보드"
        action="작업 추가"
        onAction={() => setAddCol(0)}
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
              <button
                type="button"
                onClick={() => setAddCol(ci)}
                className="text-fg-muted hover:bg-surface-muted rounded-md px-2 py-1 text-[12px] font-semibold"
              >
                + 작업
              </button>
            </div>
            {col.tasks.map((t, ti) => (
              <div
                key={t.id ?? ti}
                draggable
                onDragStart={() => {
                  drag.current = { col: ci, task: ti }
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskCard t={t} />
              </div>
            ))}
            {col.tasks.length === 0 && (
              <div className="border-border text-fg-subtle rounded-[12px] border border-dashed py-6 text-center text-[11px]">
                여기로 드래그
              </div>
            )}
          </section>
        ))}
      </div>
      {addCol !== null && (
        <AddTaskModal
          columns={columns}
          initialCol={addCol}
          onClose={() => setAddCol(null)}
          onAdd={(colIdx, task, dueAt) => {
            addTaskM.mutate(
              { title: task.title, status: columns[colIdx].key, dueAt },
              {
                onSuccess: () => {
                  toast.success('작업을 추가했습니다')
                  setAddCol(null)
                },
                onError: () => toast.danger('작업 추가에 실패했어요.'),
              },
            )
          }}
        />
      )}
    </div>
  )
}

/* ── 작업 추가 모달 ── */
function AddTaskModal({
  columns,
  initialCol,
  onClose,
  onAdd,
}: {
  columns: WsColumn[]
  initialCol: number
  onClose: () => void
  onAdd: (colIdx: number, task: WsTask, dueAt?: string) => void
}) {
  const [colIdx, setColIdx] = useState(initialCol)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  // 마감은 'D-' 고정 + 숫자만(마감 지난 D+는 없음). 빈값이면 '-'.
  const [dueDays, setDueDays] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'

  const submit = () => {
    if (!title.trim()) return
    onAdd(colIdx, {
      title: title.trim(),
      assignee: assignee.trim() || '미지정',
      due: dueDays ? `D-${dueDays}` : '-',
      tags: [],
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="작업 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">컬럼</span>
          <select
            value={colIdx}
            onChange={(e) => setColIdx(Number(e.target.value))}
            className={field}
          >
            {columns.map((c, i) => (
              <option key={c.key} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
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
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">담당자</span>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="이름"
              className={field}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">마감</span>
            <div className="border-border focus-within:border-brand flex h-10 items-center rounded-lg border px-3">
              <span className="text-fg-muted text-[13px] font-semibold">
                D-
              </span>
              <input
                value={dueDays}
                onChange={(e) => setDueDays(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric"
                placeholder="3"
                aria-label="마감 일수"
                className="text-fg placeholder:text-fg-subtle ml-1 w-full bg-transparent text-[13px] outline-none"
              />
            </div>
          </label>
        </div>
      </div>
    </Modal>
  )
}
