import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/** URL 반영을 미루는 시간(ms). 한글 조합 한 글자보다 길고 사람이 못 느낄 만큼 짧게. */
const COMMIT_DELAY = 250

// URL 쿼리 파라미터에 백업되는 useState — 탭·필터·검색어를 딥링크·새로고침·뒤로가기에서 보존한다.
// 기본값과 같으면 파라미터를 제거해 URL을 깔끔히 유지하고, 변경은 replace로 히스토리 오염을 막는다.
// 사용: const [tab, setTab] = useSearchParamState('tab', 'all')
//
// 값을 URL 에서 바로 읽어 쓰면 한 글자마다 라우터가 다시 그리고, 그때 input 의 value 가
// URL 에서 되읽혀 덮인다. Windows IME 는 조합 중에도 입력 이벤트를 보내므로 이 왕복에
// 조합이 끊겨 '이장우'가 'ㅇ이잊자장ㅇ우우'처럼 찍혔다(macOS 는 조합 완료 후에만 보내
// 증상이 없었다). 그래서 화면에 보이는 값은 로컬 state 가 쥐고, URL 반영만 뒤로 미룬다.
export function useSearchParamState(
  key: string,
  defaultValue = '',
): [string, (next: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlValue = searchParams.get(key) ?? defaultValue
  const [value, setLocal] = useState(urlValue)
  // 반영 대기 중에는 URL 이 한 박자 뒤처져 있는 게 정상이라, 그 값으로 되돌리면 안 된다.
  const pending = useRef<number | null>(null)

  // 뒤로가기·링크 진입처럼 밖에서 URL 이 바뀌면 화면 값을 맞춘다.
  useEffect(() => {
    if (pending.current === null) {
      setLocal(urlValue)
    }
  }, [urlValue])

  useEffect(() => () => {
    if (pending.current !== null) {
      clearTimeout(pending.current)
    }
  }, [])

  const commit = useCallback(
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

  const setValue = useCallback(
    (next: string) => {
      setLocal(next)
      if (pending.current !== null) {
        clearTimeout(pending.current)
      }
      pending.current = window.setTimeout(() => {
        pending.current = null
        commit(next)
      }, COMMIT_DELAY)
    },
    [commit],
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
