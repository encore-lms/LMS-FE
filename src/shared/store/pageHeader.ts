import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'

// 페이지 헤더(제목·설명) 전역 상태 — 공통 Header가 좌측에 렌더링한다(Figma: 헤더 타이틀 통합형).
// 각 페이지는 본문에 h1을 두지 않고 usePageHeader()로 등록한다. 읽기는 Header 전용.
interface PageHeaderState {
  title: ReactNode
  description: ReactNode
  setPageHeader: (title: ReactNode, description?: ReactNode) => void
  clearPageHeader: () => void
}

export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  title: null,
  description: null,
  setPageHeader: (title, description) =>
    set({ title, description: description ?? null }),
  clearPageHeader: () => set({ title: null, description: null }),
}))

// 페이지 컴포넌트 최상단(early return 이전)에서 호출 — 훅 규칙상 조건부 호출 금지.
// 데이터 로드 후 제목이 정해지는 페이지는 값이 바뀌면 자동 갱신된다(deps).
// description은 가능하면 string으로 — JSX를 넘기면 페이지 렌더마다 Header가 같이 렌더된다.
export function usePageHeader(title: ReactNode, description?: ReactNode) {
  const setPageHeader = usePageHeaderStore((s) => s.setPageHeader)
  const clearPageHeader = usePageHeaderStore((s) => s.clearPageHeader)

  useEffect(() => {
    setPageHeader(title, description)
  }, [title, description, setPageHeader])

  // 언마운트 시에만 해제 — 라우트 전환 시 이전 페이지 제목이 남지 않도록.
  useEffect(() => clearPageHeader, [clearPageHeader])
}
