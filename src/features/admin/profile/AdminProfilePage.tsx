import ProfilePage from '@/features/profile/ProfilePage'
import { MyCohortsSection } from './MyCohortsSection'

// 운영 매니저 마이 페이지 (/admin/profile) — 공용 ProfilePage에 담당 과정·기수 카드를 주입.
export default function AdminProfilePage() {
  return <ProfilePage cohortSection={<MyCohortsSection />} />
}
