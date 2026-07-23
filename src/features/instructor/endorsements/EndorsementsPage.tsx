import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useSearchParamState } from '@/shared/hooks/useSearchParamState'
import type { EndorsementPending } from '@/shared/types'
import { useEndorsementQueue, useSubmitEndorsement } from '../api/endorsements'
import { useCohortRoster, useInstructorCohorts } from '../api/console'
import { SNAPSHOT_META } from './meta'
import { endorsementSchema, type EndorsementInput } from './endorsement.schema'
import { SkeletonListPage } from '@/components/ui/Skeleton'

// 임시 저장 초안 — 학생별 localStorage 키. 제출 성공 시 제거(BE 연동 시 draft API로 대체).
const draftKey = (studentId: string) => `endorsement-draft:${studentId}`

// 강사 추천서 (/instructor/endorsements) — 긍정 추천서 작성 화면.
// 작성 대기 카드 → 학생 선택 → 코멘트 작성 → 제출. 하단에 최근 작성 + 전체 보기.
// (Figma "강사 — 강사 추천서" 2117:14624)
export default function EndorsementsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const submit = useSubmitEndorsement()
  usePageHeader('강사 추천서', '담당 수강생을 위한 추천서를 작성합니다')

  // 강사는 기수를 여러 개 담당한다 — 큐·명단·작성이 같은 기수를 보도록 하나로 묶는다.
  // (기수를 안 맞추면 다른 기수 학생이 대상일 때 이름이 '(이름 미확인)'이 된다.)
  const { data: cohorts } = useInstructorCohorts()
  const cohortOptions = useMemo(() => cohorts?.rows ?? [], [cohorts])
  const [pickedCohort, setPickedCohort] = useSearchParamState('cohort')
  const cohortId = pickedCohort || cohortOptions[0]?.id || null

  const { data, isPending, isError, refetch } = useEndorsementQueue(cohortId)
  // 명단 — BE(learning)는 수강생 로스터가 없어 추천서 응답에 userId 만 준다.
  // 이름 join·작성 대기 계산을 화면이 맡는다(운영 프로젝트 목록과 동일 관례).
  const { data: roster, isPending: rosterPending } = useCohortRoster(cohortId)
  // 명단이 오기 전에 그리면 이름이 '(이름 미확인)'으로, 작성 대기가 0건으로 잠깐 보인다.
  // 명단도 이 화면의 필수 데이터라 로딩에 포함한다.
  const rosterLoading = !cohorts || rosterPending

  const nameOf = useMemo(() => {
    const m = new Map((roster ?? []).map((s) => [s.userId, s.name]))
    return (id: string) => m.get(id) || '(이름 미확인)'
  }, [roster])

  // 최근 작성 — BE 가 준 userId 에 이름을 채운다.
  const recent = useMemo(
    () =>
      (data?.recent ?? []).map((e) => ({
        ...e,
        student: { ...e.student, name: nameOf(e.student.id) },
      })),
    [data, nameOf],
  )

  // 작성 대기 = 담당 기수 명단 − 이미 쓴 대상. BE 는 로스터가 없어 빈 목록을 주므로 여기서 만든다.
  const pending: EndorsementPending[] = useMemo(() => {
    const written = new Set((data?.recent ?? []).map((e) => e.student.id))
    return (roster ?? [])
      .filter((s) => !written.has(s.userId))
      .map((s) => ({
        student: {
          id: s.userId,
          name: s.name,
          cohort: data?.cohort ?? '',
        },
        // 관찰 기간·마감은 산출 근거가 정의되지 않아 0(화면에서 숨김).
        observationMonths: 0,
        dueDays: 0,
      }))
  }, [roster, data])

  const [studentId, setStudentId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<EndorsementInput>({
    resolver: zodResolver(endorsementSchema),
    defaultValues: { comment: '' },
  })

  // 첫 로드/목록 변경 시 첫 대기 학생을 기본 선택.
  useEffect(() => {
    if (!studentId && pending.length > 0) setStudentId(pending[0].student.id)
  }, [pending, studentId])

  // 학생이 바뀌면 그 학생의 임시 저장 초안을 복원(없으면 비움 — 다른 학생에게 새어 들어가지 않게).
  useEffect(() => {
    if (!studentId) {
      reset({ comment: '' })
      return
    }
    reset({ comment: localStorage.getItem(draftKey(studentId)) ?? '' })
  }, [studentId, reset])

  const selected =
    pending.find((p) => p.student.id === studentId) ?? pending[0] ?? null

  const onSubmit = async (input: EndorsementInput) => {
    if (!selected) return
    const { id, name } = selected.student
    try {
      await submit.mutateAsync({
        studentId: id,
        comment: input.comment,
        cohortId,
      })
      localStorage.removeItem(draftKey(id))
      toast.success(
        `추천서 제출 — ${name} · 24h 내 수정 가능 · 인증 완료 후 최신화 시 공개 스냅샷 반영`,
      )
      reset({ comment: '' })
      // 제출한 학생은 작성 대기에서 빠지므로 선택 해제 → 다음 대기 학생 자동 선택.
      setStudentId(null)
    } catch {
      toast.danger('추천서 제출에 실패했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  // 임시 저장은 20자 제한을 적용하지 않는다(작성 중 저장). 비어있을 때만 막고,
  // 20자 이상 검증은 제출(onSubmit)에서만 수행한다.
  const onDraft = () => {
    if (!selected) return
    const comment = getValues('comment')
    if (!comment.trim()) {
      toast.warning('임시 저장하려면 코멘트를 입력해주세요')
      return
    }
    localStorage.setItem(draftKey(selected.student.id), comment)
    toast.info(`임시 저장 — ${selected.student.name}`)
  }

  return (
    <DataBoundary
      isPending={isPending || rosterLoading}
      isError={isError || !data}
      onRetry={() => refetch()}
      skeleton={<SkeletonListPage kpis={3} columns={5} className="" />}
      errorTitle="추천서 화면을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
        <div className="p-8">
          {/* 기수 선택 — 강사는 여러 기수를 담당한다. 큐·명단·작성이 이 기수를 함께 따른다. */}
          {cohortOptions.length > 1 && (
            <div className="mb-5">
              <Select
                aria-label="기수 선택"
                value={cohortId}
                onChange={(v) => {
                  setPickedCohort(v)
                  setStudentId(null) // 기수가 바뀌면 이전 기수 학생 선택을 버린다
                }}
                options={cohortOptions.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                className="h-11"
              />
            </div>
          )}

          {/* 안내 배너 */}
          <div className="border-info/30 bg-info-bg flex gap-3 rounded-xl border p-4">
            <Info className="text-info mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-fg text-sm font-bold">
                강사 추천서는 본 화면에서만 작성할 수 있어요
              </p>
              <p className="text-fg-muted mt-0.5 text-xs">
                작성한 추천서는 긍정 추천이 있을 때만 저장되며, 인증 완료 후
                증명서 최신화 작업을 거쳐 공개 스냅샷에 반영됩니다.
              </p>
            </div>
          </div>

          {/* 작성 대기 */}
          <div className="mt-8 flex items-center gap-2">
            <h2 className="text-fg text-lg font-bold">작성 대기</h2>
            <StatusBadge label={`${pending.length}건`} tone="warning" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map((p) => (
              <PendingCard
                key={p.student.id}
                pending={p}
                active={p.student.id === selected?.student.id}
                onPick={() => setStudentId(p.student.id)}
              />
            ))}
            {pending.length === 0 && (
              <p className="text-fg-subtle col-span-full py-6 text-sm">
                작성 대기 중인 추천서가 없어요.
              </p>
            )}
          </div>

          {/* 작성 폼 */}
          {selected && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="border-border bg-surface mt-6 rounded-xl border p-6"
            >
              <div className="flex items-center gap-3">
                <Avatar name={selected.student.name} size={36} />
                <div className="flex flex-col">
                  <span className="text-fg text-sm font-bold">
                    {selected.student.name}
                  </span>
                  <span className="text-fg-subtle text-xs">
                    {selected.student.cohort}
                    {selected.student.track
                      ? ` · ${selected.student.track}`
                      : ''}
                  </span>
                </div>
                {pending.length > 1 && (
                  <label className="ml-auto flex items-center gap-1.5 text-xs">
                    <span className="text-fg-subtle">학생 변경</span>
                    <Select
                      value={selected.student.id}
                      onChange={(v) => setStudentId(v)}
                      aria-label="학생 변경"
                      options={pending.map((p) => ({
                        value: p.student.id,
                        label: p.student.name,
                      }))}
                    />
                  </label>
                )}
              </div>

              {/* 작성 기준 */}
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
                    외부 공개는 학생의 개별 토글이 아니라 인증 완료 + 증명서
                    최신화 작업 결과로 결정됩니다.
                  </p>
                </div>
              </div>

              {/* 코멘트 */}
              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <span className="text-fg text-[13px] font-bold">
                    추천 코멘트
                  </span>
                  <span className="text-fg-subtle text-xs">
                    · 구체적 사례 기반 서술 권장 (필수 · 길이 무제한)
                  </span>
                </div>
                <textarea
                  {...register('comment')}
                  rows={4}
                  aria-label="추천 코멘트"
                  aria-invalid={errors.comment ? true : undefined}
                  placeholder="구체적 사례를 함께 적어 주세요. (예: 데이터 분석 프로젝트에서 가설 수립부터 검증까지 본인 언어로 설계 근거를 정리한 점이 인상적)"
                  className={`text-fg placeholder:text-fg-subtle mt-2 w-full rounded-lg border-2 bg-white p-3 text-sm transition-colors outline-none ${
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
                  제출 후 24시간 내 수정 가능 · 외부 공개는 증명서 최신화 작업
                  이후 반영
                </span>
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={onDraft}>
                    임시 저장
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    제출
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* 최근 작성한 추천서 */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-fg text-lg font-bold">최근 작성한 추천서</h2>
              <span className="text-fg-subtle text-xs">
                · 누적 {recent.length}건
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/instructor/endorsements/history')}
              className="text-brand text-sm font-medium hover:underline"
            >
              전체 보기 →
            </button>
          </div>
          <div className="border-border bg-surface mt-3 rounded-xl border">
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
                    <span className="text-fg-subtle text-xs">
                      {e.createdAt}
                    </span>
                  </div>
                  <StatusBadge label="추천서" tone="info" />
                  <StatusBadge label={meta.label} tone={meta.tone} />
                  <button
                    type="button"
                    onClick={() => navigate(`/instructor/endorsements/${e.id}`)}
                    className="border-border text-fg-muted hover:bg-surface-muted ml-auto rounded-md border px-3 py-1.5 text-xs font-medium"
                  >
                    보기
                  </button>
                </div>
              )
            })}
            {recent.length === 0 && (
              <p className="text-fg-subtle px-5 py-6 text-sm">
                아직 작성한 추천서가 없어요.
              </p>
            )}
          </div>
        </div>
      )}
    </DataBoundary>
  )
}

function PendingCard({
  pending,
  active,
  onPick,
}: {
  pending: EndorsementPending
  active: boolean
  onPick: () => void
}) {
  const { student, observationMonths, dueDays } = pending
  const urgent = dueDays > 0 && dueDays <= 3
  return (
    <div
      className={`border-border bg-surface flex flex-col rounded-xl border p-6 ${
        active ? 'ring-accent ring-2' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={student.name} size={36} />
        <div className="flex min-w-0 flex-col">
          <span className="text-fg text-sm font-bold">{student.name}</span>
          <span className="text-fg-subtle text-xs">
            {student.cohort}
            {student.track ? ` · ${student.track}` : ''}
          </span>
        </div>
      </div>
      {/* 관찰 기간·마감은 산출 근거가 정해지지 않아 값이 있을 때만 보여준다(0이면 숨김). */}
      {observationMonths > 0 && (
        <p className="text-fg-muted mt-4 text-xs">
          관찰 {observationMonths}개월
        </p>
      )}
      {dueDays > 0 && (
        <p className="text-fg-subtle mt-1 text-xs">
          마감{' '}
          <span className={urgent ? 'text-danger font-bold' : 'text-fg-muted'}>
            D-{dueDays}
          </span>
        </p>
      )}
      <Button type="button" className="mt-4" onClick={onPick}>
        작성하기
      </Button>
    </div>
  )
}
