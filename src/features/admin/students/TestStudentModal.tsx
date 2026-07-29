import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import { useCreateTestStudent } from '../api/students'

// 로그인 ID 규칙은 BE 검증(4~60자, 영문·숫자와 . _ - @)과 같아야 한다.
// 화면에서 먼저 걸러 주면 서버 왕복 없이 바로 알 수 있다.
const LOGIN_ID_PATTERN = /^[A-Za-z0-9._@-]{4,60}$/
const PASSWORD_MIN = 8

// 시연·검증용 수강생 계정 생성 — 촬영 중 계정이 하나 더 필요할 때 쓴다.
// 로그인 ID·비밀번호는 운영자가 직접 정한다(바로 로그인해야 해서 기억할 수 있는 값이 낫다).
export function TestStudentModal({
  open,
  cohortId,
  cohortLabel,
  onClose,
}: {
  open: boolean
  /** 계정을 배정할 기수 — 화면에서 선택 중인 기수를 그대로 쓴다. */
  cohortId: string | null
  cohortLabel: string
  onClose: () => void
}) {
  const toast = useToast()
  const create = useCreateTestStudent()
  const [name, setName] = useState('')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')

  const loginIdOk = LOGIN_ID_PATTERN.test(loginId.trim())
  const passwordOk = password.length >= PASSWORD_MIN
  const canSubmit =
    !!name.trim() && loginIdOk && passwordOk && !!cohortId && !create.isPending

  const close = () => {
    setName('')
    setLoginId('')
    setPassword('')
    onClose()
  }

  const submit = () => {
    if (!canSubmit || !cohortId) return
    create.mutate(
      { name: name.trim(), loginId: loginId.trim(), password, cohortId },
      {
        onSuccess: (account) => {
          toast.success(`${account.loginId} 계정을 만들었어요`)
          close()
        },
        // 서버는 이미 쓰이는 로그인 ID를 409로 거절한다.
        onError: (error) =>
          toast.danger(
            /409|중복|이미/.test(String(error?.message))
              ? '이미 쓰이고 있는 로그인 ID예요'
              : '테스트 계정 생성에 실패했어요',
          ),
      },
    )
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={close}
      onConfirm={submit}
      size="md"
      title="테스트 계정 만들기"
      confirmLabel={create.isPending ? '만드는 중…' : '계정 만들기'}
      confirmDisabled={!canSubmit}
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted text-[13px] leading-6">
          시연·검증용 계정입니다. 수강생에게는 동료 평가 대상이나 멘토링 팀원
          명단에 보이지 않고, 언제든 목록에서 삭제할 수 있어요.
        </p>

        <Field label="이름">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 촬영용 수강생"
            maxLength={100}
            className={inputClass()}
          />
        </Field>

        <Field
          label="로그인 ID"
          hint="영문·숫자와 . _ - @ 만, 4자 이상"
          invalid={!!loginId && !loginIdOk}
        >
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="예: demo-student"
            autoComplete="off"
            maxLength={60}
            className={inputClass({ invalid: !!loginId && !loginIdOk })}
          />
        </Field>

        <Field
          label="비밀번호"
          hint={`${PASSWORD_MIN}자 이상`}
          invalid={!!password && !passwordOk}
        >
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            type="text"
            placeholder="예: demo1234"
            autoComplete="off"
            maxLength={72}
            className={inputClass({ invalid: !!password && !passwordOk })}
          />
        </Field>

        <div className="flex items-center gap-2 text-[12px]">
          <UserPlus className="text-fg-subtle size-3.5" />
          <span className="text-fg-muted">
            배정 기수 <span className="text-fg font-bold">{cohortLabel}</span>
          </span>
        </div>
      </div>
    </ConfirmDialog>
  )
}

function Field({
  label,
  hint,
  invalid,
  children,
}: {
  label: string
  hint?: string
  invalid?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2">
        <span className="text-fg text-[12px] font-bold">{label}</span>
        {hint && (
          <span
            className={
              invalid ? 'text-danger text-[11px]' : 'text-fg-subtle text-[11px]'
            }
          >
            {hint}
          </span>
        )}
      </span>
      {children}
    </label>
  )
}
