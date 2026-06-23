import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import { applyTsStatus } from '../flow'
import type { TsStatus } from '../types'

// 트러블슈팅 인증 흐름 데모 — FE 목 전용 테스트 컨트롤(사례 상세 우하단 FAB).
// 학생이 '사례 저장'(또는 '인증 요청')으로 검토 중(reviewing)으로 제출하면,
// 강사 인증 승인(reviewing → certified)을 여기서 시뮬레이션한다.
// (프로젝트 ProjectFlowTestNav · 증명서 CertRequestTestNav 와 동일한 규약)
// BE 연동·강사 검토 화면 연결 시 이 컨트롤과 flow.ts 시뮬은 제거한다.
const LABEL: Record<TsStatus, string> = {
  draft: '작성 중',
  reviewing: '검토 중 · 강사 승인 대기',
  certified: '인증 완료',
}

export function TsFlowTestNav({
  id,
  status,
}: {
  id: string
  status: TsStatus
}) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const solidBtn =
    'bg-success rounded-lg px-3 py-2 text-[12px] font-bold text-white'
  const ghostBtn =
    'border-accent-strong/50 text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors'

  return (
    <TestModeFab note="트러블슈팅 인증 흐름 (FE 목 · 강사 인증 시뮬레이션)">
      <span className="text-accent-strong w-full text-[11px] font-semibold">
        현재: {LABEL[status]}
      </span>

      {status === 'draft' && (
        <button
          type="button"
          onClick={() => {
            applyTsStatus(queryClient, id, 'reviewing')
            toast.success('검토 요청을 보냈어요 · 강사 검토 대기')
          }}
          className="bg-accent-strong rounded-lg px-3 py-2 text-[12px] font-bold text-white"
        >
          ▶ 검토 요청 (시뮬)
        </button>
      )}

      {status === 'reviewing' && (
        <button
          type="button"
          onClick={() => {
            applyTsStatus(queryClient, id, 'certified')
            toast.success('강사가 인증을 승인했어요 · 인증 완료')
          }}
          className={solidBtn}
        >
          🧑‍🏫 강사 인증 승인 (시뮬)
        </button>
      )}

      {status !== 'draft' && (
        <button
          type="button"
          onClick={() => {
            applyTsStatus(queryClient, id, 'draft')
            toast.info('작성 중 상태로 초기화했어요')
          }}
          className={ghostBtn}
        >
          ↺ 초기화 (작성 중)
        </button>
      )}
    </TestModeFab>
  )
}
