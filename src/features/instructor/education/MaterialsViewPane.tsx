import { useMemo, useState } from 'react'
import { Download, ExternalLink, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import type { CohortMaterialItem } from '@/shared/types'
import { formatDate } from '@/shared/lib/date'
import { ArticleView } from '@/features/admin/education/ArticleView'
import {
  downloadInstructorMaterialFile,
  useInstructorMaterials,
} from './api'

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

// 자료실 탭(강사 조회 전용) — 게시글형 기수 자료 조회 + 상세 팝업 + 파일 다운로드. 등록·삭제 없음.
export function MaterialsViewPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useInstructorMaterials(cohortId)
  const toast = useToast()
  const [detail, setDetail] = useState<CohortMaterialItem | null>(null)
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

  const onDownload = async (m: CohortMaterialItem) => {
    try {
      await downloadInstructorMaterialFile(
        cohortId,
        m.id,
        m.fileName ?? 'download',
      )
    } catch {
      toast.danger('파일 다운로드에 실패했어요')
    }
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
      header: '',
      align: 'right',
      className: 'w-24',
      cell: (m) => (
        <div className="flex justify-end">
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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-fg-muted text-sm">
            총 {filtered.length}개 자료
            {data &&
              filtered.length !== data.length &&
              ` (전체 ${data.length})`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="border-border focus-within:border-brand bg-surface flex h-9 w-56 items-center gap-2 rounded-lg border px-3">
              <Search className="text-fg-subtle h-4 w-4 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="제목·내용 검색"
                aria-label="자료 검색"
                className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
              />
            </div>
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
              metaItems={[formatDate(detail.createdAt) || '-']}
              body={detail.body}
              bodyEmptyText="본문 없이 등록된 자료입니다."
              footer={
                detail.materialType === 'link' && detail.url ? (
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-info inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> 링크 열기
                  </a>
                ) : detail.hasFile ? (
                  <button
                    type="button"
                    onClick={() => onDownload(detail)}
                    className="text-info inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                  >
                    <Download className="h-4 w-4" />{' '}
                    {detail.fileName ?? '첨부 파일'}
                  </button>
                ) : null
              }
            />
          )}
        </Modal>
      </div>
    </DataBoundary>
  )
}
