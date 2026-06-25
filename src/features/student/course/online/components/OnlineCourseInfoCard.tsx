import { ArrowUpRight, Check, ListVideo, Lock, Play } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/shared/lib/cn'
import type { OnlineChapterView, OnlineMentor } from '../types'

// 좌측 과정 정보 카드 — 과정명 · 강사(멘토) · 설명 + 차시 목록(완료 ✓ / 재생시간) + 학습 후기 CTA.
// 참고 시안의 'Course / Mentor / Course chapters / Leave your feedback' 좌측 패널을 KDC로 매핑.
export function OnlineCourseInfoCard({
  trackLabel,
  courseName,
  mentor,
  description,
  chapters,
  selectedChapterId,
  onSelectChapter,
}: {
  trackLabel: string
  courseName: string
  mentor: OnlineMentor
  description: string
  chapters: OnlineChapterView[]
  selectedChapterId: string
  onSelectChapter: (id: string) => void
}) {
  return (
    <aside className="border-border bg-surface flex flex-col gap-5 rounded-2xl border p-6 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]">
      {/* 과정 헤더 */}
      <div className="flex flex-col gap-1.5">
        <span className="text-fg-subtle text-[11px] font-semibold tracking-[0.14em]">
          {trackLabel}
        </span>
        <h2 className="text-fg text-[22px] leading-tight font-bold">
          {courseName}
        </h2>
      </div>

      {/* 강사(멘토) */}
      <div className="border-divider flex items-center gap-3 border-y py-3.5">
        <Avatar name={mentor.name} size={40} />
        <div className="flex flex-1 flex-col">
          <span className="text-fg text-[14px] font-bold">{mentor.name}</span>
          <span className="text-fg-muted text-[11px]">
            {mentor.role}
            {mentor.org ? ` · ${mentor.org}` : ''}
          </span>
        </div>
        <span className="border-border text-fg-muted flex size-8 items-center justify-center rounded-full border">
          <ArrowUpRight className="size-4" />
        </span>
      </div>

      {/* 과정 설명 */}
      <div className="flex flex-col gap-2">
        <span className="text-fg-subtle text-[11px] font-semibold tracking-[0.08em]">
          과정 소개
        </span>
        <div className="text-fg-muted flex flex-col gap-2.5 text-[13px] leading-relaxed">
          {description.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      {/* 차시 목록 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-brand/10 text-brand flex size-6 items-center justify-center rounded-md">
            <ListVideo className="size-3.5" />
          </span>
          <h3 className="text-fg text-[14px] font-bold">차시 목록</h3>
        </div>
        <ul className="flex flex-col gap-1.5">
          {chapters.map((ch) => (
            <ChapterNavRow
              key={ch.id}
              chapter={ch}
              active={ch.id === selectedChapterId}
              onSelect={() => onSelectChapter(ch.id)}
            />
          ))}
        </ul>
      </div>

      {/* 학습 후기 CTA */}
      <button
        type="button"
        className="bg-success-bg text-success hover:bg-success-bg/70 mt-1 flex items-center justify-between rounded-xl px-4 py-3.5 text-[14px] font-bold transition-colors"
      >
        <span>학습 후기 남기기</span>
        <span className="bg-success/15 flex size-7 items-center justify-center rounded-full">
          <ArrowUpRight className="size-4" />
        </span>
      </button>
    </aside>
  )
}

function ChapterNavRow({
  chapter,
  active,
  onSelect,
}: {
  chapter: OnlineChapterView
  active: boolean
  onSelect: () => void
}) {
  const { locked, completed } = chapter
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={active}
        aria-disabled={locked}
        title={locked ? `${chapter.no}주차에 열려요` : undefined}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors',
          locked
            ? 'cursor-not-allowed opacity-55'
            : active
              ? 'bg-brand/10'
              : 'hover:bg-surface-muted',
        )}
      >
        <span
          className={cn(
            'text-[11px] font-bold tabular-nums',
            active && !locked ? 'text-brand' : 'text-fg-subtle',
          )}
        >
          {String(chapter.no).padStart(2, '0')}
        </span>
        <span
          className={cn(
            'flex-1 text-[13px] font-semibold',
            locked ? 'text-fg-muted' : active ? 'text-brand' : 'text-fg',
          )}
        >
          {chapter.title}
        </span>
        <span className="shrink-0">
          {locked ? (
            <Lock className="text-fg-subtle size-3.5" />
          ) : active ? (
            <span className="bg-brand flex size-5 items-center justify-center rounded-full text-white">
              <Play className="size-2.5" fill="currentColor" />
            </span>
          ) : completed ? (
            <span className="bg-success/15 text-success flex size-5 items-center justify-center rounded-full">
              <Check className="size-3" strokeWidth={3} />
            </span>
          ) : (
            <span className="text-fg-subtle text-[11px] font-semibold tabular-nums">
              {chapter.durationLabel}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
