import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { TableKit } from '@tiptap/extension-table'
import { Markdown } from 'tiptap-markdown'

// tiptap-markdown 은 storage 타입을 넓혀 주지 않아 여기서 좁혀 쓴다.
type MarkdownStorage = { markdown: { getMarkdown: () => string } }
import { cn } from '@/shared/lib/cn'
import { EmbedPrompt, type EmbedKind, type EmbedResult } from './EmbedPrompt'
import { bookmarkTitle, fileTitle } from './embedMeta'
import { SlashCommandMenu } from './SlashCommandMenu'
import { TableToolbar } from './TableToolbar'
import { fetchLinkPreview, uploadEditorFile } from '@/shared/api'
import { filterSlashCommands, type SlashCommand } from './slashCommands'

/** 서버가 돌려준 사유. 없으면 null. */
function serverMessage(err: unknown): string | null {
  const msg = (
    err as { response?: { data?: { message?: string } } } | undefined
  )?.response?.data?.message
  return typeof msg === 'string' && msg.trim() ? msg : null
}

/** 서버가 말이 없을 때(연결 끊김 등) 대신 쓰는 문구. */
function fallbackMessage(kind: EmbedKind): string {
  if (kind === 'bookmark') return '링크를 불러오지 못했어요'
  return kind === 'image'
    ? '이미지를 올리지 못했어요'
    : '파일을 올리지 못했어요'
}

