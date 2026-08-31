import { Navigate, Outlet } from 'react-router-dom'
import { useCertificateAnalysis } from './analysis'
import { CERTIFICATE_DEMO_MODE } from './config'
import { isCertificateReady } from './readiness'

/**
 * 숨긴 메뉴의 URL을 직접 입력해 미완성 증명서에 진입하는 우회 경로도 같은 정본으로 막는다.
 * 로컬 데모 모드는 실제 발급 데이터와 분리된 명시적 개발 도구라 기존 진입을 유지한다.
 */
export function CertificateAccessGate() {
  const analysis = useCertificateAnalysis(
    { scope: 'student' },
    !CERTIFICATE_DEMO_MODE,
  )

  if (CERTIFICATE_DEMO_MODE) return <Outlet />

  if (analysis.isPending) {
    return (
      <div className="text-fg-muted flex min-h-[320px] items-center justify-center text-sm">
        증명서 준비 상태를 확인하는 중입니다.
      </div>
    )
  }

  if (analysis.isError || !isCertificateReady(analysis.data)) {
    return <Navigate to="/student" replace />
  }

  return <Outlet />
}
