import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { inputClass } from '@/components/ui/inputClass'
import { useToast } from '@/components/ui/use-toast'
import {
  StudentEvalPane,
  type EvalRowStudent,
} from '@/features/admin/education/StudentEvalPane'
import { useEndorsementQueue, useSubmitEndorsement } from '../api/endorsements'
import { useCohortRoster } from '../api/console'
import { SNAPSHOT_META } from '../endorsements/meta'
import { endorsementSchema } from '../endorsements/endorsement.schema'

// 강사 '수강생 평가' 탭(2026-08-06 병합) — 구 '코멘트/추천(강사)' 탭을 흡수했다.
// 공용 StudentEvalPane(4축 평가)에 강사 전용 추천서를 주입 슬롯로 붙인다:
//  · 행 우측 = 추천서 상태 배지·보기(작성된 경우)
//  · 평가 카드 아래 = 추천서 작성 섹션(선택 — 긍정 추천이 있을 때만 펼쳐 작성, 기존 API 그대로)
// 하단 '최근 작성한 추천서' 목록도 구 탭에서 그대로 가져왔다.

// 임시 저장 초안 — 학생별 localStorage 키(구 추천서 화면과 동일 키 유지 — 기존 초안 승계).
const draftKey = (studentId: string) => `endorsement-draft:${studentId}`

export function StudentEvalTab({ cohortId }: { cohortId: string }) {
  const navigate = useNavigate()
  const { data: queue } = useEndorsementQueue(cohortId)

  // 학생별 작성된 추천서 — 행 배지·보기 이동에 쓴다.
  const writtenBy = useMemo(
    () => new Map((queue?.recent ?? []).map((e) => [e.student.id, e.id])),
    [queue],
  )
  const detailPath = (id: string) =>
    `/instructor/endorsements/${id}?cohortId=${cohortId}`

  return (
    <div className="flex flex-col gap-4">
      <StudentEvalPane
        cohortId={cohortId}
        rowExtra={(s) => {
          const endorsementId = writtenBy.get(s.id)
          if (!endorsementId) return null
          return (
            <>
              <StatusBadge label="추천서 작성됨" tone="info" />
              <button
                type="button"
                onClick={() => navigate(detailPath(endorsementId))}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                보기
              </button>
            </>
          )
        }}
        panelExtra={(s) => (
          <EndorsementSection
            key={s.id}
            student={s}
            cohortId={cohortId}
            endorsementId={writtenBy.get(s.id) ?? null}
            onView={(id) => navigate(detailPath(id))}
          />
        )}
      />

      {/* 최근 작성한 추천서 — 구 코멘트/추천 탭에서 그대로 이관. */}
      <RecentEndorsements cohortId={cohortId} onView={navigate} />
    </div>
  )
}

/**
 * 추천서 작성 섹션 — 평가 카드 아래 접이식(선택).
 * 긍정 추천이 있을 때만 펼쳐 작성한다(구 '추천서 작성 기준' 정책 유지, 제출 API 동일).
 */
