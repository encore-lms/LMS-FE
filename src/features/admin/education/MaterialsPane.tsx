import { useState } from 'react'
import { AlertTriangle, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import type { CohortMaterialItem } from '@/shared/types'
import {
  useCohortMaterials,
  useCreateCohortMaterial,
  useDeleteCohortMaterial,
} from '../api/settings'

// 자료실 탭 — 기수 자료(CohortMaterial) 조회·추가·삭제 + 상세 팝업(실 BE).
export function MaterialsPane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const { data, isPending, isError, refetch } = useCohortMaterials(
    courseId,
    cohortId,
  )
  const createMaterial = useCreateCohortMaterial()
  const deleteMaterial = useDeleteCohortMaterial()
  const toast = useToast()

  const [detail, setDetail] = useState<CohortMaterialItem | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const onAdd = () => {
    if (!title.trim() || !url.trim()) {
      toast.danger('제목과 링크(URL)를 입력해 주세요')
      return
    }
    createMaterial.mutate(
      {
        courseId,
        cohortId,
        title: title.trim(),
        materialType: 'link',
        url: url.trim(),
      },
      {
        onSuccess: () => {
          toast.success(`자료 추가 — ${title.trim()}`)
          setAddOpen(false)
          setTitle('')
          setUrl('')
        },
        onError: () => toast.danger('자료 추가에 실패했어요'),
      },
    )
  }

  const onDelete = (m: CohortMaterialItem) => {
    deleteMaterial.mutate(
      { courseId, cohortId, materialId: m.id },
      {
        onSuccess: () => toast.success(`삭제 — ${m.title}`),
        onError: () => toast.danger('삭제에 실패했어요'),
      },
    )
  }

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="자료실을 불러오지 못했어요"
        description="실 BE(learning-service) 연결을 확인한 뒤 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const columns: Column<CohortMaterialItem>[] = [
    {
      key: 'title',
      header: '제목',
      cell: (m) => <span className="text-fg font-medium">{m.title}</span>,
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-24',
      cell: (m) => (
        <span className="text-fg-muted text-xs">{m.materialType}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      className: 'w-32',
      cell: (m) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {m.createdAt?.slice(0, 10) ?? '-'}
        </span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      align: 'right',
      className: 'w-32',
      cell: (m) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setDetail(m)
            }}
            className="bg-info-bg text-info hover:bg-info-bg/70 rounded-md px-2 py-1 text-xs font-medium"
          >
            상세
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(m)
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
        <p className="text-fg-muted text-sm">총 {data.length}개 자료</p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> 자료 추가
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(m) => m.id}
        onRowClick={(m) => setDetail(m)}
        empty="등록된 자료가 없어요"
      />

      {/* 상세 팝업 — 별도 상세 페이지가 없어 모달로 표시 */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="자료 상세"
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
              <dt className="text-fg-muted w-16 shrink-0">유형</dt>
              <dd className="text-fg">{detail.materialType}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-16 shrink-0">링크</dt>
              <dd className="min-w-0 flex-1">
                {detail.url ? (
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-info inline-flex items-center gap-1 break-all hover:underline"
                  >
                    {detail.url}{' '}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  '-'
                )}
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
        title="자료 추가"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              취소
            </Button>
            <Button onClick={onAdd} disabled={createMaterial.isPending}>
              추가
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="mat-title"
          >
            제목
          </label>
          <input
            id="mat-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 1주차 강의자료"
            className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="mat-url"
          >
            링크(URL)
          </label>
          <input
            id="mat-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="border-border focus:border-brand text-fg h-10 rounded-lg border bg-white px-3 text-sm outline-none"
          />
        </div>
      </Modal>
    </div>
  )
}
