import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CircleCheck, Lock, PencilLine, Timer } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  DEFAULT_PROJECT_CONTENT,
  formatEditUntil,
  isEditWindowExpired,
  useProjectFlow,
  type EditRequestStatus,
  type ProjectContent,
} from './workspace/useProjectFlow'

// 프로젝트 수정 권한 요청 (/student/projects/:projectId/change-requests/new)
// — Figma 4859:6731(요청·locked) · 4857:6654(승인 후·editing).
// 인증 완료 프로젝트는 수정 잠금. 수강생이 사유를 적어 수정 권한을 요청 → 강사 승인 시 시한부로 원본 직접 수정 →
// 수정 완료 + 변경 요약 제출 → 강사 최종 확인. (구 "변경 항목 선택 + 변경 전/후 비교" 방식 대체)
const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'

const EXAMPLE_REASON =
  '결제 모듈 리팩터링 결과를 설명에 반영하고, 최신 API 명세서로 산출물을 교체하기 위함입니다.'

const HEADER: Record<EditRequestStatus, [string, string]> = {
  none: [
    '프로젝트 수정 권한 요청',
    '인증 완료된 프로젝트는 수정이 잠겨 있어요. 수정 사유를 적어 강사에게 수정 권한을 요청하세요.',
  ],
  requested: [
    '프로젝트 수정 권한 요청',
    '강사 승인을 기다리는 중이에요. 승인되면 일정 시간 동안 원본을 직접 수정할 수 있어요.',
  ],
  approved: [
    '프로젝트 수정 권한 (승인됨)',
    '수정 권한이 열렸어요. 원본을 수정한 뒤 변경 요약을 적어 제출하면 강사가 최종 확인합니다.',
  ],
  submitted: [
    '수정 완료 제출됨',
    '강사가 변경 요약과 현재 프로젝트 내용을 확인하는 중이에요.',
  ],
}

