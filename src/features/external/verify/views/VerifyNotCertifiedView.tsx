import {
  VerifyStatusPill,
  VerifyStatusIcon,
  VerifyStatusCard,
  VerifyNoticeCard,
  VerifyPolicyBox,
} from '../components'

/**
 * 미인증 안내 — Figma 3197:183. 분기 조건 status != certified
 * (정식 인증 전·검토 중·보완 요청 중). 상세 일체 비노출(수강생·과정·핵심 정보 표시 금지).
 * 'status != certified' 등 개발자식 표기는 Figma 시각 SSOT — 보이는 그대로 렌더.
 */
export function VerifyNotCertifiedView() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 px-4 pt-[82px] pb-[72px]">
      <VerifyStatusPill tone="warning">status != certified</VerifyStatusPill>
      <VerifyStatusIcon tone="warning">!</VerifyStatusIcon>
      <h1 className="text-fg w-full text-center text-[28px] leading-9 font-bold">
        아직 인증이 완료되지 않았습니다
      </h1>
      <p className="text-fg-muted max-w-[560px] text-center text-sm leading-[22px]">
        정식 인증 전, 검토 중, 보완 요청 중인 증명서는 외부 검증 페이지에서 상세
        정보를 표시하지 않습니다.
      </p>
      <VerifyStatusCard
        rows={[
          { label: '표시 조건', value: 'status != certified' },
          {
            label: '인증 단계',
            value: '정식 인증 전 · 검토 중 · 보완 요청 중',
          },
          { label: '외부 노출', value: '수강생·과정·핵심 정보 표시 없음' },
        ]}
      />
      <VerifyNoticeCard>
        이 상태에서는 수강생 이름, 과정, 핵심 정보, 공개 payload, 내부 근거를
        노출하지 않습니다. 인증 완료 후 공개 조건을 만족할 때만 상세 화면으로
        분기합니다.
      </VerifyNoticeCard>
      <VerifyPolicyBox title="외부 검증 페이지 정책">
        로그인 없이 접근 · 공개 payload만 사용 · 내부 근거 노출 없음 ·
        비공개·미인증 상태에서 상세 정보 렌더링 없음
      </VerifyPolicyBox>
    </main>
  )
}
