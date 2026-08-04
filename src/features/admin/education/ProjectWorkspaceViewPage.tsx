import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { WorkspaceShell } from '@/features/student/projects/workspace/WorkspaceShell'
import { HomeTab } from '@/features/student/projects/workspace/tabs/HomeTab'
import { BoardTab } from '@/features/student/projects/workspace/tabs/BoardTab'
import { CalendarTab } from '@/features/student/projects/workspace/tabs/CalendarTab'
import { MeetingsTab } from '@/features/student/projects/workspace/tabs/MeetingsTab'
import { DocsTab } from '@/features/student/projects/workspace/tabs/DocsTab'
import { IssuesTab } from '@/features/student/projects/workspace/tabs/IssuesTab'
import { OutcomesTab } from '@/features/student/projects/workspace/tabs/OutcomesTab'
import type { WsTab } from '@/features/student/projects/types'
import { useInstructorProjectWorkspace } from '@/features/instructor/education/api'
import { useAdminProjectWorkspace } from './api'

/** 검토자 노출 탭 — 조회 7탭. 상호평가·인증·설정은 제외(인증 검토는 /instructor/projects/review). */
const REVIEW_TABS: WsTab[] = [
  'home',
  'board',
  'calendar',
  'meetings',
  'docs',
  'issues',
  'outcomes',
]

/**
 * 프로젝트 워크스페이스 열람(매니저·강사) — 수강생 워크스페이스 화면을 읽기 전용으로 재사용.
 *
 * <p>기수 허브 '프로젝트' 탭(ProjectsPane) 카드에서 진입한다. 데이터 소스만 역할별 미러로
 * 갈리고 화면은 한 코드(MaterialsPane·CourseHomePane 규약). 강사는 담당 기수만 —
 * BE requireCohortReviewer가 타 기수를 403으로 막는다.</p>
 */
export default function ProjectWorkspaceViewPage({
  source = 'admin',
}: {
  source?: 'admin' | 'instructor'
}) {
  const { cohortId = '', projectId = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const isAdmin = source === 'admin'
  const adminQuery = useAdminProjectWorkspace(isAdmin ? projectId : null)
  const instructorQuery = useInstructorProjectWorkspace(
    isAdmin ? null : projectId,
  )
  const { data, isPending, isError, refetch } = isAdmin
    ? adminQuery
    : instructorQuery

  const raw = params.get('tab')
  const tab: WsTab = (REVIEW_TABS as string[]).includes(raw ?? '')
    ? (raw as WsTab)
    : 'home'
  const setTab = (t: WsTab) => {
    // 탭 안 링크(인증 등)가 검토자 미노출 탭을 가리켜도 이탈하지 않게 여기서 한 번 거른다.
    if (!REVIEW_TABS.includes(t)) return
    setParams(t === 'home' ? {} : { tab: t }, { replace: true })
  }

  const backPath = isAdmin
    ? `/admin/education/${cohortId}?tab=projects`
    : `/instructor/cohorts/${cohortId}/education?tab=projects`

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="워크스페이스를 불러오는 중…"
      errorTitle="워크스페이스를 볼 수 없어요"
      errorDescription="담당 기수의 프로젝트만 열람할 수 있어요. 잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <WorkspaceShell
          title={data.title}
          meta={data.meta}
          startDate={data.startDate}
          endDate={data.endDate}
          active={tab}
          onTab={setTab}
          visibleTabs={REVIEW_TABS}
          readOnly
          backTo={{ label: '프로젝트 목록', onClick: () => navigate(backPath) }}
        >
          {tab === 'home' && <HomeTab d={data} onTab={setTab} readOnly />}
          {tab === 'board' && <BoardTab d={data} readOnly />}
          {tab === 'calendar' && <CalendarTab d={data} readOnly />}
          {tab === 'meetings' && <MeetingsTab d={data} readOnly />}
          {tab === 'docs' && <DocsTab d={data} readOnly />}
          {tab === 'issues' && <IssuesTab d={data} readOnly />}
          {tab === 'outcomes' && <OutcomesTab d={data} readOnly />}
        </WorkspaceShell>
      )}
    </DataBoundary>
  )
}
