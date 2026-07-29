import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { apiClient } from '@/shared/api'
import { useAuthActions } from '@/shared/store'
import { ROLE_HOME } from '@/shared/constants'
import type { User } from '@/shared/types'
import { PROFILE_PATH } from '@/features/profile/paths'
import { AuthLayout } from './AuthLayout'
import { DemoQuickLogin } from './DemoQuickLogin'
import { DEMO_LOGIN_ENABLED, type DemoAccount } from './demoAccounts'
import { loginSchema, type LoginInput } from './login.schema'

interface LoginResponse {
  token: string
  user: User
  nextRoute?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const { setSession, clearSession } = useAuthActions()
  const [rememberEmail, setRememberEmail] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  // 데모 빠른 로그인: 선택한 실제 계정으로 폼을 채우고 즉시 로그인 → 역할 홈으로 이동.
  async function quickLogin(acc: DemoAccount) {
    setValue('email', acc.email, { shouldValidate: true, shouldDirty: true })
    setValue('password', acc.password, {
      shouldValidate: true,
      shouldDirty: true,
    })
    await onSubmit({ email: acc.email, password: acc.password })
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      setCapsLockOn(event.getModifierState('CapsLock'))
    }
    window.addEventListener('keydown', handler)
    window.addEventListener('keyup', handler)
    return () => {
      window.removeEventListener('keydown', handler)
      window.removeEventListener('keyup', handler)
    }
  }, [])

  // 폼 패턴: handleSubmit이 zod 검증 통과 후에만 onSubmit 호출. 제출 단계 에러는 submitError로 분리.
  async function onSubmit({ email, password }: LoginInput) {
    setSubmitError(null)
    try {
      const res = await apiClient.post<LoginResponse>('/auth/login', {
        userId: email,
        password,
      })
      // 로그아웃 없이 /login에서 계정을 교체하는 경우(데모 빠른 로그인 등) 이전 세션의
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

  return (
    <AuthLayout
      brandSlot={
        DEMO_LOGIN_ENABLED ? <DemoQuickLogin onPick={quickLogin} /> : undefined
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-[420px] flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-fg text-[30px] leading-[38px] font-bold">
            로그인
          </h1>
          <p className="text-fg-muted text-sm leading-[22px]">
            계정에 로그인하면 보유 역할에 맞는 첫 화면으로 자동 이동합니다.
          </p>
        </div>

        <Input
          label="아이디"
          required
          type="text"
          autoComplete="username"
          placeholder="이메일 또는 수강생 코드"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="비밀번호"
          required
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              aria-pressed={showPassword}
              className="hover:text-fg flex items-center transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          labelAction={
            <button type="button" className="text-brand text-xs font-medium">
              비밀번호 찾기 →
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            checked={rememberEmail}
            onChange={setRememberEmail}
            label="아이디 기억하기"
          />
          <div
            data-testid="caps-lock-indicator"
            className="bg-surface-muted flex items-center gap-1 rounded-[5px] px-[7px] py-[3px]"
          >
            <Info className="text-fg-muted h-[11px] w-[11px]" />
            <span className="text-fg-muted text-[11px] font-bold">
              Caps Lock {capsLockOn ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {submitError && (
          <p role="alert" className="text-danger text-sm">
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? '로그인 중…' : '로그인'}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-fg-subtle">문제가 있나요?</span>
          <div className="flex items-center gap-[14px] font-medium">
            <span className="text-fg-muted">도움말 센터</span>
            <span className="text-fg-subtle">·</span>
            <span className="text-fg-muted">운영팀 문의</span>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
