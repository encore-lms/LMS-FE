// PLAY 타자 제시문 일괄 업로드 샘플 CSV — FE 제공(정적). 필수 열 헤더 + 예시 2행.
// 실제 양식 컬럼/검증 규칙은 BE 계약(P0_15) 확정 시 동기화한다.
export const TYPING_SAMPLE_CSV =
  'language,level,title,content,sortOrder\n' +
  'Python,쉬움,예시 제목,예시 본문입니다.,10\n' +
  '영문,보통,Sample Title,Sample passage body.,20\n'

// CSV 텍스트를 클라이언트에서 파일로 내려받는다.
// jsdom 등 createObjectURL 미지원 환경에서는 다운로드를 건너뛴다(토스트 피드백은 호출측에서 처리).
export function downloadCsv(filename: string, text: string) {
  if (
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function' ||
    typeof document === 'undefined'
  ) {
    return
  }
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// 샘플 CSV 양식 내려받기.
export function downloadTypingSampleCsv() {
  downloadCsv('play-typing-sample.csv', TYPING_SAMPLE_CSV)
}
