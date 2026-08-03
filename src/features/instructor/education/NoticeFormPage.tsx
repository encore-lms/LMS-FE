import { useParams } from 'react-router-dom'
import { NoticeFormView } from './NoticeFormView'

// 강사 공지 작성 — 허브 '공지' 탭에서 들어온다. 화면은 운영과 같은 한 벌.
export default function NoticeFormPage() {
  const { cohortId = '' } = useParams()
  return (
    <NoticeFormView
      cohortId={cohortId}
      backTo={`/instructor/cohorts/${cohortId}/education?tab=notices`}
    />
  )
}
