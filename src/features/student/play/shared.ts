// PLAY 화면 공통 토큰·헬퍼 — 기능 로컬(타자/코딩/퀴즈/결과가 동일 카드·타이머 포맷을 공유).
export const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

export const fmtTime = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * 입력값을 정답 텍스트와 글자 단위로 비교해 게임 지표를 계산한다(타자·코딩 공용).
 * 점수는 cpm·정확도 기반 + 정확 타수 콤보 보너스. elapsedSec=0이면 cpm 0(시작 직후 보호).
 */
export function computeMetrics(
  input: string,
  target: string,
  elapsedSec: number,
) {
  let correct = 0
  for (let i = 0; i < input.length; i++) {
    if (i < target.length && input[i] === target[i]) correct++
  }
  const typed = input.length
  const typos = typed - correct
  const accuracy = typed ? (correct / typed) * 100 : 100
  const progressPct = target.length
    ? Math.min(100, (typed / target.length) * 100)
    : 0
  const cpm = elapsedSec > 0 ? Math.round(correct / (elapsedSec / 60)) : 0
  const wpm = Math.round(cpm / 5)
  const comboBonus = Math.round(correct * 35)
  const score = Math.round(cpm * accuracy * 1.33) + comboBonus
  const linesTyped = input.length ? input.split('\n').length : 0
  const totalLines = target.split('\n').length
  return {
    correct,
    typos,
    accuracy,
    progressPct,
    cpm,
    wpm,
    comboBonus,
    score,
    linesTyped,
    totalLines,
  }
}
