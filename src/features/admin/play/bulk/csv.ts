// 타자 제시문 CSV 파싱·검증 — 업로드 파일을 클라이언트에서 해석한다.
// 필수 열: language, level, title, content, sortOrder (열 순서 무관, 헤더명 기준).
// 서버(POST /admin/play/typing-texts/bulk)가 전 행을 재검증하므로 여기 검증은 미리보기용 1차.

export interface ParsedCsvRow {
  rowNo: number
  title: string
  content: string
  /** 정규화된 표시 라벨 — Python | 한글 | 영문 (실패 시 원문 유지) */
  language: string
  /** 정규화된 표시 라벨 — 쉬움 | 보통 | 어려움 (실패 시 원문 유지) */
  level: string
  order: number
  /** 행 오류 사유들 — 비어 있으면 정상 행 */
  errors: string[]
}

export interface ParsedCsv {
  rows: ParsedCsvRow[]
  /** 필수 열 누락 등 파일 수준 오류 — 있으면 rows는 비어 있다 */
  headerError?: string
  /** 실제 파일에 존재한 헤더(소문자) */
  headers: string[]
}

const REQUIRED = ['language', 'level', 'title', 'content', 'sortorder'] as const

const LANGUAGE_MAP: Record<string, string> = {
  python: 'Python',
  한글: '한글',
  korean: '한글',
  영문: '영문',
  english: '영문',
}

const LEVEL_MAP: Record<string, string> = {
  쉬움: '쉬움',
  easy: '쉬움',
  보통: '보통',
  medium: '보통',
  normal: '보통',
  어려움: '어려움',
  hard: '어려움',
}

const TITLE_MAX = 80
const CONTENT_MAX = 2000

// RFC 4180 최소 구현 — 따옴표 필드(내부 콤마·개행·"" 이스케이프) 지원.
function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  const src = text.replace(/^﻿/, '') // BOM 제거
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      field = ''
      rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  rows.push(row)
  // 완전 빈 행 제거(말미 개행 등)
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

export function parseTypingCsv(text: string): ParsedCsv {
  const table = parseCsvText(text)
  if (table.length === 0) {
    return { rows: [], headers: [], headerError: '빈 파일이에요' }
  }
  const headers = table[0].map((h) => h.trim().toLowerCase())
  const missing = REQUIRED.filter((r) => !headers.includes(r))
  if (missing.length > 0) {
    return {
      rows: [],
      headers,
      headerError: `필수 열이 없어요: ${missing.join(', ')}`,
    }
  }
  const idx = (name: string) => headers.indexOf(name)

  const rows: ParsedCsvRow[] = table.slice(1).map((cells, i) => {
    const cell = (name: string) => (cells[idx(name)] ?? '').trim()
    const errors: string[] = []

    const title = cell('title')
    if (!title) errors.push('title 필수')
    else if (title.length > TITLE_MAX) errors.push(`title ${TITLE_MAX}자 초과`)

    const content = cell('content')
    if (!content) errors.push('content 필수')
    else if (content.length > CONTENT_MAX)
      errors.push(`content ${CONTENT_MAX}자 초과`)

    const rawLanguage = cell('language')
    const language = LANGUAGE_MAP[rawLanguage.toLowerCase()] ?? rawLanguage
    if (!LANGUAGE_MAP[rawLanguage.toLowerCase()])
      errors.push('language는 Python·한글·영문')

    const rawLevel = cell('level')
    const level = LEVEL_MAP[rawLevel.toLowerCase()] ?? rawLevel
    if (!LEVEL_MAP[rawLevel.toLowerCase()])
      errors.push('level은 쉬움·보통·어려움')

    const rawOrder = cell('sortorder')
    const order = rawOrder === '' ? 0 : Number(rawOrder)
    if (Number.isNaN(order) || !Number.isInteger(order))
      errors.push('sortOrder는 정수')

    return {
      rowNo: i + 2, // 헤더가 1행
      title,
      content,
      language,
      level,
      order: Number.isInteger(order) ? order : 0,
      errors,
    }
  })

  return { rows, headers }
}
