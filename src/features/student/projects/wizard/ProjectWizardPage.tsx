import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { useToast } from '@/components/ui/use-toast'
import { useCreateProject, useProjectWizard } from '../../api/projects'
import { STACK_CATALOG, type Tone } from '../types'
import { WizardShell } from './WizardShell'
import { STACK_TONE } from './wizardConstants'
import { Step1 } from './steps/Step1'
import { Step2 } from './steps/Step2'
import { Step3 } from './steps/Step3'
import { Step4 } from './steps/Step4'

/** 기술 스택 상한 — 고르는 자리와 검증이 같은 숫자를 보게 한곳에 둔다. */
export const MAX_STACKS = 12

const DEFAULT_WIZARD_VALUES = {
  name: 'Encore Mart — 마이크로서비스 백엔드',
  desc: '주문/결제 도메인을 마이크로서비스로 분리하고 Kafka 이벤트 라우팅으로 결제 실패율을 안정화하는 백엔드 프로젝트.',
  start: '2026-06-01',
  end: '2026-07-15',
  invited: [],
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
    stacks: z.array(z.string()).min(1).max(MAX_STACKS),
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

  const days = useMemo(() => getProjectDays(start, end), [start, end])
  // 칩 톤 해석 — 카탈로그 톤 우선, 없으면 커스텀 스택이 속한 그룹 톤(요약 단계까지 공유).
  const stackToneFor = (s: string): Tone =>
    STACK_TONE.get(s) ??
    STACK_CATALOG.find((g) => (customStacksByGroup[g.label] ?? []).includes(s))
      ?.tone ??
    'brand'

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
    const current = watch('stacks')
    // 상한을 넘어서도 계속 켜지면 "선택 16 / 12" 처럼 지킬 수 없는 숫자가 남고,
    // 다음 단계에서야 막혀 무엇을 빼야 하는지 알 수 없다. 직접 추가와 같은 규칙.
    if (!current.includes(value) && current.length >= MAX_STACKS) {
      toast.info(`기술 스택은 ${MAX_STACKS}개까지 고를 수 있어요`)
      return
    }
    const next = toggleString(current, value)
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
    if (!current.includes(value) && current.length < MAX_STACKS) {
      setValue('stacks', [...current, value], {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }

  const team = [
    {
      id: 'pm',
      name: data?.pmName ?? '',
      meta: '백엔드 · 3팀',
      avatarTone: 'brand' as Tone,
      pm: true,
    },
    ...(data?.candidates ?? [])
      .filter((c) => invited.includes(c.id))
      .map((c) => ({ ...c, pm: false })),
  ]
  const normalizedTeamSearch = teamSearch.trim().toLowerCase()
  // 검색어가 있을 때만 후보를 노출 — 빈 검색이면 결과를 숨겨 검색을 유도한다.
  const candidates = normalizedTeamSearch
    ? (data?.candidates ?? []).filter((candidate) =>
        `${candidate.name} ${candidate.meta}`
          .toLowerCase()
          .includes(normalizedTeamSearch),
      )
    : []
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
          memberUserIds: invited,
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
    <DataBoundary
      isPending={isPending}
      isError={isError || !data}
      onRetry={refetch}
      loadingText="불러오는 중…"
      errorTitle="불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {data && (
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
                setValue('start', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
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
              searchQuery={teamSearch.trim()}
              search={teamSearch}
              // register 스프레드 대신 값·핸들러로 넘긴다 — 검색 칸을 공용 컴포넌트로 쓰려면
              // (value, onChange) 계약이어야 한다. mode:'onChange' 라 검증도 함께 돌린다.
              onSearchChange={(v) =>
                setValue('teamSearch', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              invited={invited}
              team={team}
              onToggle={(id) => updateArrayField('invited', id)}
            />
          )}
          {step === 3 && (
            <Step3
              stacks={stacks}
              stackToneFor={stackToneFor}
              customStacksByGroup={customStacksByGroup}
              domain={domain}
              deliverables={deliverables}
              onStack={onStackToggle}
              onAddStack={addCustomStack}
              onDomain={(v) =>
                setValue('domain', v, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
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
              stackToneFor={stackToneFor}
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
      )}
    </DataBoundary>
  )
}
