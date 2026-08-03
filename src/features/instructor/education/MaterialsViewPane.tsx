import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { DataTable, type Column } from '@/components/data/DataTable'
import { useToast } from '@/components/ui/use-toast'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import type { CohortMaterialItem } from '@/shared/types'
import { formatDate } from '@/shared/lib/date'
import { ArticleView } from '@/components/data/ArticleView'
import { useCohortRoster } from '../api/console'
import {
  AttachmentFileCard,
  AttachmentLinkCard,
} from '@/components/data/MaterialAttachment'
import { downloadInstructorMaterialFile, useInstructorMaterials } from './api'
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

// 자료실 탭(강사 조회 전용) — 게시글형 기수 자료 조회 + 상세 팝업 + 파일 다운로드. 등록·삭제 없음.
export function MaterialsViewPane({ cohortId }: { cohortId: string }) {
  const { data, isPending, isError, refetch } = useInstructorMaterials(cohortId)
  const toast = useToast()
  // 작성자 이름 — 강사는 계정 목록(/users/students)이 막혀 있어(403) 담당 기수 로스터를 쓴다.
  // 로스터에 없는 사람(운영·타 강사)은 '운영자'로 둔다.
  const { data: roster } = useCohortRoster(cohortId)
  const nameOf = useMemo(() => {
    const map = new Map<string, string>()
    for (const r of roster ?? []) map.set(r.userId, r.name)
    return (userId: string | null | undefined) =>
      (userId && map.get(userId)) || '운영자'
  }, [roster])
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
              // 누가 올렸는지가 빠져 있었다 — 매니저·수강생 화면과 같은 정보를 보여준다.
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
      </div>
    </DataBoundary>
  )
}
