import { useEffect, useRef } from 'react'
import { cn } from '@/shared/lib/cn'
import type { SlashCommand } from './slashCommands'

/**
 * 슬래시 명령 메뉴 — 본문에서 `/` 를 치면 뜨는 블록 고르기 목록.
 *
 * <p>고르는 것만 담당한다. 언제 열고 무엇을 넣을지는 에디터가 정한다 — 그래야 다른 입력창에도
 * 같은 메뉴를 붙일 수 있다.</p>
 */
export function SlashCommandMenu({
  commands,
  activeIdx,
  onPick,
  onHover,
  onClose,
}: {
  commands: SlashCommand[]
  activeIdx: number
  onPick: (command: SlashCommand) => void
  onHover: (idx: number) => void
  onClose: () => void
}) {
  const listRef = useRef<HTMLUListElement>(null)

  // 키보드로 목록을 내려가면 화면 밖으로 나간 항목을 따라 스크롤한다.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-idx="${activeIdx}"]`,
    )
    // jsdom 에는 이 API 가 없다 — 목록을 따라 스크롤하는 건 보기 편하자고 하는 일이라,
    // 없으면 조용히 건너뛴다.
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIdx])

  if (commands.length === 0) return null

  return (
    <div className="border-border absolute bottom-3 left-3 z-30 w-72 overflow-hidden rounded-xl border bg-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.18)]">
      <span className="text-fg-subtle block px-3 pt-3 pb-1.5 text-[11px] font-semibold">
        기본 블록
      </span>
      <ul
        ref={listRef}
        role="listbox"
        aria-label="블록 고르기"
        className="max-h-64 overflow-y-auto pb-1"
      >
        {commands.map((c, idx) => (
          <li key={c.key} role="option" aria-selected={idx === activeIdx}>
            <button
              type="button"
              data-idx={idx}
              // mousedown 에서 처리한다 — click 을 기다리면 그 전에 textarea 가 blur 돼 메뉴가 닫힌다.
              onMouseDown={(e) => {
                e.preventDefault()
                onPick(c)
              }}
              onMouseEnter={() => onHover(idx)}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left',
                idx === activeIdx && 'bg-surface-muted',
              )}
            >
              <c.icon
                className="text-fg-muted size-4 shrink-0"
                aria-hidden="true"
              />
              <span className="text-fg flex-1 truncate text-[13px]">
                {c.label}
              </span>
              {c.hint && (
                <span className="text-fg-subtle shrink-0 text-[11px]">
                  {c.hint}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="border-border flex items-center justify-between border-t px-3 py-2">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onClose()
          }}
          className="text-fg-muted hover:text-fg text-[12px] font-semibold"
        >
          메뉴 닫기
        </button>
        <span className="text-fg-subtle text-[11px]">esc</span>
      </div>
    </div>
  )
}
