import {
  Check,
  EyeOff,
  Hourglass,
  Info,
  Lock,
  ShieldOff,
  XCircle,
} from 'lucide-react'
import {
  VerifyStatusPill,
  VerifyStatusIcon,
  VerifyStatusCard,
  VerifyNoticeCard,
  VerifyPolicyBox,
  type VerifyStatusRow,
} from '../components'

/**
 * 비공개 안내 — Figma 541:2907(certified_private) + 상태 변형 2종 겸용(별도 frame 신설 금지,
 * 2026-06-04 확정): public_preparing(공개 준비 중)·verification_disabled(검증 불가).
 * TODO(회고 제안): preparing/disabled 변형은 Figma 변형 프레임 부재 — 문구는
 * 증명서_검증.md('공개 준비 중'/'검증 불가' 분리 기술) 기반. 디자인 확정 시 정합.
 *
 * 상세 일체 비노출: 수강생 이름·과정·점수·대표 근거 렌더링 금지(요청자 식별 불가 원칙).
 */
type Variant = 'private' | 'preparing' | 'disabled'

const COPY: Record<
  Variant,
  {
    pill: string
    icon: React.ReactNode
    title: string
    subtitle: string
    rows: VerifyStatusRow[]
    notice: string
  }
> = {
  private: {
    pill: 'certified · isPublic = false',
    icon: <Lock size={36} aria-hidden />,
    title: '이 증명서는 비공개 상태입니다',
    subtitle:
      '정식 인증은 완료되었으나 수강생이 외부 공개를 켜지 않아 상세 정보를 표시할 수 없습니다.',
    rows: [
      {
        label: '인증 상태',
        value: 'certified — 정식 인증 완료',
        icon: <Check size={16} aria-hidden />,
        iconTone: 'success',
      },
      {
        label: '공개 상태',
        value: 'isPublic = false — 수강생이 공개를 켜지 않음',
        icon: <EyeOff size={16} aria-hidden />,
        iconTone: 'info',
      },
      {
        label: '외부 노출 정보',
        value: '없음 (요청자 식별 불가하게 상세 비표시)',
        icon: <XCircle size={16} aria-hidden />,
        iconTone: 'danger',
      },
    ],
    notice:
      '증명서 발급자에게 마이 프로필 → 공개 설정에서 외부 공개를 켜달라고 요청해 주세요. 공개 허용 시 같은 URL로 정보가 표시됩니다',
  },
  preparing: {
    pill: 'certified · 공개 준비 중',
    icon: <Hourglass size={36} aria-hidden />,
    title: '증명서 공개를 준비하고 있습니다',
    subtitle:
      '외부 공개는 켜져 있으나 공개 payload 생성이 아직 완료되지 않았습니다. 잠시 후 같은 URL에서 다시 확인해 주세요.',
    rows: [
      {
        label: '인증 상태',
        value: 'certified — 정식 인증 완료',
        icon: <Check size={16} aria-hidden />,
        iconTone: 'success',
      },
      {
        label: '공개 상태',
        value: 'isPublic = true — 활성 공개 payload 생성 대기',
        icon: <Hourglass size={16} aria-hidden />,
        iconTone: 'info',
      },
      {
        label: '외부 노출 정보',
        value: '없음 (요청자 식별 불가하게 상세 비표시)',
        icon: <XCircle size={16} aria-hidden />,
        iconTone: 'danger',
      },
    ],
    notice:
      '공개 payload가 준비되면 같은 URL에서 공개 증명서가 표시됩니다. 잠시 후 다시 확인해 주세요.',
  },
  disabled: {
    pill: 'publicToken 폐기 · 검증 불가',
    icon: <ShieldOff size={36} aria-hidden />,
    title: '이 증명서는 검증이 불가합니다',
    subtitle:
      '개인정보 삭제 처리로 검증 토큰이 폐기되어 이 URL에서는 더 이상 검증 결과를 제공하지 않습니다.',
    rows: [
      {
        label: '토큰 상태',
        value: 'publicTokenStatus = disabled — 재활성화·재사용 불가',
        icon: <ShieldOff size={16} aria-hidden />,
        iconTone: 'danger',
      },
      {
        label: '처리 사유',
        value: 'Privacy Erasure — 개인정보 삭제 처리',
        icon: <Info size={16} aria-hidden />,
        iconTone: 'info',
      },
      {
        label: '외부 노출 정보',
        value: '없음 (차단 결과만 기록)',
        icon: <XCircle size={16} aria-hidden />,
        iconTone: 'danger',
      },
    ],
    notice:
      '폐기된 검증 토큰은 다시 활성화되지 않습니다. 검증이 필요하면 발급자에게 새 검증 URL을 요청해 주세요.',
  },
}

export function VerifyPrivateView({ variant }: { variant: Variant }) {
  const c = COPY[variant]
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 px-4 pt-16 pb-[60px]">
      <VerifyStatusPill tone="info" icon={<Lock size={13} aria-hidden />}>
        {c.pill}
      </VerifyStatusPill>
      <VerifyStatusIcon tone="info">{c.icon}</VerifyStatusIcon>
      <h1 className="text-fg w-full text-center text-[28px] leading-9 font-bold">
        {c.title}
      </h1>
      <p className="text-fg-muted max-w-[560px] text-center text-sm leading-[22px]">
        {c.subtitle}
      </p>
      <VerifyStatusCard rows={c.rows} />
      <VerifyNoticeCard variant="strip">{c.notice}</VerifyNoticeCard>
      <VerifyPolicyBox title="외부 검증 페이지 정책" withIcon>
        로그인 없이 접근 · 공개 payload만 사용 · 내부 근거 노출 없음 ·
        비공개·미인증 상태에서 상세 정보 렌더링 없음
      </VerifyPolicyBox>
    </main>
  )
}
