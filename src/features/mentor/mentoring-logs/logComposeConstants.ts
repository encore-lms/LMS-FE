export const round1 = (n: number) => Math.round(n * 10) / 10

export const HELPER = 'text-fg-subtle text-[11px]'

export const DOW = ['일', '월', '화', '수', '목', '금', '토'] as const
export const dateWithDow = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? `${date}(${DOW[new Date(`${date}T00:00`).getDay()]})`
    : ''
