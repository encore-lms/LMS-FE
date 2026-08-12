import { useParams, useSearchParams } from 'react-router-dom'
import { NoticeDetailView } from '@/features/instructor/education/NoticeDetailView'

// 운영 공지 상세 — 기수 허브 '공지' 탭에서 카드를 눌러 들어온다. 화면은 강사와 같은 한 벌.
// cohortId 는 쿼리로 받는다(이력서 상세와 같은 컨벤션) — 정적 세그먼트가 :cohortId 앞에 온다.
export default function NoticeDetailPage() {
  const { noticeId = '' } = useParams()
  const [params] = useSearchParams()
  const cohortId = params.get('cohortId') ?? ''
  return (
    <NoticeDetailView
      cohortId={cohortId}
      noticeId={noticeId}
      backTo={`/admin/education/${cohortId}?tab=notices`}
      editTo={`/admin/education/notices/${noticeId}/edit?cohortId=${cohortId}`}
    />
  )
}
