import { useParams } from 'react-router-dom'
import { NoticeFormView } from './NoticeFormView'

// 강사 공지 작성·수정 — 허브 '공지' 탭에서 들어온다. 화면은 운영과 같은 한 벌.
// :noticeId 가 있으면 수정 모드(.../notices/:noticeId/edit).
export default function NoticeFormPage() {
  const { cohortId = '', noticeId } = useParams()
  return (
    <NoticeFormView
      cohortId={cohortId}
      noticeId={noticeId}
      backTo={`/instructor/cohorts/${cohortId}/education?tab=notices`}
    />
  )
}
