import type { ReactNode } from 'react'
import { SearchInput } from './SearchInput'

/**
 * 목록 상단 공통 툴바 — 교육과정 허브 탭 통일 규격(2026-08-07, 전 탭 실측 다수결).
 *
 * 한 줄 무배경 구성: 좌측 = 총 N개 카운트·안내, 우측 = [검색][필터 Select][주요 액션].
 * 검색은 항상 우측·SearchInput 기본 폭(w-56) — 기존 자료실·이력서 주석의 "탭 공통 필터 바
 * 규격"을 컴포넌트로 승격했다(공지·과제·기록실이 좌측 검색으로 어긋나 있었다).
 * 칩형 카테고리 필터(QnA·출결)는 secondRow 로 둘째 줄 좌측에 둔다.
 */
export function ListToolbar({
  left,
  search,
  filters,
  actions,
  secondRow,
}: {
  /** 좌측 — '총 N개' 카운트·보조 안내 */
  left?: ReactNode
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder: string
    ariaLabel: string
  }
  /** 검색 오른쪽에 놓이는 필터(Select 등) */
  filters?: ReactNode
  /** 우측 끝 주요 액션 버튼 */
  actions?: ReactNode
  /** 둘째 줄(카테고리 칩 등) — 렌더는 호출부 몫 */
  secondRow?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-fg-subtle flex min-w-0 flex-wrap items-center gap-2 text-sm">
          {left}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <SearchInput
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              ariaLabel={search.ariaLabel}
            />
          )}
          {filters}
          {actions}
        </div>
      </div>
      {secondRow}
    </div>
  )
}
