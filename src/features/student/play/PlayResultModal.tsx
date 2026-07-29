import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// PLAY 결과 모달 — Figma 3370:5976 "결과 화면(서버 계산 결과)" 상태를 모달로 구현.
// 게임 종료 시 컴팩트 결과(KPI 4)를 띄우고, 자세한 분석·랭킹은 결과 페이지("자세히 보기")로 넘긴다.
export interface PlayResultMetric {
  label: string
  value: string
}

interface PlayResultModalProps {
  open: boolean
  onClose: () => void
  metrics: PlayResultMetric[]
  /** 다시 플레이 — 같은 게임을 새 세션으로 재시작 */
  onReplay: () => void
  /** 자세히 보기 — 전체 결과 페이지로 이동 */
  detailTo: string
  detailState?: unknown
}

export function PlayResultModal({
  open,
  onClose,
  metrics,
  onReplay,
  detailTo,
  detailState,
}: PlayResultModalProps) {
  const navigate = useNavigate()

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={false}
      title={
        <span className="flex items-center gap-2">
          <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-[11px] font-bold">
            결과 화면
          </span>
          <span>서버 계산 결과</span>
        </span>
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate('/student/play')}>
            PLAY로 돌아가기
          </Button>
          <Button onClick={onReplay}>다시 플레이</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-fg-muted text-[13px] leading-6">
          클라이언트 진행 중 예상값이 아니라 서버가 세션 원본을 재계산한 최종
          결과입니다.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((mt) => (
            <div
              key={mt.label}
              className="bg-surface-muted/50 flex flex-col gap-1 rounded-[10px] p-3"
            >
              <span className="text-fg-subtle text-[11px]">{mt.label}</span>
              <span className="text-brand text-[18px] font-bold">
                {mt.value}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            navigate(detailTo, detailState ? { state: detailState } : undefined)
          }
          className="text-brand w-fit text-[12px] font-bold hover:underline"
        >
          전체 결과·랭킹 자세히 보기 →
        </button>
        <span className="text-fg-subtle text-[11px]">
          랭킹·보상 예정은 결과 저장 이후 비교로 반영됩니다.
        </span>
      </div>
    </Modal>
  )
}
