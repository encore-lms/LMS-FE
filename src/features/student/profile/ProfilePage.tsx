import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { usePageHeader } from '@/shared/store'
import { PasswordChangeCard } from '@/features/profile/ProfilePage'
import { useStudentProfile } from '../api/profile'
import { ProfileForm } from './components/ProfileForm'

/**
 * 마이 프로필 (/student/profile) — 증명서·외부 공개용 기본 정보·이미지·URL·스킬·공개 설정 관리.
 * 데이터/상태만 여기서 다루고, 편집 폼/영역은 components/* 가 그린다(영역별 격리).
 */
export default function ProfilePage() {
  const { data, isPending, isError, refetch } = useStudentProfile()
  usePageHeader('마이 프로필')

  return (
    <>
      {isPending ? (
        <div className="text-fg-muted p-8">프로필을 불러오는 중…</div>
      ) : isError ? (
        <div className="p-8">
          <Empty
            title="프로필을 불러오지 못했어요"
            description="잠시 후 다시 시도해 주세요."
            action={<Button onClick={() => refetch()}>다시 시도</Button>}
          />
        </div>
      ) : (
        <ProfileForm profile={data} />
      )}
      {/* 계정 보안 — 매니저 발급 임시 비밀번호(1회 표시) 수령 후 자가 변경 경로(#374).
          공개 프로필 폼과 별개 도메인(auth)이라 폼 밖 독립 섹션으로 두고(중첩 form 방지),
          공개 프로필 조회 실패/로딩과 무관하게 항상 렌더한다(임시 비밀번호 변경 경로 보장). */}
      <div className="grid grid-cols-1 gap-6 px-8 pb-8 lg:grid-cols-2">
        <PasswordChangeCard />
      </div>
    </>
  )
}
