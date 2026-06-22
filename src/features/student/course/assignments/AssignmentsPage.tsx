import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useAssignments } from '../../api/course'
import { CourseTabs } from '../CourseTabs'
import { AssignmentCard } from './components/AssignmentCard'
// 페이지네이션은 자료실과 동일 컴포넌트 재사용(같은 '나의 과정' 도메인).
import { MaterialPagination } from '../materials/components/MaterialPagination'
import type { AssignmentStatus } from './types'

type Filter = 'all' | AssignmentStatus
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'not_submitted', label: '미제출' },
  { key: 'submitted', label: '제출 완료' },
  { key: 'reviewed', label: '검토 완료' },
]
const PAGE_SIZE = 5

/**
 * 과제/실습 목록 (/student/course/assignments) — 나의 과정 '과제/실습' 탭. Figma 407:1785.
 * 상태 드롭다운으로 필터링, 카드에서 제출/수정/피드백 화면으로 이동.
 */
export default function AssignmentsPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAssignments()
  usePageHeader('과제/실습')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  if (isPending) {
    return <div className="text-fg-muted p-8">과제를 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="과제를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const items = data ?? []
  const shown = items.filter((it) => filter === 'all' || it.status === filter)
  const activeLabel = FILTERS.find((f) => f.key === filter)?.label ?? '전체'

  // 항목이 많아지면 스크롤 대신 페이지로 끊어 본다(자료실과 동일 규칙).
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount)
  const pageItems = shown.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 p-8">
      <CourseTabs />

      {/* 상태 필터 드롭다운 */}
      <div className="relative w-fit">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="border-border bg-surface text-fg flex items-center gap-2 rounded-[10px] border px-3.5 py-[9px] text-[13px] font-medium"
        >
          {activeLabel}
          <span className="text-fg-subtle text-[10px]">▾</span>
        </button>
        {open && (
          <div className="border-border bg-surface absolute top-[calc(100%+4px)] left-0 z-10 flex w-40 flex-col rounded-[10px] border p-1 shadow-[0px_8px_22px_0px_rgba(18,23,38,0.12)]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => {
                  setFilter(f.key)
                  setPage(1)
                  setOpen(false)
                }}
                className={cn(
                  'rounded-md px-3 py-2 text-left text-[13px]',
                  f.key === filter
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-fg hover:bg-surface-muted',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 과제 카드 목록 */}
      {shown.length === 0 ? (
        <Empty title="해당 상태의 과제가 없어요" />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {pageItems.map((it) => (
              <AssignmentCard
                key={it.id}
                item={it}
                onAction={() =>
                  navigate(`/student/course/assignments/${it.id}`)
                }
              />
            ))}
          </div>
          <MaterialPagination
            shownCount={pageItems.length}
            totalCount={shown.length}
            pageCount={pageCount}
            page={curPage}
            onPage={setPage}
          />
        </>
      )}
    </div>
  )
}
