import { useMemo, useState, type ReactNode } from 'react'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Send, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { useCreateProject, useProjectWizard } from '../../api/projects'
import {
  DELIVERABLES,
  DOMAINS,
  STACK_CATALOG,
  type TeamCandidate,
  type Tone,
} from '../types'
import { WizardShell } from './WizardShell'

const card = 'border-border bg-surface rounded-2xl border p-6'
const AVA: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const CHIP_ON: Record<Tone, string> = {
  brand: 'border-brand bg-brand text-white',
  info: 'border-info bg-info text-white',
  warning: 'border-warning bg-warning text-white',
  danger: 'border-danger bg-danger text-white',
  accent: 'border-accent-strong bg-accent-strong text-white',
  success: 'border-success bg-success text-white',
}

const DEFAULT_WIZARD_VALUES = {
  name: 'Encore Mart — 마이크로서비스 백엔드',
  desc: '주문/결제 도메인을 마이크로서비스로 분리하고 Kafka 이벤트 라우팅으로 결제 실패율을 안정화하는 백엔드 프로젝트.',
  start: '2026-06-01',
  end: '2026-07-15',
  invited: ['c2', 'c3', 'c4'],
  teamSearch: '',
  stacks: ['Java 17', 'Spring Boot', 'PostgreSQL', 'Apache Kafka', 'Docker'],
  domain: '커머스',
  deliverables: ['GitHub 리포지토리', '기술 문서·회고', '발표 자료'],
  checks: [false, false, false],
}

const wizardSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    desc: z.string().trim().min(1).max(500),
    start: z.string().min(1),
    end: z.string().min(1),
    invited: z.array(z.string()).max(6),
    teamSearch: z.string().max(60),
    stacks: z.array(z.string()).min(1).max(12),
    domain: z.string().min(1),
    deliverables: z.array(z.string()).min(1),
    checks: z.array(z.boolean()).length(3),
  })
  .superRefine(({ start, end }, ctx) => {
    const days = getProjectDays(start, end)
    if (days < 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end'],
        message: '최소 7일 이상이어야 합니다.',
      })
    }
  })

type WizardFormValues = z.infer<typeof wizardSchema>

function getProjectDays(start: string, end: string) {
  const d = Math.round((+new Date(end) - +new Date(start)) / 86400000) + 1
  return Number.isFinite(d) && d > 0 ? d : 0
}