function EndorsementSection({
  student,
  cohortId,
  endorsementId,
  onView,
}: {
  student: EvalRowStudent
  cohortId: string
  endorsementId: string | null
  onView: (endorsementId: string) => void
}) {
  const toast = useToast()
  const submit = useSubmitEndorsement()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState(
    () => localStorage.getItem(draftKey(student.id)) ?? '',
  )
  const [error, setError] = useState<string | null>(null)

  if (endorsementId) {
    return (
      <div className="border-border bg-surface flex items-center gap-2 rounded-xl border px-4 py-3">
        <StatusBadge label="추천서 작성됨" tone="info" />
        <span className="text-fg-muted text-xs">
          이 수강생의 추천서를 이미 작성했어요. 수정은 제출 후 24시간 내에만
          가능합니다.
        </span>
        <button
          type="button"
          onClick={() => onView(endorsementId)}
          className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-md border px-3 py-1.5 text-xs font-medium"
        >
          보기
        </button>
      </div>
    )
  }

  const onSubmit = async () => {
    const parsed = endorsementSchema.safeParse({ comment })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '추천 코멘트를 입력해주세요')
      return
    }
    setError(null)
    try {
      await submit.mutateAsync({
        studentId: student.id,
        comment: parsed.data.comment,
        cohortId,
      })
      localStorage.removeItem(draftKey(student.id))
      toast.success(
        `추천서 제출 — ${student.name} · 24시간 내 수정 가능 · 인증 완료 후 최신화 시 외부 공개에 반영`,
      )
      setOpen(false)
    } catch {
      toast.danger('추천서 제출에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const onDraft = () => {
    if (!comment.trim()) {
      toast.warning('임시 저장하려면 코멘트를 입력해주세요')
      return
    }
    localStorage.setItem(draftKey(student.id), comment)
    toast.info(`임시 저장 — ${student.name}`)
  }

  return (
    <div className="border-border bg-surface rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-fg text-[13px] font-bold">
          추천서 작성 <span className="text-fg-subtle font-medium">(선택)</span>
        </span>
        <span className="text-fg-subtle text-xs">
          · 긍정 추천이 있을 때만 작성합니다 — 인증 완료 후 증명서 최신화를 거쳐
          외부 공개에 반영
        </span>
        {open ? (
          <ChevronUp className="text-fg-subtle ml-auto h-4 w-4" />
        ) : (
          <ChevronDown className="text-fg-subtle ml-auto h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="border-divider border-t px-4 py-4">
          <div className="border-border bg-surface-muted rounded-lg border p-3">
            <p className="text-fg text-[13px] font-bold">
              추천할 내용이 없으면 추천서를 작성하지 않습니다.
            </p>
            <p className="text-fg-muted mt-0.5 text-xs">
              구체적 사례 기반 서술 권장 (20자 이상) · 외부 공개는 인증 완료 +
              증명서 최신화 작업 결과로 결정됩니다.
            </p>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            aria-label={`${student.name} 추천 코멘트`}
            aria-invalid={error ? true : undefined}
            placeholder="구체적 사례를 함께 적어 주세요. (예: 데이터 분석 프로젝트에서 가설 수립부터 검증까지 본인 언어로 설계 근거를 정리한 점이 인상적)"
            className={inputClass({
              size: 'md',
              invalid: !!error,
              className: 'mt-3 resize-y transition-colors',
            })}
          />
          {error && (
            <p role="alert" className="text-danger mt-1 text-[13px]">
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-fg-subtle text-xs">
              제출 후 24시간 내 수정 가능
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onDraft}>
                임시 저장
              </Button>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={submit.isPending}
              >
                추천서 제출
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 최근 작성한 추천서 — 구 코멘트/추천 탭 하단 목록 이관.
 * BE(learning)는 로스터가 없어 userId 만 주므로 이름 join 은 화면이 맡는다(구 화면 관례). */
function RecentEndorsements({
  cohortId,
  onView,
}: {
  cohortId: string
  onView: (path: string) => void
}) {
  const { data: queue } = useEndorsementQueue(cohortId)
  const { data: roster } = useCohortRoster(cohortId)
  const nameOf = useMemo(() => {
    const m = new Map((roster ?? []).map((s) => [s.userId, s.name]))
    return (id: string) => m.get(id) || '(이름 미확인)'
  }, [roster])
  const recent = useMemo(
    () =>
      (queue?.recent ?? []).map((e) => ({
        ...e,
        student: { ...e.student, name: nameOf(e.student.id) },
      })),
    [queue, nameOf],
  )
  if (recent.length === 0) return null
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="text-fg text-lg font-bold">최근 작성한 추천서</h2>
        <span className="text-fg-subtle text-xs">· 누적 {recent.length}건</span>
      </div>
      <div className="border-border bg-surface rounded-xl border">
        {recent.map((e) => {
          const meta = SNAPSHOT_META[e.snapshotStatus]
          return (
            <div
              key={e.id}
              className="border-divider flex items-center gap-3 border-b px-5 py-3 last:border-b-0"
            >
              <Avatar name={e.student.name} size={36} />
              <div className="flex flex-col">
                <span className="text-fg text-sm font-medium">
                  {e.student.name}
                </span>
                <span className="text-fg-subtle text-xs">{e.createdAt}</span>
              </div>
              <StatusBadge label="추천서" tone="info" />
              <StatusBadge label={meta.label} tone={meta.tone} />
              <button
                type="button"
                onClick={() =>
                  onView(
                    `/instructor/endorsements/${e.id}?cohortId=${cohortId}`,
                  )
                }
                className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-md border px-3 py-1.5 text-xs font-medium"
              >
                보기
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
