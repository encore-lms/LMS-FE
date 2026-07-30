/**
 * 표를 CSV 파일로 내려받는다 — 엑셀에서 바로 열린다.
 *
 * <p>맨 앞의 BOM 이 핵심이다. 엑셀은 BOM 없는 UTF-8 CSV 를 로캘 인코딩으로 읽어 한글이
 * 깨진다. 구분자를 쉼표로 두는 대신 BOM 을 붙여 어디서 열어도 글자가 살아 있게 한다.</p>
 */
export function downloadCsv(
  fileName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
) {
  const body = [headers, ...rows]
    .map((cols) => cols.map(csvCell).join(','))
    .join('\r\n')
  // BOM 은 이스케이프로 — 소스에 보이지 않는 문자를 그대로 두면 편집기마다 사라진다.
  const blob = new Blob([`\uFEFF${body}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * 한 칸을 CSV 규칙에 맞게 감싼다.
 *
 * <p>쉼표·줄바꿈·따옴표가 든 값은 따옴표로 감싸고, 안쪽 따옴표는 두 번 겹쳐 이스케이프한다.
 * 앞이 =, +, -, @ 인 값도 감싼다 — 엑셀이 수식으로 읽어 실행하는 것을 막는다.</p>
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  const risky = /[",\r\n]/.test(s) || /^[=+\-@]/.test(s)
  return risky ? `"${s.replace(/"/g, '""')}"` : s
}
