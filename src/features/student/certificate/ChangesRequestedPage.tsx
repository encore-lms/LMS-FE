import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useCertStatus, useRequestCertification } from '../api/certificate'

/**
 * 보완 요청 상세 (/student/certificate/changes-requested).
 *
 * <p>예전에는 사유 카드 여러 건·관련 영역 바로가기·재요청 체크리스트가 있었다. 매니저가
 * 코멘트만 남기기로 하면서(2026-08-07) 그 재료가 없어져 코멘트 한 덩어리만 보여준다.</p>
 */
export default function ChangesRequestedPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useCertStatus()
  const reRequest = useRequestCertification()
  usePageHeader('보완 요청', '매니저 보완 사항을 확인하고 다시 요청하세요')

  const change = data?.changeRequest ?? null

  const submit = () => {
    reRequest.mutate(undefined, {
      onSuccess: () => {
        toast.success('정식 인증을 재요청했어요 · 매니저 재검토 대기')
        navigate('/student/certificate')
      },
      onError: () => toast.danger('재요청하지 못했어요 · 잠시 후 다시 시도해 주세요'),
    })
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="보완 요청을 불러오는 중…"
      errorTitle="보완 요청을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="flex flex-col gap-5 p-8">
          {!change ? (
            <Empty
              icon={<AlertTriangle />}
              title="보완 요청이 없어요"
              description="매니저가 보완을 요청하면 여기에 내용이 표시됩니다."
              action={
                <button
                  type="button"
                  onClick={() => navigate('/student/certificate')}
                  className={buttonClass()}
                >
                  역량 증명서로
                </button>
              }
            />
          ) : (
            <>
              <section className="bg-surface flex flex-col gap-4 rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-danger-bg text-danger rounded px-2 py-0.5 text-[11px] font-bold">
                    보완 요청
                  </span>
                  <span className="text-fg-subtle text-[12px]">
                    {change.requestedAt} · 검토자 {change.reviewerName}
                  </span>
                  {change.resolved && (
                    <span className="bg-success-bg text-success rounded px-2 py-0.5 text-[11px] font-bold">
                      재요청 완료
                    </span>
                  )}
                </div>
                {/* 매니저가 쓴 그대로 — 줄바꿈을 살린다. */}
                <p className="text-fg text-[14px] leading-6 whitespace-pre-wrap">
                  {change.comment}
                </p>
              </section>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/student/certificate')}
                  className={buttonClass({ variant: 'secondary' })}
                >
                  역량 증명서 보기
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={reRequest.isPending || !data.canRequest}
                  className={buttonClass()}
                >
                  {reRequest.isPending ? '요청 중…' : '정식 인증 재요청'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </DataBoundary>
  )
}
