import { cn } from '@/shared/lib/cn'

// 입력값을 정답 텍스트와 글자 단위로 비교해 색으로 보여준다 — 타자/코딩 게임 공용.
//  맞게 친 글자=초록, 틀리게 친 글자=빨강 배경, 아직 안 친 글자=회색, 다음 칠 위치=brand 밑줄.
interface CharCompareProps {
  target: string
  input: string
  mono?: boolean // 코드 스니펫은 monospace + 들여쓰기/줄바꿈 보존
}

export function CharCompare({ target, input, mono }: CharCompareProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'bg-surface-muted/50 text-fg rounded-xl p-4',
        mono
          ? 'overflow-x-auto font-mono text-[13px] leading-[20px] whitespace-pre'
          : 'text-[14px] leading-7 break-words whitespace-pre-wrap',
      )}
    >
      {[...target].map((ch, i) => {
        const typed = i < input.length
        const correct = typed && input[i] === ch
        const wrong = typed && input[i] !== ch
        const atCursor = i === input.length
        return (
          <span
            key={i}
            className={cn(
              correct && 'text-success',
              // 틀린 글자: 빨강 + 빨간 밑줄로 어디가 틀렸는지 표시.
              wrong &&
                'bg-danger-bg text-danger decoration-danger rounded-[2px] underline decoration-2 underline-offset-2',
              !typed && 'text-fg-subtle',
              atCursor && 'border-brand border-b-2',
            )}
          >
            {ch}
          </span>
        )
      })}
      {input.length > target.length && (
        <span className="bg-danger-bg text-danger ml-1 rounded-[2px] px-1 text-[11px] font-bold">
          초과 입력 {input.length - target.length}자
        </span>
      )}
    </div>
  )
}
