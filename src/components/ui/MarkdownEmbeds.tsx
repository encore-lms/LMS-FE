import { useEffect, useState } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { formatBytes, type EmbedMeta } from './embedMeta'
import { fetchEditorUpload, type UploadScope } from '@/shared/api'

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

const UPLOAD = 'upload:'

/**
 * 파일 — 이름 + 크기. 눌러서 내려받는다.
 *
 * <p>주소를 그대로 &lt;a download&gt; 에 걸면 401 이 난다 — 브라우저가 스스로 부르는 요청에는
 * 토큰이 붙지 않기 때문이다. 눌렀을 때 받아서 저장한다.</p>
 */
export function FileChip({
  href,
  scope,
  label,
  size,
}: {
  /** 본문에 담긴 참조(`upload:{id}`) 또는 평범한 주소. */
  href: string
  scope: UploadScope
  label: string
  size: number | null
}) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const upload = href.startsWith(UPLOAD) ? href.slice(UPLOAD.length) : null

  const download = async () => {
    if (!upload || busy) return
    setBusy(true)
    setFailed(false)
    try {
      saveBlob(await fetchEditorUpload(upload, scope), label)
    } catch {
      // 지워졌거나 권한이 없는 파일. 칩 안에서 알린다 — 본문 렌더러는 알림 상자 밖에서도 쓰인다.
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  const body = (
    <>
      {busy ? (
        <Loader2
          className="text-fg-muted size-4 shrink-0 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <FileUp className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
      )}
      <span className="text-fg truncate text-[13px] font-medium">{label}</span>
      {size && (
        <span className="text-fg-subtle shrink-0 text-[12px]">
          {formatBytes(size)}
        </span>
      )}
      {failed && (
        <span className="text-danger shrink-0 text-[12px]">
          내려받지 못했어요
        </span>
      )}
    </>
  )
  // 테두리 없이 한 줄을 다 쓴다 — 본문 안에 놓이는 블록이라 상자로 가두지 않고,
  // 가리키는 동안만 바탕이 들어와 누를 수 있는 자리임을 알린다.
  const chip =
    'hover:bg-surface-muted my-0.5 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left no-underline transition-colors'

  // 올린 파일이 아니면(밖에서 붙여 넣은 주소) 평범한 링크 그대로 둔다.
  if (!upload) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        download={label}
        className={chip}
      >
        {body}
      </a>
    )
  }
  return (
    <button
      type="button"
      onClick={() => void download()}
      aria-label={`${label} 내려받기`}
      className={chip}
    >
      {body}
    </button>
  )
}

/** 올린 이미지 — 토큰을 붙여 받아 온 뒤에야 그릴 수 있다. */
export function UploadImage({
  id,
  scope,
  alt,
}: {
  id: string
  scope: UploadScope
  alt: string
}) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let url: string | null = null
    let alive = true
    fetchEditorUpload(id, scope)
      .then((blob) => {
        if (!alive) return
        url = URL.createObjectURL(blob)
        setSrc(url)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
      // 화면에서 사라지면 브라우저가 들고 있던 사본을 놓아 준다.
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, scope])

  if (failed) {
    // 깨진 그림 자리 대신 무슨 파일이었는지 남긴다.
    return (
      <span className="text-fg-subtle inline-flex items-center gap-1.5 text-[13px]">
        <FileUp className="size-4 shrink-0" aria-hidden="true" />
        {alt || '이미지'} — 불러오지 못했어요
      </span>
    )
  }
  if (!src) {
    return (
      <span className="bg-surface-muted my-1 block h-40 w-full max-w-sm animate-pulse rounded-lg" />
    )
  }
  return <img src={src} alt={alt} />
}

/** 받아 온 파일을 원래 이름으로 저장한다. */
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
