import { useRef, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { useAddTask, useUpdateTaskStatus } from '../../../api/projects'
import type { WorkspaceData, WsColumn, WsMember, WsTask } from '../../types'
import { SectionHead, TaskCard } from '../components/ws-shared'
import { card } from '../components/ws-style'
import { useMemberNames } from '../components/useMemberNames'

export function BoardTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const columns = d.columns
  const [addCol, setAddCol] = useState<number | null>(null)
  const drag = useRef<{ col: number; task: number } | null>(null)
  const addTaskM = useAddTask(d.id)
  const updateStatusM = useUpdateTaskStatus(d.id)
  const nameOf = useMemberNames()

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
          members={d.members}
          nameOf={nameOf}
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
  members,
  nameOf,
  onClose,
  onAdd,
}: {
  columns: WsColumn[]
  initialCol: number
  members: WsMember[]
  nameOf: (userId: string | undefined, fallback: string) => string
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
  const [title, setTitle] = useState('')
  // 담당자(멀티) — 현재 프로젝트 팀원 중 선택(ProjectMember.id 집합)
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const toggleAssignee = (id: string) =>
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  // 시작일 기본=오늘, 종료일 기본=시작일 다음날.
  const today = todayISO()
  const [startAt, setStartAt] = useState(today)
  const [endAt, setEndAt] = useState(nextDayISO(today))
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'

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
            className={buttonClass({ size: 'sm' })}
          >
            추가
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
              onChange={(e) => {
                const v = e.target.value
                setStartAt(v)
                // 종료일이 시작일보다 빠르면 시작일 다음날로 보정
                if (v && (!endAt || endAt <= v)) setEndAt(nextDayISO(v))
              }}
              className={field}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">종료일</span>
            <input
              type="date"
              value={endAt}
              min={startAt}
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
