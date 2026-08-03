import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Megaphone, Pin, Trash2 } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DataTable, type Column } from '@/components/data/DataTable'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { markdownToText } from '@/components/ui/markdownText'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import {
  useDeleteCourseNotice,
  useStaffCourseNotices,
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
  newPath,
}: {
  cohortId: string
  /** 카드를 눌렀을 때 갈 상세 경로 — 강사와 운영이 라우트가 달라 호출부가 정한다. */
  detailPathOf: (noticeId: string) => string
  /** '공지 작성' 을 눌렀을 때 갈 경로. */
  newPath: string
}) {
  const toast = useToast()
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useStaffCourseNotices(cohortId)
  const remove = useDeleteCourseNotice()

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
        <Link to={newPath} className={buttonClass({ size: 'sm' })}>
          공지 작성
        </Link>
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
