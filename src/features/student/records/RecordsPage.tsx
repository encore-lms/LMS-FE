import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { useRecordsOverview } from '../api/records'
import { RecordStatCards } from './components/RecordStatCards'
import { BlogRecordCard } from './components/BlogRecordCard'
import { DeleteRecordModal } from './components/DeleteRecordModal'
import { RecordToast } from './components/RecordToast'

const TOAST_MSG: Record<string, string> = {
  deleted: '블로그 기록이 삭제되었습니다.',
  'blog-updated': '블로그 기록이 수정되었습니다.',
}

/**
 * 기록실 (/student/records) — Figma 246:27.
 * 필터 탭·요약 통계·제출 배너·블로그 기록 목록. 상태 변형:
 * ?toast=deleted|blog-updated (우하단 토스트), ?modal=delete-blog (삭제 확인 모달).
 */
export default function RecordsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, isPending, isError, refetch } = useRecordsOverview()
  const [activeTab, setActiveTab] = useState('blog')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(
    TOAST_MSG[params.get('toast') ?? ''] ?? null,
  )
  usePageHeader(
    '기록실',
    '블로그·스터디·자격증·이력서·GitHub 등 학습 기록을 한 곳에서 관리',
  )

  const modalParam = params.get('modal') === 'delete-blog'

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  if (isPending)
    return <div className="text-fg-muted p-8">기록실을 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="기록실을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  // 삭제 대상: 로컬 선택 또는 ?modal=delete-blog 진입 시 첫 삭제 가능 기록.
  const targetId =
    deleteId ??
    (modalParam ? data.records.find((r) => r.canDelete)?.id : undefined)
  const deleteTarget = data.records.find((r) => r.id === targetId)

  const closeModal = () => {
    setDeleteId(null)
    if (modalParam) setParams({}, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      {/* 필터 탭 */}
      <div className="flex flex-wrap items-center gap-2">
        {data.tabs.map((t) => {
          const on = t.key === activeTab
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                on
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted hover:bg-surface-muted border',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'text-[12px]',
                  on ? 'text-white/70' : 'text-fg-subtle',
                )}
              >
                {t.count}
              </span>
            </button>
          )
        })}
      </div>

      <RecordStatCards stats={data.stats} />

      {/* 제출 안내 배너 */}
      <div className="bg-brand flex items-center justify-between gap-4 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
            <span className="size-5 rounded bg-white/90" />
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-bold text-white">
              {data.banner.title}
            </span>
            <span className="text-[12px] text-white/80">{data.banner.sub}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/student/records/new/blog')}
          className="text-brand shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-bold"
        >
          {data.banner.actionLabel} →
        </button>
      </div>

      {/* 목록 헤더 */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-fg text-[16px] font-bold">{data.listTitle}</h2>
          <span className="text-fg-subtle text-[12px]">{data.listCount}건</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold">
            최신순 ▾
          </span>
          <span className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold">
            상태 전체 ▾
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data.records.map((r) => (
          <BlogRecordCard
            key={r.id}
            record={r}
            onEdit={(id) => navigate(`/student/records/blog/${id}/edit`)}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}
      </div>

      {/* 푸터 + 페이지네이션 */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-fg-subtle text-[12px]">{data.shownLabel}</span>
        <div className="flex items-center gap-1">
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ‹
          </span>
          {['1', '2', '3'].map((n) => (
            <span
              key={n}
              className={cn(
                'flex size-8 items-center justify-center rounded-lg text-[13px] font-semibold',
                n === '1'
                  ? 'bg-brand-deep text-white'
                  : 'border-border text-fg-muted border',
              )}
            >
              {n}
            </span>
          ))}
          <span className="border-border text-fg-subtle flex size-8 items-center justify-center rounded-lg border text-[13px]">
            ›
          </span>
        </div>
      </div>

      {deleteTarget && (
        <DeleteRecordModal
          record={deleteTarget}
          onCancel={closeModal}
          onConfirm={() => {
            closeModal()
            setToast(TOAST_MSG.deleted)
          }}
        />
      )}

      {toast && <RecordToast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}
