import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuizBasePath } from './useQuizBasePath'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  GradingMode,
  QuizVisibility,
  ResultRevealPolicy,
} from '@/shared/types'
import { useInstructorQuizDetail, useSaveQuiz } from '../api/quizzes'
import { useAssignmentCohortOptions } from '../api/assignments'
import { useQuizTemplateDetail } from '../api/quizTemplates'
import { GRADING_MODE_META, VISIBILITY_META } from './meta'
import { quizSchema, type QuizInput } from './quiz.schema'

const REVEAL_OPTIONS: { value: ResultRevealPolicy; label: string }[] = [
  { value: 'after_grading', label: '강사 채점 완료 후 학생에게 공개' },
  { value: 'immediate', label: '제출 즉시 자동 채점 결과 공개' },
  { value: 'after_close', label: '응시 기간 종료 후 일괄 공개' },
]

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="border-border flex items-center justify-between rounded-xl border px-4 py-3">
      <div>
        <p className="text-fg text-sm font-medium">{label}</p>
        <p className="text-fg-subtle text-xs">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          'h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors',
          checked ? 'bg-brand' : 'bg-border',
        )}
      >
        <span
          className={cn(
            'block h-5 w-5 rounded-full bg-white transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  )
}

// 라디오 카드 3종 — 채점 정책·공개 설정 공용.
function RadioCards<T extends string>({
  options,
  value,
  onChange,
  disabledNote,
  isDisabled,
}: {
  options: { value: T; title: string; description: string }[]
  value: T
  onChange: (v: T) => void
  /** 카드 비활성 시 보조 설명 (채점 모드 변경 차단) */
  disabledNote?: string
  isDisabled?: boolean
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            disabled={isDisabled && !selected}
            title={isDisabled && !selected ? disabledNote : undefined}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-start gap-3 rounded-xl border p-3.5 text-left',
              selected
                ? 'border-accent-strong bg-accent-bg/40'
                : 'border-border hover:bg-surface-muted',
              isDisabled && !selected && 'cursor-not-allowed opacity-50',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                selected ? 'border-accent-strong' : 'border-border',
              )}
            >
              {selected && (
                <span className="bg-accent-strong h-2 w-2 rounded-full" />
              )}
            </span>
            <span>
              <span className="text-fg block text-sm font-bold">{o.title}</span>
              <span className="text-fg-muted mt-0.5 block text-xs">
                {o.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 퀴즈 생성/수정 (/instructor/quizzes/new · /:quizId/edit) — §6. (Figma 1338:9792)
// 이미 제출된 퀴즈는 amber 경고 + 채점 모드 변경 차단. 정답/배점 변경은 자동 재채점 트리거.
export default function QuizFormPage() {
  const { quizId } = useParams()
  const isEdit = !!quizId
  const navigate = useNavigate()
  const base = useQuizBasePath()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  // 생성 모드에서 '템플릿 열기'로 진입하면 ?templateId= 로 폼을 프리필.
  const templateId = isEdit ? null : searchParams.get('templateId')
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
    '기본 정보 · 응시 정책 · 채점 정책 · 문제 정책 · 공개 설정',
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
    formState: { errors },
  } = useForm<QuizInput>({
    resolver: zodResolver(quizSchema),
    // startAt/endAt 은 Controller(DateTimePicker)라 빈 문자열로 초기화 → 미입력 시 min(1) 메시지 노출
    defaultValues: { cohortId: '', startAt: '', endAt: '' },
  })

  // 수정 모드 — 상세 도착 시 폼·라디오·토글 동기화.
  useEffect(() => {
    if (!data) return
    reset({
      title: data.title,
      cohortId: data.cohortId,
      description: data.description,
      startAt: data.startAt,
      endAt: data.endAt,
      timeLimitMin: data.timeLimitMin,
      totalPoints: data.totalPoints,
    })
    setGradingMode(data.gradingMode)
    setResultReveal(data.resultReveal)
    setAllowRetake(data.allowRetake)
    setShuffleQuestions(data.shuffleQuestions)
    setShuffleChoices(data.shuffleChoices)
    setVisibility(data.visibility)
  }, [data, reset])

  // 생성 모드 — 기수 옵션 로드되면 첫 기수 기본 선택(미선택 시).
  useEffect(() => {
    if (!isEdit && cohortOptions && cohortOptions.length > 0) {
      if (!getValues('cohortId'))
        setValue('cohortId', cohortOptions[0].cohortId)
    }
  }, [isEdit, cohortOptions, getValues, setValue])

  // 생성 모드 — 템플릿 프리필(제목·설명·배점·시간·정책). cohortId는 보존(setValue로 개별 적용).
  const prefilledRef = useRef<string | null>(null)
  useEffect(() => {
    if (isEdit || !template) return
    if (prefilledRef.current === template.id) return
    prefilledRef.current = template.id
    setValue('title', template.name)
    setValue('description', template.description)
    setValue('timeLimitMin', template.defaultTimeLimitMin)
    setValue('totalPoints', template.totalPoints)
    setGradingMode(template.gradingMode)
    setResultReveal(template.resultReveal)
    setShuffleQuestions(template.shuffleQuestions)
    setShuffleChoices(template.shuffleChoices)
    toast.info(
      `'${template.name}' 템플릿을 불러왔어요 (문항 ${template.questionCount} · 만점 ${template.totalPoints})`,
    )
  }, [isEdit, template, setValue, toast])

  if (isEdit && isPending) {
    return <div className="text-fg-muted p-8">퀴즈 정보를 불러오는 중…</div>
  }
  if (isEdit && (isError || !data)) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="퀴즈 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const hasSubmissions = isEdit && (data?.submittedCount ?? 0) > 0

  const save = (
    input: QuizInput,
    thenQuestions: boolean,
    vis: QuizVisibility,
  ) => {
    saveQuiz.mutate(
      {
        cohortId: input.cohortId,
        title: input.title,
        description: input.description,
        gradingMode,
        resultReveal,
        timeLimitMin: input.timeLimitMin,
        allowRetake,
        shuffleQuestions,
        shuffleChoices,
        totalPoints: input.totalPoints,
        visibility: vis,
        startAt: input.startAt,
        endAt: input.endAt,
      },
      {
        onSuccess: (saved) => {
          toast.success(`${input.title} 저장 — ${VISIBILITY_META[vis].label}`)
          if (thenQuestions) navigate(`${base}/${quizId ?? saved.id}/questions`)
          else navigate(base)
        },
        onError: () => toast.danger('저장에 실패했어요'),
      },
    )
  }

  return (
    <div className="p-8">
      {/* 이미 제출 경고 */}
      {hasSubmissions && (
        <div className="bg-warning-bg mb-5 flex items-start gap-3 rounded-xl p-4">
          <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-fg text-sm font-bold">
              이미 제출된 퀴즈입니다 — {data?.submittedCount}명 응시 중
            </p>
            <p className="text-fg-muted text-xs">
              정답/배점 변경 시 자동 재채점이 트리거되고, 기간/제한 시간 변경은
              응시 중인 학생에게 즉시 적용됩니다. 채점 모드 변경은 차단됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <section className="border-border bg-surface rounded-xl border p-6">
        <p className="text-fg text-base font-bold">기본 정보</p>
        <p className="text-fg-subtle text-xs">제목·설명·대상 과정/기수</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Input
            label="제목"
            required
            placeholder="알고리즘 기초 #3"
            error={errors.title?.message}
            {...register('title')}
          />
          <label className="flex w-full flex-col gap-[6px]">
            <span className="text-fg text-[13px] font-bold">
              대상 과정/기수 <span className="text-danger">*</span>
            </span>
            <select
              aria-label="대상 과정/기수"
              className="border-border focus:border-brand text-fg h-[52px] rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none"
              {...register('cohortId')}
            >
              {(cohortOptions ?? []).map((c) => (
                <option key={c.cohortId} value={c.cohortId}>
                  {c.label}
                </option>
              ))}
              {(cohortOptions ?? []).length === 0 && (
                <option value="">기수 없음</option>
              )}
            </select>
          </label>
        </div>
        <label className="mt-4 flex w-full flex-col gap-[6px]">
          <span className="text-fg text-[13px] font-bold">설명</span>
          <textarea
            rows={2}
            placeholder="재귀·동적 계획법·그리디 기본 개념 확인."
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
            {...register('description')}
          />
        </label>
      </section>

      {/* 응시 정책 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">응시 정책</p>
        <p className="text-fg-subtle text-xs">
          시작일·종료일·제한 시간·재응시 허용 (변경 시 응시 중인 학생에게 즉시
          적용)
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* 시작·종료 일시 — 공용 DateTimePicker(datetime). 저장값은 "YYYY-MM-DD HH:mm"(공백)이라 경계에서 'T'와 변환 */}
          <Controller
            control={control}
            name="startAt"
            render={({ field }) => (
              <DateTimePicker
                mode="datetime"
                label="시작일"
                required
                placeholder="2026-05-12 09:00"
                error={errors.startAt?.message}
                value={field.value ? field.value.replace(' ', 'T') : ''}
                onChange={(v) => field.onChange(v ? v.replace('T', ' ') : '')}
              />
            )}
          />
          <Controller
            control={control}
            name="endAt"
            render={({ field }) => (
              <DateTimePicker
                mode="datetime"
                label="종료일"
                required
                placeholder="2026-05-18 23:59"
                error={errors.endAt?.message}
                value={field.value ? field.value.replace(' ', 'T') : ''}
                onChange={(v) => field.onChange(v ? v.replace('T', ' ') : '')}
              />
            )}
          />
          <Input
            label="제한 시간 (분)"
            required
            placeholder="90"
            error={errors.timeLimitMin?.message}
            {...register('timeLimitMin')}
          />
        </div>
        <div className="mt-4">
          <ToggleRow
            label="재응시 허용"
            description="학생이 제출 후 점수 확인 → 재시작 가능 · 점수는 최고 점수만 기록"
            checked={allowRetake}
            onChange={() => setAllowRetake((v) => !v)}
          />
        </div>
      </section>

      {/* 채점 정책 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">채점 정책</p>
        <p className="text-fg-subtle text-xs">
          AUTO·MANUAL·MIXED 중 선택 · 문제별 채점 방식과 일치해야 함 (이미
          제출된 퀴즈는 변경 차단)
        </p>
        <div className="mt-4">
          <RadioCards
            options={(['AUTO', 'MANUAL', 'MIXED'] as const).map((m) => ({
              value: m,
              title: GRADING_MODE_META[m].label,
              description: GRADING_MODE_META[m].description,
            }))}
            value={gradingMode}
            onChange={setGradingMode}
            isDisabled={hasSubmissions}
            disabledNote="이미 제출된 퀴즈는 채점 모드를 변경할 수 없어요"
          />
        </div>
        <label className="mt-4 flex w-full flex-col gap-[6px] lg:w-[420px]">
          <span className="text-fg text-[13px] font-bold">결과 공개 시점</span>
          <select
            value={resultReveal}
            onChange={(e) =>
              setResultReveal(e.target.value as ResultRevealPolicy)
            }
            aria-label="결과 공개 시점"
            className="border-border focus:border-brand text-fg h-[44px] rounded-[10px] border-2 bg-white px-4 text-sm font-medium outline-none"
          >
            {REVEAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* 문제 정책 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">문제 정책</p>
        <p className="text-fg-subtle text-xs">문제 셔플·보기 셔플·총점</p>
        <div className="mt-4 flex flex-col gap-3">
          <ToggleRow
            label="문제 셔플"
            description="학생마다 다른 순서로 문제 노출 (난이도 분포는 유지)"
            checked={shuffleQuestions}
            onChange={() => setShuffleQuestions((v) => !v)}
          />
          <ToggleRow
            label="보기 셔플"
            description="객관식 보기 순서를 학생마다 다르게 (정답 위치 노출 방지)"
            checked={shuffleChoices}
            onChange={() => setShuffleChoices((v) => !v)}
          />
        </div>
        <div className="mt-4 flex items-end gap-3">
          <div className="w-40">
            <Input
              label="총점"
              placeholder="100"
              error={errors.totalPoints?.message}
              {...register('totalPoints')}
            />
          </div>
          {isEdit && data && (
            <span className="text-fg-subtle pb-4 text-xs">
              · 문제 {data.questionCount}개 · 평균 배점{' '}
              {data.questionCount > 0
                ? Math.round(data.totalPoints / data.questionCount)
                : 0}
              점
            </span>
          )}
        </div>
      </section>

      {/* 공개 설정 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">공개 설정</p>
        <p className="text-fg-subtle text-xs">
          학생에게 노출 여부 · 임시저장은 강사·운영자만 조회
        </p>
        <div className="mt-4">
          <RadioCards
            options={(['draft', 'published', 'closed'] as const).map((v) => ({
              value: v,
              title: VISIBILITY_META[v].label,
              description: VISIBILITY_META[v].description,
            }))}
            value={visibility}
            onChange={setVisibility}
          />
        </div>
      </section>

      {/* 푸터 */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border px-5 py-4">
        <p className="text-fg-subtle text-xs">
          저장 후 [문제 관리]로 진입해 문제를 편집할 수 있습니다.
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 text-sm"
            onClick={() => navigate(base)}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 text-sm"
            onClick={handleSubmit((input) => {
              setVisibility('draft')
              save(input, false, 'draft')
            })}
          >
            임시저장으로 저장
          </Button>
          <Button
            type="button"
            className="h-10 text-sm"
            disabled={saveQuiz.isPending}
            onClick={handleSubmit((input) => save(input, true, visibility))}
          >
            저장 + 문제 관리 →
          </Button>
        </div>
      </div>
    </div>
  )
}
