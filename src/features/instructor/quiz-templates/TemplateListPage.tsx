import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Info, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { QuizTemplateRow } from '@/shared/types'
import { useDeleteQuizTemplate, useQuizTemplates } from '../api/quizTemplates'

const CATEGORIES = [
  '전체',
  '알고리즘',
  'JavaScript',
  '데이터분석',
  'SQL',
  'React',
] as const
type SortKey = 'recent' | 'useCount' | 'name'

// 퀴즈 템플릿 목록 (/instructor/quiz-templates) — §10. (Figma 1354:9948)
// [새 퀴즈로 복제] → §6 퀴즈 생성 폼 진입. 사용 중 템플릿(복제된 퀴즈 존재)은 삭제 비활성.
export default function TemplateListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useQuizTemplates()
  const deleteTemplate = useDeleteQuizTemplate()
  // mock 환경 — invalidate 후 refetch가 즉시 반영되지 않아 로컬에서도 즉시 제거.
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('전체')
  const [sort, setSort] = useState<SortKey>('recent')
  usePageHeader(
    '퀴즈 템플릿',
    '재사용 문제 풀 관리 — 변경은 기존 파생 퀴즈에 소급 반영되지 않음',
  )

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const needle = q.trim().toLowerCase()
    const result = items.filter((t) => {
      if (removedIds.includes(t.id)) return false
      if (category !== '전체' && t.category !== category) return false
      if (needle) {
        const hay = `${t.name} ${t.category}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
    return [...result].sort((a, b) => {
      if (sort === 'useCount') return b.useCount - a.useCount
      if (sort === 'name') return a.name.localeCompare(b.name)
      return (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '')
    })
  }, [data, q, category, sort, removedIds])

  if (isPending) {
    return <div className="text-fg-muted p-8">템플릿 목록을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="템플릿 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const columns: Column<QuizTemplateRow>[] = [
    {
      key: 'name',
      header: '템플릿명',
      cell: (t) => (
        <div>
          <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
            {t.name}
            {t.isNew && (
              <span className="bg-accent-bg text-accent-strong rounded px-1 py-px text-[10px] font-bold">
                NEW
              </span>
            )}
          </p>
          <p className="text-fg-subtle text-xs">{t.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: '카테고리',
      className: 'w-32',
      cell: (t) => <StatusBadge label={t.category} tone="info" />,
    },
    {
      key: 'count',
      header: '문항 수',
      className: 'w-24',
      cell: (t) => <span className="text-fg text-sm">{t.questionCount}개</span>,
    },
    {
      key: 'points',
      header: '총점',
      className: 'w-24',
      cell: (t) => <span className="text-fg text-sm">{t.totalPoints}점</span>,
    },
    {
      key: 'lastUsed',
      header: '최근 사용',
      className: 'w-36',
      cell: (t) => (
        <div>
          <p className="text-fg-muted text-sm">{t.lastUsedAt ?? '미사용'}</p>
          <p className="text-fg-subtle text-xs">{t.useCount}회 사용</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '액션',
      className: 'w-56',
      cell: (t) => {
        const inUse = t.useCount > 0
        return (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.success(`${t.name} → 새 퀴즈로 복제 (mock)`)
                navigate('/instructor/quizzes/new')
              }}
              className="bg-brand-deep rounded-md px-2.5 py-1 text-xs font-bold text-white"
            >
              새 퀴즈로 복제
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/instructor/quiz-templates/${t.id}/edit`)
              }}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              편집
            </button>
            <button
              type="button"
              disabled={inUse}
              title={
                inUse
                  ? '복제된 퀴즈가 있는 템플릿은 삭제할 수 없어요'
                  : undefined
              }
              onClick={(e) => {
                e.stopPropagation()
                if (inUse) return
                deleteTemplate.mutate(t.id, {
                  onSuccess: () => {
                    setRemovedIds((prev) => [...prev, t.id])
                    toast.success(`${t.name} 삭제됨`)
                  },
                  onError: () =>
                    toast.danger(
                      '템플릿 삭제에 실패했어요. 다시 시도해 주세요.',
                    ),
                })
              }}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs font-medium',
                inUse
                  ? 'border-border text-fg-subtle cursor-not-allowed opacity-50'
                  : 'border-danger/40 text-danger hover:bg-danger-bg',
              )}
            >
              삭제
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="p-8">
      {/* 필터 바 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="border-border flex h-9 w-72 items-center gap-2 rounded-lg border bg-white px-3">
          <Search className="text-fg-subtle h-4 w-4" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="템플릿명·카테고리로 검색"
            aria-label="템플릿 검색"
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
          />
        </div>
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">카테고리</span>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number])
            }
            aria-label="카테고리 필터"
            className="text-fg bg-transparent text-sm font-medium outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
          <span className="text-fg-subtle">정렬</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="정렬"
            className="text-fg bg-transparent text-sm font-medium outline-none"
          >
            <option value="recent">최근 사용 순</option>
            <option value="useCount">사용 횟수 순</option>
            <option value="name">이름 순</option>
          </select>
        </label>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-fg-subtle text-xs">
            총 {data.total}개 템플릿 · 누적 사용 {data.totalUseCount}회
          </span>
          <button
            type="button"
            onClick={() => navigate('/instructor/quiz-templates/new')}
            className="bg-brand-deep flex h-9 items-center gap-1 rounded-lg px-3.5 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" /> 템플릿 생성
          </button>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(t) => t.id}
          onRowClick={(t) =>
            navigate(`/instructor/quiz-templates/${t.id}/edit`)
          }
          empty="조건에 맞는 템플릿이 없어요"
        />
      </div>
      <p className="text-fg-subtle mt-3 flex items-center gap-1.5 text-xs">
        <Info className="h-3 w-3" />
        [새 퀴즈로 복제] → §6 퀴즈 생성 폼으로 이동 · 사용 중인 템플릿(복제된
        퀴즈 존재)은 삭제 비활성
      </p>
    </div>
  )
}
