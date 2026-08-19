import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { TONE_SOFT } from '@/shared/lib/tone'
import { useTsList } from '../../../api/troubleshooting'
import {
  useLinkTroubleshooting,
  useUnlinkTroubleshooting,
  wsWriteError,
} from '../../../api/projects'
import type { TsCase } from '../../../troubleshooting/types'
import type { WorkspaceData, WsTsCase } from '../../types'
import { SectionHead } from '../components/ws-shared'

// 이슈 탭 — 이 프로젝트에서 해결한 트러블슈팅 중 "인증 완료" 사례를 연결해 보여준다.
//
// 목록은 서버가 만든다(d.troubleshootingCases). 예전에는 응답이 사례 id 배열뿐이라 화면이
// 그 id를 '내가 쓴 사례 목록'에서 되찾아 그렸고, 그래서 같은 프로젝트인데도 사람마다 목록이
// 달랐다 — 팀원이 연결한 사례는 서로 보이지 않았고, 검토자는 목록 자체를 못 받아 건수만 셌다.
export function IssuesTab({
  d,
  readOnly = false,
  onOpenCase,
}: {
  d: WorkspaceData
  /** 검토자(매니저·강사) 열람 — 연결 관리 미노출. */
  readOnly?: boolean
  /**
   * 사례 원문 열기 — 미지정 시 수강생 트러블슈팅 상세로 이동한다.
   * 검토자는 그 경로가 수강생 전용이라, 검토 상세 패널을 여는 함수를 넘겨받는다.
   */
  onOpenCase?: (caseId: string) => void
}) {
  const navigate = useNavigate()
  const toast = useToast()
  // 연결 피커는 '내가 쓴 인증 사례' 중에서 고르는 화면이라 수강생 목록이 그대로 필요하다.
  const { data } = useTsList(!readOnly)
  const linked = d.troubleshootingCases ?? []
  const linkedIds = linked.map((c) => c.id)
  const unlinkM = useUnlinkTroubleshooting(d.id)
  const [picking, setPicking] = useState(false)

  const cases = data?.cases ?? []
  const open = (caseId: string) =>
    onOpenCase
      ? onOpenCase(caseId)
      : navigate(`/student/troubleshooting/${caseId}?view=1`)

  const unlink = (c: WsTsCase) =>
    unlinkM.mutate(
      { caseId: c.id },
      {
        onSuccess: () =>
          toast.info('프로젝트 연결을 해제했어요 (사례는 그대로예요)'),
        onError: (e) =>
          toast.danger(wsWriteError(e, '연결 해제에 실패했어요.')),
      },
    )

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="연결된 트러블슈팅"
        action={readOnly ? undefined : '트러블슈팅 관리'}
        onAction={readOnly ? undefined : () => setPicking(true)}
      />
      <p className="text-fg-subtle -mt-2 text-[12px]">
        이 프로젝트에서 해결한 트러블슈팅 중 인증 완료된 사례만 연결해 보여줘요.
        카드를 누르면 사례 내용을 자세히 볼 수 있어요.
      </p>
      {linked.length === 0 ? (
        <Empty
          title="연결된 인증 트러블슈팅이 없어요"
          description={
            readOnly
              ? '팀이 인증받은 사례를 연결하면 여기에 쌓여요.'
              : '‘트러블슈팅 관리’로 인증 완료된 사례를 연결하세요.'
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {linked.map((c) => (
            <div
              key={c.id}
              className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-fg text-[14px] font-bold [overflow-wrap:anywhere]">
                    {c.title}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                      TONE_SOFT[c.status.tone],
                    )}
                  >
                    {c.status.label}
                  </span>
                </div>
                {/* 누가 겪은 문제인지가 팀 사례의 핵심 정보다 — 예전에는 이 줄이 없어
                    자기 사례만 보이는 줄도 모른 채 목록이 비어 보였다. */}
                <span className="text-fg-subtle text-[12px]">
                  {c.author ?? '작성자 미확인'}
                  {c.mine && ' (본인)'} · {c.date}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => open(c.id)}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  보기
                </button>
                {/* 연결 해제는 사례 주인만 — 남의 사례를 걷어낼 수는 없다. */}
                {!readOnly && c.mine && (
                  <button
                    type="button"
                    onClick={() => unlink(c)}
                    className="text-fg-subtle hover:text-danger rounded px-2 py-1 text-[12px] font-semibold"
                  >
                    연결 해제
                  </button>
                )}
              </div>
            </div>
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
