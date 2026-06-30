import { useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { useProjectWorkspace } from '../../api/projects'
import type { WsTab } from '../types'
import { ProjectFlowTestNav } from './ProjectFlowTestNav'
import { WorkspaceShell } from './WorkspaceShell'
import { HomeTab } from './tabs/HomeTab'
import { BoardTab } from './tabs/BoardTab'
import { CalendarTab } from './tabs/CalendarTab'
import { MeetingsTab } from './tabs/MeetingsTab'
import { DocsTab } from './tabs/DocsTab'
import { IssuesTab } from './tabs/IssuesTab'
import { TeamTab } from './tabs/TeamTab'
import { OutcomesTab } from './tabs/OutcomesTab'
import { PeerTab } from './tabs/PeerTab'
import { CertTab } from './tabs/CertTab'

const TABS: WsTab[] = [
  'home',
  'board',
  'calendar',
  'meetings',
  'docs',
  'issues',
  'team',
  'outcomes',
  'peer-evaluation',
  'certification',
]

// 프로젝트 워크스페이스 (/student/projects/:projectId ?tab=) — Figma 342:1032 외 9탭.
// 셸 + 탭 라우팅만 담당. 각 탭 화면은 ./tabs/*, 공용 프리미티브는 ./components/ws-shared.
export default function WorkspacePage() {
  const { projectId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: WsTab = (TABS as string[]).includes(raw ?? '')
    ? (raw as WsTab)
    : 'home'
  const { data, isPending, isError, refetch } = useProjectWorkspace(projectId)

  if (isPending)
    return <div className="text-fg-muted p-8">워크스페이스를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="워크스페이스를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const setTab = (t: WsTab) =>
    setParams(t === 'home' ? {} : { tab: t }, { replace: true })

  return (
    <>
      <WorkspaceShell
        title={data.title}
        meta={data.meta}
        active={tab}
        onTab={setTab}
      >
        {tab === 'home' && <HomeTab d={data} onTab={setTab} />}
        {tab === 'board' && <BoardTab d={data} />}
        {tab === 'calendar' && <CalendarTab d={data} />}
        {tab === 'meetings' && <MeetingsTab d={data} />}
        {tab === 'docs' && <DocsTab d={data} />}
        {tab === 'issues' && <IssuesTab d={data} />}
        {tab === 'team' && <TeamTab d={data} />}
        {tab === 'outcomes' && <OutcomesTab d={data} />}
        {tab === 'peer-evaluation' && <PeerTab d={data} />}
        {tab === 'certification' && <CertTab d={data} />}
      </WorkspaceShell>
      <ProjectFlowTestNav projectId={projectId} status={data.status} />
    </>
  )
}
