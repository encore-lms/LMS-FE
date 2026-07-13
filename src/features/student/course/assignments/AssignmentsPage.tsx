import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { Select } from '@/components/ui/Select'
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
  const [page, setPage] = useState(1)

  const items = data ?? []
  const shown = items.filter((it) => filter === 'all' || it.status === filter)

  // 항목이 많아지면 스크롤 대신 페이지로 끊어 본다(자료실과 동일 규칙).
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const curPage = Math.min(page, pageCount)
  const pageItems = shown.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 p-8">
      <CourseTabs />

      <DataBoundary
        isPending={isPending}
        isError={isError}
        onRetry={refetch}
        errorTitle="과제를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {/* 상태 필터 — 공통 Select */}
        <div className="w-fit">
          <Select
            aria-label="상태 필터"
            value={filter}
            onChange={(v) => {
              setFilter(v as Filter)
              setPage(1)
            }}
            options={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
          />
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
      </DataBoundary>
    </div>
  )
}
