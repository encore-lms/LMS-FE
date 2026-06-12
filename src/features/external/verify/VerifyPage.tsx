import {
  VerifyTopbar,
  VerifyStatusPill,
  VerifyStatusIcon,
  VerifyStatusCard,
  VerifyNoticeCard,
  VerifyPolicyBox,
} from './components'

/**
 * 외부 검증 — 검증 URL 진입(/verify/:publicToken) 로딩 셸. Figma 540:2907.
 *
 * 비로그인 public 화면: AppShell·usePageHeader 미사용, 자체 풀스크린 레이아웃(bg surface-muted).
 * 이 PR(public 마운트 구조)에서는 진입 로딩의 정적 마크업만 렌더한다 —
 * publicToken 검증 API 호출과 resultType 7종 분기(공개/비공개/미인증/잘못된 링크 등)는 후속 PR.
 * 분기 완료 전에는 수강생 이름·과정·핵심 정보·공개 payload·내부 근거를 렌더링하지 않는다(명세 요구).
 */
export default function VerifyPage() {
  return (
    <div className="bg-surface-muted flex min-h-screen flex-col">
      <VerifyTopbar />
      {/* 본문 640 고정(Figma 1440 기준) — max-w·px는 좁은 뷰포트 최소 안전장치(모바일 정식 대응은 회고 안건). */}
      <main
        className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 px-4 pt-[94px] pb-[72px]"
        role="status"
      >
        <VerifyStatusPill tone="info">
          VERIFYING TOKEN · 자동 분기
        </VerifyStatusPill>
        <VerifyStatusIcon tone="info">...</VerifyStatusIcon>
        <h1 className="text-fg w-full text-center text-[28px] leading-9 font-bold">
          검증 정보를 확인하고 있습니다
        </h1>
        <p className="text-fg-muted max-w-[560px] text-center text-sm leading-[22px]">
          검증 토큰을 확인한 뒤 공개, 비공개, 미인증, 잘못된 링크 상태로 자동
          분기합니다.
        </p>
        <VerifyStatusCard
          rows={[
            { label: '확인 대상', value: 'publicToken 유효성' },
            {
              label: '분기 결과',
              value: '공개 / 비공개 / 미인증 / 잘못된 링크',
            },
            { label: '상세 노출', value: '분기 완료 전 표시 없음' },
          ]}
        />
        <VerifyNoticeCard>
          분기 전 화면에서는 수강생 이름, 과정, 핵심 정보, 공개 payload, 내부
          검증 근거를 렌더링하지 않습니다.
        </VerifyNoticeCard>
        <VerifyPolicyBox title="외부 검증 페이지 정책">
          로그인 없이 접근 · 공개 payload만 사용 · 내부 근거 노출 없음 ·
          비공개·미인증 상태에서 상세 정보 렌더링 없음
        </VerifyPolicyBox>
      </main>
    </div>
  )
}
