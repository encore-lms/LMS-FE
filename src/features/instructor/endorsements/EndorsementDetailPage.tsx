import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import {
  useDeleteEndorsement,
  useEndorsement,
  useUpdateEndorsement,
} from '../api/endorsements'
import { SNAPSHOT_META, formatRemaining } from './meta'
import { endorsementSchema, type EndorsementInput } from './endorsement.schema'

const LIST = '/instructor/endorsements'

// 강사 추천서 상세/수정 (/instructor/endorsements/:endorsementId).
// 24h 수정 창 안에서만 기존 row 수정. 이후 변경은 신규 row. 삭제는 확인 모달.
// (Figma "강사 — 강사 추천서 상세/수정" 2141:14681)
export default function EndorsementDetailPage() {
  const { endorsementId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useEndorsement(endorsementId)
  const update = useUpdateEndorsement(endorsementId)
  const del = useDeleteEndorsement()
  const [confirmDelete, setConfirmDelete] = useState(false)
  usePageHeader('강사 추천서 상세/수정', '추천서 내용을 확인하고 수정합니다')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EndorsementInput>({
    resolver: zodResolver(endorsementSchema),
    values: data ? { comment: data.comment } : undefined,
  })

  const meta = data ? SNAPSHOT_META[data.snapshotStatus] : null
  const remaining = data ? formatRemaining(data.editableUntilMinutes) : null
  const editable = remaining !== null

  const onSubmit = async (input: EndorsementInput) => {
    if (!data) return
    try {
      await update.mutateAsync({ comment: input.comment })
      toast.success(
        `수정 저장 — ${data.student.name} · 다음 증명서 최신화 작업 후 공개 반영`,
      )
      navigate(LIST)
    } catch {
      toast.danger('수정 저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const onDelete = async () => {
    setConfirmDelete(false)
    if (!data) return
    try {
      await del.mutateAsync(endorsementId)
      toast.danger(`삭제 — ${data.student.name}의 추천서가 삭제되었습니다`)
      navigate(LIST)
    } catch {
      toast.danger('삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={() => refetch()}
      loadingText="추천서를 불러오는 중…"
      errorTitle="추천서를 불러오지 못했어요"
      errorDescription="목록에서 다시 선택해 주세요."
      className="p-8"
    >
      {data && meta && (
        <div className="p-8">
          {/* 안내 배너 */}
          <div className="border-info/30 bg-info-bg flex gap-3 rounded-xl border p-4">
            <Info className="text-info mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-fg text-sm font-bold">
                이 추천서는 작성 후 24시간 내 수정할 수 있어요
              </p>
              <p className="text-fg-muted mt-0.5 text-xs">
                24시간 이후 변경은 신규 row로 저장됩니다. 외부 공개는 증명서
                최신화 작업 이후 공개 스냅샷에 반영됩니다.
              </p>
            </div>
          </div>

          {/* 메타 strip */}
          <div className="border-border bg-surface mt-4 flex items-center gap-4 rounded-xl border p-5">
            <Avatar name={data.student.name} size={48} />
            <div className="flex flex-col">
              <span className="text-fg text-sm font-bold">
                {data.student.name}
              </span>
              <span className="text-fg-subtle text-xs">
                {data.student.cohort}
                {data.student.track ? ` · ${data.student.track}` : ''} ·{' '}
                {data.createdAt} 작성
              </span>
              {data.student.email && (
                <span className="text-fg-subtle text-xs">
                  {data.student.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label="추천서" tone="info" />
              <StatusBadge label={meta.label} tone={meta.tone} />
            </div>
            <span
              className={`ml-auto text-xs font-medium ${
                editable ? 'text-warning' : 'text-fg-subtle'
              }`}
            >
              {editable ? `수정 가능: ${remaining}` : '수정 불가 (24h 경과)'}
            </span>
            <button
              type="button"
              onClick={() => navigate(LIST)}
              className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-3 py-2 text-xs font-medium"
            >
              ← 목록
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="border-danger/40 text-danger hover:bg-danger-bg rounded-md border px-3 py-2 text-xs font-medium"
            >
              삭제
            </button>
          </div>

          {/* 수정 폼 */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="border-border bg-surface mt-4 rounded-xl border p-6"
          >
            <div className="flex items-center gap-3">
              <Avatar name={data.student.name} size={36} />
              <div className="flex flex-col">
                <span className="text-fg text-sm font-bold">
                  {data.student.name}
                </span>
                <span className="text-fg-subtle text-xs">
                  {data.student.cohort}
                  {data.student.track ? ` · ${data.student.track}` : ''}
                </span>
              </div>
              <span className="text-fg-subtle ml-auto text-xs">
                학생 변경 불가 (수정 모드)
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <span className="text-fg text-[13px] font-bold">
                  추천서 작성 기준
                </span>
                <span className="text-fg-subtle text-xs">
                  · 긍정 추천이 있을 때만 작성합니다
                </span>
              </div>
              <div className="border-border bg-surface-muted mt-2 rounded-lg border p-4">
                <p className="text-fg text-sm font-bold">
                  추천할 내용이 없으면 추천서를 작성하지 않습니다.
                </p>
                <p className="text-fg-muted mt-1 text-xs">
                  수정 내용은 다음 증명서 최신화 작업 이후 공개 스냅샷에
                  반영됩니다.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-2">
                <span className="text-fg text-[13px] font-bold">
                  추천 코멘트
                </span>
                <span className="text-fg-subtle text-xs">
                  · 구체적 사례 기반 서술 권장 (길이 무제한)
                </span>
              </div>
              <textarea
                {...register('comment')}
                rows={5}
                disabled={!editable}
                aria-label="추천 코멘트"
                aria-invalid={errors.comment ? true : undefined}
                className={`text-fg placeholder:text-fg-subtle mt-2 w-full rounded-lg border-2 bg-white p-3 text-sm transition-colors outline-none disabled:opacity-60 ${
                  errors.comment
                    ? 'border-danger'
                    : 'focus:border-brand border-border'
                }`}
              />
              {errors.comment && (
                <p role="alert" className="text-danger mt-1 text-[13px]">
                  {errors.comment.message}
                </p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-fg-subtle text-xs">
                수정 사항은 다음 증명서 최신화 작업 후 외부 공개에 반영됩니다 ·
                24h 이후 변경은 신규 row
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(LIST)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSubmitting || !editable}>
                  수정 저장
                </Button>
              </div>
            </div>
          </form>

          <Modal
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            title="추천서 삭제"
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  취소
                </Button>
                <Button onClick={onDelete}>삭제</Button>
              </>
            }
          >
            <p className="text-fg-muted text-sm">
              {data.student.name}의 추천서를 삭제할까요? 삭제 후에는 되돌릴 수
              없습니다.
            </p>
          </Modal>
        </div>
      )}
    </DataBoundary>
  )
}
