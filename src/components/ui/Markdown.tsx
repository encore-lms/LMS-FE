import { type ComponentPropsWithoutRef, useMemo } from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import 'highlight.js/styles/github.css'
import { getImage } from './markdownImages'

// react-markdown 기본 urlTransform 은 data: URL 을 제거한다(보안 기본값).
// 추가 허용: (1) 에디터가 붙인 `attachment:id` → 세션 저장소의 base64 로 해석,
//           (2) base64 인라인 이미지(data:image/*). 그 외는 기본 정책 유지.
function urlTransform(url: string): string {
  if (url.startsWith('attachment:')) {
    const resolved = getImage(url.slice('attachment:'.length))
    return resolved && resolved.startsWith('data:image/') ? resolved : ''
  }
  if (url.startsWith('data:image/')) return url
  return defaultUrlTransform(url)
}

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
    a: [...(defaultSchema.attributes?.a ?? []), 'className'],
    img: [...(defaultSchema.attributes?.img ?? []), 'src', 'alt', 'title'],
  },
  protocols: {
    ...defaultSchema.protocols,
    // src 허용 프로토콜 확장: base64 이미지(data) + 에디터 첨부 참조(attachment).
    // attachment 는 urlTransform 이 dataURL 로 해석하기 전에 sanitize 가 지우지 않도록 필요.
    // script: 등 위험 프로토콜은 계속 차단된다.
    src: [...(defaultSchema.protocols?.src ?? []), 'data', 'attachment'],
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
  className?: string
}

// QnA 질문·답변·댓글 본문 공용 렌더러. 마크다운 + GFM + 코드 하이라이트 + sanitize.
export function Markdown({ children, mentions, className }: MarkdownProps) {
  const source = useMemo(
    () => linkifyMentions(children, mentions),
    [children, mentions],
  )
  return (
    <div className={`markdown-body ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, [rehypeSanitize, schema]]}
        urlTransform={urlTransform}
        components={{
          a({ href, children, ...rest }: ComponentPropsWithoutRef<'a'>) {
            if (typeof href === 'string' && href.startsWith('#mention-')) {
              return <span className="qna-mention">{children}</span>
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
