import { createContext, useContext } from 'react'

// 공개 검증 문서 모드 — 증명서 탭 컴포넌트를 /verify 에서 재사용할 때 켠다.
// 외부 검증자는 LMS 계정이 없으므로 내부 화면(기록실·프로젝트 등)으로의
// 이동 링크를 전부 정적 카드로 바꿔야 한다(클릭 시 로그인 화면으로 튕긴다).
export const CertPublicDocContext = createContext(false)

export function useIsPublicCertDoc() {
  return useContext(CertPublicDocContext)
}
