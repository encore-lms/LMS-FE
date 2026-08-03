import { type ComponentPropsWithoutRef, useMemo } from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import 'highlight.js/styles/github.css'
import { getImage } from './markdownImages'
import { BookmarkCard, FileChip, UploadImage } from './MarkdownEmbeds'
import { parseEmbedTitle } from './embedMeta'
import type { UploadScope } from '@/shared/api'

// react-markdown 기본 urlTransform 은 data: URL 을 제거한다(보안 기본값).
// 추가 허용: (1) 에디터가 붙인 `attachment:id` → 세션 저장소의 base64 로 해석,
//           (2) base64 인라인 이미지(data:image/*),
//           (3) 본문 업로드 참조 `upload:id` → 그대로 통과.
// 그 외는 기본 정책 유지.
//
// `upload:id` 를 여기서 실제 경로로 바꾸지 않는다 — 그 경로는 로그인을 요구하는데
// 브라우저가 스스로 부르는 요청(img src·a download)에는 토큰이 붙지 않아 401 이 된다.
// 참조를 그대로 넘겨 두고, 아래 컴포넌트가 토큰을 붙여 받아 온다.
function makeUrlTransform() {
  return (url: string): string => {
    if (url.startsWith('attachment:')) {
      const resolved = getImage(url.slice('attachment:'.length))
      return resolved && resolved.startsWith('data:image/') ? resolved : ''
    }
    if (url.startsWith('upload:')) return url
    if (url.startsWith('data:image/')) return url
    return defaultUrlTransform(url)
  }
}

/**
 * 본문에 박힌 업로드를 어느 경로로 받을지 — 읽는 사람의 역할.
 *
 * <p>본문에는 접두사 없는 `upload:{id}` 만 담긴다 — 같은 글을 수강생과 강사가 함께 보는데
 * BE 가 경로 앞머리로 역할을 가르기 때문이다(한쪽 경로를 박으면 다른 역할은 403).</p>
 */
export type { UploadScope }

const UPLOAD = 'upload:'

// sanitize 스키마 확장 — raw HTML은 비허용 유지. 추가로 허용하는 것:
//  · 코드 하이라이트(hljs-*) className (code·span·pre)
//  · base64 인라인 이미지(img src 의 data: 프로토콜)
//  · 멘션 링크가 쓰는 fragment href(#mention)와 className
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    pre: [...(defaultSchema.attributes?.pre ?? []), 'className'],
    // title 은 카드형 링크(북마크·파일)의 메타를 담는 자리라 지워지면 안 된다.
    a: [...(defaultSchema.attributes?.a ?? []), 'className', 'title'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title'],
  },
  protocols: {
    ...defaultSchema.protocols,
    // src 허용 프로토콜 확장: base64 이미지(data) + 에디터 첨부 참조(attachment·upload).
    // 둘 다 urlTransform 이 실제 주소로 바꾸기 전에 sanitize 가 지우지 않도록 필요하다.
    // script: 등 위험 프로토콜은 계속 차단된다.
    src: [
      ...(defaultSchema.protocols?.src ?? []),
      'data',
      'attachment',
      'upload',
    ],
    // 파일 카드는 링크라 href 에도 같은 참조가 온다.
    href: [...(defaultSchema.protocols?.href ?? []), 'upload'],
  },
}

// 멘션 이름을 fragment 링크로 치환 → components.a 가 강조 span 으로 렌더(raw HTML 회피).
function linkifyMentions(text: string, mentions?: string[]): string {
  if (!mentions || mentions.length === 0) return text
  let out = text
  // 긴 이름 먼저 치환(부분 매칭 방지).
  for (const name of [...mentions].sort((a, b) => b.length - a.length)) {
    const safe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    out = out.replace(
      new RegExp(`@${safe}`, 'g'),
      `[@${name}](#mention-${encodeURIComponent(name)})`,
    )
  }
  return out
}

interface MarkdownProps {
  children: string
  /** 강조할 멘션 이름들(없으면 멘션 처리 안 함) */
  mentions?: string[]
  /** 본문에 박힌 업로드를 어느 경로로 받을지 — 읽는 사람의 역할. */
  uploadScope?: UploadScope
  className?: string
}

// QnA 질문·답변·댓글 본문 공용 렌더러. 마크다운 + GFM + 코드 하이라이트 + sanitize.
export function Markdown({
  children,
  mentions,
  uploadScope = 'student',
  className,
}: MarkdownProps) {
  const source = useMemo(
    () => linkifyMentions(children, mentions),
    [children, mentions],
  )
  return (
    <div className={`markdown-body ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, [rehypeSanitize, schema]]}
        urlTransform={makeUrlTransform()}
        components={{
          // 올린 이미지는 토큰이 필요해 src 에 주소를 그대로 걸 수 없다.
          img({ src, alt, ...rest }: ComponentPropsWithoutRef<'img'>) {
            if (typeof src === 'string' && src.startsWith(UPLOAD)) {
              return (
                <UploadImage
                  id={src.slice(UPLOAD.length)}
                  scope={uploadScope}
                  alt={alt ?? ''}
                />
              )
            }
            return <img src={src} alt={alt ?? ''} {...rest} />
          },
          a({ href, children, title, ...rest }: ComponentPropsWithoutRef<'a'>) {
            if (typeof href === 'string' && href.startsWith('#mention-')) {
              return <span className="qna-mention">{children}</span>
            }
            // 카드로 그릴 링크인지 title 로 가린다 — 마크다운을 유지한 채 표현을 넓히는 방법이다.
            const embed = parseEmbedTitle(title)
            if (embed?.kind === 'bookmark' && href) {
              return (
                <BookmarkCard
                  href={href}
                  label={String(children)}
                  meta={embed}
                />
              )
            }
            if (embed?.kind === 'file' && href) {
              return (
                <FileChip
                  href={href}
                  scope={uploadScope}
                  label={String(children)}
                  size={embed.size}
                />
              )
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...rest}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
