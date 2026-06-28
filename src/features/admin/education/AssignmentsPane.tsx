import { useState } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import type { AssignmentItem } from './types'
import { useAssignments, useCreateAssignment, useDeleteAssignment } from './api'

const fmt = (iso: string | null) =>
  iso ? iso.slice(0, 16).replace('T', ' ') : '-'

// 과제 탭 — 기수 과제(Assignment) 조회·추가·삭제 + 상세 팝업(실 BE).
export function AssignmentsPane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const { data, isPending, isError, refetch } = useAssignments(
    courseId,
    cohortId,
  )
  const createA = useCreateAssignment()
  const deleteA = useDeleteAssignment()
  const toast = useToast()

  const [detail, setDetail] = useState<AssignmentItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueAt, setDueAt] = useState('') // YYYY-MM-DD

  const onAdd = () => {
    if (!title.trim()) {
      toast.danger('과제 제목을 입력해 주세요')
      return
    }
    createA.mutate(
      {
        courseId,
        cohortId,
        title: title.trim(),
        description: description.trim() || undefined,
        // 마감일(날짜) → ISO. 시각은 18:00 기본.
        dueAt: dueAt ? `${dueAt}T18:00:00Z` : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`과제 추가 — ${title.trim()}`)
          setAddOpen(false)
          setTitle('')
          setDescription('')
          setDueAt('')
        },
        onError: () => toast.danger('과제 추가에 실패했어요'),
      },
    )
  }

  const onDelete = (a: AssignmentItem) =>
    deleteA.mutate(
      { courseId, cohortId, assignmentId: a.id },
      {
        onSuccess: () => toast.success(`삭제 — ${a.title}`),
        onError: () => toast.danger('삭제에 실패했어요'),
      },
    )

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="과제를 불러오지 못했어요"
        description="실 BE(learning-service) 연결을 확인한 뒤 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const columns: Column<AssignmentItem>[] = [
    {
      key: 'title',
      header: '제목',
      cell: (a) => <span className="text-fg font-medium">{a.title}</span>,
    },
    {
      key: 'due',
      header: '마감',
      className: 'w-40',
      cell: (a) => (
        <span className="text-fg-muted text-xs tabular-nums">
          {fmt(a.dueAt)}
        </span>
      ),
    },
    {
      key: 'created',
      header: '등록일',
      className: 'w-32',
      cell: (a) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {a.createdAt?.slice(0, 10) ?? '-'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-32',
      cell: (a) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDetail(a)
            }}
            className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
          >
            상세
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(a)
            }}
            className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-2 py-1 text-xs font-medium"
          >
            삭제
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-fg-muted text-sm">총 {data.length}개 과제</p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> 과제 추가
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(a) => a.id}
        onRowClick={(a) => setDetail(a)}
        empty="등록된 과제가 없어요"
      />

      {/* 상세 팝업 */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="과제 상세"
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            닫기
          </Button>
        }
      >
        {detail && (
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">제목</dt>
              <dd className="text-fg font-medium">{detail.title}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">마감</dt>
              <dd className="text-fg tabular-nums">{fmt(detail.dueAt)}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">설명</dt>
              <dd className="text-fg whitespace-pre-wrap">
                {detail.description || '-'}
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">등록일</dt>
              <dd className="text-fg-muted tabular-nums">
                {detail.createdAt?.slice(0, 10) ?? '-'}
              </dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* 추가 모달 */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="과제 추가"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              취소
            </Button>
            <Button onClick={onAdd} disabled={createA.isPending}>
              추가
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="as-title"
          >
            제목
          </label>
          <input
            id="as-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 1주차 미니프로젝트"
            className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="as-desc"
          >
            설명
          </label>
          <textarea
            id="as-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="과제 안내·제출 조건"
            rows={4}
            className="border-border focus:border-brand text-fg rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="as-due"
          >
            마감일
          </label>
          <input
            id="as-due"
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
        </div>
      </Modal>
    </div>
  )
}
