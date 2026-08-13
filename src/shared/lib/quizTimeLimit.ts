// 퀴즈 제한 시간 표기 — 0(또는 미지정)은 '무제한'이다.
//
// 템플릿은 제한 시간 기본값 0을 '무제한'으로 허용하는데 퀴즈 폼은 1분 이상만 받아
// 그런 템플릿으로 복제하면 저장이 막혔다. 반대로 응시 화면은 0을 그대로 카운트다운
// 시작값으로 써서 시작하자마자 자동 제출됐다(2026-08-13 QA). 두 해석을 여기로 모은다.
export const UNLIMITED_TIME_LABEL = '제한 없음'

/** 제한 시간이 없는 퀴즈인지 — BE는 미지정을 0으로 내려준다. */
export function isUnlimitedTimeLimit(minutes: number | null | undefined) {
  return !minutes || minutes <= 0
}

/** 목록·결과·응시 안내에 쓰는 표기. 무제한이면 '분'을 붙이지 않는다. */
export function timeLimitLabel(minutes: number | null | undefined) {
  return isUnlimitedTimeLimit(minutes) ? UNLIMITED_TIME_LABEL : `${minutes}분`
}
