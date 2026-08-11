import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, Info, Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from './AuthLayout'
import { DemoQuickLogin } from './DemoQuickLogin'
import { DEMO_LOGIN_ENABLED, type DemoAccount } from './demoAccounts'
import { QA_ACCOUNTS } from './qaAccounts'
import { loginSchema, type LoginInput } from './login.schema'
import { useLoginSubmit } from './useLoginSubmit'

export function LoginPage() {
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

  return (
    <AuthLayout
      brandSlot={
        DEMO_LOGIN_ENABLED ? (
          // 데모(시연 데이터)와 QA(개발·테스트) 두 그룹 — /login2 폐쇄(08-11 시연 종료)로
          // 한 입구에 모았다. 단일 세션 정책상 같은 계정 동시 로그인은 서로를 끊으므로
          // 여럿이 쓸 때는 서로 다른 계정을 잡는다.
          <div className="flex flex-col gap-5">
            <DemoQuickLogin onPick={quickLogin} />
            <DemoQuickLogin
              onPick={quickLogin}
              accounts={QA_ACCOUNTS}
              title="QA 계정 · 개발·테스트용"
              showStyleguideLink={false}
            />
          </div>
        ) : undefined
      }
    >
      <form
        noValidate
        onSubmit={handleSubmit(submit)}
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
