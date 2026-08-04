import { useEffect, useState, type ComponentPropsWithoutRef } from 'react'
import { FileUp, ImageOff, Loader2 } from 'lucide-react'
import { formatBytes, type EmbedMeta } from './embedMeta'
import { cachedUploadUrl, uploadObjectUrl } from './uploadCache'
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
      //
      // 높이를 못으로 박는다 — 안에 들어오는 건 남의 사이트 그림이라, 두지 않으면 세로로
      // 긴 이미지 하나가 카드를 화면만큼 늘려 버린다.
      className="border-border hover:bg-surface-muted my-2 flex h-[108px] w-full overflow-hidden rounded-xl border no-underline transition-colors"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3.5 py-3">
        <span className="flex items-center gap-1.5">
          {meta.favicon && (
            <img
              src={meta.favicon}
              alt=""
              // data-embed: 본문 이미지용 CSS(최대 360px 블록)에서 빼 달라는 표시.
              // 그 규칙이 카드 안까지 덮으면 파비콘이 원본 크기로 부풀어 카드를 무너뜨린다.
              data-embed=""
              className="size-4 shrink-0 rounded-[3px] object-contain"
              // 파비콘이 없어진 사이트가 흔하다 — 깨진 그림 자리를 남기지 않는다.
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <span className="text-fg truncate text-[14px] font-semibold">
            {label}
          </span>
        </span>
        {meta.description && (
          <span className="text-fg-muted line-clamp-2 text-[12px] leading-5">
            {meta.description}
          </span>
        )}
        <span className="text-fg-subtle mt-0.5 truncate text-[12px]">
          {href}
        </span>
      </span>
      {meta.image && (
        <span className="hidden h-full w-[180px] shrink-0 sm:block">
          <img
            src={meta.image}
            alt=""
            data-embed=""
            className="size-full object-cover"
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
  const [src, setSrc] = useState<string | null>(
    () => cachedUploadUrl(id, scope) ?? null,
  )
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (src) return
    let alive = true
    uploadObjectUrl(id, scope)
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [id, scope, src])

  if (failed) {
    return <BrokenImage alt={alt} reason="지워졌거나 볼 권한이 없어요" />
  }
  if (!src) {
    return (
      <span className="bg-surface-muted my-1 block h-40 w-full max-w-sm animate-pulse rounded-lg" />
    )
  }
  return <img src={src} alt={alt} />
}

/**
 * 본문에 그대로 걸린 그림(남의 서버 주소).
 *
 * <p>주소가 죽거나 핫링크가 막히면 브라우저는 아무 말 없이 빈 상자만 남긴다 — 테두리와
 * 둥근 모서리는 본문 이미지 규칙 그대로라, 쓰는 사람은 무엇이 있었는지도 모른다.</p>
 */
export function BodyImage({
  src,
  alt,
  ...rest
}: ComponentPropsWithoutRef<'img'>) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return <BrokenImage alt={alt ?? ''} reason="주소를 확인해 주세요" />
  }
  return (
    <img src={src} alt={alt ?? ''} onError={() => setFailed(true)} {...rest} />
  )
}

/** 못 그린 그림 자리 — 무엇이 있었고 왜 안 보이는지 남긴다. */
function BrokenImage({ alt, reason }: { alt: string; reason: string }) {
  return (
    <span className="border-border text-fg-subtle bg-surface-muted/50 my-2 flex items-center gap-2 rounded-lg border border-dashed px-3.5 py-3 text-[13px]">
      <ImageOff className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">
        {alt || '이미지'}를 불러오지 못했어요 — {reason}
      </span>
    </span>
  )
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
