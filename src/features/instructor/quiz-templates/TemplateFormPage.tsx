import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { GradingMode, ResultRevealPolicy } from '@/shared/types'
import { useQuizTemplateDetail } from '../api/quizTemplates'
import { GRADING_MODE_META } from '../quizzes/meta'
import { templateSchema, type TemplateInput } from './template.schema'

const CATEGORY_OPTIONS = [
  '알고리즘',
  'JavaScript',
  '데이터분석',
  'SQL',
  'React',
]

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

// 퀴즈 템플릿 생성/편집 (/instructor/quiz-templates/new · /:templateId/edit) — §10. (Figma 1392:10014)
// §6 폼 패턴 차용한 Edit-default 통합 프레임 — 응시 기간·대상 기수·공개 설정은 인스턴스 단계 결정이라 제외.
// 변경은 기존 파생 퀴즈에 자동 전파되지 않고 다음 복제부터 반영.
export default function TemplateFormPage() {
  const { templateId } = useParams()
  const isEdit = !!templateId
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useQuizTemplateDetail(
    templateId ?? null,
  )
  const [gradingMode, setGradingMode] = useState<GradingMode>('AUTO')
  const [resultReveal, setResultReveal] =
    useState<ResultRevealPolicy>('after_grading')
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  const [shuffleChoices, setShuffleChoices] = useState(true)
  usePageHeader(
    isEdit ? '퀴즈 템플릿 편집' : '퀴즈 템플릿 생성',
    '기본 정보 · 채점 정책 · 문제 정책 · 메타 기본값',
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TemplateInput>({
    resolver: zodResolver(templateSchema),
    defaultValues: { category: CATEGORY_OPTIONS[0], defaultTimeLimitMin: 60 },
  })

  // 편집 모드 — 상세 도착 시 폼·라디오·토글 동기화.
  useEffect(() => {
    if (!data) return
    reset({
      name: data.name,
      category: data.category,
      description: data.description,
      totalPoints: data.totalPoints,
      defaultTimeLimitMin: data.defaultTimeLimitMin,
    })
    setGradingMode(data.gradingMode)
    setResultReveal(data.resultReveal)
    setShuffleQuestions(data.shuffleQuestions)
    setShuffleChoices(data.shuffleChoices)
  }, [data, reset])

  if (isEdit && isPending) {
    return <div className="text-fg-muted p-8">템플릿 정보를 불러오는 중…</div>
  }
  if (isEdit && (isError || !data)) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="템플릿 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const save = (input: TemplateInput, thenQuestions: boolean) => {
    toast.success(`${input.name} 저장 (mock)`)
    if (isEdit && (data?.derivedActiveCount ?? 0) > 0)
      toast.info(
        '변경은 기존 파생 퀴즈에 전파되지 않고 다음 복제부터 반영됩니다',
      )
    if (thenQuestions)
      navigate(
        `/instructor/quiz-templates/${templateId ?? 'tpl-new'}/questions`,
      )
    else navigate('/instructor/quiz-templates')
  }

  return (
    <div className="p-8">
      {/* 편집 모드 메타 strip + 소급 미반영 경고 */}
      {isEdit && data && (
        <div className="bg-warning-bg mb-5 flex items-start gap-3 rounded-xl p-4">
          <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-fg text-sm font-bold">
              편집 중 · 생성 {data.createdAt} · 최근 사용{' '}
              {data.lastUsedAt ?? '미사용'} · 파생 활성 퀴즈{' '}
              {data.derivedActiveCount}건
            </p>
            <p className="text-fg-muted text-xs">
              이 템플릿은 사용 중입니다. 변경은 기존 인스턴스에 자동 전파되지
              않으며, 다음 복제부터 반영됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 기본 정보 */}
      <section className="border-border bg-surface rounded-xl border p-6">
        <p className="text-fg text-base font-bold">기본 정보</p>
        <p className="text-fg-subtle text-xs">템플릿명·설명·카테고리</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          <Input
            label="템플릿명"
            required
            placeholder="알고리즘 기초 — 재귀·DP·그리디"
            error={errors.name?.message}
            {...register('name')}
          />
          <label className="flex w-full flex-col gap-[6px]">
            <span className="text-fg text-[13px] font-bold">
              카테고리 <span className="text-danger">*</span>
            </span>
            <select
              aria-label="카테고리"
              className="border-border focus:border-brand text-fg h-[52px] rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none"
              {...register('category')}
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 flex w-full flex-col gap-[6px]">
          <span className="text-fg text-[13px] font-bold">설명</span>
          <textarea
            rows={2}
            placeholder="재귀·동적 계획법·그리디 기본 개념 확인 퀴즈 풀."
            className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
            {...register('description')}
          />
        </label>
      </section>

      {/* 채점 정책 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">채점 정책</p>
        <p className="text-fg-subtle text-xs">
          AUTO·MANUAL·MIXED 중 선택 · 문제별 채점 방식과 일치해야 함
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {(['AUTO', 'MANUAL', 'MIXED'] as const).map((m) => {
            const selected = m === gradingMode
            return (
              <button
                key={m}
                type="button"
                onClick={() => setGradingMode(m)}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3.5 text-left',
                  selected
                    ? 'border-accent-strong bg-accent-bg/40'
                    : 'border-border hover:bg-surface-muted',
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
                  <span className="text-fg block text-sm font-bold">
                    {GRADING_MODE_META[m].label}
                  </span>
                  <span className="text-fg-muted mt-0.5 block text-xs">
                    {GRADING_MODE_META[m].description}
                  </span>
                </span>
              </button>
            )
          })}
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

      {/* 메타 기본값 */}
      <section className="border-border bg-surface mt-5 rounded-xl border p-6">
        <p className="text-fg text-base font-bold">메타 기본값</p>
        <p className="text-fg-subtle text-xs">
          퀴즈 인스턴스 복제 시 전달되는 기본값 (제한 시간 등)
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="w-52">
            <Input
              label="제한 시간 기본값 (분)"
              placeholder="60"
              error={errors.defaultTimeLimitMin?.message}
              {...register('defaultTimeLimitMin')}
            />
          </div>
          <span className="text-fg-subtle flex items-center gap-1 pb-4 text-xs">
            <Info className="h-3 w-3" /> 미설정 시 무제한. 복제 시 인스턴스로
            전달
          </span>
        </div>
      </section>

      {/* 푸터 */}
      <div className="border-border bg-surface mt-5 flex flex-wrap items-center gap-2 rounded-xl border px-5 py-4">
        <p className="text-fg-subtle text-xs">
          저장 후 [템플릿 문항 관리]로 진입해 문제 풀을 편집할 수 있습니다.
        </p>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="h-10 text-sm"
            onClick={() => navigate('/instructor/quiz-templates')}
          >
            취소
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-10 text-sm"
            onClick={handleSubmit((input) => save(input, false))}
          >
            임시저장으로 저장
          </Button>
          <Button
            type="button"
            className="h-10 text-sm"
            onClick={handleSubmit((input) => save(input, true))}
          >
            저장 + 템플릿 문항 →
          </Button>
        </div>
      </div>
    </div>
  )
}
