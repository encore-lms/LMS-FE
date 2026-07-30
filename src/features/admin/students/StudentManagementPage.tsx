import { usePageHeader } from '@/shared/store'
import { StudentsPane } from './StudentsPane'

// 운영 학생 관리 (/admin/students) — 계정·출결·출결 폼 3탭. (Figma Main Flow 09)
// MANAGER 전용: HRD-Net 명단 동기화·계정 관제 + 출결/출결 폼 검토를 한 화면에 묶는다.
// 본문은 StudentsPane 이 갖고 있고, 기수 허브의 '수강생' 탭도 같은 본문을 쓴다.
export default function StudentManagementPage() {
  usePageHeader('학생 관리', '수강생 명단과 출결을 확인하고 계정을 관리합니다')

  return (
    <div className="p-8">
      <StudentsPane />
    </div>
  )
}
