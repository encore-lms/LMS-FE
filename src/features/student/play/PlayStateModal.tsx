import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

// PLAY 결과·예외 상태 모달 — Figma 3370:5976 "(/student/play states)" 명세를 상태별 모달로 구현.
// 정상 "결과 화면" 상태는 모달이 아니라 결과 페이지 자체(PlayResultView)다.
// 여기서는 예외 3종만 상태에 따라 띄운다: 저장 실패 / 제시문 없음 / 기능 미사용.
export type PlayExceptionState = 'save-failed' | 'no-prompt' | 'feature-off'

const BADGE: Record<PlayExceptionState, { label: string; cls: string }> = {
  'save-failed': { label: '저장 실패', cls: 'bg-danger-bg text-danger' },
  'no-prompt': { label: 'Empty', cls: 'bg-surface-muted text-fg-subtle' },
  'feature-off': {
    label: '기능 미사용',
    cls: 'bg-surface-muted text-fg-subtle',
  },
}

const TITLE: Record<PlayExceptionState, string> = {
  'save-failed': '결과 저장 실패',
  'no-prompt': '사용 가능한 제시문 없음',
  'feature-off': 'PLAY 기능 미사용 과정',
}

interface PlayStateModalProps {
  state: PlayExceptionState | null
  onClose: () => void
  /** 저장 실패 — 결과 저장 재시도(없으면 닫기만) */
  onRetry?: () => void
  /** 제시문 없음 — 운영자에게 문의(없으면 닫기만) */
  onContact?: () => void
}

export function PlayStateModal({
  state,
  onClose,
  onRetry,
  onContact,
}: PlayStateModalProps) {
  const navigate = useNavigate()

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      size="sm"
      title={
        state && (
          <span className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-bold',
                BADGE[state].cls,
              )}
            >
              {BADGE[state].label}
            </span>
            <span>{TITLE[state]}</span>
          </span>
        )
      }
      footer={
        state === 'save-failed' ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              나중에 다시 시도
            </Button>
            <Button onClick={onRetry ?? onClose}>결과 저장 재시도</Button>
          </>
        ) : state === 'no-prompt' ? (
          <Button variant="secondary" onClick={onContact ?? onClose}>
            운영자에게 문의
          </Button>
        ) : state === 'feature-off' ? (
          <Button
            onClick={() => {
              onClose()
              navigate('/student')
            }}
          >
            대시보드로 돌아가기
          </Button>
        ) : null
      }
    >
      {state === 'save-failed' && (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-[13px] leading-6">
            네트워크 또는 서버 오류로 결과가 저장되지 않았습니다. 동일 세션 ID와
            입력 digest로 재시도합니다.
          </p>
          <div className="bg-warning-bg/60 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-warning text-[12px] font-bold">
              입력 내용 보존 중
            </span>
            <span className="text-fg-muted text-[11px]">
              재시도 전까지 사용자가 입력한 내용과 세션 ID를 유지합니다.
            </span>
          </div>
        </div>
      )}

      {state === 'no-prompt' && (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-[13px] leading-6">
            PLAY는 켜져 있지만 현재 과정에 활성화된 타자 제시문이 없습니다. 게임
            카드는 비활성화하고 운영자 문의 안내를 표시합니다.
          </p>
          <div className="border-border bg-surface-muted/30 flex flex-col gap-1 rounded-xl border border-dashed p-4">
            <span className="text-fg-muted text-[13px] font-semibold">
              타자 게임
            </span>
            <span className="text-fg-subtle text-[11px]">
              제시문 등록 후 이용할 수 있습니다.
            </span>
          </div>
        </div>
      )}

      {state === 'feature-off' && (
        <div className="flex flex-col gap-3">
          <p className="text-fg-muted text-[13px] leading-6">
            과정 설정에서 PLAY가 꺼져 있으면 사이드바 메뉴를 숨기고, 직접 URL
            접근 시 기능 미사용 안내를 표시합니다.
          </p>
          <div className="bg-surface-muted/50 flex flex-col gap-1 rounded-xl p-3.5">
            <span className="text-fg-muted text-[11px] font-bold">
              노출 조건
            </span>
            <span className="text-fg-subtle font-mono text-[11px]">
              CourseFeatureConfig.playEnabled = true 인 과정에서만 노출
            </span>
          </div>
        </div>
      )}
    </Modal>
  )
}
