import { useParams } from 'react-router-dom'
import { NoticeDetailView } from '@/features/instructor/education/NoticeDetailView'

// 교육과정 공지 상세(수강생) — 스태프와 같은 한 벌(NoticeDetailView)을 읽기 전용으로 소비(2026-08-05).
export default function NoticeDetailPage() {
  const { noticeId = '' } = useParams()
  return (
    <NoticeDetailView
      source="student"
      noticeId={noticeId}
      backTo="/student/course/notices"
    />
  )
}
