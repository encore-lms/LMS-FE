import { usePageHeader } from '@/shared/store'

// 강사 홈 placeholder — features/instructor 소유자가 채운다. 제목은 공유 헤더에 등록.
export default function InstructorHome() {
  usePageHeader(
    '강사 홈',
    '준비 중 — features/instructor/ 에 화면을 추가하세요.',
  )
  return null
}
