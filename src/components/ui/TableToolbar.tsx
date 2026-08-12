import type { Editor } from '@tiptap/react'
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns3,
  Rows3,
  Trash2,
} from 'lucide-react'

/**
 * 표 조작 막대 — 커서가 표 안에 있을 때만 뜬다.
 *
 * <p>표를 넣고 나면 행·열을 더하거나 지울 방법이 없어 지우지도 못하고 남았다.
 * 열 너비는 경계선을 끌어 조절한다(ProseMirror 기본 동작).</p>
 */
export function TableToolbar({ editor }: { editor: Editor }) {
  const btn =
    'text-fg-muted hover:text-fg hover:bg-surface-muted flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-medium'

  const actions = [
    {
      label: '왼쪽에 열',
      icon: ArrowLeftToLine,
      run: () => editor.chain().focus().addColumnBefore().run(),
    },
    {
      label: '오른쪽에 열',
      icon: ArrowRightToLine,
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      label: '열 삭제',
      icon: Columns3,
      run: () => editor.chain().focus().deleteColumn().run(),
    },
    {
      label: '위에 행',
      icon: ArrowUpToLine,
      run: () => editor.chain().focus().addRowBefore().run(),
    },
    {
      label: '아래에 행',
      icon: ArrowDownToLine,
      run: () => editor.chain().focus().addRowAfter().run(),
    },
    {
      label: '행 삭제',
      icon: Rows3,
      run: () => editor.chain().focus().deleteRow().run(),
    },
  ]

  return (
    <div
      role="toolbar"
      aria-label="표 편집"
      className="border-border bg-surface mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border p-1"
    >
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          // mousedown 을 막아야 표 안의 커서가 유지된다 — 커서가 빠지면 어느 행·열인지 알 수 없다.
          onMouseDown={(e) => e.preventDefault()}
          onClick={a.run}
          title={a.label}
          className={btn}
        >
          <a.icon className="size-3.5" aria-hidden="true" />
          {a.label}
        </button>
      ))}
      <span className="bg-divider mx-1 h-4 w-px" />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="표 삭제"
        className="text-danger hover:bg-danger-bg flex h-7 items-center gap-1 rounded-md px-2 text-[12px] font-semibold"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />표 삭제
      </button>
    </div>
  )
}
