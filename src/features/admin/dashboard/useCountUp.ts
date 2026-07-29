import { useEffect, useRef, useState } from 'react'

// 숫자 0→target 카운트업 애니메이션(easeOutCubic, 기본 600ms). 이전 매니저 대시보드의 useCountUp 포팅.
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!Number.isFinite(target) || target === 0) {
      setValue(0)
      return
    }
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(target * eased))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs])

  return value
}
