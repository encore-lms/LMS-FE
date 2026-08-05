// 팀 상세 멘티 명단 섹션 — 명단 표시 + 멘티 추가·제외 트리거. TeamDetailBody에서 분리.
import { UserPlus, Users, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { AdminMentoringStudentOption } from './types'

export function MenteeRosterSection({
  members,
  onAdd,
  onRemove,
}: {
  members: AdminMentoringStudentOption[]
  onAdd: () => void
  /** 멘티 제외 — 마지막 1명은 팀이 빈 채로 남아 BE가 막는다. */
  onRemove?: (member: AdminMentoringStudentOption) => void
}) {
  return (
    <section className="border-border bg-surface h-fit rounded-xl border">
      <div className="border-border flex items-center justify-between gap-2 border-b px-5 py-3.5">
        <p className="text-fg inline-flex items-center gap-2 text-[15px] font-bold">
          <Users className="text-fg-muted h-4 w-4" />
          멘티 명단
          <span className="text-fg-subtle text-[12px] font-normal">
            {members.length}명
          </span>
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="border-border text-fg-muted hover:bg-surface-muted bg-surface inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-bold"
        >
          <UserPlus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>
      {members.length === 0 ? (
        <p className="text-fg-subtle px-5 py-8 text-center text-[13px]">
          등록된 멘티가 없어요
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {members.map((m) => (
            <li
              key={m.userId}
              className="flex items-center gap-2.5 px-5 py-2.5"
            >
              <Avatar name={m.name} size={26} />
              <span className="text-fg text-[13px] font-medium">{m.name}</span>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(m)}
                  disabled={members.length <= 1}
                  title={
                    members.length <= 1
                      ? '마지막 멘티는 뺄 수 없어요. 팀을 정리하려면 배정을 삭제하세요.'
                      : undefined
                  }
                  aria-label={`${m.name} 멘티 제외`}
                  className="text-fg-subtle hover:text-danger ml-auto rounded p-1 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-current"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
