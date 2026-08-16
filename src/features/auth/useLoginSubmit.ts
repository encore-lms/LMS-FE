import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/shared/api'
import { useAuthActions } from '@/shared/store'
import { ROLE_HOME } from '@/shared/constants'
import type { User } from '@/shared/types'
import { PROFILE_PATH } from '@/features/profile/paths'
import type { LoginInput } from './login.schema'

interface LoginResponse {
  token: string
  user: User
  nextRoute?: string
}

// 로그인 제출 흐름 — /login과 /login2(회의용)가 같은 세션 정리·리다이렉트 규칙을 쓰도록
// 한곳에 둔다. 분기 규칙(P0-01 계약)이 페이지마다 갈라지면 안 된다.
export function useLoginSubmit() {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthActions()
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function submit({ email, password }: LoginInput) {
    setSubmitError(null)
    try {
      // credentials 없이 부르면 크로스 오리진 배포(FE ↔ API CloudFront)에서 브라우저가
      // 응답의 refresh 쿠키(Set-Cookie)를 버린다 — silent refresh 가 시작부터 불가능해
      // 30분(access TTL)마다 강제 로그아웃됐다(2026-08-16 실측: 로그인 후 쿠키 저장 0건).
      const res = await apiClient.postCredentialed<LoginResponse>('/auth/login', {
        userId: email,
        password,
      })
      // 로그아웃 없이 계정을 교체하는 경우(빠른 로그인 등) 이전 세션의
      // 쿼리 캐시·로컬 알림이 새 사용자에게 남지 않도록 세션을 먼저 정리한다(스토어 구독이 정리 수행).
      clearSession()
      setSession(res.data.token, res.data.user)
      // 임시 비밀번호(매니저 발급) 상태면 역할 홈 대신 마이 프로필로 보내 비밀번호 변경을 유도한다(P0-01 계약).
      // 단, 온보딩이 먼저 필요한 수강생은 온보딩부터 — 프로필이 OnboardingGate 하위라 어차피 튕기고,
      // 온보딩 완료 화면이 mustChangePassword를 이어받아 프로필로 보낸다.
      const needsOnboarding = res.data.nextRoute === '/student/onboarding'
      navigate(
        res.data.user.mustChangePassword && !needsOnboarding
          ? PROFILE_PATH[res.data.user.role]
          : (res.data.nextRoute ?? ROLE_HOME[res.data.user.role]),
        { replace: true },
      )
    } catch {
      setSubmitError('이메일 또는 비밀번호를 확인해주세요.')
    }
  }

  return { submit, submitError }
}
