import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { TONE_SOFT } from '@/shared/lib/tone'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDeleteTsCase, useTsList } from '../../../api/troubleshooting'
import { projectKeys } from '../../queryKeys'
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
  const queryClient = useQueryClient()
  // 연결 피커는 '내가 쓴 인증 사례' 중에서 고르는 화면이라 수강생 목록이 그대로 필요하다.
  const { data } = useTsList(!readOnly)
  const linked = d.troubleshootingCases ?? []
  const linkedIds = linked.map((c) => c.id)
  const unlinkM = useUnlinkTroubleshooting(d.id)
  const [picking, setPicking] = useState(false)
  // 삭제는 되돌릴 수 없다 — 한 번 묻고 지운다.
  const [deleting, setDeleting] = useState<WsTsCase | null>(null)
  const deleteCase = useDeleteTsCase()

  const cases = data?.cases ?? []
  // 내 사례는 편집 화면으로, 팀원 사례는 보기 전용으로 연다.
  // 편집에도 projectId 를 실어야 저장 뒤 이 탭으로 돌아온다 — 없으면 사라진 트러블슈팅
  // 목록 주소로 떨어져 404 를 만난다.
  const open = (c: WsTsCase) =>
    onOpenCase
      ? onOpenCase(c.id)
      : navigate(
          c.mine
            ? `/student/troubleshooting/${c.id}?projectId=${d.id}`
            : `/student/troubleshooting/${c.id}?view=1`,
        )

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
        title="트러블슈팅"
        action={readOnly ? undefined : '트러블슈팅 작성'}
        onAction={
          readOnly
            ? undefined
            : () => navigate(`/student/troubleshooting/new?projectId=${d.id}`)
        }
      />
      <div className="-mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-fg-subtle text-[12px]">
          이 프로젝트에서 겪은 문제를 기록해요. 인증을 받지 않아도 팀이 바로 볼
          수 있고, 인증은 사례를 열어 따로 요청해요.
        </p>
        {/* 다른 데서 쓰던 사례를 이 프로젝트로 가져오는 길 — 새 사례는 위 버튼으로 쓴다. */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="text-fg-subtle hover:text-brand shrink-0 text-[12px] font-semibold underline-offset-2 hover:underline"
          >
            기존 사례 연결
          </button>
        )}
      </div>
      {linked.length === 0 ? (
        <Empty
          title="아직 기록한 트러블슈팅이 없어요"
          description={
            readOnly
              ? '팀이 사례를 기록하면 여기에 쌓여요.'
              : '‘트러블슈팅 작성’으로 이 프로젝트에서 겪은 문제를 남겨보세요.'
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
                  onClick={() => open(c)}
                  className={buttonClass({ variant: 'secondary', size: 'sm' })}
                >
                  {!readOnly && c.mine ? '이어 쓰기' : '보기'}
                </button>
                {/* 연결 해제·삭제는 사례 주인만 — 남의 기록을 치울 수는 없다. */}
                {!readOnly && c.mine && (
                  <>
                    <button
                      type="button"
                      onClick={() => unlink(c)}
                      className="text-fg-subtle hover:text-fg rounded px-2 py-1 text-[12px] font-semibold"
                    >
                      연결 해제
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(c)}
                      className="text-fg-subtle hover:text-danger rounded px-2 py-1 text-[12px] font-semibold"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {deleting && (
        <ConfirmDialog
          open
          title="이 트러블슈팅을 삭제할까요?"
          confirmLabel="삭제"
          tone="danger"
          onConfirm={() => {
            const target = deleting
            setDeleting(null)
            deleteCase.mutate(target.id, {
              onSuccess: () => {
                toast.info('사례를 삭제했어요')
                queryClient.invalidateQueries({
                  queryKey: projectKeys.workspace(d.id),
                })
              },
              onError: () => toast.danger('삭제하지 못했어요.'),
            })
          }}
          onClose={() => setDeleting(null)}
        >
          <p className="text-fg-muted text-[13px]">
            ‘{deleting.title}’ 기록이 사라져요. 되돌릴 수 없어요.
          </p>
        </ConfirmDialog>
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
  // 인증 여부와 무관하게 내 사례를 붙일 수 있다 — 인증은 사례를 열어 따로 요청한다.
  const linkable = cases
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
          내가 쓴 사례를 이 프로젝트에 연결해요. 사례는 한 번에 한 프로젝트에만
          연결돼요.
        </p>
        {linkable.length === 0 ? (
          <div className="text-fg-subtle py-6 text-center text-[13px]">
            연결할 사례가 없어요.
          </div>
        ) : (
          linkable.map((c) => {
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
                <span
                  className={cn(
                    'shrink-0 rounded px-2 py-0.5 text-[10px] font-bold',
                    c.status === 'certified'
                      ? 'bg-success-bg text-success'
                      : 'bg-surface-muted text-fg-muted',
                  )}
                >
                  {c.statusLabel}
                </span>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
