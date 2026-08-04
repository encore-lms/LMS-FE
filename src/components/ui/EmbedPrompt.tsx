import { useEffect, useRef, useState } from 'react'
import { Bookmark, FileUp, Image as ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from './buttonClass'
import { inputClass } from './inputClass'

export type EmbedKind = 'image' | 'file' | 'bookmark'

export interface EmbedResult {
  kind: EmbedKind
  /** 업로드한 파일(이미지·파일) */
  file?: File
  /** 붙여 넣은 주소(북마크·이미지 링크) */
  url?: string
}

const META: Record<
  EmbedKind,
  { icon: typeof ImageIcon; label: string; tabs: ('upload' | 'link')[] }
> = {
  // 이미지는 올리기만 — 남의 서버 주소를 걸면 그 주소가 죽는 순간 본문이 비고,
  // 쓰는 사람은 왜 사라졌는지 알 수 없다.
  image: { icon: ImageIcon, label: '이미지 업로드', tabs: ['upload'] },
  file: {
    icon: FileUp,
    label: '파일 업로드 또는 임베드',
    tabs: ['upload', 'link'],
  },
  bookmark: { icon: Bookmark, label: '웹 북마크 추가', tabs: ['link'] },
}

/**
 * 본문에 넣을 값을 그 자리에서 받는 상자.
 *
 * <p>이미지·파일·북마크는 고르는 것만으로 끝나지 않는다 — 파일을 올리거나 주소를 받아야 한다.
 * 폼 아래에 따로 칸을 두지 않고 본문 흐름 안에서 받는다.</p>
 *
 * <p>두 단계로 나눈다. 블록을 고르면 먼저 자리만 잡아 두고(한 줄짜리 회색 띠), 그 줄을 눌러야
 * 고르는 칸이 펼쳐진다 — 처음부터 큰 상자가 열리면 쓰던 글이 밀려 흐름이 끊긴다.</p>
 */
export function EmbedPrompt({
  kind,
  busy,
  onSubmit,
  onCancel,
}: {
  kind: EmbedKind
  /** 올리는 중 — 두 번 눌러 같은 파일이 두 번 올라가지 않게 잠근다. */
  busy?: boolean
  onSubmit: (result: EmbedResult) => void
  onCancel: () => void
}) {
  const meta = META[kind]
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'upload' | 'link'>(meta.tabs[0])
  const [url, setUrl] = useState('')
  const filePicker = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)

  // 펼치면 첫 칸으로 초점을 옮긴다 — 마우스를 다시 가져가지 않아도 이어서 할 수 있다.
  useEffect(() => {
    if (!open) return
    box.current
      ?.querySelector<HTMLElement>('input:not([type="file"]), button')
      ?.focus()
  }, [open, tab])

  const submitUrl = () => {
    const v = url.trim()
    if (!v) return
    onSubmit({ kind, url: v })
  }

  const 머리 = (
    <span className="text-fg-subtle flex items-center gap-2 text-[13px]">
      <meta.icon className="size-[18px] shrink-0" aria-hidden="true" />
      {meta.label}
    </span>
  )

  const 파일칸 = (
    <input
      ref={filePicker}
      type="file"
      accept={kind === 'image' ? 'image/*' : undefined}
      className="hidden"
      aria-label={kind === 'image' ? '이미지 파일 선택' : '첨부 파일 선택'}
      onChange={(e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (f) onSubmit({ kind, file: f })
      }}
    />
  )

  // 올릴 길밖에 없는 블록은 한 단계를 건너뛴다 — 눌러 놓고 또 '파일을 선택하세요'를
  // 누르게 하면 같은 말을 두 번 시키는 셈이다.
  const 곧바로열기 = meta.tabs.length === 1 && meta.tabs[0] === 'upload'

  // 아직 자리만 잡은 상태 — 한 줄짜리 회색 띠로 눕혀 둔다.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // 파일 창은 누른 그 순간에 열어야 브라우저가 막지 않는다(state 를 거치면 늦다).
          if (곧바로열기) filePicker.current?.click()
          else setOpen(true)
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') onCancel()
        }}
        className="bg-surface-muted hover:bg-surface-muted/70 my-1 flex w-full items-center rounded-lg px-3 py-3 text-left transition-colors"
      >
        {머리}
        {파일칸}
      </button>
    )
  }

  return (
    <div
      ref={box}
      className="border-border bg-surface my-1 flex max-w-[440px] flex-col gap-2 rounded-lg border p-2.5"
      // 편집기 키 처리(슬래시 메뉴 등)가 이 안의 입력까지 가로채지 않게 한다.
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') onCancel()
      }}
    >
      {머리}

      {meta.tabs.length > 1 && (
        <div className="border-divider flex items-center gap-1 border-b">
          {meta.tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px border-b-2 px-2 pb-1 text-[12px] font-semibold',
                tab === t
                  ? 'border-brand text-fg'
                  : 'text-fg-subtle hover:text-fg border-transparent',
              )}
            >
              {t === 'upload' ? '업로드' : '링크'}
            </button>
          ))}
        </div>
      )}

      {tab === 'upload' ? (
        <>
          <input
            ref={filePicker}
            type="file"
            accept={kind === 'image' ? 'image/*' : undefined}
            className="hidden"
            aria-label={
              kind === 'image' ? '이미지 파일 선택' : '첨부 파일 선택'
            }
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onSubmit({ kind, file: f })
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => filePicker.current?.click()}
            className={buttonClass({
              variant: 'secondary',
              size: 'sm',
              className: 'w-full justify-center',
            })}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                올리는 중…
              </>
            ) : (
              '파일을 선택하세요'
            )}
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitUrl()
              }
            }}
            placeholder="URL을 붙여넣으세요(https://...)"
            aria-label={kind === 'bookmark' ? '북마크 주소' : '링크 주소'}
            className={inputClass({ size: 'sm' })}
          />
          <button
            type="button"
            disabled={busy || !url.trim()}
            onClick={submitUrl}
            className={buttonClass({
              variant: 'secondary',
              size: 'sm',
              className: 'w-full justify-center',
            })}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                불러오는 중…
              </>
            ) : kind === 'bookmark' ? (
              '북마크 생성'
            ) : (
              '넣기'
            )}
          </button>
          {kind === 'bookmark' && (
            <span className="text-fg-subtle text-center text-[12px]">
              링크로 시각적 북마크 생성
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="text-fg-subtle hover:text-fg self-start text-[12px] font-medium"
      >
        취소
      </button>
    </div>
  )
}
