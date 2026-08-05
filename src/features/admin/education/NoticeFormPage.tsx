import { useParams, useSearchParams } from 'react-router-dom'
import { NoticeFormView } from '@/features/instructor/education/NoticeFormView'

// 운영 공지 작성·수정 — 기수 허브 '공지' 탭에서 들어온다. 화면은 강사와 같은 한 벌.
// cohortId 는 쿼리로 받는다(상세와 같은 컨벤션) — 정적 세그먼트가 :cohortId 앞에 온다.
// :noticeId 가 있으면 수정 모드(education/notices/:noticeId/edit).
export default function NoticeFormPage() {
  const [params] = useSearchParams()
  const { noticeId } = useParams()
  const cohortId = params.get('cohortId') ?? ''
  return (
    <NoticeFormView
      cohortId={cohortId}
      noticeId={noticeId}
      backTo={`/admin/education/${cohortId}?tab=notices`}
    />
  )
}
