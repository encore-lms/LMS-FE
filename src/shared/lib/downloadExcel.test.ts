import { describe, expect, it, vi, beforeEach } from 'vitest'
import { downloadExcel } from './downloadExcel'

// 계정 정보 내려받기가 쓰는 엑셀 생성기.
// 수강생에게 그대로 나눠 주는 문서라 표지·안내·표가 한 시트에 위에서 아래로 이어진다.

const toFile = vi.fn().mockResolvedValue(undefined)
// 인자를 그대로 받아 두고 검증에서 꺼내 본다.
const writeXlsxFile = vi.fn((...args: unknown[]) => {
  void args
  return { toFile, toBlob: vi.fn() }
})

vi.mock('write-excel-file/browser', () => ({
  default: (...args: unknown[]) => writeXlsxFile(...(args as [])),
}))

beforeEach(() => {
  writeXlsxFile.mockClear()
  toFile.mockClear()
})

type Cell = {
  value?: unknown
  fontWeight?: string
  fontSize?: number
  textColor?: string
  columnSpan?: number
  type?: unknown
}

function sheet() {
  return writeXlsxFile.mock.calls[0]![0] as unknown as Cell[][]
}

function options() {
  return writeXlsxFile.mock.calls[0]![1] as unknown as {
    columns: { width: number }[]
    sheet?: string
  }
}

/** 값이 있는 줄만 — 사이에 넣은 빈 줄은 배치용이라 검증에서 뺀다. */
function lines() {
  return sheet()
    .filter((row) => row.some((c) => c?.value !== undefined))
    .map((row) => row.map((c) => c?.value))
}

const COLUMNS = [
  { header: '이름' },
  { header: '아이디' },
  { header: '생년월일' },
]

describe('downloadExcel', () => {
  it('표지 → 안내 → 표 순서로 쌓는다', async () => {
    await downloadExcel('계정정보.xlsx', {
      title: 'PLAYDATA LMS',
      notice: [
        '안녕하세요, SK네트웍스 Family AI 캠프 32기 수강생 여러분.',
        { text: '반드시 첫 로그인 후에 비밀번호를 변경해 주세요!', emphasis: true },
      ],
      tableTitle: '계정 정보',
      columns: COLUMNS,
      rows: [['박수진', '100032945250', '2003-04-29']],
    })
    expect(lines()).toEqual([
      ['PLAYDATA LMS'],
      ['안녕하세요, SK네트웍스 Family AI 캠프 32기 수강생 여러분.'],
      ['반드시 첫 로그인 후에 비밀번호를 변경해 주세요!'],
      ['계정 정보'],
      ['이름', '아이디', '생년월일'],
      ['박수진', '100032945250', '2003-04-29'],
    ])
    expect(toFile).toHaveBeenCalledWith('계정정보.xlsx')
  })

  // 표지·안내는 표 너비만큼 병합해야 긴 문장이 한 칸에 갇히지 않는다.
  it('표지와 안내는 표 너비만큼 병합한다', async () => {
    await downloadExcel('a.xlsx', {
      title: 'PLAYDATA LMS',
      notice: ['안내'],
      columns: COLUMNS,
      rows: [],
    })
    expect(sheet()[0][0].columnSpan).toBe(3)
    expect(sheet()[2][0].columnSpan).toBe(3)
  })

  it('강조한 안내 줄은 굵게 + 눈에 띄는 색', async () => {
    await downloadExcel('a.xlsx', {
      notice: ['보통 줄', { text: '꼭 읽어 주세요', emphasis: true }],
      columns: COLUMNS,
      rows: [],
    })
    const [plain, emphasized] = [sheet()[0][0], sheet()[1][0]]
    expect(plain.fontWeight).toBeUndefined()
    expect(emphasized.fontWeight).toBe('bold')
    expect(emphasized.textColor).toBe('#B42318')
  })

  // 아이디·생년월일을 숫자·날짜로 넘기면 엑셀이 앞자리 0 을 지우거나 형식을 바꾼다.
  it('기본 형식은 글자라 값이 뒤틀리지 않는다', async () => {
    await downloadExcel('a.xlsx', {
      columns: COLUMNS,
      rows: [['박수진', '100032945250', '1995-01-22']],
    })
    const row = sheet()[1]
    expect(row[1]).toEqual({ value: '100032945250', type: String })
    expect(row[2]).toEqual({ value: '1995-01-22', type: String })
  })

  it('숫자·날짜 열은 그 형식으로 넘긴다', async () => {
    const when = new Date('2026-07-31T00:00:00Z')
    await downloadExcel('a.xlsx', {
      columns: [
        { header: '점수', type: 'number' },
        { header: '가입일', type: 'date' },
      ],
      rows: [[92, when]],
    })
    const row = sheet()[1]
    expect(row[0]).toEqual({ value: 92, type: Number })
    expect(row[1]).toMatchObject({ value: when, type: Date })
  })

  it('빈 값은 빈 칸으로 둔다', async () => {
    await downloadExcel('a.xlsx', {
      columns: [{ header: '최근 로그인' }],
      rows: [[null]],
    })
    expect(sheet()[1][0]).toEqual({})
  })

  it('열 너비와 시트 이름을 넘긴다', async () => {
    await downloadExcel('a.xlsx', {
      columns: [{ header: '이름', width: 14 }],
      rows: [['박수진']],
      sheetName: '32기 계정',
    })
    expect(options().columns).toEqual([{ width: 14 }])
    expect(options().sheet).toBe('32기 계정')
  })
})