export default function ChangeRequestPage() {
  const navigate = useNavigate()
  const { projectId = 'unknown' } = useParams()
  const toast = useToast()

  const editRequest = useProjectFlow((s) => s.editRequests[projectId])
  const setEditRequest = useProjectFlow((s) => s.setEditRequest)
  const resetEditRequest = useProjectFlow((s) => s.resetEditRequest)
  const content =
    useProjectFlow((s) => s.projectContent[projectId]) ??
    DEFAULT_PROJECT_CONTENT

  // 만료된 승인은 잠금(none)으로 간주하고 스토어도 정리한다.
  const expired = isEditWindowExpired(editRequest)
  const status: EditRequestStatus = expired
    ? 'none'
    : (editRequest?.status ?? 'none')

  useEffect(() => {
    if (expired) {
      resetEditRequest(projectId)
      toast.info('수정 가능 기간이 만료되어 다시 잠겼어요')
    }
  }, [expired, projectId, resetEditRequest, toast])

  const [reason, setReason] = useState(
    editRequest?.requestReason ?? EXAMPLE_REASON,
  )
  const [summary, setSummary] = useState(editRequest?.changeSummary ?? '')

  usePageHeader(HEADER[status][0], HEADER[status][1])

  const requestEdit = () => {
    if (!reason.trim()) {
      toast.danger('수정 사유를 입력해 주세요')
      return
    }
    // 계약 확정 시 apiClient.post(`/student/projects/${projectId}/edit-requests`, { requestReason: reason })로 교체.
    setEditRequest(projectId, { status: 'requested', requestReason: reason })
    toast.success('수정 권한을 요청했어요')
  }
  const cancelRequest = () => {
    resetEditRequest(projectId)
    toast.info('수정 권한 요청을 취소했어요')
  }
  const submitEdit = () => {
    if (!summary.trim()) {
      toast.danger('변경 요약을 입력해 주세요')
      return
    }
    // 계약 확정 시 apiClient.post(`/student/projects/${projectId}/edit-requests/submit`, { changeSummary: summary })로 교체.
    setEditRequest(projectId, { status: 'submitted', changeSummary: summary })
    toast.success('수정 완료를 제출했어요')
  }
  const goEditOriginal = () => navigate(`/student/projects/${projectId}`)

  return (
    <div className="flex flex-col gap-5 p-8 pb-24">
      {/* 상태 안내 배너 */}
      {status === 'none' && (
        <StatusBanner
          tone="info"
          icon={<Lock className="size-3.5" aria-hidden="true" />}
          title="인증 완료 — 수정 잠금 상태예요"
          body="수정하려면 강사 승인이 필요해요. 승인되면 일정 시간 동안 원본 프로젝트를 직접 수정할 수 있어요."
        />
      )}
      {status === 'requested' && (
        <StatusBanner
          tone="warning"
          icon={<Timer className="size-3.5" aria-hidden="true" />}
          title="강사 승인 대기 중"
          body="강사가 수정 권한 요청을 검토하고 있어요. 승인되면 수정 가능 만료 시각과 함께 권한이 열립니다."
        />
      )}
      {status === 'approved' && (
        <StatusBanner
          tone="success"
          icon={<CircleCheck className="size-3.5" aria-hidden="true" />}
          title="수정 권한이 열렸어요"
          body={`${formatEditUntil(editRequest?.editAllowedUntil)}까지 원본 프로젝트를 직접 수정할 수 있어요. 수정을 마치면 아래에 변경 요약을 적고 제출하세요.`}
        />
      )}
      {status === 'submitted' && (
        <StatusBanner
          tone="info"
          icon={<Timer className="size-3.5" aria-hidden="true" />}
          title="강사 최종 확인 대기 중"
          body="강사가 변경 요약과 현재 프로젝트 내용을 확인한 뒤 최종 확인 처리합니다."
        />
      )}

      {/* 프로젝트 정보 (공통) */}
      <section className={cn(card, 'flex flex-col gap-2')}>
        <div className="flex items-center gap-2">
          <span className="text-fg text-[15px] font-bold">
            주문 관리 MSA 백엔드
          </span>
          <span className="bg-success-bg text-success rounded px-1.5 py-0.5 text-[10px] font-bold">
            인증 완료
          </span>
        </div>
        <span className="text-fg-subtle text-[11px]">
          역할 PM · 팀 프로젝트 4명 · 2026-04-01 ~ 2026-05-30 · 인증일
          2026-05-08
        </span>
      </section>

      {/* none — 수정 사유 입력 */}
      {status === 'none' && (
        <>
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center gap-1.5">
              <span className="text-fg text-[13px] font-bold">수정 사유</span>
              <span className="text-danger text-[11px]">필수</span>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="왜 다시 수정해야 하는지 적어주세요"
              className="border-border bg-surface text-fg focus:border-brand min-h-[100px] w-full resize-none rounded-[10px] border px-4 py-3 text-[14px] leading-6 focus:outline-none"
            />
          </section>
          <div className="border-border bg-surface-muted/40 text-fg-muted flex items-start gap-2 rounded-xl border px-4 py-3 text-[12px] leading-5">
            <span className="text-info mt-px shrink-0 font-bold">ⓘ</span>
            <span>
              변경 항목 선택·변경 전/후 비교는 따로 작성하지 않아요. 승인 후
              원본 프로젝트 화면에서 직접 수정하면, 강사가{' '}
              <span className="text-fg font-semibold">현재 프로젝트 내용</span>
              과 <span className="text-fg font-semibold">변경 요약</span>으로
              확인합니다.
            </span>
          </div>
        </>
      )}

      {/* approved — 프로젝트 수정 CTA + 변경 요약 입력 */}
      {status === 'approved' && (
        <>
          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg-muted text-[13px] leading-5">
              원본 프로젝트 작성·수정 화면으로 이동해 직접 수정하세요. 저장한
              내용은 바로 원본에 반영됩니다.
            </span>
            <button
              type="button"
              onClick={goEditOriginal}
              className={buttonClass({ size: 'sm', className: 'w-fit' })}
            >
              <PencilLine className="size-4" aria-hidden="true" />
              프로젝트 수정하기
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </section>
          <BeforeAfterAux snapshot={editRequest?.snapshot} current={content} />
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center gap-1.5">
              <span className="text-fg text-[13px] font-bold">변경 요약</span>
              <span className="text-danger text-[11px]">필수</span>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="무엇을 어떻게 수정했는지 요약해 주세요"
              className="border-border bg-surface text-fg focus:border-brand min-h-[100px] w-full resize-none rounded-[10px] border px-4 py-3 text-[14px] leading-6 focus:outline-none"
            />
          </section>
        </>
      )}

      {/* requested / submitted — 대기 안내 */}
      {(status === 'requested' || status === 'submitted') && (
        <section className={cn(card, 'flex flex-col gap-2')}>
          <span className="text-fg text-[13px] font-bold">
            {status === 'requested' ? '요청한 수정 사유' : '제출한 변경 요약'}
          </span>
          <span className="text-fg-muted text-[13px] leading-6">
            {status === 'requested'
              ? (editRequest?.requestReason ?? reason)
              : (editRequest?.changeSummary ?? summary)}
          </span>
        </section>
      )}
      {status === 'submitted' && (
        <BeforeAfterAux snapshot={editRequest?.snapshot} current={content} />
      )}

      {/* 하단 액션바 */}
      <div className="bg-surface border-border fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl border px-6 py-4 shadow-[0px_12px_32px_0px_rgba(18,23,38,0.16)]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
        >
          {status === 'none' || status === 'approved' ? '취소' : '닫기'}
        </button>
        <div className="flex items-center gap-4">
          {status === 'none' && (
            <>
              <span className="text-fg-subtle text-[12px]">
                승인되면 수정 권한이 열려요
              </span>
              <button
                type="button"
                onClick={requestEdit}
                className={buttonClass({ size: 'md' })}
              >
                수정 권한 요청
              </button>
            </>
          )}
          {status === 'requested' && (
            <>
              <span className="text-fg-subtle text-[12px]">
                강사 승인 대기 중
              </span>
              <button
                type="button"
                onClick={cancelRequest}
                className="border-border text-fg-muted rounded-lg border px-5 py-2.5 text-[13px] font-semibold"
              >
                요청 취소
              </button>
            </>
          )}
          {status === 'approved' && (
            <>
              <span className="text-fg-subtle text-[12px]">
                강사 최종 확인으로 전달돼요
              </span>
              <button
                type="button"
                onClick={submitEdit}
                className={buttonClass({ size: 'md' })}
              >
                수정 완료 제출
              </button>
            </>
          )}
          {status === 'submitted' && (
            <span className="text-fg-subtle text-[12px]">
              강사 최종 확인 대기 중
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBanner({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'info' | 'warning' | 'success'
  icon: React.ReactNode
  title: string
  body: string
}) {
  const toneCls = {
    info: 'bg-info-bg/60 text-info',
    warning: 'bg-warning-bg/70 text-warning',
    success: 'bg-success-bg/70 text-success',
  }[tone]
  return (
    <div className={cn('flex flex-col gap-1 rounded-xl p-4', toneCls)}>
      <span className="flex items-center gap-1.5 text-[12px] font-bold">
        {icon}
        {title}
      </span>
      <span className="text-fg-muted text-[11px] leading-5">{body}</span>
    </div>
  )
}

// 원본↔현재 비교 — '변경 전/후 비교'를 제거 대신 보조 수준으로 축소(승인 후/제출에서만).
function BeforeAfterAux({
  snapshot,
  current,
}: {
  snapshot?: ProjectContent
  current: ProjectContent
}) {
  const before = snapshot ?? current
  const fields: (keyof ProjectContent)[] = ['설명', '산출물']
  return (
    <section className="border-border bg-surface-muted/30 flex flex-col gap-3 rounded-2xl border p-5">
      <div className="flex items-center gap-1.5">
        <span className="text-fg-muted text-[12px] font-bold">
          변경 전 / 후
        </span>
        <span className="text-fg-subtle text-[11px]">
          참고 · 원본↔현재 비교
        </span>
      </div>
      {fields.map((f) => {
        const changed = before[f] !== current[f]
        return (
          <div key={f} className="flex flex-col gap-1.5">
            <span className="text-fg-subtle text-[11px] font-semibold">
              {f}
              {changed && <span className="text-brand"> · 변경됨</span>}
            </span>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="border-border bg-surface flex flex-col gap-1 rounded-[10px] border p-3">
                <span className="text-fg-subtle text-[10px]">
                  변경 전 (원본)
                </span>
                <span className="text-fg-muted text-[12px] leading-5">
                  {before[f]}
                </span>
              </div>
              <div
                className={cn(
                  'flex flex-col gap-1 rounded-[10px] border p-3',
                  changed
                    ? 'border-brand/40 bg-brand/5'
                    : 'border-border bg-surface',
                )}
              >
                <span
                  className={cn(
                    'text-[10px]',
                    changed ? 'text-brand font-semibold' : 'text-fg-subtle',
                  )}
                >
                  변경 후 (현재)
                </span>
                <span className="text-fg text-[12px] leading-5">
                  {current[f]}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
