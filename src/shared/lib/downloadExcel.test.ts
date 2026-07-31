import { describe, expect, it, vi, beforeEach } from 'vitest'
import { downloadExcel } from './downloadExcel'

// 계정 정보 내려받기가 쓰는 엑셀 생성기 — 무엇을 어떤 형식으로 넘기는지 고정한다.

const toFile = vi.fn().mockResolvedValue(undefined)
const writeXlsxFile = vi.fn(() => ({ toFile, toBlob: vi.fn() }))

vi.mock('write-excel-file/browser', () => ({
  default: (...args: unknown[]) => writeXlsxFile(...(args as [])),
}))

beforeEach(() => {
  writeXlsxFile.mockClear()
  toFile.mockClear()
})

function lastCall() {
  const [sheetData, sheetOptions] = writeXlsxFile.mock.calls[0] as unknown as [
    { value?: unknown; type?: unknown }[][],
    { columns: { width: number }[]; sheet: string; stickyRowsCount: number },
  ]
  return { sheetData, sheetOptions }
}

describe('downloadExcel', () => {
  it('머리글 줄을 굵게 얹고 파일 이름 그대로 저장한다', async () => {
    await downloadExcel('계정정보.xlsx', [{ header: '이름' }], [['박수진']])
    const { sheetData } = lastCall()
    expect(sheetData[0][0]).toMatchObject({ value: '이름', fontWeight: 'bold' })
    expect(toFile).toHaveBeenCalledWith('계정정보.xlsx')
  })

  // UUID·생년월일을 숫자·날짜로 넘기면 엑셀이 앞자리 0 을 지우거나 형식을 바꾼다.
  it('기본 형식은 글자라 값이 뒤틀리지 않는다', async () => {
    await downloadExcel(
      'a.xlsx',
      [{ header: '학생 UUID' }, { header: '생년월일' }],
      [['100032945250', '1995-01-22']],
    )
    const { sheetData } = lastCall()
    expect(sheetData[1][0]).toEqual({ value: '100032945250', type: String })
    expect(sheetData[1][1]).toEqual({ value: '1995-01-22', type: String })
  })

  it('숫자·날짜 열은 그 형식으로 넘긴다', async () => {
    const when = new Date('2026-07-31T00:00:00Z')
    await downloadExcel(
      'a.xlsx',
      [
        { header: '점수', type: 'number' },
        { header: '가입일', type: 'date' },
      ],
      [[92, when]],
    )
    const { sheetData } = lastCall()
    expect(sheetData[1][0]).toEqual({ value: 92, type: Number })
    expect(sheetData[1][1]).toMatchObject({ value: when, type: Date })
  })

  it('빈 값은 빈 칸으로 둔다', async () => {
    await downloadExcel('a.xlsx', [{ header: '최근 로그인' }], [[null]])
    const { sheetData } = lastCall()
    expect(sheetData[1][0]).toEqual({})
  })

  it('열 너비와 시트 이름을 넘기고 머리글을 고정한다', async () => {
    await downloadExcel(
      'a.xlsx',
      [{ header: '이름', width: 12 }],
      [['박수진']],
      '32기 계정',
    )
    const { sheetOptions } = lastCall()
    expect(sheetOptions.columns).toEqual([{ width: 12 }])
    expect(sheetOptions.sheet).toBe('32기 계정')
    expect(sheetOptions.stickyRowsCount).toBe(1)
  })
})
