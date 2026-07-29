import { Fragment } from 'react'
import { cn } from '@/shared/lib/cn'
import type { MentoringMentor, MentoringTeamMemberInfo } from '../types'

// 함께 멘토링 받는 팀원 패널(사이드) — 같은 팀 수강생을 본인 표시와 함께 나열.
// 아웃라인 없는 flat: 담당 멘토 요약 + 구분선 리스트. teamMembers 는 BE(MentoringResponse.Member).
export function CoMenteesPanel({
  teamName,
  mentor,
  members,
}: {
  teamName: string
  mentor: MentoringMentor
  members: MentoringTeamMemberInfo[]
}) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-fg text-[15px] font-bold">함께 멘토링 받는 팀원</h2>
        {members.length > 0 && (
          <span className="text-fg-subtle text-[12px]">{members.length}명</span>
        )}
      </div>

      {/* 담당 멘토 요약 */}
      <div className="flex items-center gap-2.5">
        <span className="bg-brand/10 text-brand flex size-9 items-center justify-center rounded-full text-[13px] font-bold">
          {mentor.assigned && mentor.name ? mentor.name.slice(0, 1) : '·'}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-fg-subtle text-[11px]">담당 멘토</span>
          <span className="text-fg truncate text-[13px] font-bold">
            {mentor.assigned && mentor.name ? mentor.name : '배정 대기'}
          </span>
        </div>
      </div>

      {teamName && (
        <div className="text-fg-muted flex items-center gap-1.5 text-[12px]">
          <span className="text-fg-subtle">팀</span>
          <span className="font-semibold">{teamName}</span>
        </div>
      )}

      {/* 팀원 구분선 리스트 */}
      {members.length === 0 ? (
        <p className="text-fg-subtle py-6 text-center text-[12px] leading-5">
          같은 팀으로 배정된 다른 수강생이 아직 없어요.
        </p>
      ) : (
        <div className="flex flex-col">
          {members.map((m, i) => (
            <Fragment key={`${m.name}-${i}`}>
              {i > 0 && <div className="bg-divider h-px w-full" />}
              <div className="flex items-center gap-2.5 py-2.5">
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold',
                    m.isMe
                      ? 'bg-brand text-on-color'
                      : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {m.name.slice(0, 1)}
                </span>
                <span className="text-fg truncate text-[13px] font-semibold">
                  {m.name}
                </span>
                {m.isMe && (
                  <span className="bg-brand/10 text-brand ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold">
                    나
                  </span>
                )}
              </div>
            </Fragment>
          ))}
        </div>
      )}
    </section>
  )
}
