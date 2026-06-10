import { usePageHeader } from '@/shared/store'

// 멘토 홈 placeholder — features/mentor 소유자가 채운다. 제목은 공유 헤더에 등록.
export default function MentorHome() {
  usePageHeader('멘토 홈', '준비 중 — features/mentor/ 에 화면을 추가하세요.')
  return null
}
