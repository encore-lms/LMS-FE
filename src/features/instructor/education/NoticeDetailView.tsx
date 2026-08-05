import { useState } from 'react'
import { ChevronLeft, Pencil, Pin, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SkeletonListPage } from '@/components/ui/Skeleton'
import { Markdown } from '@/components/ui/Markdown'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  useCourseNotices,
  useDeleteCourseNotice,
  useStaffCourseNotices,
} from '@/shared/api'

// 공지 상세 — 강사 허브와 운영 기수 허브가 같은 한 벌을 쓴다. 라우트만 역할별로 다르다.
//
// 첨부는 따로 모아 두지 않는다 — 파일·북마크는 본문 안에 넣어 글의 흐름대로 읽힌다.
//
// 단건 조회 API 를 따로 두지 않고 기수 목록에서 찾는다 — 목록 응답이 이미 본문·첨부까지
// 담고 있고, 목록에서 눌러 들어오는 흐름이라 캐시가 그대로 재사용된다.

export function NoticeDetailView({
  cohortId,
  noticeId,
  backTo,
  editTo,
  source = 'staff',
}: {
  /** 스태프(source='staff')만 필요 — 수강생 미러는 서버가 본인 기수를 해석한다. */
  cohortId?: string
  noticeId: string
  /** 목록으로 돌아갈 경로 — 삭제 후에도 여기로 보낸다. */
  backTo: string
  /** 수정 화면 경로 — 없으면 수정 버튼을 내지 않는다(수강생 미러). */
  editTo?: string
  /** 수강생(source='student')은 같은 상세를 읽기 전용으로 소비(2026-08-05). */
  source?: 'staff' | 'student'
}) {
  const readOnly = source === 'student'
  usePageHeader(
    '공지',
    readOnly
      ? '과정 운영 공지를 확인하세요'
      : '수강생 강의 홈에 보이는 공지입니다',
  )
  const toast = useToast()
  const navigate = useNavigate()
  const staffQuery = useStaffCourseNotices(readOnly ? undefined : cohortId)
  const studentQuery = useCourseNotices(readOnly)
  const { data, isPending, isError, refetch } = readOnly
    ? studentQuery
    : staffQuery
  const remove = useDeleteCourseNotice()
  const [confirming, setConfirming] = useState(false)

  const notice = data?.notices.find((n) => n.id === noticeId) ?? null

  return (
    <div className="p-8">
      <DataBoundary
        isPending={isPending}
        isError={isError || !data}
        onRetry={refetch}
        skeleton={<SkeletonListPage columns={1} className="" />}
        errorTitle="공지를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {data &&
          (!notice ? (
            // 다른 사람이 지웠거나 주소를 직접 고쳐 들어온 경우.
            <Empty
              title="공지를 찾을 수 없어요"
              description="이미 삭제됐거나 다른 기수의 공지일 수 있어요."
            />
          ) : (
            // 읽는 글이라 카드로 띄우지 않는다 — 배경과 같은 면 위에 머리말·본문·꼬리말을
            // 가는 선으로만 나눈다(그림자·테두리 없음).
            <article className="mx-auto flex w-full max-w-[880px] flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
                <span className="bg-accent-bg text-accent-strong rounded px-1.5 py-0.5 text-[11px] font-bold">
                  공지
                </span>
                {notice.pinned && (
                  <span className="bg-warning-bg text-warning inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold">
                    <Pin className="size-3" aria-hidden="true" />
                    고정
                  </span>
                )}
                <span className="text-fg-muted font-medium">
                  {notice.authorName}
                </span>
                <span className="text-fg-subtle">·</span>
                <span className="text-fg-subtle">{notice.roleLabel}</span>
                <span className="text-fg-subtle">·</span>
                <span className="text-fg-subtle tabular-nums">
                  {notice.createdAt}
                </span>
              </div>

              <h2 className="text-fg mt-2 text-[22px] font-bold [overflow-wrap:anywhere]">
                {notice.title}
              </h2>

              <div className="bg-divider mt-4 h-px w-full" />

              {/* 짧은 글이라도 본문 자리를 넉넉히 잡는다 — 한 줄짜리 공지에서 제목과 꼬리말이
                  붙어 버려 본문이 어디까지인지 읽히지 않았다. */}
              <div className="min-h-[320px] py-7">
                <Markdown uploadScope="staff" className="text-[14px] leading-7">
                  {notice.content}
                </Markdown>
              </div>

              {/* 꼬리말 — 왼쪽에 목록으로, 오른쪽에 이 글에 대한 액션. */}
              <div className="border-divider mt-6 flex items-center justify-between gap-3 border-t pt-5">
                <Link
                  to={backTo}
                  className="border-border text-fg hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  목록으로
                </Link>
                <div className="flex items-center gap-2">
                  {/* 고정 해제도 이 수정 화면에서 한다 — 별도 토글을 두면 판이 둘로 갈린다. */}
                  {!readOnly && notice.canEdit && editTo && (
                    <Link
                      to={editTo}
                      aria-label={`${notice.title} 수정`}
                      className="border-border text-fg hover:bg-surface-muted inline-flex items-center gap-1 rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      수정
                    </Link>
                  )}
                  {!readOnly && notice.canDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirming(true)}
                      aria-label={`${notice.title} 삭제`}
                      className="border-danger/40 text-danger hover:bg-danger-bg inline-flex items-center gap-1 rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
      </DataBoundary>

      <ConfirmDialog
        open={confirming}
        title="공지를 삭제할까요?"
        confirmLabel="삭제"
        tone="danger"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          if (!notice) return
          remove.mutate(notice.id, {
            onSuccess: () => {
              toast.success('공지를 삭제했어요')
              // 지운 글의 상세에 남아 있으면 '찾을 수 없어요'만 보인다 — 목록으로 돌려보낸다.
              navigate(backTo, { replace: true })
            },
            onError: () => toast.danger('공지를 삭제하지 못했어요'),
          })
          setConfirming(false)
        }}
      >
        <p className="text-fg-muted text-[13px] leading-6">
          {notice ? `'${notice.title}' 공지가 사라져요.` : ''}
        </p>
      </ConfirmDialog>
    </div>
  )
}
