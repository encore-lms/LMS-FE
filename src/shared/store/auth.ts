import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Role, User } from '@/shared/types'
import { clearUploadCache } from '@/components/ui/uploadCache'

// 전역 인증 상태 — Zustand + localStorage persist(새로고침 후 세션 복구).
// 읽기는 useAuth()(파생: role·isAuthenticated), 쓰기는 useAuthActions()를 쓴다.
// (JSON 직렬화라 함수는 저장되지 않고 token·user만 보존된다.)
interface AuthStoreState {
  user: User | null
  token: string | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => {
        // 보던 사람이 바뀐다 — 본문에 실린 그림 사본도 함께 놓는다.
        clearUploadCache()
        set({ token: null, user: null })
      },
    }),
    {
      name: 'lms-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// 파생 읽기 계약 — 시그니처 고정(기존 소비자 AuthGuard·RoleEntry 불변).
export interface AuthState {
  user: User | null
  role: Role | null
  isAuthenticated: boolean
}

export function useAuth(): AuthState {
  const user = useAuthStore((s) => s.user)
  return {
    user,
    role: user?.role ?? null,
    isAuthenticated: user !== null,
  }
}

// 로그인/로그아웃 액션 훅 — LoginPage 등에서 사용(실제 API 연동은 후속 axios·MSW PR).
export function useAuthActions() {
  const setSession = useAuthStore((s) => s.setSession)
  const clearSession = useAuthStore((s) => s.clearSession)
  return { setSession, clearSession }
}