function toggleString(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

// 신규 프로젝트 생성 4단계 마법사 (/student/projects/new) — Figma 340:981·347:1134·349:1185·353:1241.
export default function ProjectWizardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useProjectWizard()
  const createProject = useCreateProject()

  const [step, setStep] = useState(1)
  // 그룹별 직접 추가한 커스텀 스택 — 스텝 이동에도 유지되도록 부모에서 보관.
  const [customStacksByGroup, setCustomStacksByGroup] = useState<
    Record<string, string[]>
  >({})
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_WIZARD_VALUES,
  })

  const name = watch('name')
  const desc = watch('desc')
  const start = watch('start')
  const end = watch('end')
  const invited = watch('invited')
  const teamSearch = watch('teamSearch')
  const stacks = watch('stacks')
  const domain = watch('domain')
  const deliverables = watch('deliverables')
  const checks = watch('checks')

  const stackTone = useMemo(() => {
    const m = new Map<string, Tone>()
    STACK_CATALOG.forEach((g) => g.items.forEach((it) => m.set(it, g.tone)))
    return m
  }, [])
  const days = useMemo(() => getProjectDays(start, end), [start, end])

  if (isPending) return <div className="text-fg-muted p-8">불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const updateArrayField = (
    field: 'invited' | 'stacks' | 'deliverables',
    value: string,
  ) =>
    setValue(field, toggleString(watch(field), value), {
      shouldDirty: true,
      shouldValidate: true,
    })

  // 스택 토글 — 커스텀 스택을 해제하면 그룹 칩 목록에서도 제거.
  const onStackToggle = (value: string) => {
    const next = toggleString(watch('stacks'), value)
    setValue('stacks', next, { shouldDirty: true, shouldValidate: true })
    if (!next.includes(value)) {
      setCustomStacksByGroup((prev) => {
        let changed = false
        const out: Record<string, string[]> = {}
        for (const [group, list] of Object.entries(prev)) {
          const filtered = list.filter((s) => s !== value)
          if (filtered.length !== list.length) changed = true
          out[group] = filtered
        }
        return changed ? out : prev
      })
    }
  }

  // 그룹별 직접 추가 — 커스텀 스택을 해당 그룹 칩으로 등록하고 선택.
  const addCustomStack = (group: string, raw: string) => {
    const value = raw.trim()
    if (!value) return
    const inCatalog = STACK_CATALOG.some((g) => g.items.includes(value))
    const inCustom = Object.values(customStacksByGroup).some((list) =>
      list.includes(value),
    )
    if (!inCatalog && !inCustom) {
      setCustomStacksByGroup((prev) => ({
        ...prev,
        [group]: [...(prev[group] ?? []), value],
      }))
    }
    const current = watch('stacks')
    if (!current.includes(value) && current.length < 12) {
      setValue('stacks', [...current, value], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  const team = [
    {
      id: 'pm',
      name: data.pmName,
      meta: '백엔드 · 3팀',
      avatarTone: 'brand' as Tone,
      pm: true,
    },
    ...data.candidates
      .filter((c) => invited.includes(c.id))
      .map((c) => ({ ...c, pm: false })),
  ]
  const normalizedTeamSearch = teamSearch.trim().toLowerCase()
  const candidates = normalizedTeamSearch
    ? data.candidates.filter((candidate) =>
        `${candidate.name} ${candidate.meta}`
          .toLowerCase()
          .includes(normalizedTeamSearch),
      )
    : data.candidates
  const checkedCount = checks.filter(Boolean).length
  const step1Count = [name.trim(), desc.trim(), start, end && days >= 7].filter(
    Boolean,
  ).length
  const step1Ready = step1Count === 4 && !errors.end
  const step3Ready =
    stacks.length > 0 && Boolean(domain) && deliverables.length > 0

  const next = async () => {
    if (step === 1) {
      if (await trigger(['name', 'desc', 'start', 'end'])) setStep(2)
      return
    }
    if (step === 2) {
      if (await trigger('invited')) setStep(3)
      return
    }
    if (step === 3) {
      if (await trigger(['stacks', 'domain', 'deliverables'])) setStep(4)
      return
    }
    if ((await trigger()) && checkedCount === 3) {
      createProject.mutate(
        {
          name,
          desc,
          start,
          end,
          teamSize: team.length,
          stacks,
          domain,
          deliverables,
        },
        {
          onSuccess: () => {
            toast.success('프로젝트가 생성되었습니다')
            navigate('/student/projects')
          },
          onError: () => toast.danger('프로젝트 생성에 실패했습니다'),
        },
      )
    }
  }
  const left = () =>
    step === 1 ? navigate('/student/projects') : setStep(step - 1)

  const shellProps = {
    1: {
      heroTitle: '프로젝트명·설명·기간을 입력하세요',
      heroSub: '작성자는 자동으로 PM이 되며, 다음 단계에서 팀원을 초대해요.',
      summary: `필수 ${step1Count} / 4 입력 완료`,
      summarySub: '다음 단계에서 PM 자동 지정 · 팀원 초대 후 확인',
      leftLabel: '취소',
      rightLabel: '다음 — 팀 설정 →',
    },
    2: {
      heroTitle: '작성자가 자동으로 PM이 됩니다',
      heroSub:
        '같은 기수 동료만 팀원으로 초대할 수 있습니다 · 기수 외 사용자는 추가 불가',
      summary: `팀 ${team.length}명 구성 완료 (PM 1 + 팀원 ${invited.length})`,
      summarySub: '다음 단계에서 기술 스택·도메인·산출물을 함께 설정합니다',
      leftLabel: '← 이전 — 기본 정보',
      rightLabel: '다음 — 상세 설정 →',
    },
    3: {
      heroTitle: '기술 스택 · 도메인 · 산출물 형태',
      heroSub:
        '선택한 값은 워크스페이스의 성과·기술스택 탭에 자동으로 반영됩니다.',
      summary: `스택 ${stacks.length} · 도메인 1 · 산출물 ${deliverables.length}건 선택 완료`,
      summarySub: '다음 단계에서 입력값을 요약 확인하고 프로젝트를 생성합니다',
      leftLabel: '← 이전 — 팀 설정',
      rightLabel: '다음 — 생성 확인 →',
    },
    4: {
      heroTitle: '입력하신 내용을 마지막으로 확인하세요',
      heroSub:
        '생성 후에도 워크스페이스에서 항목별로 수정 가능합니다. 인증 후에는 변경 제안으로만 수정.',
      summary: `모든 단계 입력 완료 · 확인 사항 ${checkedCount} / 3 체크`,
      summarySub:
        '프로젝트 생성 시 PM은 본인이 자동 지정되며, 팀원에게 알림이 발송됩니다',
      leftLabel: '← 이전 — 상세 설정',
      rightLabel: '✓ 프로젝트 생성',
    },
  }[step]!

  return (
    <WizardShell
      step={step}
      {...shellProps}
      onLeft={left}
      onRight={next}
      rightTone={step === 4 ? 'success' : 'brand'}
      rightDisabled={
        (step === 1 && !step1Ready) ||
        (step === 3 && !step3Ready) ||
        (step === 4 && (checkedCount < 3 || createProject.isPending))
      }
    >
      {step === 1 && (
        <Step1
          name={name}
          desc={desc}
          start={start}
          end={end}
          days={days}
          nameInput={register('name')}
          descInput={register('desc')}
          onStartChange={(v) =>
            setValue('start', v, { shouldDirty: true, shouldValidate: true })
          }
          onEndChange={(v) =>
            setValue('end', v, { shouldDirty: true, shouldValidate: true })
          }
          invalid={{
            name: Boolean(errors.name),
            desc: Boolean(errors.desc),
            start: Boolean(errors.start),
            end: Boolean(errors.end),
          }}
        />
      )}
      {step === 2 && (
        <Step2
          pmName={data.pmName}
          pmMeta={data.pmMeta}
          cohortLabel={data.cohortLabel}
          candidates={candidates}
          searchInput={register('teamSearch')}
          invited={invited}
          team={team}
          onToggle={(id) => updateArrayField('invited', id)}
        />
      )}
      {step === 3 && (
        <Step3
          stacks={stacks}
          stackTone={stackTone}
          customStacksByGroup={customStacksByGroup}
          domain={domain}
          deliverables={deliverables}
          onStack={onStackToggle}
          onAddStack={addCustomStack}
          onDomain={(v) =>
            setValue('domain', v, { shouldDirty: true, shouldValidate: true })
          }
          onDeliverable={(v) => updateArrayField('deliverables', v)}
        />
      )}
      {step === 4 && (
        <Step4
          name={name}
          desc={desc}
          team={team}
          stacks={stacks}
          domain={domain}
          deliverables={deliverables}
          checks={checks}
          onEditStep={setStep}
          onCheck={(i) =>
            setValue(
              'checks',
              checks.map((c, j) => (j === i ? !c : c)),
              { shouldDirty: true, shouldValidate: true },
            )
          }
        />
      )}
    </WizardShell>
  )
}

/* ── Step 1 기본 정보 ── */
function Step1(p: {
  name: string
  desc: string
  start: string
  end: string
  days: number
  nameInput: UseFormRegisterReturn
  descInput: UseFormRegisterReturn
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  invalid: Record<'name' | 'desc' | 'start' | 'end', boolean>
}) {
  const input =
    'border-border bg-surface text-fg focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'
  return (
    <section className={cn(card, 'flex flex-col gap-4')}>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">
          프로젝트 기본 정보
        </span>
        <span className="text-fg-subtle text-[11px]">
          저장된 값은 자동 저장되며 다음 단계에서도 수정할 수 있어요
        </span>
      </div>
      <Field label="프로젝트명" required counter={`${p.name.length} / 80`}>
        <input
          className={input}
          maxLength={80}
          aria-invalid={p.invalid.name}
          {...p.nameInput}
        />
      </Field>
      <Field label="프로젝트 설명" required counter={`${p.desc.length} / 500`}>
        <textarea
          className={cn(input, 'min-h-[120px] resize-none leading-6')}
          maxLength={500}
          aria-invalid={p.invalid.desc}
          {...p.descInput}
        />
        <span className="text-fg-subtle text-[11px]">
          무엇을 만들고 왜 만드는지 한두 단락으로 설명하면 좋습니다 · Markdown
          지원
        </span>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="시작일" required>
          <DateTimePicker
            mode="date"
            value={p.start}
            onChange={p.onStartChange}
            error={
              p.invalid.start ? '교육 기간 내 날짜를 선택하세요' : undefined
            }
            ariaLabel="시작일"
            placeholder="시작일"
            max={p.end || undefined}
          />
          <span className="text-fg-subtle text-[11px]">
            교육 기간 내에서 정합니다
          </span>
        </Field>
        <Field label="종료일" required>
          <DateTimePicker
            mode="date"
            value={p.end}
            onChange={p.onEndChange}
            error={p.invalid.end ? '시작일로부터 7일 이상 뒤로' : undefined}
            ariaLabel="종료일"
            placeholder="종료일"
            min={p.start || undefined}
          />
          <span className="text-fg-subtle text-[11px]">
            시작일로부터 최소 7일 이상
          </span>
        </Field>
      </div>
      <div className="bg-brand/10 flex flex-col gap-0.5 rounded-xl p-4">
        <span className="text-brand text-[12px] font-bold">
          ⓘ 프로젝트 기간 {p.days}일
        </span>
        <span className="text-fg-muted text-[11px]">
          {p.start} → {p.end} · 교육 기간 내 시점 시작
        </span>
      </div>
    </section>
  )
}

/* ── Step 2 팀 설정 ── */
function Step2(p: {
  pmName: string
  pmMeta: string
  cohortLabel: string
  candidates: TeamCandidate[]
  searchInput: UseFormRegisterReturn
  invited: string[]
  team: {
    id: string
    name: string
    meta: string
    avatarTone: Tone
    pm: boolean
  }[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <section className={cn(card, 'flex items-center gap-3')}>
        <Avatar name={p.pmName} tone="brand" />
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">
              {p.pmName} (본인)
            </span>
            <span className="bg-accent-bg text-accent-strong rounded px-2 py-0.5 text-[10px] font-bold">
              📌 PM · 자동 지정
            </span>
          </div>
          <span className="text-fg-subtle text-[11px]">{p.pmMeta}</span>
        </div>
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">팀원 초대</span>
            <span className="text-fg-subtle text-[11px]">
              같은 기수({p.cohortLabel}) 동료 중 검색하여 초대
            </span>
          </div>
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[12px] font-bold">
            초대 {p.invited.length} / 7명
          </span>
        </div>
        <label className="border-border text-fg-subtle focus-within:border-brand flex items-center gap-2 rounded-[10px] border px-4 py-3 text-[13px]">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent focus:outline-none"
            placeholder="이름이나 영문 닉네임으로 검색"
            {...p.searchInput}
          />
        </label>
        <span className="text-fg-subtle text-[11px]">
          검색 결과 ({p.candidates.length}명)
        </span>
        {p.candidates.map((c) => {
          const on = p.invited.includes(c.id)
          return (
            <div key={c.id} className="flex items-center gap-3">
              <Avatar name={c.name} tone={c.avatarTone} />
              <div className="flex flex-1 flex-col">
                <span className="text-fg text-[13px] font-bold">{c.name}</span>
                <span className="text-fg-subtle text-[11px]">{c.meta}</span>
              </div>
              <button
                type="button"
                onClick={() => p.onToggle(c.id)}
                className={cn(
                  'rounded-lg px-3.5 py-2 text-[12px] font-bold',
                  on
                    ? 'bg-success-bg text-success'
                    : 'bg-brand-deep text-white',
                )}
              >
                {on ? '✓ 초대됨' : '초대하기'}
              </button>
            </div>
          )
        })}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-fg text-[15px] font-bold">현재 팀 구성</span>
            <span className="text-fg-subtle text-[11px]">
              PM 1명 + 최대 팀원 6명 · 최대 7명까지
            </span>
          </div>
          <span className="text-brand flex items-center gap-1 text-[12px] font-bold">
            <Send className="size-3.5" aria-hidden="true" /> {p.team.length} / 7
          </span>
        </div>
        {p.team.map((m) => (
          <div key={m.id} className="flex items-center gap-3">
            <Avatar name={m.name} tone={m.avatarTone} />
            <div className="flex flex-1 flex-col">
              <span className="text-fg text-[13px] font-bold">
                {m.name}
                {m.pm && ' (본인)'}
              </span>
              <span className="text-fg-subtle text-[11px]">{m.meta}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-bold',
                  m.pm
                    ? 'bg-accent-strong text-white'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {m.pm ? 'PM' : '팀원'}
              </span>
              {!m.pm && (
                <button
                  type="button"
                  onClick={() => p.onToggle(m.id)}
                  aria-label={`${m.name} 초대 취소`}
                  className="border-border text-fg-subtle hover:text-fg flex size-7 items-center justify-center rounded-lg border"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="bg-info-bg/60 text-fg-muted flex items-center gap-2 rounded-xl p-3 text-[11px]">
          <Send className="text-info size-4 shrink-0" aria-hidden="true" />
          초대된 팀원에게 알림이 발송됩니다. 수락 시점부터 워크스페이스에 참여할
          수 있습니다.
        </div>
      </section>
    </div>
  )
}

/* ── Step 3 상세 설정 ── */
function Step3(p: {
  stacks: string[]
  stackTone: Map<string, Tone>
  customStacksByGroup: Record<string, string[]>
  domain: string
  deliverables: string[]
  onStack: (v: string) => void
  onAddStack: (group: string, value: string) => void
  onDomain: (v: string) => void
  onDeliverable: (v: string) => void
}) {
  // 스택 직접 추가(그룹별 인라인 입력) · 도메인 '기타' 직접 입력 — 입력값을 칩으로 추가/선택.
  const [openStackGroup, setOpenStackGroup] = useState<string | null>(null)
  const [stackInput, setStackInput] = useState('')
  const [domainInput, setDomainInput] = useState('')

  const addStack = () => {
    const v = stackInput.trim()
    if (v && openStackGroup) p.onAddStack(openStackGroup, v)
    setStackInput('')
    setOpenStackGroup(null)
  }
  // 요약 칩 색상 — 카탈로그 톤 우선, 없으면 커스텀 스택이 속한 그룹 톤.
  const stackToneFor = (s: string): Tone =>
    p.stackTone.get(s) ??
    STACK_CATALOG.find((g) =>
      (p.customStacksByGroup[g.label] ?? []).includes(s),
    )?.tone ??
    'brand'
  const addDomain = () => {
    const v = domainInput.trim()
    if (!v) return
    p.onDomain(v)
    setDomainInput('')
  }
  // 커스텀 도메인은 RHF domain 값에서 파생 — Step3 언마운트 후 복귀해도 칩 유지.
  const isCustomDomain = Boolean(p.domain) && !DOMAINS.includes(p.domain)

  return (
    <div className="flex flex-col gap-4">
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex items-center justify-between">
          <span className="text-fg text-[15px] font-bold">
            기술 스택 <span className="text-danger text-[11px]">필수</span>
          </span>
          <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[12px] font-bold">
            선택 {p.stacks.length} / 12
          </span>
        </div>
        {p.stacks.length > 0 && (
          <div className="bg-surface-muted/50 flex flex-wrap gap-1.5 rounded-xl p-3">
            {p.stacks.map((s) => (
              <span
                key={s}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold text-white',
                  AVA[stackToneFor(s)],
                )}
              >
                {s}
                <button type="button" onClick={() => p.onStack(s)}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        {STACK_CATALOG.map((g) => (
          <div key={g.label} className="flex flex-col gap-2">
            <span className="text-fg-muted flex items-center gap-1.5 text-[12px] font-semibold">
              <span className={cn('size-2 rounded-full', AVA[g.tone])} />
              {g.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[...g.items, ...(p.customStacksByGroup[g.label] ?? [])].map(
                (it) => {
                  const on = p.stacks.includes(it)
                  return (
                    <button
                      key={it}
                      type="button"
                      onClick={() => p.onStack(it)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[12px] font-semibold',
                        on
                          ? CHIP_ON[g.tone]
                          : 'border-border text-fg-muted hover:border-brand/50',
                      )}
                    >
                      {on && '✓ '}
                      {it}
                    </button>
                  )
                },
              )}
              <button
                type="button"
                onClick={() => {
                  setOpenStackGroup(g.label)
                  setStackInput('')
                }}
                className="border-border text-fg-subtle hover:border-brand/50 rounded-full border border-dashed px-3 py-1.5 text-[12px]"
              >
                + 직접 추가
              </button>
              {openStackGroup === g.label && (
                <span className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={stackInput}
                    maxLength={30}
                    onChange={(e) => setStackInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addStack()
                      } else if (e.key === 'Escape') {
                        setOpenStackGroup(null)
                        setStackInput('')
                      }
                    }}
                    placeholder="스택 이름"
                    aria-label={`${g.label} 스택 직접 입력`}
                    className="border-brand w-32 rounded-full border px-3 py-1.5 text-[12px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={addStack}
                    disabled={!stackInput.trim()}
                    className="bg-brand rounded-full px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40"
                  >
                    추가
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          도메인 <span className="text-danger text-[11px]">필수</span>
        </span>
        <span className="text-fg-subtle text-[11px]">
          프로젝트가 다루는 도메인을 선택하세요 (1개)
        </span>
        <div className="flex flex-wrap gap-2">
          {(isCustomDomain ? [...DOMAINS, p.domain] : DOMAINS).map((d) => {
            const on = d === p.domain
            return (
              <button
                key={d}
                type="button"
                onClick={() => p.onDomain(d)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand text-white'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {on && '✓ '}
                {d}
              </button>
            )
          })}
        </div>
        {p.domain === '기타' && (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={domainInput}
              maxLength={30}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDomain()
                }
              }}
              placeholder="도메인을 직접 입력하고 추가하세요"
              aria-label="기타 도메인 직접 입력"
              className="border-border focus:border-brand flex-1 rounded-lg border px-3.5 py-2 text-[12px] outline-none"
            />
            <button
              type="button"
              onClick={addDomain}
              disabled={!domainInput.trim()}
              className="border-brand text-brand shrink-0 rounded-lg border px-4 py-2 text-[12px] font-semibold disabled:opacity-40"
            >
              추가
            </button>
          </div>
        )}
      </section>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[15px] font-bold">
          산출물 형태 <span className="text-danger text-[11px]">필수</span>
        </span>
        <span className="text-fg-subtle text-[11px]">
          최종 인증 시 검사가 인정할 산출물 형태 (복수 선택)
        </span>
        <div className="flex flex-wrap gap-2">
          {DELIVERABLES.map((d) => {
            const on = p.deliverables.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => p.onDeliverable(d)}
                className={cn(
                  'rounded-lg border px-3.5 py-2 text-[12px] font-semibold',
                  on
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-fg-muted hover:border-brand/50',
                )}
              >
                {on && '✓ '}
                {d}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

/* ── Step 4 생성 확인 ── */
function Step4(p: {
  name: string
  desc: string
  team: { id: string; name: string; avatarTone: Tone; pm: boolean }[]
  stacks: string[]
  domain: string
  deliverables: string[]
  checks: boolean[]
  onEditStep: (step: number) => void
  onCheck: (i: number) => void
}) {
  const CONFIRMS = [
    '초대된 팀원에게 알림이 발송되며, 수락 시점부터 워크스페이스에 참여할 수 있습니다.',
    '프로젝트 생성 후에도 워크스페이스에서 항목별로 수정 가능합니다.',
    '인증 완료된 프로젝트는 직접 수정 불가 · 변경 제안으로만 수정합니다.',
  ]
  return (
    <div className="flex flex-col gap-4">
      <SummaryCard
        step="STEP 1"
        title="기본 정보"
        onEdit={() => p.onEditStep(1)}
      >
        <span className="text-fg-subtle text-[11px]">프로젝트명</span>
        <span className="text-fg text-[15px] font-bold">{p.name}</span>
        <span className="text-fg-muted bg-surface-muted/50 mt-1 rounded-lg p-3 text-[12px] leading-5">
          {p.desc}
        </span>
      </SummaryCard>

      <SummaryCard step="STEP 2" title="팀 구성" onEdit={() => p.onEditStep(2)}>
        {p.team.map((m) => (
          <div key={m.id} className="flex items-center gap-2 py-1">
            <Avatar name={m.name} tone={m.avatarTone} sm />
            <span className="text-fg flex-1 text-[13px] font-semibold">
              {m.name}
              {m.pm && ' (본인)'}
            </span>
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[10px] font-bold',
                m.pm
                  ? 'bg-accent-strong text-white'
                  : 'bg-surface-muted text-fg-muted',
              )}
            >
              {m.pm ? 'PM' : '팀원'}
            </span>
          </div>
        ))}
      </SummaryCard>

      <SummaryCard
        step="STEP 3"
        title="상세 설정"
        onEdit={() => p.onEditStep(3)}
      >
        <span className="text-fg-subtle text-[11px]">기술 스택</span>
        <div className="flex flex-wrap gap-1.5">
          {p.stacks.map((s) => (
            <span
              key={s}
              className="bg-brand/10 text-brand rounded-md px-2 py-0.5 text-[11px] font-semibold"
            >
              {s}
            </span>
          ))}
        </div>
        <span className="text-fg-subtle mt-1 text-[11px]">도메인</span>
        <span className="bg-brand w-fit rounded-md px-2 py-0.5 text-[11px] font-bold text-white">
          ✓ {p.domain}
        </span>
        <span className="text-fg-subtle mt-1 text-[11px]">
          산출물 형태 · {p.deliverables.length}건
        </span>
        <div className="flex flex-wrap gap-1.5">
          {p.deliverables.map((d) => (
            <span
              key={d}
              className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-medium"
            >
              {d}
            </span>
          ))}
        </div>
      </SummaryCard>

      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[13px] font-bold">
          ⓘ 생성 전 확인 사항
        </span>
        {CONFIRMS.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => p.onCheck(i)}
            className="flex items-start gap-2.5 text-left"
          >
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                p.checks[i]
                  ? 'bg-success text-white'
                  : 'border-border text-fg-subtle border',
              )}
            >
              {p.checks[i] ? '✓' : ''}
            </span>
            <span className="text-fg-muted text-[12px] leading-5">{c}</span>
          </button>
        ))}
      </section>
    </div>
  )
}

/* ── 공용 소품 ── */
function Field({
  label,
  required,
  counter,
  children,
}: {
  label: string
  required?: boolean
  counter?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-fg text-[13px] font-bold">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
        {counter && (
          <span className="text-fg-subtle text-[11px]">{counter}</span>
        )}
      </div>
      {children}
    </div>
  )
}
function Avatar({
  name,
  tone,
  sm,
}: {
  name: string
  tone: Tone
  sm?: boolean
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold text-white',
        sm ? 'size-7 text-[11px]' : 'size-10 text-[14px]',
        AVA[tone],
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}
function SummaryCard({
  step,
  title,
  onEdit,
  children,
}: {
  step: string
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <section className={cn(card, 'flex flex-col gap-1.5')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
            {step}
          </span>
          <span className="text-fg text-[14px] font-bold">{title}</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-brand text-[12px] font-semibold"
        >
          ✎ 수정
        </button>
      </div>
      {children}
    </section>
  )
}
