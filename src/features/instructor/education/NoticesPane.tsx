import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, Pin, Trash2 } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Modal } from '@/components/ui/Modal'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { buttonClass } from '@/components/ui/buttonClass'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import { markdownToText } from '@/components/ui/markdownText'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import {
  useDeleteCourseNotice,
  useStaffCourseNotices,
  useWriteCourseNotice,
  type NoticePost,
} from '@/shared/api'
import { SearchInput } from '@/components/ui/SearchInput'

// 담당 기수 공지 — 강사·매니저가 쓰고 지운다.
// 삭제 버튼은 서버가 canDelete 로 허락한 글에만 나온다(강사는 본인 글만).
//
// 강사 허브와 운영 기수 허브가 이 한 벌을 함께 쓴다 — 같은 글을 다루는 화면이 둘로 갈라지면
// 한쪽만 고쳐지기 때문이다. 역할 차이는 서버가 canDelete 로 내려주는 것뿐이다.

export function NoticesPane({
  cohortId,
  detailPathOf,
}: {
  cohortId: string
  /** 카드를 눌렀을 때 갈 상세 경로 — 강사와 운영이 라우트가 달라 호출부가 정한다. */
  detailPathOf: (noticeId: string) => string
}) {
  const toast = useToast()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useStaffCourseNotices(cohortId)
  const write = useWriteCourseNotice(cohortId)
  const remove = useDeleteCourseNotice()

  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [target, setTarget] = useState<NoticePost | null>(null)
  // 검색어는 주소에 남긴다 — 상세를 보고 뒤로 오면 찾던 목록이 그대로 있어야 한다.
  const [q, setQ] = useSearchParamState('nq')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return data?.notices ?? []
    return (data?.notices ?? []).filter((n) =>
      `${n.title} ${n.content} ${n.authorName}`.toLowerCase().includes(needle),
    )
  }, [data, q])

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

  // 자료실과 같은 표 — 제목·작성자·등록일. 본문은 제목 아래 한 줄 요약으로만 보이고,
  // 전문과 첨부 내려받기는 상세에서 한다(목록에서 카드가 길어지면 훑기가 어렵다).
  const columns: Column<NoticePost>[] = [
    {
      key: 'title',
      header: '제목',
      cell: (n) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1.5">
            {n.pinned && (
              <span className="bg-warning-bg text-warning inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold">
                <Pin className="size-2.5" aria-hidden="true" />
                고정
              </span>
            )}
            <span className="text-fg truncate font-medium">{n.title}</span>
          </div>
          {/* 본문은 마크다운이라 `#`·`-` 기호가 그대로 보이지 않게 평문으로 줄여 보여준다. */}
          {n.content && (
            <span className="text-fg-subtle line-clamp-1 text-xs">
              {markdownToText(n.content)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'author',
      header: '작성자',
      className: 'w-32',
      cell: (n) => (
        <div className="flex min-w-0 flex-col">
          <span className="text-fg-muted truncate text-xs">{n.authorName}</span>
          <span className="text-fg-subtle text-[11px]">{n.roleLabel}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      className: 'w-28',
      cell: (n) => (
        <span className="text-fg-subtle text-xs tabular-nums">
          {n.createdAt}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      className: 'w-16',
      cell: (n) =>
        n.canDelete ? (
          <div className="flex justify-end">
            <button
              type="button"
              // 행 전체가 상세로 가는 버튼이라, 삭제가 거기까지 번지면 안 된다.
              onClick={(e) => {
                e.stopPropagation()
                setTarget(n)
              }}
              aria-label={`${n.title} 삭제`}
              className="border-danger/40 text-danger rounded-md border px-2 py-1 text-xs font-semibold"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="제목·내용·작성자 검색"
          ariaLabel="공지 검색"
        />
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
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(n) => n.id}
              onRowClick={(n) => navigate(detailPathOf(n.id))}
              empty="조건에 맞는 공지가 없어요"
            />
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
          {/* 공지는 목록·제목만으로 전달되지 않는 안내가 많다 — 쓰는 대로 보이는 편집기로
              제목·목록·표를 넣는다. 빈 문단에서 `/` 를 치면 블록을 고른다. */}
          <RichTextEditor
            value={content}
            onChange={setContent}
            ariaLabel="공지 내용"
            minHeight={220}
            placeholder="공지 내용을 적어주세요 · 빈 줄에서 / 를 누르면 제목·목록·표·이미지·파일·북마크를 넣을 수 있어요"
            onError={(m) => toast.danger(m)}
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
