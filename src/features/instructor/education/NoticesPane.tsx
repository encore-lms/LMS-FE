import { useState } from 'react'
import { Megaphone, Pin, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import {
  useDeleteCourseNotice,
  useStaffCourseNotices,
  useWriteCourseNotice,
  type NoticePost,
} from '@/shared/api'

// 담당 기수 공지 — 강사·매니저가 쓰고 지운다.
// 삭제 버튼은 서버가 canDelete 로 허락한 글에만 나온다(강사는 본인 글만).

const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

export function NoticesPane({ cohortId }: { cohortId: string }) {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useStaffCourseNotices(cohortId)
  const write = useWriteCourseNotice(cohortId)
  const remove = useDeleteCourseNotice()

  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [target, setTarget] = useState<NoticePost | null>(null)

  const reset = () => {
    setTitle('')
    setContent('')
    setPinned(false)
    setComposing(false)
  }

  const submit = () => {
    if (!title.trim()) {
      toast.danger('제목을 입력해 주세요')
      return
    }
    if (!content.trim()) {
      toast.danger('내용을 입력해 주세요')
      return
    }
    write.mutate(
      { title: title.trim(), content: content.trim(), pinned },
      {
        onSuccess: () => {
          toast.success('공지를 올렸어요')
          reset()
        },
        onError: () => toast.danger('공지를 올리지 못했어요'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-fg-muted text-[13px]">
          수강생 강의 홈에 바로 보입니다
        </span>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className={buttonClass({ size: 'sm' })}
        >
          공지 작성
        </button>
      </div>

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
              description="첫 공지를 올려 보세요."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {data.notices.map((n) => (
                <article key={n.id} className={cn(card, 'flex flex-col gap-2')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.pinned && (
                          <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold">
                            <Pin className="size-3" aria-hidden="true" />
                            고정
                          </span>
                        )}
                        <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
                          {n.roleLabel}
                        </span>
                        <span className="text-fg text-[15px] font-bold">
                          {n.title}
                        </span>
                      </div>
                      <span className="text-fg-subtle text-[12px]">
                        {n.authorName} · {n.createdAt} · {n.timeAgo}
                      </span>
                    </div>
                    {n.canDelete && (
                      <button
                        type="button"
                        onClick={() => setTarget(n)}
                        aria-label={`${n.title} 삭제`}
                        className="border-danger/40 text-danger shrink-0 rounded-md border px-2.5 py-1.5 text-[12px] font-semibold"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <p className="text-fg-muted text-[13px] leading-6 whitespace-pre-wrap">
                    {n.content}
                  </p>
                </article>
              ))}
            </div>
          ))}
      </DataBoundary>

      <Modal
        open={composing}
        onClose={reset}
        size="md"
        title="공지 작성"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
            >
              취소
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={write.isPending}
              className={buttonClass({ size: 'md' })}
            >
              올리기
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            aria-label="공지 제목"
            className={inputClass({ size: 'md' })}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지 내용을 적어주세요"
            aria-label="공지 내용"
            className={inputClass({
              size: 'md',
              className: 'min-h-[160px] resize-none leading-6',
            })}
          />
          <label className="text-fg-muted flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            목록 맨 위에 고정
          </label>
        </div>
      </Modal>

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
