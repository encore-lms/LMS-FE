/**
 * 본문 안 카드형 링크의 표기 규칙 — 웹 북마크와 파일.
 *
 * <p>본문은 마크다운으로 저장한다(읽는 쪽·목록 요약·이미 쌓인 글이 전부 마크다운을 전제한다).
 * 마크다운에는 카드 문법이 없으므로 <b>링크의 title 자리</b>에 메타를 담아 표현을 넓혔다.
 * 마크다운을 모르는 도구가 읽어도 그냥 링크로 보인다는 점이 이 방식의 장점이다.</p>
 *
 * <pre>
 * 북마크: [제목](https://url "bookmark::설명::썸네일::파비콘")
 * 파일:   [파일명](upload:id "file::12345")   // 12345 = 바이트
 * </pre>
 */

const SEP = '::'

export type EmbedMeta =
  | {
      kind: 'bookmark'
      description: string | null
      image: string | null
      favicon: string | null
    }
  | { kind: 'file'; size: number | null }

/** 링크 title 을 카드 메타로 읽는다. 규칙에 맞지 않으면 null(평범한 링크). */
export function parseEmbedTitle(
  title: string | null | undefined,
): EmbedMeta | null {
  if (!title) return null
  const [kind, ...rest] = title.split(SEP)
  if (kind === 'bookmark') {
    const [description, image, favicon] = rest
    return {
      kind: 'bookmark',
      description: description || null,
      image: image || null,
      favicon: favicon || null,
    }
  }
  if (kind === 'file') {
    const size = Number(rest[0])
    return {
      kind: 'file',
      size: Number.isFinite(size) && size > 0 ? size : null,
    }
  }
  return null
}

/** 카드 메타를 마크다운 title 문자열로 만든다(에디터가 쓴다). */
export function bookmarkTitle(meta: {
  description?: string | null
  image?: string | null
  favicon?: string | null
}): string {
  // 구분자가 값에 섞이면 뒤 칸이 밀리므로 지운다.
  const clean = (v: string | null | undefined) =>
    (v ?? '').split(SEP).join(' ').replace(/[\n"]/g, ' ').trim()
  return [
    'bookmark',
    clean(meta.description),
    clean(meta.image),
    clean(meta.favicon),
  ].join(SEP)
}

export function fileTitle(size: number | null | undefined): string {
  return `file${SEP}${size ?? ''}`
}

export function formatBytes(n: number | null): string {
  if (!n || n <= 0) return ''
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`
  return `${(n / 1024 / 1024).toFixed(1)}MB`
}
