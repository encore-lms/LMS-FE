import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { SuggestInput } from '@/components/ui/SuggestInput'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  GradingMode,
  QuizVisibility,
  ResultRevealPolicy,
} from '@/shared/types'
import {
  useInstructorQuizDetail,
  useQuizCategoryOptions,
  useSaveQuiz,
} from '../api/quizzes'
import { useAssignmentCohortOptions } from '../api/assignments'
import { useQuizTemplateDetail } from '../api/quizTemplates'
import { GRADING_MODE_META, VISIBILITY_META } from './meta'
import { QuizQuestionEditor } from './QuizQuestionEditor'
import { quizSchema, type QuizInput } from './quiz.schema'

const REVEAL_OPTIONS: { value: ResultRevealPolicy; label: string }[] = [
  { value: 'after_grading', label: '강사 채점 완료 후 공개' },
  { value: 'immediate', label: '제출 즉시 공개' },
  { value: 'after_close', label: '응시 기간 종료 후 공개' },
]

// 폼 일시 포맷 "YYYY-MM-DD HH:mm" (DateTimePicker 저장값).
function fmtDateTime(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// 공통 컴팩트 입력 스타일 — 페이지 전역 Input(h-[52px])보다 작게.
const FIELD =
  'border-border focus:border-brand text-fg placeholder:text-fg-subtle h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none'

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <span className="text-fg-muted mb-1 block text-xs font-semibold">
      {children}
      {required && <span className="text-danger"> *</span>}
    </span>
  )
}

