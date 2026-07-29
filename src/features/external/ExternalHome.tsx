import { usePageHeader } from '@/shared/store'

// 외부 검증 홈 placeholder — features/external 소유자가 채운다. 제목은 공유 헤더에 등록.
export default function ExternalHome() {
  usePageHeader(
    '외부 검증 홈',
    '준비 중 — features/external/ 에 화면을 추가하세요.',
  )
  return null
}