/**
 * 글 쓰는 대로 보이는 편집기.
 *
 * <p>예전에는 마크다운을 글자 그대로 치는 칸이라 `### 안내` 처럼 기호가 본문에 남았고, 결과를
 * 보려면 미리보기 탭으로 넘어가야 했다. 여기서는 제목을 고르면 그 자리에서 제목이 된다.</p>
 *
 * <p>저장은 그대로 마크다운이다 — 읽는 쪽({@link Markdown})과 목록 요약, 이미 쌓인 글이
 * 전부 마크다운을 전제하고 있어 형식을 바꾸면 과거 글이 깨진다.</p>
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
  ariaLabel,
  className,
  onError,
}: {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  minHeight?: number
  ariaLabel?: string
  className?: string
  /** 업로드·미리보기 실패를 사람이 읽는 말로 알린다. */
  onError?: (message: string) => void
}) {
  // 슬래시 메뉴 — 열려 있으면 검색어(빈 문자열 포함), 닫혀 있으면 null.
  const [slashQuery, setSlashQuery] = useState<string | null>(null)
  const [slashIdx, setSlashIdx] = useState(0)
  // 내가 올려보낸 값이 부모를 돌아 다시 내려올 때 편집 중인 문서를 덮어쓰지 않도록 기억해 둔다.
  const lastEmitted = useRef(value)
  // 닫은 검색어를 기억한다 — 닫자마자 keyup 이 같은 `/` 를 보고 다시 열어 버리기 때문이다.
  const dismissed = useRef<string | null>(null)
  // onUpdate 는 editor 를 만들 때 고정되므로, 그 안에서 최신 동기화 함수를 꺼내 쓴다.
  const syncSlashRef = useRef<((ed: Editor) => void) | null>(null)
  // 커서가 표 안에 있는지 — 표 조작 막대를 그때만 띄운다.
  const [inTable, setInTable] = useState(false)
  // 값을 더 받아야 하는 블록(이미지·파일·북마크)을 고른 상태.
  const [prompt, setPrompt] = useState<EmbedKind | null>(null)
  const [busy, setBusy] = useState(false)
  // 편집기에 보여 준 미리보기(blob:) → 저장할 참조(upload:id).
  const previews = useRef(new Map<string, string>())

  // 화면을 떠날 때 브라우저가 들고 있던 사본을 놓아 준다.
  useEffect(() => {
    const held = previews.current
    return () => {
      for (const url of held.keys()) URL.revokeObjectURL(url)
      held.clear()
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      // upload 를 허용하지 않으면 파일 칩의 주소를 지워 버려(href="") 저장한 글에서
      // 받을 길이 사라진다.
      Link.configure({ openOnClick: false, protocols: ['upload'] }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      Markdown.configure({ transformPastedText: true }),
    ],
    content: value,
    editorProps: {
      attributes: {
        'aria-label': ariaLabel ?? '',
        role: 'textbox',
        'aria-multiline': 'true',
        class: 'markdown-body focus:outline-none',
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      let md = (
        editor.storage as unknown as MarkdownStorage
      ).markdown.getMarkdown()
      // 보여 주기용 미리보기 주소는 이 브라우저에서만 통한다 — 저장 전에 참조로 되돌린다.
      for (const [preview, ref] of previews.current) {
        md = md.split(preview).join(ref)
      }
      lastEmitted.current = md
      onChange(md)
      // 키 이벤트만 보면 한글 조합·붙여넣기로 들어온 글자를 놓쳐 검색어가 갱신되지 않는다.
      syncSlashRef.current?.(editor)
    },
  })

  // 커서가 표 안팎을 오갈 때만 막대를 여닫는다.
  useEffect(() => {
    if (!editor) return
    const sync = () => setInTable(editor.isActive('table'))
    editor.on('selectionUpdate', sync)
    editor.on('transaction', sync)
    return () => {
      editor.off('selectionUpdate', sync)
      editor.off('transaction', sync)
    }
  }, [editor])

  // 밖에서 값을 갈아끼운 경우(폼 초기화 등)만 문서를 다시 세운다.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return
    lastEmitted.current = value
    editor.commands.setContent(value)
  }, [editor, value])

  /**
   * 커서 앞의 `/검색어` 를 찾는다 — 빈 문단에서만 연다.
   *
   * <p>검색어에 공백을 허용한다 — 메뉴에 보이는 이름을 그대로 치는 사람이 많은데
   * (`/할 일`, `/코드 블록`) 공백에서 끊으면 메뉴가 사라져 아무것도 고를 수 없었다.
   * 걸리는 게 없으면 메뉴가 알아서 닫히므로, 길이만 막아 문장을 계속 훑지 않게 한다.</p>
   */
  const readSlashToken = (ed: Editor) => {
    const { $from } = ed.state.selection
    const before = $from.parent.textBetween(0, $from.parentOffset, '\n', '\n')
    const m = /^\/(.{0,20})$/.exec(before)
    return m ? { length: before.length, query: m[1] } : null
  }

  const syncSlash = (ed: Editor) => {
    const token = readSlashToken(ed)
    if (!token) {
      dismissed.current = null
      setSlashQuery(null)
      return
    }
    // 닫아 둔 그대로면 열지 않는다. 이어서 더 치면(검색어가 달라지면) 다시 연다.
    if (dismissed.current === token.query) return
    dismissed.current = null
    setSlashQuery(token.query)
  }

  syncSlashRef.current = syncSlash

  const closeSlash = () => {
    dismissed.current = slashQuery
    setSlashQuery(null)
  }

  const applySlash = (command: SlashCommand) => {
    if (!editor) return
    const token = readSlashToken(editor)
    if (!token) return
    const to = editor.state.selection.from
    // 친 `/검색어` 는 어느 쪽이든 지운다 — 남으면 본문에 `/이미` 같은 찌꺼기가 된다.
    editor
      .chain()
      .focus()
      .deleteRange({ from: to - token.length, to })
      .run()
    dismissed.current = null
    setSlashQuery(null)
    if (command.prompt) {
      setPrompt(command.prompt)
      return
    }
    command.apply?.(editor.chain().focus()).run()
  }

  /** 고른 값을 본문에 넣는다 — 업로드·미리보기는 여기서 한 번에 끝낸다. */
  const insertEmbed = async (result: EmbedResult) => {
    if (!editor) return
    setBusy(true)
    try {
      if (result.kind === 'bookmark') {
        const meta = await fetchLinkPreview(result.url!)
        // 제목을 못 읽어 온 사이트도 있다 — 주소라도 보이게 한다.
        const label = meta.title ?? meta.siteName ?? result.url!
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: label,
                marks: [
                  {
                    type: 'link',
                    attrs: { href: meta.url, title: bookmarkTitle(meta) },
                  },
                ],
              },
            ],
          })
          .run()
      } else if (result.url) {
        // 링크로 넣는 이미지 — 남의 서버 주소를 그대로 쓴다.
        editor.chain().focus().setImage({ src: result.url }).run()
      } else if (result.file) {
        const up = await uploadEditorFile(result.file)
        // 그림으로 펼칠지 이름표로 접을지는 고른 블록이 정한다 — 서버가 본 파일 종류가
        // 아니라. 스크린샷을 '파일'로 올렸다면 그림이 아니라 받을 거리로 쓰겠다는 뜻이다.
        if (result.kind === 'image') {
          // 편집기에서는 방금 고른 파일을 그대로 보여 준다 — `upload:` 는 브라우저가 모르는
          // 주소라 그 자리에 깨진 그림이 남는다. 저장할 때 참조로 되돌린다.
          const preview = URL.createObjectURL(result.file)
          previews.current.set(preview, up.url)
          editor
            .chain()
            .focus()
            .setImage({ src: preview, alt: up.fileName })
            .run()
        } else {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: up.fileName,
                  marks: [
                    {
                      type: 'link',
                      attrs: { href: up.url, title: fileTitle(up.fileSize) },
                    },
                  ],
                },
              ],
            })
            .run()
        }
      }
      setPrompt(null)
    } catch (err) {
      // 서버가 이유를 말해 준다(용량 한도·내부 주소 차단 등) — 일반 문구로 덮으면
      // 왜 안 되는지 알 수 없어 같은 파일을 계속 다시 올리게 된다.
      onError?.(serverMessage(err) ?? fallbackMessage(result.kind))
    } finally {
      setBusy(false)
    }
  }

  const matches = slashQuery != null ? filterSlashCommands(slashQuery) : []

  useEffect(() => {
    setSlashIdx(0)
  }, [slashQuery])

  if (!editor) return null

  return (
    <div
      className={cn(
        'border-border focus-within:border-brand relative rounded-[10px] border px-4 py-3',
        className,
      )}
      // 캡처 단계에서 먼저 가로챈다 — 버블을 기다리면 ProseMirror 가 Enter·화살표를
      // 이미 처리해(문단이 새로 생겨) 고르려던 블록이 사라진다.
      onKeyDownCapture={(e) => {
        // 자리만 잡아 둔 블록은 Esc 로 물린다 — 고르고 나면 초점이 본문으로 돌아가 있어
        // 그 줄을 다시 눌러 초점을 옮기지 않고도 지울 수 있어야 한다.
        if (prompt && e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          setPrompt(null)
          return
        }
        if (matches.length === 0) return
        const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape']
        if (!handled.includes(e.key)) return
        e.preventDefault()
        e.stopPropagation()
        if (e.key === 'ArrowDown') {
          setSlashIdx((i) => (i + 1) % matches.length)
        } else if (e.key === 'ArrowUp') {
          setSlashIdx((i) => (i - 1 + matches.length) % matches.length)
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          applySlash(matches[Math.min(slashIdx, matches.length - 1)])
        } else {
          closeSlash()
        }
      }}
    >
      {inTable && <TableToolbar editor={editor} />}
      {prompt && (
        <EmbedPrompt
          kind={prompt}
          busy={busy}
          onSubmit={(r) => void insertEmbed(r)}
          onCancel={() => setPrompt(null)}
        />
      )}
      <EditorContent
        editor={editor}
        onKeyUp={() => syncSlash(editor)}
        onClick={() => syncSlash(editor)}
      />
      {matches.length > 0 && (
        <SlashCommandMenu
          commands={matches}
          activeIdx={Math.min(slashIdx, matches.length - 1)}
          onPick={applySlash}
          onHover={setSlashIdx}
          onClose={closeSlash}
        />
      )}
    </div>
  )
}
