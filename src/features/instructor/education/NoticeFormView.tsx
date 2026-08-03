import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useWriteCourseNotice } from '@/shared/api'

/**
 * 공지 작성 — 강사 허브와 운영 기수 허브가 같은 한 벌을 쓴다. 라우트만 역할별로 다르다.
 *
 * <p>모달이 아니라 페이지다. 본문에 제목·목록·표·이미지·파일·북마크를 넣다 보면 글이 길어지는데,
 * 좁은 상자 안에서는 쓴 글이 한눈에 들어오지 않고 슬래시 메뉴·임베드 상자가 상자 밖으로 밀린다.
 * 읽는 화면(상세)과 같은 폭·같은 흐름으로 쓴다.</p>
 */
export function NoticeFormView({
  cohortId,
  backTo,
}: {
  cohortId: string
  /** 목록으로 돌아갈 경로 — 올린 뒤에도 여기로 보낸다. */
  backTo: string
}) {
  usePageHeader('공지 작성', '수강생 강의 홈에 바로 보입니다')
  const toast = useToast()
  const navigate = useNavigate()
  const write = useWriteCourseNotice(cohortId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)

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
          navigate(backTo, { replace: true })
        },
        onError: () => toast.danger('공지를 올리지 못했어요'),
      },
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto flex w-full max-w-[880px] flex-col">
        <Link
          to={backTo}
          className="text-fg-muted hover:text-fg mb-4 inline-flex w-fit items-center gap-1 text-[13px] font-medium"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          공지 목록
        </Link>

        {/* 제목은 상세에서 보일 크기 그대로 — 쓰면서 결과를 가늠할 수 있게. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          aria-label="공지 제목"
          className="text-fg placeholder:text-fg-subtle w-full border-0 bg-transparent px-0 text-[22px] font-bold outline-none focus-visible:shadow-none"
        />

        <div className="bg-divider mt-4 mb-5 h-px w-full" />

        <RichTextEditor
          value={content}
          onChange={setContent}
          ariaLabel="공지 내용"
          minHeight={360}
          placeholder="공지 내용을 적어주세요 · 빈 줄에서 / 를 누르면 제목·목록·표·이미지·파일·북마크를 넣을 수 있어요"
          onError={(m) => toast.danger(m)}
          // 본문이 글의 몸통이라 상자 테두리를 지운다 — 상세와 같은 면으로 읽힌다.
          className="border-0 px-0"
        />

        <div className="border-divider mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <label className="text-fg-muted flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            목록 맨 위에 고정
          </label>
          <div className="flex items-center gap-2">
            <Link
              to={backTo}
              className="border-border text-fg hover:bg-surface-muted rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
            >
              취소
            </Link>
            <button
              type="button"
              onClick={submit}
              disabled={write.isPending}
              className={buttonClass({ size: 'md' })}
            >
              올리기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
