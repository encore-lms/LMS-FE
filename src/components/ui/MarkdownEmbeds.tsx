import { FileUp } from 'lucide-react'
import { formatBytes, type EmbedMeta } from './embedMeta'

// 본문 안의 카드형 링크를 그린다. 표기 규칙은 embedMeta.ts 참고.

/** 웹 북마크 — 썸네일 + 제목·설명·주소. */
export function BookmarkCard({
  href,
  label,
  meta,
}: {
  href: string
  label: string
  meta: Extract<EmbedMeta, { kind: 'bookmark' }>
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // a 를 그대로 카드로 만든다 — 문단(<p>) 안에 블록 요소를 넣지 않기 위해서다.
      className="border-border hover:bg-surface-muted my-2 flex w-full overflow-hidden rounded-xl border no-underline transition-colors"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <span className="flex items-center gap-1.5">
          {meta.favicon && (
            <img
              src={meta.favicon}
              alt=""
              className="size-4 shrink-0 rounded-[3px]"
              // 파비콘이 없어진 사이트가 흔하다 — 깨진 그림 자리를 남기지 않는다.
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <span className="text-fg truncate text-[14px] font-bold">
            {label}
          </span>
        </span>
        {meta.description && (
          <span className="text-fg-muted line-clamp-2 text-[12px] leading-5">
            {meta.description}
          </span>
        )}
        <span className="text-fg-subtle mt-1 truncate text-[12px]">{href}</span>
      </span>
      {meta.image && (
        <span className="hidden w-40 shrink-0 sm:block">
          <img
            src={meta.image}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement!.style.display = 'none'
            }}
          />
        </span>
      )}
    </a>
  )
}

/** 파일 — 이름 + 크기. 눌러서 내려받는다. */
export function FileChip({
  href,
  label,
  size,
}: {
  href: string
  label: string
  size: number | null
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download={label}
      className="border-border hover:bg-surface-muted my-1 inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 no-underline"
    >
      <FileUp className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
      <span className="text-fg truncate text-[13px] font-medium">{label}</span>
      {size && (
        <span className="text-fg-subtle shrink-0 text-[12px]">
          {formatBytes(size)}
        </span>
      )}
    </a>
  )
}
