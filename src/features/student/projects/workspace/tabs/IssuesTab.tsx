import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { useTsList } from '../../../api/troubleshooting'
import { TsCaseCard } from '../../../troubleshooting/components/TsCaseCard'
import {
  useLinkTroubleshooting,
  useUnlinkTroubleshooting,
} from '../../../api/projects'
import type { TsCase } from '../../../troubleshooting/types'
import type { WorkspaceData } from '../../types'
import { SectionHead } from '../components/ws-shared'

// 이슈 탭 — 프로젝트(워크스페이스)에서 해결한 트러블슈팅 중 "인증 완료" 사례만 연결해
// 트러블슈팅 목록 화면과 같은 카드로 보여준다(연결 방향: 프로젝트 → 사례, 보기 전용).
// 카드를 누르면 공용 사례 상세를 보기 전용(?view=1)으로 연다.
export function IssuesTab({ d }: { d: WorkspaceData }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending } = useTsList()
  const linkedIds = d.troubleshootingCaseIds ?? []
  const unlinkM = useUnlinkTroubleshooting(d.id)
  const [picking, setPicking] = useState(false)

  const cases = data?.cases ?? []
  // 연결된 사례 중 인증 완료만 노출(연결도 인증 완료만 허용하지만 상태 변동 방어).
  const linked = linkedIds
    .map((id) => cases.find((c) => c.id === id))
    .filter((c): c is TsCase => !!c && c.status === 'certified')

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="연결된 트러블슈팅"
        action="트러블슈팅 관리"
        onAction={() => setPicking(true)}
      />
      <p className="text-fg-subtle -mt-2 text-[12px]">
        이 프로젝트에서 해결한 트러블슈팅 중 인증 완료된 사례만 연결해 보여줘요.
        카드를 누르면 사례 내용을 자세히 볼 수 있어요.
      </p>
      {isPending ? (
        <div className="text-fg-muted p-6 text-[13px]">
          트러블슈팅을 불러오는 중…
        </div>
      ) : linked.length === 0 ? (
        <Empty
          title="연결된 인증 트러블슈팅이 없어요"
          description="‘트러블슈팅 관리’로 인증 완료된 사례를 연결하세요."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {linked.map((c) => (
            <TsCaseCard
              key={c.id}
              c={c}
              actionLabel="보기"
              onOpen={(t) =>
                navigate(`/student/troubleshooting/${t.id}?view=1`)
              }
              onRemove={() => {
                unlinkM.mutate(
                  { caseId: c.id },
                  {
                    onSuccess: () =>
                      toast.info(
                        '프로젝트 연결을 해제했어요 (사례는 그대로예요)',
                      ),
                    onError: () => toast.danger('연결 해제에 실패했어요.'),
                  },
                )
              }}
            />
          ))}
        </div>
      )}
      {picking && (
        <TsLinkPickerModal
          projectId={d.id}
          cases={cases}
          linkedIds={linkedIds}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}

// 연결 피커 — 인증 완료된 사례만 토글로 연결/해제한다.
function TsLinkPickerModal({
  projectId,
  cases,
  linkedIds,
  onClose,
}: {
  projectId: string
  cases: TsCase[]
  linkedIds: string[]
  onClose: () => void
}) {
  const toast = useToast()
  const linkM = useLinkTroubleshooting(projectId)
  const unlinkM = useUnlinkTroubleshooting(projectId)
  const certified = cases.filter((c) => c.status === 'certified')
  const toggle = (c: TsCase) => {
    if (linkedIds.includes(c.id)) {
      unlinkM.mutate(
        { caseId: c.id },
        { onSuccess: () => toast.info('연결을 해제했어요') },
      )
    } else {
      linkM.mutate(
        { troubleshootingCaseId: c.id },
        { onSuccess: () => toast.success('트러블슈팅을 연결했어요') },
      )
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="트러블슈팅 관리"
      footer={
        <button
          type="button"
          onClick={onClose}
          className={buttonClass({ size: 'sm' })}
        >
          완료
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-fg-subtle text-[12px]">
          인증 완료된 트러블슈팅 사례만 연결할 수 있어요.
        </p>
        {certified.length === 0 ? (
          <div className="text-fg-subtle py-6 text-center text-[13px]">
            연결할 인증 완료 사례가 없어요.
          </div>
        ) : (
          certified.map((c) => {
            const on = linkedIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left',
                  on ? 'border-brand bg-brand/5' : 'border-border',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white',
                    on ? 'bg-brand' : 'border-border bg-surface border',
                  )}
                >
                  {on && '✓'}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-fg truncate text-[13px] font-semibold">
                    {c.title}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {c.category} · {c.days}
                  </span>
                </div>
                <span className="bg-success-bg text-success shrink-0 rounded px-2 py-0.5 text-[10px] font-bold">
                  인증 완료
                </span>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
