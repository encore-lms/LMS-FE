import type { ChainedCommands } from '@tiptap/react'
import {
  Code,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Table,
  Type,
  type LucideIcon,
} from 'lucide-react'

/**
 * 슬래시 명령으로 넣을 수 있는 블록.
 *
 * <p>본문은 마크다운으로 저장되고 {@link Markdown} 이 렌더하므로, 여기 있는 항목은 전부
 * 실제로 그려지는 문법만 담는다. 노션의 '토글 목록'·'페이지'처럼 raw HTML 이 필요한 블록은
 * sanitize 단계에서 지워지므로 넣지 않는다 — 메뉴에 있는데 글자로만 남으면 더 나쁘다.</p>
 */
export interface SlashCommand {
  key: string
  label: string
  /** 오른쪽에 흐리게 보여줄 원래 문법 — 익숙해지면 메뉴 없이 바로 치게 된다. */
  hint: string
  icon: LucideIcon
  /** 검색어 — 라벨 외에 영문·별칭으로도 찾을 수 있게. */
  keywords: string[]
  /** 고른 블록으로 바꾸는 편집 명령. */
  apply: (chain: ChainedCommands) => ChainedCommands
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    key: 'text',
    label: '텍스트',
    hint: '',
    icon: Type,
    keywords: ['text', '본문', '문단', '일반'],
    apply: (c) => c.setParagraph(),
  },
  {
    key: 'h1',
    label: '제목1',
    hint: '#',
    icon: Heading1,
    keywords: ['h1', 'heading', '제목', '머리말'],
    apply: (c) => c.setNode('heading', { level: 1 }),
  },
  {
    key: 'h2',
    label: '제목2',
    hint: '##',
    icon: Heading2,
    keywords: ['h2', 'heading', '제목', '머리말'],
    apply: (c) => c.setNode('heading', { level: 2 }),
  },
  {
    key: 'h3',
    label: '제목3',
    hint: '###',
    icon: Heading3,
    keywords: ['h3', 'heading', '제목', '머리말'],
    apply: (c) => c.setNode('heading', { level: 3 }),
  },
  {
    key: 'h4',
    label: '제목4',
    hint: '####',
    icon: Heading4,
    keywords: ['h4', 'heading', '제목', '머리말'],
    apply: (c) => c.setNode('heading', { level: 4 }),
  },
  {
    key: 'ul',
    label: '글머리 기호 목록',
    hint: '-',
    icon: List,
    keywords: ['ul', 'list', '목록', '불릿', '리스트'],
    apply: (c) => c.toggleBulletList(),
  },
  {
    key: 'ol',
    label: '번호 매기기 목록',
    hint: '1.',
    icon: ListOrdered,
    keywords: ['ol', 'list', '번호', '순서', '리스트'],
    apply: (c) => c.toggleOrderedList(),
  },
  {
    key: 'todo',
    label: '할 일 목록',
    hint: '[]',
    icon: ListTodo,
    keywords: ['todo', 'task', 'check', '체크', '할일', '점검'],
    apply: (c) => c.toggleTaskList(),
  },
  {
    key: 'quote',
    label: '인용',
    hint: '>',
    icon: Quote,
    keywords: ['quote', '인용', '강조'],
    apply: (c) => c.toggleBlockquote(),
  },
  {
    key: 'code',
    label: '코드 블록',
    hint: '```',
    icon: Code,
    keywords: ['code', '코드', '소스'],
    apply: (c) => c.toggleCodeBlock(),
  },
  {
    key: 'table',
    label: '표',
    hint: '| |',
    icon: Table,
    keywords: ['table', '표', '테이블'],
    apply: (c) => c.insertTable({ rows: 3, cols: 2, withHeaderRow: true }),
  },
  {
    key: 'divider',
    label: '구분선',
    hint: '---',
    icon: Minus,
    keywords: ['divider', 'hr', '구분', '선'],
    apply: (c) => c.setHorizontalRule(),
  },
]

/** 입력한 검색어로 좁히기 — 라벨과 키워드 어느 쪽이든 걸리면 남긴다. */
export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.trim().toLowerCase()
  if (!q) return SLASH_COMMANDS
  return SLASH_COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)),
  )
}
