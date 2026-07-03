import { useMemo, useState } from 'react'
import { AlertTriangle, Download, ExternalLink, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import type { CohortMaterialItem } from '@/shared/types'
import { formatDate } from '@/shared/lib/date'
import {
  downloadCohortMaterialFile,
  useCohortMaterials,
  useCreateCohortMaterial,
  useDeleteCohortMaterial,
  useOpsAccounts,
} from '../api/settings'
import { ActionModal, type ActionModalSpec } from '../settings/ActionModal'
import { ArticleView } from './ArticleView'

const TYPE_LABEL: Record<string, string> = {
  link: '링크',
  document: '문서',
  file: '파일',
}
const fmtSize = (n: number | null) => {
  if (!n) return ''
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

// 자료실 탭 — 게시글형 기수 자료(본문·링크/파일·작성자) 조회·등록·삭제 + 상세 팝업(실 BE).
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
  const { data: ops } = useOpsAccounts()
  const createMaterial = useCreateCohortMaterial()
  const deleteMaterial = useDeleteCohortMaterial()
  const toast = useToast()

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const o of ops?.items ?? []) map.set(o.id, o.name)
    return (userId: string) => map.get(userId) ?? '운영자'
  }, [ops])

  const [detail, setDetail] = useState<CohortMaterialItem | null>(null)
  // 삭제 확인 대상 — 파괴적 액션은 ActionModal 확인을 거친다.
  const [deleteTarget, setDeleteTarget] = useState<CohortMaterialItem | null>(
    null,
  )
  const [addOpen, setAddOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<'link' | 'file'>('link')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const resetForm = () => {
    setTitle('')
    setBody('')
    setKind('link')
    setUrl('')
    setFile(null)
  }

  const onAdd = () => {
    if (!title.trim()) {
      toast.danger('제목을 입력해 주세요')
      return
    }
    if (kind === 'link' && !url.trim()) {
      toast.danger('링크(URL)를 입력해 주세요')
      return
    }
    if (kind === 'file' && !file) {
      toast.danger('업로드할 파일을 선택해 주세요')
      return
    }
    createMaterial.mutate(
      {
        courseId,
        cohortId,
        title: title.trim(),
        body: body.trim() || undefined,
        materialType: kind === 'file' ? 'file' : 'link',
        url: kind === 'link' ? url.trim() : undefined,
        file: kind === 'file' ? (file ?? undefined) : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`자료 등록 — ${title.trim()}`)
          setAddOpen(false)
          resetForm()
        },
        onError: () => toast.danger('자료 등록에 실패했어요'),
      },
    )
  }

  const onDownload = async (m: CohortMaterialItem) => {
    try {
      await downloadCohortMaterialFile(
        courseId,
        cohortId,
        m.id,
        m.fileName ?? 'download',
      )
    } catch {
      toast.danger('파일 다운로드에 실패했어요')
    }
  }

  const deleteSpec: ActionModalSpec | null = deleteTarget
    ? {
        title: '자료 삭제',
        subtitle: '삭제한 자료는 복구할 수 없습니다.',
        rows: [
          { label: '자료', value: deleteTarget.title },
          {
            label: '유형',
            value:
              TYPE_LABEL[deleteTarget.materialType] ??
              deleteTarget.materialType,
          },
          { label: '처리', value: '게시글·첨부 영구 삭제' },
        ],
        confirmLabel: '삭제',
      }
    : null
  const onDelete = () => {
    if (!deleteTarget) return
    const m = deleteTarget
    deleteMaterial.mutate(
      { courseId, cohortId, materialId: m.id },
      {
        onSuccess: () => toast.success(`삭제 — ${m.title}`),
        onError: () => toast.danger('삭제에 실패했어요'),
        onSettled: () => setDeleteTarget(null),
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
      cell: (m) => (
        <div className="flex flex-col">
          <span className="text-fg font-medium">{m.title}</span>
          {m.body && (
            <span className="text-fg-subtle line-clamp-1 text-xs">
              {m.body}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: '유형',
      className: 'w-28',
      cell: (m) => (
        <span className="text-fg-muted text-xs">
          {TYPE_LABEL[m.materialType] ?? m.materialType}
          {m.hasFile && m.fileSize ? ` · ${fmtSize(m.fileSize)}` : ''}
        </span>
      ),
    },
    {
      key: 'author',
      header: '작성자',
      className: 'w-28',
      cell: (m) => (
        <span className="text-fg-muted text-[13px]">
          {nameOf(m.uploadedByUserId)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      className: 'w-28',
      cell: (m) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {formatDate(m.createdAt) || '-'}
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
              setDeleteTarget(m)
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
          <Plus className="h-4 w-4" /> 자료 등록
        </Button>
      </div>

      <DataTable
        columns={columns}
        rows={data}
        rowKey={(m) => m.id}
        onRowClick={(m) => setDetail(m)}
        empty="등록된 자료가 없어요"
      />

      {/* 자료 삭제 확인 — 복구 불가 액션 */}
      <ActionModal
        spec={deleteSpec}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        pending={deleteMaterial.isPending}
      />

      {/* 상세 팝업 — 블로그 포스트형 */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setDetail(null)}>
            닫기
          </Button>
        }
      >
        {detail && (
          <ArticleView
            badges={[
              {
                label: TYPE_LABEL[detail.materialType] ?? detail.materialType,
                className: 'bg-info-bg text-info',
              },
            ]}
            title={detail.title}
            metaItems={[
              nameOf(detail.uploadedByUserId),
              formatDate(detail.createdAt) || '-',
            ]}
            body={detail.body}
            bodyEmptyText="본문 없이 등록된 자료입니다."
            footer={
              detail.hasFile ? (
                <button
                  type="button"
                  onClick={() => onDownload(detail)}
                  className="border-border hover:border-brand hover:bg-info-bg/40 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors"
                >
                  <span className="bg-info-bg text-info flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Download className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-fg truncate text-sm font-semibold">
                      {detail.fileName}
                    </span>
                    <span className="text-fg-subtle text-xs">
                      {fmtSize(detail.fileSize)} · 클릭하여 다운로드
                    </span>
                  </span>
                </button>
              ) : detail.url ? (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border hover:border-brand hover:bg-info-bg/40 flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                >
                  <span className="bg-info-bg text-info flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <ExternalLink className="h-5 w-5" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-fg text-sm font-semibold">
                      링크 열기
                    </span>
                    <span className="text-info truncate text-xs">
                      {detail.url}
                    </span>
                  </span>
                </a>
              ) : null
            }
          />
        )}
      </Modal>

      {/* 등록 모달 */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          resetForm()
        }}
        title="자료 등록"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setAddOpen(false)
                resetForm()
              }}
            >
              취소
            </Button>
            <Button onClick={onAdd} disabled={createMaterial.isPending}>
              등록
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
            className="border-border focus:border-brand text-fg bg-surface h-10 rounded-lg border px-3 text-sm outline-none"
          />

          <label
            className="text-fg-subtle text-xs font-medium"
            htmlFor="mat-body"
          >
            본문
          </label>
          <textarea
            id="mat-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="자료 안내·설명을 입력하세요"
            rows={4}
            className="border-border focus:border-brand text-fg bg-surface rounded-lg border px-3 py-2 text-sm outline-none"
          />

          {/* 유형 토글 */}
          <div className="bg-surface-muted flex gap-1 rounded-lg p-1">
            {(['link', 'file'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={
                  'flex-1 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-colors ' +
                  (kind === k
                    ? 'bg-surface text-fg shadow-sm'
                    : 'text-fg-muted hover:text-fg')
                }
              >
                {k === 'link' ? '링크' : '파일'}
              </button>
            ))}
          </div>

          {kind === 'link' ? (
            <input
              aria-label="링크 URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="border-border focus:border-brand text-fg bg-surface h-10 rounded-lg border px-3 text-sm outline-none"
            />
          ) : (
            <input
              aria-label="파일 선택"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-fg-muted file:border-border file:bg-surface-muted file:text-fg text-sm file:mr-3 file:rounded-md file:border file:px-3 file:py-1.5 file:text-[13px]"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
