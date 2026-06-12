import { useParams } from 'react-router-dom'
import { useVerifyCertificate } from '../api/verify'
import { VerifyTopbar } from './components'
import { VerifyLoadingView } from './views/VerifyLoadingView'
import { VerifyPublicView } from './views/VerifyPublicView'
import { VerifyPrivateView } from './views/VerifyPrivateView'
import { VerifyNotCertifiedView } from './views/VerifyNotCertifiedView'
import { VerifyInvalidView } from './views/VerifyInvalidView'
import type { ExternalCertificateVerificationResponse } from './types'

/**
 * 외부 검증(/verify/:publicToken) — 비로그인 public 화면. Figma 외부검증 Pages 5프레임.
 *
 * AppShell·usePageHeader 미사용, 자체 풀스크린 레이아웃(bg surface-muted) + 전용 VerifyTopbar.
 * query pending = 진입 로딩(540:2907), 응답 도착 시 resultType 7종 즉시 분기(최소 표시 시간 없음):
 *  - certified_public(543:2909) 공개 증명서 / certified_private(541:2907) 비공개 안내
 *  - not_certified(3197:183) 미인증 안내 / invalid_token(537:2905) 잘못된 링크
 *  - expired_token → 잘못된 링크 화면 재사용(문서 명시, 로그 resultType만 구분)
 *  - public_preparing·verification_disabled → 비공개 안내 변형 재사용(문서 명시)
 */
function resolveView(
  data: ExternalCertificateVerificationResponse,
  publicToken: string,
) {
  switch (data.resultType) {
    case 'certified_public':
      return <VerifyPublicView result={data} publicToken={publicToken} />
    case 'certified_private':
      return <VerifyPrivateView variant="private" />
    case 'public_preparing':
      return <VerifyPrivateView variant="preparing" />
    case 'verification_disabled':
      return <VerifyPrivateView variant="disabled" />
    case 'not_certified':
      return <VerifyNotCertifiedView />
    case 'invalid_token':
    case 'expired_token':
      return <VerifyInvalidView />
  }
}

export default function VerifyPage() {
  const { publicToken = '' } = useParams()
  const { data, isPending } = useVerifyCertificate(publicToken)

  return (
    <div className="bg-surface-muted flex min-h-screen flex-col">
      <VerifyTopbar />
      {isPending || !data ? (
        // 실패도 200 + resultType이라(명세) 에러 분기는 네트워크 장애뿐 — 로딩 셸 유지.
        // dead-end invalid로 위장하지 않고, 재시도 UI는 BE 계약 확정 시 검토.
        <VerifyLoadingView />
      ) : (
        resolveView(data, publicToken)
      )}
    </div>
  )
}
