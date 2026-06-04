import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useStudentProfile } from '../api/profile'
import { ProfileForm } from './components/ProfileForm'

/**
 * 마이 프로필 (/student/profile) — 증명서·외부 공개용 기본 정보·이미지·URL·스킬·공개 설정 관리.
 * 데이터/상태만 여기서 다루고, 편집 폼/영역은 components/* 가 그린다(영역별 격리).
 */
export default function ProfilePage() {
  const { data, isPending, isError, refetch } = useStudentProfile()

  if (isPending) {
    return <div className="text-fg-muted p-8">프로필을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <div className="p-8">
        <Empty
          title="프로필을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  return <ProfileForm profile={data} />
}
