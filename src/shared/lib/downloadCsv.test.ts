import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { downloadCsv } from './downloadCsv'

// 엑셀에서 열리는 CSV — 한글이 깨지지 않고, 값이 수식으로 실행되지 않아야 한다.

let captured: { parts: BlobPart[]; name: string } | null = null

beforeEach(() => {
  captured = null
  vi.stubGlobal(
    'Blob',
    class {
      parts: BlobPart[]
      constructor(parts: BlobPart[]) {
        this.parts = parts
        captured = { parts, name: captured?.name ?? '' }
      }
    },
  )
  URL.createObjectURL = vi.fn(() => 'blob:x')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
    captured = { parts: captured?.parts ?? [], name: '' }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function content() {
  return String(captured?.parts?.[0] ?? '')
}

describe('downloadCsv', () => {
  // BOM 이 없으면 엑셀이 로캘 인코딩으로 읽어 한글이 깨진다.
  it('BOM 으로 시작해 엑셀에서 한글이 살아 있다', () => {
    downloadCsv('a.csv', ['이름'], [['박수진']])
    expect(content().startsWith('\uFEFF')).toBe(true)
    expect(content()).toContain('박수진')
  })

  it('쉼표·따옴표가 든 값은 감싸고 안쪽 따옴표는 겹친다', () => {
    downloadCsv('a.csv', ['사유'], [['지각, 병원 "재방문"']])
    expect(content()).toContain('"지각, 병원 ""재방문"""')
  })

  // = 로 시작하는 값을 그대로 두면 엑셀이 수식으로 실행한다.
  it('수식으로 읽힐 수 있는 값도 감싼다', () => {
    downloadCsv('a.csv', ['메모'], [['=SUM(A1:A2)']])
    expect(content()).toContain('"=SUM(A1:A2)"')
  })

  it('빈 값은 빈 칸으로 둔다', () => {
    downloadCsv('a.csv', ['최근 로그인'], [[null]])
    expect(content()).toBe('\uFEFF최근 로그인\r\n')
  })
})
