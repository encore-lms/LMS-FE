import { Info, XCircle } from 'lucide-react'
import {
  VerifyStatusPill,
  VerifyStatusIcon,
  VerifyNoticeCard,
  VerifyPolicyBox,
} from '../components'

const CASES = [
  'URL을 복사·붙여넣기 중 일부가 잘렸을 때',
  '발급자가 검증 토큰을 재발급해 이전 링크가 만료됐을 때',
  '토큰 형식이 올바르지 않거나 변조됐을 때',
]

/**
 * 잘못된 링크 안내 — Figma 537:2905. invalid_token + expired_token이 화면을 공유한다
 * (문서 명시: 만료 토큰은 화면 재사용, 로그 resultType만 구분).
 * Figma 그대로 dead-end — 버튼·링크 없음. 토큰 원문·certificateId·학생 정보 비노출.
 */
export function VerifyInvalidView() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-5 px-4 pt-16 pb-[60px]">
      <VerifyStatusPill
        tone="danger"
        shape="chip"
        icon={<XCircle size={13} aria-hidden />}
      >
        INVALID LINK · 검증 실패
      </VerifyStatusPill>
      <VerifyStatusIcon tone="danger" variant="solid-ring">
        <XCircle size={36} aria-hidden />
      </VerifyStatusIcon>
      <h1 className="text-fg w-full text-center text-[28px] leading-9 font-bold">
        잘못된 검증 링크입니다
      </h1>
      <p className="text-fg-muted max-w-[560px] text-center text-sm leading-[22px]">
        토큰이 누락되었거나, 해당 토큰에 해당하는 증명서가 존재하지 않습니다.
        <br />
        링크를 다시 확인하거나 발급자에게 새 검증 URL을 요청해 주세요.
      </p>
      {/* '이런 경우에 표시됩니다' 카드 — Figma 2815:255. 불릿 = 6px danger 원. */}
      <div className="border-border bg-surface w-full rounded-[14px] border pb-4 shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <div className="text-fg flex items-center gap-1.5 px-[18px] pt-3.5 pb-2.5 text-xs font-bold">
          <Info size={13} aria-hidden />
          이런 경우에 표시됩니다
        </div>
        {CASES.map((text) => (
          <div key={text} className="flex items-center gap-2 px-[18px] py-1.5">
            <span
              className="bg-danger size-1.5 shrink-0 rounded-full"
              aria-hidden
            />
            <span className="text-fg-muted flex-1 text-xs leading-[18px] font-medium">
              {text}
            </span>
          </div>
        ))}
      </div>
      <VerifyNoticeCard variant="strip">
        증명서 발급자가 PLAYDATA 수강생이라면, 발급자의 &quot;공개 설정&quot;
        화면에서 검증 URL을 다시 복사해 보내달라고 요청하세요
      </VerifyNoticeCard>
      <VerifyPolicyBox title="외부 검증 페이지 정책" withIcon>
        로그인 없이 접근 · 공개 payload만 사용 · 내부 근거 노출 없음 ·
        비공개·미인증 상태에서 상세 정보 렌더링 없음
      </VerifyPolicyBox>
    </main>
  )
}
