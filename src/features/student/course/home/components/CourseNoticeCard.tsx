import { Fragment } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { CourseNotice, NoticeTone } from '../../types'

// 강의 홈 공지 카드(전체 폭) — 태그 칩 + 제목 + 작성 시각. 행 사이 디바이더.
// 행은 공지 상세로, 헤더의 '전체 보기'는 공지 탭으로 간다(홈 위젯은 최근 7일 5건만 보여준다).
const TAG: Record<NoticeTone, string> = {
  urgent: 'bg-danger-bg text-danger',
  notice: 'bg-info-bg text-info',
  normal: 'bg-surface-muted text-fg-muted',
}

export function CourseNoticeCard({ notices }: { notices: CourseNotice[] }) {
  return (
    <section className="bg-surface flex w-full flex-col gap-3.5 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-fg text-[15px] font-bold">공지</h2>
          <p className="text-fg-muted text-[11px]">
            {notices.length}건 · 최근 7일
          </p>
        </div>
        <Link
          to="/student/course/notices"
          className="text-fg-muted hover:text-fg flex shrink-0 items-center gap-1 text-[12px] font-semibold"
        >
          전체 보기
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
      {notices.map((n, i) => (
        <Fragment key={n.id}>
          {i > 0 && <div className="bg-divider h-px w-full" />}
          <Link
            to={`/student/course/notices/${n.id}`}
            className="hover:bg-surface-muted -mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors"
          >
            <span
              className={cn(
                'shrink-0 rounded-[5px] px-2 py-[3px] text-[11px] font-bold',
                TAG[n.tone],
              )}
            >
              {n.tagLabel}
            </span>
            <span className="text-fg flex-1 text-[13px] font-medium">
              {n.title}
            </span>
            <span className="text-fg-subtle shrink-0 text-[11px]">
              {n.timeAgo}
            </span>
          </Link>
        </Fragment>
      ))}
    </section>
  )
}