// 컴팩트 세그먼트 — 라디오 카드 대체(채점 모드·공개 상태).
function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: (v: T) => boolean
}) {
  return (
    <div className="bg-surface-muted flex w-full gap-1 rounded-lg p-1">
      {options.map((o) => {
        const on = o.value === value
        const off = disabled?.(o.value) ?? false
        return (
          <button
            key={o.value}
            type="button"
            disabled={off}
            title={o.hint}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[13px] font-semibold transition-colors',
              on
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
              off && 'cursor-not-allowed opacity-40',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// 컴팩트 토글 한 줄.
function CompactToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="bg-surface-muted hover:bg-border/40 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left"
    >
      <span className="text-fg text-[13px] font-medium">{label}</span>
      <span
        className={cn(
          'h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors',
          checked ? 'bg-brand' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'block h-4 w-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
    </button>
  )
}

// 퀴즈 생성/수정 (/instructor/quizzes/new · /:quizId/edit) — §6~§7 통합 1페이지(컴팩트).
// 기본 정보 + 출제 설정 한 화면, 수정 모드에선 문항까지 인라인. 제출된 퀴즈는 채점 모드 변경 차단.
export default function QuizFormPage() {
  const { quizId } = useParams()
  const isEdit = !!quizId
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const templateId = isEdit ? null : searchParams.get('templateId')
  // 과정·기수 허브에서 진입 시 대상 기수를 그 기수로 고정(자유 선택 차단).
  const lockedCohortId = isEdit ? null : searchParams.get('cohortId')
  // 허브 진입(생성·수정 모두)이면 저장·취소 후 허브 퀴즈 탭으로 복귀. cohortId를 편집 화면에도 이어붙인다.
  const fromCohortId = searchParams.get('cohortId')
  const backTo = fromCohortId
    ? `/instructor/cohorts/${fromCohortId}/education?tab=quizzes`
    : base
  const editUrl = (id: string, add: boolean) => {
    const params: string[] = []
    if (add) params.push('add=1')
    if (fromCohortId) params.push(`cohortId=${fromCohortId}`)
    return `${base}/${id}/edit${params.length ? `?${params.join('&')}` : ''}`
  }
  const { data, isPending, isError, refetch } = useInstructorQuizDetail(
    quizId ?? null,
  )
  const { data: template } = useQuizTemplateDetail(templateId)
  const [gradingMode, setGradingMode] = useState<GradingMode>('AUTO')
  const [resultReveal, setResultReveal] =
    useState<ResultRevealPolicy>('after_grading')
  const [allowRetake, setAllowRetake] = useState(false)
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleChoices, setShuffleChoices] = useState(true)
  const [visibility, setVisibility] = useState<QuizVisibility>('draft')
  usePageHeader(
    isEdit ? '퀴즈 수정' : '퀴즈 생성',
    '기본 정보와 출제 설정을 한 화면에서 관리합니다',
  )

  const { data: cohortOptions } = useAssignmentCohortOptions()
  const saveQuiz = useSaveQuiz(quizId)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<QuizInput>({
    resolver: zodResolver(quizSchema),
    defaultValues: { cohortId: '', startAt: '', endAt: '' },
  })

  // 카테고리 추천 — 선택된 기수 범위에서 이미 쓰인 값. 기수를 바꾸면 제안도 따라간다.
  const { data: categoryOptions } = useQuizCategoryOptions(watch('cohortId'))

  // 수정 모드 — 상세 도착 시 폼·라디오·토글 동기화.
  useEffect(() => {
    if (!data) return
    reset({
      title: data.title,
      cohortId: data.cohortId,
      description: data.description,
      category: data.category,
      startAt: data.startAt,
      endAt: data.endAt,
      timeLimitMin: data.timeLimitMin,
    })
    setGradingMode(data.gradingMode)
    setResultReveal(data.resultReveal)
    setAllowRetake(data.allowRetake)
    setShuffleQuestions(data.shuffleQuestions)
    setShuffleChoices(data.shuffleChoices)
    setVisibility(data.visibility)
  }, [data, reset])

  // 생성 모드 — 고정 기수(허브 진입)면 그 기수로, 아니면 기수 옵션 로드 시 첫 기수 기본 선택.
  useEffect(() => {
    if (isEdit) return
    if (lockedCohortId) {
      setValue('cohortId', lockedCohortId)
      return
    }
    if (cohortOptions && cohortOptions.length > 0 && !getValues('cohortId')) {
      setValue('cohortId', cohortOptions[0].cohortId)
    }
  }, [isEdit, lockedCohortId, cohortOptions, getValues, setValue])

  // 생성 모드 — 일시/제한시간 기본값(시작=현재, 종료=다음날, 제한 60분). 1회.
  const initDefaultsRef = useRef(false)
  useEffect(() => {
    if (isEdit || initDefaultsRef.current) return
    initDefaultsRef.current = true
    const now = new Date()
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    setValue('startAt', fmtDateTime(now))
    setValue('endAt', fmtDateTime(next))
    setValue('timeLimitMin', 60)
  }, [isEdit, setValue])

  // 생성 모드 — 템플릿 프리필(cohortId 보존).
  const prefilledRef = useRef<string | null>(null)
  useEffect(() => {
    if (isEdit || !template) return
    if (prefilledRef.current === template.id) return
    prefilledRef.current = template.id
    setValue('title', template.name)
    setValue('description', template.description)
    setValue('timeLimitMin', template.defaultTimeLimitMin)
    setGradingMode(template.gradingMode)
    setResultReveal(template.resultReveal)
    setShuffleQuestions(template.shuffleQuestions)
    setShuffleChoices(template.shuffleChoices)
    toast.info(
      `'${template.name}' 템플릿을 불러왔어요 (문항 ${template.questionCount}개)`,
    )
  }, [isEdit, template, setValue, toast])

  const hasSubmissions = isEdit && (data?.submittedCount ?? 0) > 0

  const save = (input: QuizInput, vis: QuizVisibility, openAdd = false) => {
    saveQuiz.mutate(
      {
        cohortId: input.cohortId,
        title: input.title,
        description: input.description,
        category: input.category,
        gradingMode,
        resultReveal,
        timeLimitMin: input.timeLimitMin,
        allowRetake,
        shuffleQuestions,
        shuffleChoices,
        visibility: vis,
        startAt: input.startAt,
        endAt: input.endAt,
      },
      {
        onSuccess: (saved) => {
          toast.success(`${input.title} 저장 — ${VISIBILITY_META[vis].label}`)
          // 생성 직후엔 같은 폼의 수정 화면으로 — 문항 섹션이 인라인으로 함께 보인다.
          // 여기서 목록으로 내보내면 문항 0개짜리 퀴즈가 남는다.
          // openAdd면 문항 추가 폼을 바로 펼친다(임시저장 따로 누를 필요 없음).
          if (!isEdit) {
            navigate(editUrl(saved.id, openAdd))
            return
          }
          // 수정 저장은 편집을 마쳤다는 뜻 — 목록(허브 퀴즈 탭)으로 복귀한다.
          navigate(backTo)
        },
        onError: () => toast.danger('저장에 실패했어요'),
      },
    )
  }

  // 생성 모드 — 임시저장 버튼 없이 바로 문항 추가. 제목·기수만 있으면 임시저장 생성 후 편집(문항 폼 펼침).
  // 시작/종료/제한시간은 미입력이어도 허용(공개 전까지 보완 가능).
  const onQuickAddQuestion = () => {
    const v = getValues()
    if (!v.title?.trim()) {
      toast.danger('제목을 입력해 주세요')
      return
    }
    if (!v.cohortId) {
      toast.danger('대상 과정/기수를 선택해 주세요')
      return
    }
    saveQuiz.mutate(
      {
        cohortId: v.cohortId,
        title: v.title.trim(),
        description: v.description,
        gradingMode,
        resultReveal,
        timeLimitMin: Number(v.timeLimitMin) || undefined,
        allowRetake,
        shuffleQuestions,
        shuffleChoices,
        visibility,
        startAt: v.startAt || undefined,
        endAt: v.endAt || undefined,
      },
      {
        onSuccess: (saved) => {
          toast.success('임시저장했어요 — 문항을 추가하세요')
          navigate(editUrl(saved.id, true))
        },
        onError: () => toast.danger('저장에 실패했어요'),
      },
    )
  }

  return (
    <DataBoundary
      isPending={isEdit && isPending}
      isError={isEdit && (isError || !data)}
      onRetry={() => refetch()}
      loadingText="퀴즈 정보를 불러오는 중…"
      errorTitle="퀴즈 정보를 불러오지 못했어요"
      errorDescription={null}
      className="p-8"
    >
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        {hasSubmissions && (
          <div className="bg-warning-bg flex max-w-4xl items-start gap-2.5 rounded-lg p-3">
            <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-fg-muted text-xs">
              이미 {data?.submittedCount}명 응시 중 — 정답/배점 변경 시 자동
              재채점, 채점 모드 변경은 차단됩니다.
            </p>
          </div>
        )}

        {/* 기본 정보 */}
        <section className="bg-surface max-w-4xl rounded-xl p-5">
          <p className="text-fg mb-3 text-sm font-bold">기본 정보</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
            <div>
              <FieldLabel required>제목</FieldLabel>
              <input
                className={FIELD}
                placeholder="알고리즘 기초 #3"
                {...register('title')}
              />
              {errors.title && (
                <span className="text-danger mt-1 block text-xs">
                  {errors.title.message}
                </span>
              )}
            </div>
            <div>
              <FieldLabel required>대상 과정/기수</FieldLabel>
              {lockedCohortId ? (
                // 허브 진입 — 대상 기수 고정(변경 불가). 라벨은 옵션 로드 후 표시.
                <div
                  aria-label="대상 과정/기수(고정)"
                  className="border-border bg-surface-muted text-fg flex h-10 w-full items-center rounded-lg border px-3 text-sm"
                >
                  {cohortOptions?.find((c) => c.cohortId === lockedCohortId)
                    ?.label ?? '기수 고정'}
                </div>
              ) : (
                <Controller
                  name="cohortId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      aria-label="대상 과정/기수"
                      value={field.value}
                      onChange={field.onChange}
                      options={(cohortOptions ?? []).map((c) => ({
                        value: c.cohortId,
                        label: c.label,
                      }))}
                      placeholder="기수 없음"
                      className="h-10 w-full"
                    />
                  )}
                />
              )}
            </div>
          </div>
          <div className="mt-3">
            <FieldLabel>설명</FieldLabel>
            <textarea
              rows={2}
              placeholder="퀴즈 안내·범위(선택)"
              className={`${FIELD} h-auto py-2`}
              {...register('description')}
            />
          </div>
          <div className="mt-3 sm:max-w-xs">
            <FieldLabel>카테고리</FieldLabel>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <SuggestInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  suggestions={categoryOptions?.quizCategories}
                  placeholder="예: 빅데이터 (선택)"
                  aria-label="퀴즈 카테고리"
                  maxLength={50}
                  className={FIELD}
                />
              )}
            />
            {errors.category?.message && (
              <p className="text-danger mt-1 text-[12px]">
                {errors.category.message}
              </p>
            )}
          </div>
        </section>

        {/* 출제 설정 — 응시·채점·문제·공개 통합(컴팩트) */}
        <section className="bg-surface max-w-4xl rounded-xl p-5">
          <p className="text-fg mb-3 text-sm font-bold">출제 설정</p>

          {/* 기간·제한 */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel required>시작일시</FieldLabel>
              <Controller
                control={control}
                name="startAt"
                render={({ field }) => (
                  <DateTimePicker
                    mode="datetime"
                    label=""
                    placeholder="2026-05-12 09:00"
                    error={errors.startAt?.message}
                    value={field.value ? field.value.replace(' ', 'T') : ''}
                    onChange={(v) =>
                      field.onChange(v ? v.replace('T', ' ') : '')
                    }
                  />
                )}
              />
            </div>
            <div>
              <FieldLabel required>종료일시</FieldLabel>
              <Controller
                control={control}
                name="endAt"
                render={({ field }) => (
                  <DateTimePicker
                    mode="datetime"
                    label=""
                    placeholder="2026-05-18 23:59"
                    error={errors.endAt?.message}
                    value={field.value ? field.value.replace(' ', 'T') : ''}
                    onChange={(v) =>
                      field.onChange(v ? v.replace('T', ' ') : '')
                    }
                  />
                )}
              />
            </div>
            <div>
              <FieldLabel required>제한 시간(분)</FieldLabel>
              <input
                type="number"
                className={FIELD}
                placeholder="90"
                {...register('timeLimitMin')}
              />
              {errors.timeLimitMin && (
                <span className="text-danger mt-1 block text-xs">
                  {errors.timeLimitMin.message}
                </span>
              )}
            </div>
          </div>

          {/* 채점 모드 · 결과 공개 · 총점 */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <FieldLabel>채점 모드</FieldLabel>
              <Segmented
                options={(['AUTO', 'MANUAL', 'MIXED'] as const).map((m) => ({
                  value: m,
                  label: GRADING_MODE_META[m].label,
                }))}
                value={gradingMode}
                onChange={setGradingMode}
                disabled={(v) => hasSubmissions && v !== gradingMode}
              />
            </div>
            <div>
              <FieldLabel>결과 공개</FieldLabel>
              <Select
                className="h-10 w-full"
                aria-label="결과 공개 시점"
                value={resultReveal}
                onChange={(v) => setResultReveal(v as ResultRevealPolicy)}
                options={REVEAL_OPTIONS}
              />
            </div>
            <div>
              <FieldLabel>총점</FieldLabel>
              {/* 총점은 문항 배점 합계에서 자동 계산된다 — 직접 수정하지 않는다(서버가 문항 CRUD 때 동기화). */}
              <div
                className={`${FIELD} text-fg-muted bg-surface-muted flex cursor-not-allowed items-center`}
                aria-label="총점(자동 계산)"
              >
                {isEdit ? `${data?.totalPoints ?? 0}점` : '문항 추가 시 자동 계산'}
              </div>
              <span className="text-fg-subtle mt-1 block text-xs">
                문항 배점 합계로 자동 계산됩니다
              </span>
            </div>
          </div>

          {/* 정책 토글 */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <CompactToggle
              label="재응시 허용"
              checked={allowRetake}
              onChange={() => setAllowRetake((v) => !v)}
            />
            <CompactToggle
              label="문제 셔플"
              checked={shuffleQuestions}
              onChange={() => setShuffleQuestions((v) => !v)}
            />
            <CompactToggle
              label="보기 셔플"
              checked={shuffleChoices}
              onChange={() => setShuffleChoices((v) => !v)}
            />
          </div>

          {/* 공개 상태 */}
          <div className="mt-4 sm:w-[420px]">
            <FieldLabel>공개 상태</FieldLabel>
            <Segmented
              options={(['draft', 'published', 'closed'] as const).map((v) => ({
                value: v,
                label: VISIBILITY_META[v].label,
              }))}
              value={visibility}
              onChange={setVisibility}
            />
          </div>
        </section>

        {/* 문항 — 수정 모드는 인라인, 생성 모드는 저장 후 안내 */}
        <section className="bg-surface max-w-4xl rounded-xl p-5">
          <p className="text-fg mb-3 text-sm font-bold">문항</p>
          {isEdit && quizId ? (
            <QuizQuestionEditor
              categorySuggestions={categoryOptions?.questionCategories ?? []}
              quizId={quizId}
              defaultAdding={searchParams.get('add') === '1'}
            />
          ) : (
            <div className="bg-surface-muted flex flex-col items-center gap-3 rounded-lg px-4 py-6 text-center">
              <p className="text-fg-subtle text-sm">
                ‘문제 추가’를 누르면 자동 임시저장 후 바로 문항을 추가할 수
                있어요.
              </p>
              <Button
                type="button"
                size="sm"
                disabled={saveQuiz.isPending}
                onClick={onQuickAddQuestion}
              >
                <Plus className="h-4 w-4" /> 문제 추가
              </Button>
            </div>
          )}
        </section>

        {/* 푸터 */}
        <div className="bg-surface flex max-w-4xl items-center gap-2 rounded-xl px-4 py-3">
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(backTo)}
            >
              취소
            </Button>
            {/* 공개 상태는 위 세그먼트가 단일 진실원 — 적용될 상태를 라벨에 노출한다. */}
            <Button
              type="button"
              size="sm"
              disabled={saveQuiz.isPending}
              onClick={handleSubmit((input) => save(input, visibility))}
            >
              저장 ({VISIBILITY_META[visibility].label})
            </Button>
          </div>
        </div>
      </div>
    </DataBoundary>
  )
}
