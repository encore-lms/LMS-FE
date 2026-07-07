import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Mail, ShieldCheck, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useAuthActions } from '@/shared/store'
import { ROLE_LABEL } from '@/shared/constants'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useChangePassword, useCurrentUser } from './api'

// 마이 프로필(전 역할 공용) — 본인 계정 정보 + 비밀번호 변경 (헤더 아바타 드롭다운 §7-X).
// 임시 비밀번호(매니저 발급·1회 표시)를 받은 모든 역할이 여기서 비밀번호를 변경한다.
// 계정 생성·역할 부여는 설정>계정 관리(타인 관리)의 소관이라, 여기선 본인 조회 + 비밀번호 자가 변경만.

interface ProfilePageProps {
  /** 역할 전용 부가 섹션 — 운영은 담당 과정·기수 카드를 주입한다(/admin/courses가 운영 전용 권한이라 본체에 두지 않음). */
  cohortSection?: ReactNode
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '기록 없음'
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

export default function ProfilePage({ cohortSection }: ProfilePageProps) {
  usePageHeader(
    '마이 프로필',
    cohortSection
      ? '내 계정 정보와 담당 기수 · 비밀번호 변경'
      : '내 계정 정보 · 비밀번호 변경',
  )
  const me = useCurrentUser()

  return (
    <div className="p-8">
      <DataBoundary
        isPending={me.isPending}
        isError={me.isError}
        onRetry={() => me.refetch()}
        skeleton={<SkeletonText lines={6} className="max-w-md" />}
      >
        {me.data && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* 좌: 계정 정보 (+역할별 부가 섹션) */}
            <div className="flex flex-col gap-6">
              <section className="border-border bg-surface rounded-xl border p-6">
                <div className="flex items-center gap-4">
                  <span className="bg-brand flex size-14 items-center justify-center rounded-full text-xl font-bold text-white">
                    {me.data.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-fg text-lg font-bold">{me.data.name}</p>
                    <p className="text-fg-muted text-[13px]">{me.data.email}</p>
                  </div>
                  <StatusBadge label={ROLE_LABEL[me.data.role]} tone="info" />
                </div>

                <dl className="border-border mt-5 grid grid-cols-1 gap-x-8 gap-y-4 border-t pt-5 sm:grid-cols-2">
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="이름"
                    value={me.data.name}
                  />
                  <InfoRow
                    icon={<Mail className="h-4 w-4" />}
                    label="이메일"
                    value={me.data.email}
                  />
                  <InfoRow
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="역할"
                    value={ROLE_LABEL[me.data.role]}
                  />
                  <InfoRow
                    icon={<ShieldCheck className="h-4 w-4" />}
                    label="계정 상태"
                    value={
                      me.data.status === 'active' ? '활성' : me.data.status
                    }
                  />
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="최근 로그인"
                    value={fmtDateTime(me.data.lastLoginAt)}
                  />
                </dl>
              </section>

              {cohortSection}
            </div>

            {/* 우: 비밀번호 변경 */}
            <PasswordChangeCard />
          </div>
        )}
      </DataBoundary>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-fg-subtle flex items-center gap-1.5 text-[11.5px] font-semibold">
        {icon}
        {label}
      </dt>
      <dd className="text-fg text-[14px]">{value}</dd>
    </div>
  )
}

// 수강생 프로필(/student/profile, 박준석 영역)에도 합성할 수 있게 export —
// 임시 비밀번호 자가 변경 경로가 수강생에게도 필요하다(후속 협의, 이슈 참조).
export function PasswordChangeCard() {
  const toast = useToast()
  const navigate = useNavigate()
  const { clearSession } = useAuthActions()
  const changePassword = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < 8 || next.length > 72) {
      setError('새 비밀번호는 8자 이상 72자 이하로 입력해 주세요.')
      return
    }
    if (next !== confirm) {
      setError('새 비밀번호가 서로 일치하지 않아요.')
      return
    }
    if (next === current) {
      setError('새 비밀번호가 현재 비밀번호와 같아요.')
      return
    }
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          // 서버가 refresh 쿠키를 만료시키므로 세션을 정리하고 재로그인으로 보낸다.
          toast.success('비밀번호를 변경했어요. 다시 로그인해 주세요.')
          clearSession()
          navigate('/login', { replace: true })
        },
        onError: () =>
          setError('현재 비밀번호가 올바르지 않거나 변경에 실패했어요.'),
      },
    )
  }

  return (
    <section className="border-border bg-surface h-fit rounded-xl border p-6">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="text-fg-muted h-4 w-4" />
        <p className="text-fg text-[15px] font-bold">비밀번호 변경</p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Input
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={error ?? undefined}
          required
        />
        <p className="text-fg-subtle text-[11.5px]">
          변경 후에는 보안을 위해 다시 로그인해야 합니다.
        </p>
        <Button
          type="submit"
          disabled={changePassword.isPending || !current || !next || !confirm}
        >
          {changePassword.isPending ? '변경 중…' : '비밀번호 변경'}
        </Button>
      </form>
    </section>
  )
}
