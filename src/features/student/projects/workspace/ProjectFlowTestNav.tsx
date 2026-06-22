import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import type { ProjectStatus } from '../types'
import {
  statusToPhase,
  useProjectFlow,
  type ProjectPhase,
} from './useProjectFlow'

// 프로젝트 생애주기 데모(완료 확정·인증 흐름) — FE 목 전용 테스트 컨트롤.
// 워크스페이스 우하단 플로팅 버튼(TestModeFab)으로 노출. 단계는 프로젝트별로 보관돼 목록과 공유된다.
// 학생이 [인증 요청]을 보내면 강사 승인은 여기 [강사 인증 승인]으로 시뮬레이션한다.
// (인증 완료 후 "수정 권한 요청" 흐름의 강사 승인/반려/최종확인 시뮬은 변경 제안 화면 FAB에서 다룬다.)
const PHASE_LABEL: Record<ProjectPhase, string> = {
  active: '작성 중 (완료 확정 전)',
  completed: '작성 완료 · 상호평가 진행',
  reviewing: '인증 검토 중',
  certified: '인증 완료',
}

export function ProjectFlowTestNav({
  projectId,
  status,
}: {
  projectId: string
  status: ProjectStatus
}) {
  const toast = useToast()
  const phase =
    useProjectFlow((s) => s.phases[projectId]) ?? statusToPhase(status)
  const setPhaseFor = useProjectFlow((s) => s.setPhase)
  const setPhase = (p: ProjectPhase) => setPhaseFor(projectId, p)

  const solidBtn =
    'bg-accent-strong rounded-lg px-3 py-2 text-[12px] font-bold text-white'
  const ghostBtn =
    'border-accent-strong/50 text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors'

  return (
    <TestModeFab note="프로젝트 생애주기 (FE 목 · 기간 경과·인증 흐름 시뮬레이션)">
      <span className="text-accent-strong w-full text-[11px] font-semibold">
        현재: {PHASE_LABEL[phase]}
      </span>

      {phase === 'active' && (
        <button
          type="button"
          onClick={() => {
            setPhase('completed')
            toast.success(
              '프로젝트 기간이 종료되어 완료 확정됐어요 · 상호평가가 열렸어요',
            )
          }}
          className={solidBtn}
        >
          ⏩ 기간 경과 · 완료 확정
        </button>
      )}

      {phase === 'completed' && (
        <button
          type="button"
          onClick={() => {
            setPhase('reviewing')
            toast.success('인증을 요청했어요 · 강사 검토 대기')
          }}
          className={solidBtn}
        >
          ▶ 인증 요청 (PM)
        </button>
      )}

      {phase === 'reviewing' && (
        <button
          type="button"
          onClick={() => {
            setPhase('certified')
            toast.success('강사가 인증을 승인했어요 · 인증 완료')
          }}
          className="bg-success rounded-lg px-3 py-2 text-[12px] font-bold text-white"
        >
          ✅ 강사 인증 승인 (시뮬)
        </button>
      )}

      {phase !== 'active' && (
        <button
          type="button"
          onClick={() => {
            setPhase('active')
            toast.info('진행 중 상태로 초기화했어요')
          }}
          className={ghostBtn}
        >
          ↺ 초기화 (진행 중)
        </button>
      )}
    </TestModeFab>
  )
}
