/**
 * 해결 소요 일수가 문제 발생일과 앞뒤가 맞는지 본다.
 *
 * <p>아직 오지 않은 날을 소요 일수로 적을 수는 없다 — 오늘 겪은 문제에 "5일 걸렸다"고 쓰면
 * 사례를 읽는 강사가 시점을 되짚을 수 없다. 발생일부터 오늘까지가 쓸 수 있는 전부다.</p>
 *
 * <p>당일 해결은 1일로 센다(0일이 아니라). 8월 1일에 겪고 오늘이 8월 3일이면 1·2·3일이
 * 가능하고 4일부터는 미래를 적는 셈이다.</p>
 */

const DAY_MS = 24 * 60 * 60 * 1000

/** 'YYYY-MM-DD' → 그 날 자정(로컬). 형식이 아니면 null. */
function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  // 2026-02-31 처럼 넘어간 날짜를 걸러 낸다(Date 가 조용히 다음 달로 넘긴다).
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3])
    ? d
    : null
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** 발생일에 적을 수 있는 최대 소요 일수. 날짜가 잘못됐으면 null. */
export function maxResolutionDays(
  startDate: string,
  today: Date = new Date(),
): number | null {
  const start = parseDate(startDate)
  if (!start) return null
  const elapsed = Math.round(
    (startOfDay(today).getTime() - start.getTime()) / DAY_MS,
  )
  return elapsed < 0 ? null : elapsed + 1
}

/** 사람이 읽는 오류 문구. 문제가 없으면 null. */
export function resolutionDaysError(
  startDate: string,
  dayCount: string,
  today: Date = new Date(),
): string | null {
  const raw = dayCount.trim()
  if (!startDate.trim()) return null // 발생일을 아직 안 고른 단계에서는 따지지 않는다.
  const start = parseDate(startDate)
  if (!start) return '문제 발생일을 다시 확인해 주세요'
  if (start.getTime() > startOfDay(today).getTime())
    return '문제 발생일은 오늘까지만 고를 수 있어요'
  if (!raw) return null // 비워 두는 건 허용(0일로 저장된다).

  const days = Number.parseInt(raw, 10)
  if (!Number.isFinite(days) || days < 0)
    return '해결 소요는 0일 이상이어야 해요'

  const max = maxResolutionDays(startDate, today)
  if (max != null && days > max) {
    return `발생일부터 오늘까지 ${max}일이라 그보다 길게 적을 수 없어요`
  }
  return null
}
