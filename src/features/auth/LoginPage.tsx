import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from './AuthLayout'
import { DemoQuickLogin } from './DemoQuickLogin'
import { DEMO_LOGIN_ENABLED, type DemoAccount } from './demoAccounts'
import { MEETING_ACCOUNTS } from './meetingAccounts'
import { loginSchema, type LoginInput } from './login.schema'
import { useLoginSubmit } from './useLoginSubmit'

interface LoginPageProps {
  /**
   * meeting = /login2 개발자 회의용 — 빠른 로그인이 시연용 데모 계정 대신 QA 계정으로
   * 바뀌고 상단에 회의용 표식이 붙는다. 시연 중 데모 계정 오클릭(단일 세션이라 시연
   * 세션이 즉시 끊김)을 막기 위한 분리 입구로, 로그인 동작 자체는 동일하다.
   */
  variant?: 'demo' | 'meeting'
}

export function LoginPage({ variant = 'demo' }: LoginPageProps) {
  const isMeeting = variant === 'meeting'
  const { submit, submitError } = useLoginSubmit()
  const [rememberEmail, setRememberEmail] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  // 빠른 로그인: 선택한 실제 계정으로 폼을 채우고 즉시 로그인 → 역할 홈으로 이동.
  async function quickLogin(acc: DemoAccount) {
    setValue('email', acc.email, { shouldValidate: true, shouldDirty: true })
    setValue('password', acc.password, {
      shouldValidate: true,
      shouldDirty: true,
    })
    await submit({ email: acc.email, password: acc.password })
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

  // 회의용 입구는 빠른 로그인 게이트가 꺼진 빌드에서 존재 이유가 없다 — 기본 로그인으로 돌려보낸다.
  if (isMeeting && !DEMO_LOGIN_ENABLED) return <Navigate to="/login" replace />

  return (
    <AuthLayout
      brandSlot={
        DEMO_LOGIN_ENABLED ? (
          <DemoQuickLogin
            onPick={quickLogin}
            accounts={isMeeting ? MEETING_ACCOUNTS : undefined}
            title={
              isMeeting ? '회의용 QA 계정 · 클릭하면 바로 입장' : undefined
            }
          />
        ) : undefined
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className="flex w-[420px] flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          {isMeeting && (
            <span className="bg-brand/10 text-brand w-fit rounded-[6px] px-2 py-1 text-xs font-bold">
              개발자 회의용 — 시연 계정 사용 금지
            </span>
          )}
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
