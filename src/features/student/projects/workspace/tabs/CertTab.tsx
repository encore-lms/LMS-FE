import { useNavigate } from 'react-router-dom'
import { CircleCheck, Timer } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { useRequestCertification, wsWriteError } from '../../../api/projects'
import {
  formatEditUntil,
  isEditWindowExpired,
  statusToPhase,
  useProjectFlow,
} from '../useProjectFlow'
import type { WorkspaceData } from '../../types'
import { Chip } from '../components/ws-shared'
import { card, phaseCertBadge } from '../components/ws-style'

export function CertTab({ d }: { d: WorkspaceData }) {
  const navigate = useNavigate()
  const toast = useToast()
  // 체크리스트는 BE가 실데이터(작업·산출물·지표·상호평가)로 자동 판정 — 읽기 전용 표시.
  // 로컬 토글(useState 복제)은 판정을 손으로 덮어써 제출 가드를 뚫는 가짜였다.
  const checks = d.certChecklist
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const setPhase = useProjectFlow((s) => s.setPhase)
  const editRequest = useProjectFlow((s) => s.editRequests[d.id])
  const requestCertM = useRequestCertification(d.id)
  // 만료된 승인은 잠금으로 표시(자동 잠금 정리는 변경 제안 화면에서 수행).
  const editStatus = isEditWindowExpired(editRequest)
    ? 'none'
    : (editRequest?.status ?? 'none')
  const allDone = checks.every((check) => check.status.tone === 'success')
  const submit = () => {
    if (!allDone) {
      toast.warning('요청 전 체크리스트를 모두 완료해 주세요')
      return
    }
    requestCertM.mutate(undefined, {
      onSuccess: () => {
        setPhase(d.id, 'reviewing')
        toast.success('인증 요청을 제출했습니다')
      },
      onError: (e) => toast.danger(wsWriteError(e, '인증 요청에 실패했어요.')),
    })
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-fg text-[16px] font-bold">프로젝트 인증 요청</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-1')}>
          <span className="text-fg pb-2 text-[14px] font-bold">
            요청 전 체크리스트
          </span>
          {checks.map((c, i) => {
            const done = c.status.tone === 'success'
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 py-3',
                  i > 0 && 'border-divider border-t',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    done
                      ? 'bg-success text-white'
                      : 'border-border text-fg-subtle border',
                  )}
                >
                  {done ? '✓' : ''}
                </span>
                <span className="text-fg flex-1 text-[13px] font-semibold">
                  {c.label}
                </span>
                <Chip badge={c.status} />
              </div>
            )
          })}
        </section>
        <div className="flex flex-col gap-4 lg:w-[320px]">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">인증 상태</span>
              <Chip badge={phaseCertBadge(phase)} />
            </div>
            <span className="text-fg-muted text-[12px] leading-5">
              {phase === 'certified'
                ? editStatus === 'approved'
                  ? `수정 권한이 열렸어요. ${formatEditUntil(editRequest?.editAllowedUntil)}까지 원본을 직접 수정할 수 있어요.`
                  : editStatus === 'requested'
                    ? '수정 권한 요청이 강사 승인 대기 중이에요.'
                    : editStatus === 'submitted'
                      ? '수정 완료를 제출했어요. 강사 최종 확인을 기다리는 중이에요.'
                      : editStatus === 'rejected'
                        ? '수정 권한 요청이 반려됐어요. 사유를 확인하고 다시 요청할 수 있어요.'
                        : '인증이 완료된 프로젝트입니다. 원본 수정은 강사에게 수정 권한을 요청한 뒤 가능합니다.'
                : phase === 'reviewing'
                  ? '담당 강사가 산출물과 발표 내용을 검토하고 있어요. 승인되면 인증이 완료됩니다.'
                  : phase === 'completed'
                    ? '요청하면 담당 강사가 산출물과 발표 내용을 검토합니다. 인증 완료 후 프로젝트는 증명서 대표 후보가 됩니다.'
                    : '프로젝트 진행 중이에요. 기간이 종료되어 완료 확정되면 인증을 요청할 수 있습니다.'}
            </span>
            {phase === 'certified' ? (
              <div className="bg-success-bg text-success flex items-center justify-center gap-1.5 rounded-lg py-3 text-[13px] font-bold">
                <CircleCheck className="size-4" aria-hidden="true" />
                인증 완료
              </div>
            ) : phase === 'reviewing' ? (
              <div className="bg-warning-bg text-warning flex items-center justify-center gap-1.5 rounded-lg py-3 text-[13px] font-bold">
                <Timer className="size-4" aria-hidden="true" />
                강사 검토 중
              </div>
            ) : phase === 'completed' ? (
              <button
                type="button"
                onClick={submit}
                className={buttonClass({ size: 'md' })}
              >
                인증 요청 제출
              </button>
            ) : (
              <div className="border-border text-fg-subtle flex items-center justify-center rounded-lg border border-dashed py-3 text-[12px] font-semibold">
                기간 종료 후 인증 요청 가능
              </div>
            )}
            {phase === 'certified' && (
              <>
                {editStatus === 'approved' && editRequest?.editAllowedUntil && (
                  <div className="bg-success-bg/60 text-success flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-bold">
                    <Timer className="size-3.5" aria-hidden="true" />
                    수정 가능 ~ {formatEditUntil(editRequest.editAllowedUntil)}
                  </div>
                )}
                {/* 반려는 사유가 전부다 — 무엇이 부족했는지 모르면 다시 요청할 수 없다. */}
                {editStatus === 'rejected' && (
                  <div className="bg-danger-bg/60 flex flex-col gap-1 rounded-lg px-3 py-2.5">
                    <span className="text-danger text-[12px] font-bold">
                      수정 권한 요청 반려
                    </span>
                    <span className="text-fg-muted text-[12px] leading-5">
                      {editRequest?.decisionReason?.trim() ||
                        '강사가 사유를 남기지 않았어요.'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/student/projects/${d.id}/change-requests/new`)
                  }
                  className={cn(
                    'rounded-lg py-2.5 text-[13px] font-semibold',
                    editStatus === 'approved'
                      ? 'bg-brand text-white'
                      : 'border-border text-fg border',
                  )}
                >
                  {editStatus === 'none'
                    ? '수정 권한 요청'
                    : editStatus === 'requested'
                      ? '승인 대기 중 — 요청 보기'
                      : editStatus === 'approved'
                        ? '수정 진행 · 완료 제출'
                        : editStatus === 'rejected'
                          ? '수정 권한 다시 요청'
                          : '최종 확인 대기 — 제출 보기'}
                </button>
              </>
            )}
          </section>
          <section className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg text-[14px] font-bold">
              최근 변경 제안
            </span>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[13px] font-semibold">
                {d.certRecentChange.label}
              </span>
              <Chip badge={d.certRecentChange.status} />
            </div>
            <span className="text-fg-subtle text-[11px]">
              {d.certRecentChange.date}
            </span>
          </section>
        </div>
      </div>
    </div>
  )
}
