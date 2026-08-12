import type { CertifiedPublicResult } from '../types'
import { VerifyCertificateDoc } from './VerifyCertificateDoc'

/**
 * 공개 증명서 — 증명서 본문만 보여준다.
 *
 * <p>수강생 미리보기와 같은 히어로·탭·탭 콘텐츠를 그대로 쓴다.
 * 상단에 따로 두던 진본 배너(정식 발급 문구·해시·발급기관·인증일)는 뺐다 —
 * 인증 상태·검증 ID 는 증명서 히어로가 이미 보여준다(2026-08-12 요청).</p>
 */
export function VerifyPublicView({
  result,
}: {
  result: CertifiedPublicResult
  publicToken: string
}) {
  return (
    // 최대 1440 까지 넓히고 그 아래는 화면을 따라 줄인다. 여백도 폭에 맞춰 단계적으로.
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 pt-8 pb-[60px] sm:px-6 lg:px-8 lg:pt-12">
      <VerifyCertificateDoc
        payload={result.publicPayload}
        verificationId={result.verificationId}
      />
    </main>
  )
}
