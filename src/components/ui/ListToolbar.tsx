import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { SearchInput } from './SearchInput'

/** 좌측 카운트 표준 표기 — 필터·검색이 걸려 목록이 줄었을 때만 '(전체 M)'을 병기한다. */
export function ToolbarCount({
  filtered,
  total,
  unit,
}: {
  filtered: number
  total: number
  unit: string
}) {
  return (
    <span>
      {`총 ${filtered}${unit}`}
      {filtered !== total && (
        <span className="text-fg-subtle">{` (전체 ${total})`}</span>
      )}
    </span>
  )
}

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
  reset,
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
  /** 검색·필터가 기본값이 아닐 때만 '초기화' 버튼 노출 — active 판정은 호출부가 한다. */
  reset?: { active: boolean; onReset: () => void }
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
          {reset?.active && (
            <button
              type="button"
              onClick={reset.onReset}
              className="text-fg-muted hover:text-fg flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              초기화
            </button>
          )}
          {actions}
        </div>
      </div>
      {secondRow}
    </div>
  )
}
