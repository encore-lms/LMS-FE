/** 엑셀 한 칸에 담을 값. 날짜·숫자는 그 형식대로, 나머지는 글자로 들어간다. */
export type ExcelCell = string | number | Date | null | undefined

export interface ExcelColumn {
  header: string
  /** 열 너비(글자 수). 안 주면 머리글 길이에 맞춘다. */
  width?: number
  /** 이 열의 값 형식. 기본은 글자. */
  type?: 'text' | 'number' | 'date'
}

/**
 * 표를 엑셀 파일(.xlsx)로 내려받는다.
 *
 * <p>라이브러리는 쓸 때 불러온다 — 다운로드는 눌러야 일어나는 일이라, 화면에 들어오기만 한
 * 사람에게까지 파서를 내려보낼 이유가 없다.</p>
 *
 * <p>글자로 지정한 열은 엑셀이 값을 해석하지 못하게 막는다. 학생 UUID(`100032945250`)나
 * 생년월일(`1995-01-22`) 같은 값을 그냥 두면 엑셀이 숫자·날짜로 바꿔 앞자리 0 이 사라지거나
 * 형식이 뒤틀린다.</p>
 */
export async function downloadExcel(
  fileName: string,
  columns: ExcelColumn[],
  rows: ExcelCell[][],
  sheetName = 'Sheet1',
) {
  // 브라우저 빌드를 콕 집어 부른다 — 패키지 루트에는 진입점이 없고 node/browser 가 갈려 있다.
  const mod = await import('write-excel-file/browser')
  const writeXlsxFile = mod.default
  type Row = import('write-excel-file/browser').Row
  type SheetData = import('write-excel-file/browser').SheetData

  const header: Row = columns.map((c) => ({
    value: c.header,
    fontWeight: 'bold' as const,
    backgroundColor: '#F1F5F9',
    align: 'center' as const,
  }))

  const body: Row[] = rows.map((row) =>
    columns.map((col, i): Row[number] => {
      const raw = row[i]
      // 빈 칸은 값을 비운다 — 빈 문자열을 넣으면 엑셀에서 '있는데 비어 있는 칸'이 된다.
      if (raw === null || raw === undefined || raw === '') {
        return {}
      }
      if (col.type === 'number' && typeof raw === 'number') {
        return { value: raw, type: Number }
      }
      if (col.type === 'date' && raw instanceof Date) {
        return { value: raw, type: Date, format: 'yyyy-mm-dd' }
      }
      return { value: String(raw), type: String }
    }),
  )

  const sheetData: SheetData = [header, ...body]
  const file = writeXlsxFile(sheetData, {
    columns: columns.map((c) => ({
      width: c.width ?? Math.max(10, c.header.length + 4),
    })),
    sheet: sheetName,
    // 머리글 줄은 스크롤해도 남아 있게 — 인원이 많으면 어느 열인지 금방 잊는다.
    stickyRowsCount: 1,
  })
  await file.toFile(fileName)
}
