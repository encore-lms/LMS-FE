import { useState } from 'react'
import { Megaphone, Pin, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  useCourseNotices,
  useDeleteCourseNotice,
  type NoticePost,
} from '@/shared/api'
import { CourseTabs } from '../CourseTabs'

// 강의 홈 공지 — 수강생은 읽기만. 삭제 버튼은 서버가 canDelete 로 허락한 글에만 나온다
// (강사는 본인 글만, 매니저는 어떤 글이든).

const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

function NoticeCard({
  notice,
  onDelete,
}: {
  notice: NoticePost
  onDelete: (n: NoticePost) => void
}) {
  return (
    <article className={cn(card, 'flex flex-col gap-2')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {notice.pinned && (
              <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold">
                <Pin className="size-3" aria-hidden="true" />
                고정
              </span>
            )}
            <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
              {notice.roleLabel}
            </span>
            <span className="text-fg text-[15px] font-bold">
              {notice.title}
            </span>
          </div>
          <span className="text-fg-subtle text-[12px]">
            {notice.authorName} · {notice.createdAt} · {notice.timeAgo}
          </span>
        </div>
        {notice.canDelete && (
          <button
            type="button"
            onClick={() => onDelete(notice)}
            aria-label={`${notice.title} 삭제`}
            className="border-danger/40 text-danger shrink-0 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="text-fg-muted text-[13px] leading-6 whitespace-pre-wrap">
        {notice.content}
      </p>
    </article>
  )
}

export default function NoticesPage() {
  usePageHeader('공지', '과정 운영 공지를 확인하세요')
  const toast = useToast()
  const { data, isPending, isError, refetch } = useCourseNotices()
  const remove = useDeleteCourseNotice()
  const [target, setTarget] = useState<NoticePost | null>(null)

  return (
    <div className="flex flex-col gap-5 p-8">
      <CourseTabs />
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        skeleton={<SkeletonListPage columns={3} className="" />}
        errorTitle="공지를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data &&
          (data.notices.length === 0 ? (
            <Empty
              icon={<Megaphone aria-hidden="true" />}
              title="등록된 공지가 없어요"
              description="새 공지가 올라오면 여기에서 확인할 수 있어요."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {data.notices.map((n) => (
                <NoticeCard key={n.id} notice={n} onDelete={setTarget} />
              ))}
            </div>
          ))}
      </DataBoundary>

      <ConfirmDialog
        open={!!target}
        title="공지를 삭제할까요?"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (!target) return
          remove.mutate(target.id, {
            onSuccess: () => toast.success('공지를 삭제했어요'),
            onError: () => toast.danger('공지를 삭제하지 못했어요'),
          })
          setTarget(null)
        }}
      >
        <p className="text-fg-muted text-[13px] leading-6">
          {target ? `'${target.title}' 공지가 사라져요.` : ''}
        </p>
      </ConfirmDialog>
    </div>
  )
}
