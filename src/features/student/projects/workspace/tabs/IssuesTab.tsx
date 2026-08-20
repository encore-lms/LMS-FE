import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import { useToast } from '@/components/ui/use-toast'
import { TONE_SOFT } from '@/shared/lib/tone'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDeleteTsCase } from '../../../api/troubleshooting'
import { projectKeys } from '../../queryKeys'
import type { WorkspaceData, WsTsCase } from '../../types'
import { SectionHead } from '../components/ws-shared'

// 이슈 탭 — 이 프로젝트에서 겪은 트러블슈팅을 쓰고 읽는 곳(게시판형 CRUD).
//
// 사례는 이 프로젝트에 속한 기록이다. 예전에는 다른 데서 쓴 사례를 골라 붙이는
// '기존 사례 연결' 피커가 있었는데, 작성 자체가 프로젝트에서 시작하도록 바뀐 뒤로는
// 붙일 게 없다(2026-08-19 폐기). 떼어내는 '연결 해제'도 같이 없앴다 — 떼면 그 기록은
// 어느 화면에도 뜨지 않는다. 프로젝트에서 지우고 싶으면 삭제한다.
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
  // 연결 피커는 '내가 쓴 사례' 중에서 고르는 화면이라 수강생 목록이 그대로 필요하다.
  const linked = d.troubleshootingCases ?? []
  // 삭제는 되돌릴 수 없다 — 한 번 묻고 지운다.
  const [deleting, setDeleting] = useState<WsTsCase | null>(null)
  const deleteCase = useDeleteTsCase()

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
      <p className="text-fg-subtle -mt-2 text-[12px]">
        이 프로젝트에서 겪은 문제를 기록해요. 저장하는 즉시 팀이 볼 수 있고,
        내가 쓴 기록은 언제든 고치거나 지울 수 있어요.
      </p>
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
    </div>
  )
}
