import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// URL 쿼리 파라미터에 백업되는 useState — 탭·필터·검색어를 딥링크·새로고침·뒤로가기에서 보존한다.
// 기본값과 같으면 파라미터를 제거해 URL을 깔끔히 유지하고, 변경은 replace로 히스토리 오염을 막는다.
// 사용: const [tab, setTab] = useSearchParamState('tab', 'all')
export function useSearchParamState(
  key: string,
  defaultValue = '',
): [string, (next: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const value = searchParams.get(key) ?? defaultValue

  const setValue = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next === defaultValue || next === '') {
            params.delete(key)
          } else {
            params.set(key, next)
          }
          return params
        },
        { replace: true },
      )
    },
    [key, defaultValue, setSearchParams],
  )

  return [value, setValue]
}

// 다중 선택(칩 토글 등)을 URL에 백업하는 변형 — 쉼표로 직렬화한다. 빈 배열이면 파라미터를 제거한다.
// 사용: const [active, setActive] = useSearchParamArrayState('cat')
export function useSearchParamArrayState(
  key: string,
): [string[], (next: string[]) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(key)
  const value = raw ? raw.split(',').filter(Boolean) : []

  const setValue = useCallback(
    (next: string[]) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          if (next.length === 0) {
            params.delete(key)
          } else {
            params.set(key, next.join(','))
          }
          return params
        },
        { replace: true },
      )
    },
    [key, setSearchParams],
  )

  return [value, setValue]
}
