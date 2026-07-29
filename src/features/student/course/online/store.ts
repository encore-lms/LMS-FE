import { create } from 'zustand'

// 온라인 교육 "현재 주차" 전역 상태 — 기능 로컬(shared/store 미오염).
// 주차별 1강 해제(no ≤ week)를 FE에서 시뮬레이션하기 위한 값. BE 연동 시 서버(enrollment week)가 내려준다.
//   week: null = 서버 기본값(OnlineCourse.currentWeek) 사용 / 숫자 = 테스트 오버라이드.
// 테스트 FAB(OnlineWeekTestNav)가 쓰고, OnlineCoursePage 가 읽는다(컴포넌트 트리 밖 FAB와 공유).
interface OnlineWeekState {
  week: number | null
  setWeek: (week: number | null) => void
}

export const useOnlineWeekStore = create<OnlineWeekState>((set) => ({
  week: null,
  setWeek: (week) => set({ week }),
}))
