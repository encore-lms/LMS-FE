import { Hourglass, Lock, ShieldOff } from 'lucide-react'
import { VerifyStatusPill, VerifyStatusIcon } from '../components'

/**
 * 비공개 안내 — Figma 541:2907(certified_private) + 상태 변형 2종 겸용(별도 frame 신설 금지,
 * 2026-06-04 확정): public_preparing(공개 준비 중)·verification_disabled(검증 불가).
 *
 * 상세 일체 비노출: 수강생 이름·과정·점수·대표 근거 렌더링 금지(요청자 식별 불가 원칙).
 *
 * 상태 표·안내문·정책 박스는 뺐다 — 이 화면을 보는 사람은 채용 담당자이지 개발자가 아니다.
 * 왜 못 보는지는 제목·부제 두 줄이면 충분하고, isPublic·payload 같은 내부 표현을
 * 외부 검증자에게 보여 줄 이유가 없다.
 */
type Variant = 'private' | 'preparing' | 'disabled'

const COPY: Record<
  Variant,
  { pill: string; icon: React.ReactNode; title: string; subtitle: string }
> = {
  private: {
    pill: '비공개 증명서',
    icon: <Lock size={40} aria-hidden />,
    title: '이 증명서는 비공개 상태입니다',
    subtitle:
      '정식 인증은 완료되었으나 수강생이 외부 공개를 켜지 않아 상세 정보를 표시할 수 없습니다.',
  },
  preparing: {
    pill: '공개 준비 중',
    icon: <Hourglass size={36} aria-hidden />,
    title: '증명서 공개를 준비하고 있습니다',
    subtitle:
      '외부 공개는 켜져 있으나 준비가 아직 끝나지 않았습니다. 잠시 후 같은 URL에서 다시 확인해 주세요.',
  },
  disabled: {
    pill: '검증 불가',
    icon: <ShieldOff size={36} aria-hidden />,
    title: '이 증명서는 검증이 불가합니다',
    subtitle:
      '개인정보 삭제 처리로 검증 토큰이 폐기되어 이 URL에서는 더 이상 검증 결과를 제공하지 않습니다.',
  },
}

export function VerifyPrivateView({ variant }: { variant: Variant }) {
  const c = COPY[variant]
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 px-4 pt-16 pb-[60px]">
      <VerifyStatusPill
        tone="info"
        shape="chip"
        icon={<Lock size={13} aria-hidden />}
      >
        {c.pill}
      </VerifyStatusPill>
      <VerifyStatusIcon tone="info" variant="solid-ring">
        {c.icon}
      </VerifyStatusIcon>
      <h1 className="text-fg w-full text-center text-[28px] leading-9 font-bold">
        {c.title}
      </h1>
      <p className="text-fg-muted max-w-[560px] text-center text-sm leading-[22px]">
        {c.subtitle}
      </p>
    </main>
  )
}
