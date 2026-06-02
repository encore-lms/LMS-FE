import type { Role, User } from '@/shared/types'

// 전역 인증 상태 계약 — 공유 읽기전용.
// 현재는 미인증 스텁(기존 AuthGuard의 useAuthStub을 공식화). AuthGuard·RoleEntry가 이 계약을 의존한다.
// TODO(pair): Zustand v5로 구현 (WBS §4.1 — 토큰·역할 저장, 새로고침 복구 persist, login/logout 액션).
//            useAuth(): AuthState 시그니처는 고정 — 내부만 Zustand로 바꾸면 소비자 코드 불변.
export interface AuthState {
  user: User | null
  role: Role | null
  isAuthenticated: boolean
}

const STUB: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
}

export function useAuth(): AuthState {
  return STUB
}
