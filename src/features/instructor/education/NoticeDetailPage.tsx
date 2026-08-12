import { useParams } from 'react-router-dom'
import { NoticeDetailView } from './NoticeDetailView'

// 강사 공지 상세 — 허브 '공지' 탭에서 카드를 눌러 들어온다. 화면은 운영과 같은 한 벌.
export default function NoticeDetailPage() {
  const { cohortId = '', noticeId = '' } = useParams()
  return (
    <NoticeDetailView
      cohortId={cohortId}
      noticeId={noticeId}
      backTo={`/instructor/cohorts/${cohortId}/education?tab=notices`}
      editTo={`/instructor/cohorts/${cohortId}/notices/${noticeId}/edit`}
    />
  )
}
