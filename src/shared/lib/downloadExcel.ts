/** 엑셀 한 칸에 담을 값. 날짜·숫자는 그 형식대로, 나머지는 글자로 들어간다. */
export type ExcelCell = string | number | Date | null | undefined

export interface ExcelColumn {
  header: string
  /** 열 너비(글자 수). 안 주면 머리글 길이에 맞춘다. */
  width?: number
  /** 이 열의 값 형식. 기본은 글자. */
  type?: 'text' | 'number' | 'date'
}

/** 안내 문단 한 줄. 강조하면 굵게 + 눈에 띄는 색으로 나온다. */
export type ExcelNoticeLine = string | { text: string; emphasis: true }

export interface ExcelDocument {
  /** 표지 제목 — 맨 윗줄에 크게. */
  title?: string
  /** 표지 아래 안내 문단. 줄마다 한 행이 된다. */
  notice?: ExcelNoticeLine[]
  /** 표 바로 위에 붙는 소제목. */
  tableTitle?: string
  columns: ExcelColumn[]
  rows: ExcelCell[][]
  sheetName?: string
}

/**
 * 표를 엑셀 파일(.xlsx)로 내려받는다.
 *
 * <p>표만 있는 자료가 아니라 그대로 나눠 줄 수 있는 문서를 만든다 — 표지·안내·표가 한 시트에
 * 위에서 아래로 이어진다. 받는 사람이 이 파일 하나만 보고도 무엇인지, 무엇을 해야 하는지
 * 알 수 있어야 한다.</p>
 *
 * <p>라이브러리는 쓸 때 불러온다 — 다운로드는 눌러야 일어나는 일이라, 화면에 들어오기만 한
 * 사람에게까지 파서를 내려보낼 이유가 없다.</p>
 *
 * <p>글자로 지정한 열은 엑셀이 값을 해석하지 못하게 막는다. 아이디(`100032945250`)나
 * 생년월일(`1995-01-22`) 같은 값을 그냥 두면 엑셀이 숫자·날짜로 바꿔 앞자리 0 이 사라지거나
 * 형식이 뒤틀린다.</p>
 */
export async function downloadExcel(fileName: string, doc: ExcelDocument) {
  // 브라우저 빌드를 콕 집어 부른다 — 패키지 루트에는 진입점이 없고 node/browser 가 갈려 있다.
  const mod = await import('write-excel-file/browser')
  const writeXlsxFile = mod.default
  type Row = import('write-excel-file/browser').Row
  type SheetData = import('write-excel-file/browser').SheetData

  const { title, notice = [], tableTitle, columns, rows, sheetName } = doc
  const span = columns.length
  const sheet: SheetData = []

  if (title) {
    sheet.push([
      {
        value: title,
        fontSize: 20,
        fontWeight: 'bold',
        align: 'center',
        alignVertical: 'center',
        height: 36,
        columnSpan: span,
      },
    ])
    sheet.push([{}])
  }

  for (const line of notice) {
    const emphasized = typeof line === 'object'
    sheet.push([
      {
        value: emphasized ? line.text : line,
        fontWeight: emphasized ? 'bold' : undefined,
        textColor: emphasized ? '#B42318' : undefined,
        // 긴 문장이 옆 칸으로 흘러 잘리지 않게 병합한 칸 안에서 접는다.
        wrap: true,
        alignVertical: 'center',
        columnSpan: span,
      },
    ])
  }
  if (notice.length > 0) sheet.push([{}])

  if (tableTitle) {
    sheet.push([
      { value: tableTitle, fontWeight: 'bold', fontSize: 13, columnSpan: span },
    ])
  }

  sheet.push(
    columns.map((c) => ({
      value: c.header,
      fontWeight: 'bold' as const,
      backgroundColor: '#F1F5F9',
      align: 'center' as const,
    })),
  )

  for (const row of rows) {
    sheet.push(
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
  }

  const file = writeXlsxFile(sheet, {
    columns: columns.map((c) => ({
      width: c.width ?? Math.max(10, c.header.length + 4),
    })),
    sheet: sheetName,
  })
  await file.toFile(fileName)
}
