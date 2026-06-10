import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useProjectList } from '../api/projects'
import { ProjectStatCards } from './components/ProjectStatCards'
import { ProjectCard } from './components/ProjectCard'

// 프로젝트 목록 (/student/projects) — Figma 337:930.
export default function ProjectListPage() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useProjectList()
  const [active, setActive] = useState('all')
  usePageHeader(data?.headerTitle ?? '프로젝트', data?.headerSub)

  if (isPending)
    return <div className="text-fg-muted p-8">프로젝트를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="프로젝트를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const open = (id: string) => navigate(`/student/projects/${id}`)

  return (
    <div className="flex flex-col gap-5 p-8">
      <ProjectStatCards stats={data.stats} />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">참여 프로젝트</h2>
          <span className="text-fg-subtle text-[12px]">
            {data.projects.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-border text-fg-subtle hidden items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] sm:inline-flex">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            프로젝트명·스택 검색
          </span>
          <button
            type="button"
            onClick={() => navigate('/student/projects/new')}
            className="bg-brand rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
          >
            ✓ 신규 프로젝트
          </button>
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="flex flex-wrap items-center gap-2">
        {data.filters.map((f) => {
          const on = f.key === active
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setActive(f.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {f.label}
              <span
                className={cn(
                  'text-[12px]',
                  on ? 'text-white/70' : 'text-fg-subtle',
                )}
              >
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4">
        {data.projects.map((p) => (
          <ProjectCard key={p.id} project={p} onOpen={open} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">{data.shownLabel}</span>
        <div className="flex items-center gap-1">
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ‹
          </span>
          <span className="bg-brand-deep flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold text-white">
            1
          </span>
        </div>
      </div>
    </div>
  )
}
