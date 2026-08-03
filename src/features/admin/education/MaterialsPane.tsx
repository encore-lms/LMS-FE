import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
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
import { useCohortRoster } from '@/shared/api/students'
import { useAuth } from '@/shared/store'
import {
  downloadInstructorMaterialFile,
  useCreateInstructorMaterial,
  useDeleteInstructorMaterial,
  useInstructorMaterials,
} from '@/features/instructor/education/api'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { ArticleView } from '@/components/data/ArticleView'
import {
  AttachmentFileCard,
  AttachmentLinkCard,
} from '@/components/data/MaterialAttachment'
import { SearchInput } from '@/components/ui/SearchInput'

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
// source: 매니저(admin, 기본)·강사(instructor) 공용 — 등록은 양 역할(2026-08-03 개방, 공지와 동일 정책),
// 삭제는 매니저=전체·강사=본인 등록분만(BE 가드와 동일 판정).
// 데이터 소스만 역할별 미러 훅으로 갈리고 화면은 한 코드다(CourseHomePane과 같은 규약).
export function MaterialsPane({
  courseId,
  cohortId,
  source = 'admin',
}: {
  /** 매니저(source='admin')만 필요 — 강사 미러는 서버가 기수에서 과정을 해석한다. */
  courseId?: string
  cohortId: string
  source?: 'admin' | 'instructor'
}) {
  const isAdmin = source === 'admin'
  const adminQuery = useCohortMaterials(
    isAdmin ? (courseId ?? null) : null,
    isAdmin ? cohortId : null,
  )
  const instructorQuery = useInstructorMaterials(isAdmin ? null : cohortId)
  const { data, isPending, isError, refetch } = isAdmin
    ? adminQuery
    : instructorQuery
  // 작성자 이름 — 매니저는 운영 계정 목록, 강사는 계정 목록이 403이라 담당 기수 로스터를 쓴다.
  const { data: ops } = useOpsAccounts(isAdmin)
  const { data: roster } = useCohortRoster(isAdmin ? null : cohortId)
  const createMaterial = useCreateCohortMaterial()
  const deleteMaterial = useDeleteCohortMaterial()
  const createInstructorMaterial = useCreateInstructorMaterial(cohortId)
  const deleteInstructorMaterial = useDeleteInstructorMaterial(cohortId)
  const { user } = useAuth()
  // 삭제 가능 판정 — 매니저는 전체, 강사는 본인 등록분만(BE와 동일).
  const canDelete = (m: CohortMaterialItem) =>
    isAdmin || m.uploadedByUserId === user?.id
  const toast = useToast()

  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    if (isAdmin) for (const o of ops?.items ?? []) map.set(o.id, o.name)
    else for (const r of roster ?? []) map.set(r.userId, r.name)
    return (userId: string) => map.get(userId) ?? '운영자'
  }, [isAdmin, ops, roster])

  const [detail, setDetail] = useState<CohortMaterialItem | null>(null)
  // 목록 필터 — 제목·본문 검색 + 유형(문서/링크/파일)으로 좁힌다(탭 공통 필터 바 규격).
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const filtered = useMemo(() => {
    const needle = q.trim()
    return (data ?? []).filter((m) => {
      if (
        needle &&
        !m.title.includes(needle) &&
        !(m.body ?? '').includes(needle)
      )
        return false
      return typeFilter === 'all' || m.materialType === typeFilter
    })
  }, [data, q, typeFilter])
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
    const input = {
      title: title.trim(),
      body: body.trim() || undefined,
      materialType: kind === 'file' ? 'file' : 'link',
      url: kind === 'link' ? url.trim() : undefined,
      file: kind === 'file' ? (file ?? undefined) : undefined,
    }
    const opts = {
      onSuccess: () => {
        toast.success(`자료 등록 — ${input.title}`)
        setAddOpen(false)
        resetForm()
      },
      onError: () => toast.danger('자료 등록에 실패했어요'),
    }
    if (isAdmin)
      createMaterial.mutate(
        { courseId: courseId ?? '', cohortId, ...input },
        opts,
      )
    else createInstructorMaterial.mutate(input, opts)
  }

  const onDownload = async (m: CohortMaterialItem) => {
    try {
      if (isAdmin) {
        await downloadCohortMaterialFile(
          courseId ?? '',
          cohortId,
          m.id,
          m.fileName ?? 'download',
        )
      } else {
        await downloadInstructorMaterialFile(
          cohortId,
          m.id,
          m.fileName ?? 'download',
        )
      }
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
    const opts = {
      onSuccess: () => toast.success(`삭제 — ${m.title}`),
      onError: () => toast.danger('삭제에 실패했어요'),
      onSettled: () => setDeleteTarget(null),
    }
    if (isAdmin)
      deleteMaterial.mutate(
        { courseId: courseId ?? '', cohortId, materialId: m.id },
        opts,
      )
    else deleteInstructorMaterial.mutate(m.id, opts)
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
          {canDelete(m) && (
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
          )}
        </div>
      ),
    },
  ]

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage columns={4} className="" />}
      errorTitle="자료실을 불러오지 못했어요"
      errorDescription="일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
    >
      <div>
        {/* 탭 공통 필터 바 규격 — 좌: 총 개수 / 우: 검색·유형 필터·주 액션 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-fg-muted text-sm">
            총 {filtered.length}개 자료
            {data &&
              filtered.length !== data.length &&
              ` (전체 ${data.length})`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="제목·내용 검색"
              ariaLabel="자료 검색"
            />
            <Select
              aria-label="유형 필터"
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: '전체 유형' },
                { value: 'document', label: '문서' },
                { value: 'link', label: '링크' },
                { value: 'file', label: '파일' },
              ]}
            />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> 자료 등록
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(m) => m.id}
          onRowClick={(m) => setDetail(m)}
          empty={
            (data?.length ?? 0) === 0
              ? '등록된 자료가 없어요'
              : '조건에 맞는 자료가 없어요'
          }
        />

        {/* 자료 삭제 확인 — 복구 불가 액션 */}
        <ActionModal
          spec={deleteSpec}
          onClose={() => setDeleteTarget(null)}
          onConfirm={onDelete}
          pending={
            isAdmin
              ? deleteMaterial.isPending
              : deleteInstructorMaterial.isPending
          }
        />

        {/* 상세 팝업 — 블로그 포스트형 */}
        <Modal
          open={!!detail}
          onClose={() => setDetail(null)}
          size="lg"
          footer={
            <>
              {detail && canDelete(detail) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setDeleteTarget(detail)
                    setDetail(null)
                  }}
                >
                  삭제
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDetail(null)}>
                닫기
              </Button>
            </>
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
                  <AttachmentFileCard
                    fileName={detail.fileName ?? '첨부 파일'}
                    fileSize={detail.fileSize}
                    onDownload={() => onDownload(detail)}
                  />
                ) : detail.url ? (
                  <AttachmentLinkCard url={detail.url} />
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
              <Button
                onClick={onAdd}
                disabled={
                  isAdmin
                    ? createMaterial.isPending
                    : createInstructorMaterial.isPending
                }
              >
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
    </DataBoundary>
  )
}
