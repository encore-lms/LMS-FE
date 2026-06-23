import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { TestModeFab } from '@/components/dev/TestModeFab'
import { PlayStateModal, type PlayExceptionState } from './PlayStateModal'

// PLAY 예외 상태 모달 시뮬레이터 — FE 목 전용. Figma 3370:5976 "states" 명세를 상태별 모달로 띄운다.
// 실제로는 저장 실패(결과 저장 mutation 실패)·제시문 없음(세션 활성 제시문 0)·기능 미사용(playEnabled=false)
// 조건에서 자동 노출된다. BE 연동 시 각 트리거로 교체하고 이 테스트 컨트롤은 사용처와 함께 제거한다.
const LABEL: Record<PlayExceptionState, string> = {
  'save-failed': '저장 실패',
  'no-prompt': '제시문 없음',
  'feature-off': '기능 미사용',
}

export function PlayStateTestNav({ states }: { states: PlayExceptionState[] }) {
  const toast = useToast()
  const [state, setState] = useState<PlayExceptionState | null>(null)

  return (
    <>
      <TestModeFab note="PLAY 결과·예외 상태 모달 (FE 목 · 상태별 모달 시뮬레이션)">
        {states.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className="border-accent-strong/50 text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors"
          >
            {LABEL[s]} 모달
          </button>
        ))}
      </TestModeFab>

      <PlayStateModal
        state={state}
        onClose={() => setState(null)}
        onRetry={() => {
          setState(null)
          toast.success('결과 저장을 다시 시도했어요.')
        }}
        onContact={() => {
          setState(null)
          toast.info('운영자에게 문의를 전달했어요.')
        }}
      />
    </>
  )
}
