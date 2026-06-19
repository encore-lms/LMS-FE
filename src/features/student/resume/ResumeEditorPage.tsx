import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  Check,
  Code2,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  Save,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useToast } from '@/components/ui/use-toast'
import { useCreateResume, useResume, useUpdateResume } from '../api/resume'
import {
  INTRO_QUESTIONS,
  SECTIONS,
  computeDoneSections,
  missingSections,
} from './constants'
import type {
  ResumeDetail,
  ResumeItem,
  ResumeStatus,
  ResumeUpdatePayload,
} from './types'

// 편집 폼 상태 — 저장 페이로드에서 status(제출 시 결정)·skills(별도 텍스트 입력) 제외.
type ResumeForm = Omit<ResumeUpdatePayload, 'status' | 'skills'>

// ResumeItem[] 을 다루는 섹션들 — 키·제목·추가버튼 라벨.
type ItemKey =
  | 'careers'
  | 'educations'
  | 'certificates'
  | 'awards'
  | 'trainings'
  | 'activities'
  | 'projects'

// SECTIONS 순서를 따른다(학력 → 경력 …). 기술스택·프로젝트는 위치상 별도 렌더.
const ITEM_SECTIONS: { key: ItemKey; title: string; addLabel: string }[] = [
  { key: 'educations', title: '학력사항', addLabel: '항목 추가' },
  { key: 'careers', title: '경력사항', addLabel: '항목 추가' },
  { key: 'certificates', title: '자격사항', addLabel: '항목 추가' },
  { key: 'awards', title: '수상내역', addLabel: '항목 추가' },
  { key: 'trainings', title: '교육경험', addLabel: '항목 추가' },
  { key: 'activities', title: '기타활동', addLabel: '항목 추가' },
]

function blankForm(): ResumeForm {
  return {
    title: '새 이력서',
    basicInfo: {
      name: '',
      phone: '',
      email: '',
      birth: '',
      githubUrl: '',
      blogUrl: '',
    },
    strength: '',
    educations: [],
    careers: [],
    certificates: [],
    awards: [],
    trainings: [],
    activities: [],
    projects: [],
    coverLetters: INTRO_QUESTIONS.map((q) => ({ question: q, content: '' })),
  }
}

// 상세(mock) → 편집 폼. 배열은 복사해 원본 불변 유지.
function toForm(d: ResumeDetail): ResumeForm {
  return {
    title: d.title,
    basicInfo: { ...d.basicInfo },
    strength: d.strength,
    educations: d.educations.map((x) => ({ ...x })),
    careers: d.careers.map((x) => ({ ...x })),
    certificates: d.certificates.map((x) => ({ ...x })),
    awards: d.awards.map((x) => ({ ...x })),
    trainings: d.trainings.map((x) => ({ ...x })),
    activities: d.activities.map((x) => ({ ...x })),
    projects: d.projects.map((x) => ({ ...x })),
    coverLetters: d.coverLetters.map((x) => ({ ...x })),
  }
}

/** 섹션 작성 여부 배지 — 미작성은 눈에 띄게(앰버), 작성됨은 초록. */
function SectionStatus({ done }: { done: boolean }) {
  return done ? (
    <span className="bg-success-bg text-success inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold">
      <Check className="h-3.5 w-3.5" />
      작성됨
    </span>
  ) : (
    <span className="bg-warning-bg text-warning inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold">
      <AlertCircle className="h-3.5 w-3.5" />
      미작성
    </span>
  )
}

/** 섹션(제목 + 구분선 + 본문). done 을 주면 제목 옆에 작성 여부 배지를 표시. */
function Section({
  title,
  done,
  children,
}: {
  title: string
  done?: boolean
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-fg text-[17px] font-bold">{title}</h2>
          {done !== undefined && <SectionStatus done={done} />}
        </div>
        <div className="bg-border h-px w-full" />
      </div>
      {children}
    </section>
  )
}

function InlineField({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: ReactNode
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <span className="text-fg-subtle inline-flex items-center gap-1.5 text-[14px] [&>svg]:h-4 [&>svg]:w-4">
      {icon}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="placeholder:text-fg-subtle text-fg w-[160px] bg-transparent focus:outline-none"
      />
    </span>
  )
}

/** ResumeItem[] 편집기 — 항목별 제목·부제·기간·설명 입력 + 추가/삭제. */
function ItemSectionEditor({
  title,
  addLabel,
  items,
  done,
  onChange,
}: {
  title: string
  addLabel: string
  items: ResumeItem[]
  done: boolean
  onChange: (items: ResumeItem[]) => void
}) {
  const update = (i: number, p: Partial<ResumeItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const add = () =>
    onChange([
      ...items,
      { title: '', subtitle: '', period: '', description: '' },
    ])
  const inputCls =
    'placeholder:text-fg-subtle text-fg bg-transparent focus:outline-none'
  return (
    <Section title={title} done={done}>
      <div className="flex flex-col gap-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="border-border bg-surface-muted/40 flex flex-col gap-2 rounded-xl border p-4"
          >
            <div className="flex items-center gap-2">
              <input
                value={it.title}
                onChange={(e) => update(i, { title: e.target.value })}
                placeholder="제목 (회사/학교/자격증명 등)"
                className={cn(inputCls, 'flex-1 text-[14px] font-semibold')}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="항목 삭제"
                className="text-fg-subtle hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <input
                value={it.subtitle}
                onChange={(e) => update(i, { subtitle: e.target.value })}
                placeholder="부제 (역할/학위/발급처 등)"
                className={cn(inputCls, 'w-[200px] text-[13px]')}
              />
              <input
                value={it.period}
                onChange={(e) => update(i, { period: e.target.value })}
                placeholder="기간 (예: 2025.07 ~ 2025.12)"
                className={cn(inputCls, 'w-[200px] text-[13px]')}
              />
            </div>
            <textarea
              value={it.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="설명"
              className={cn(
                inputCls,
                'min-h-[44px] w-full resize-none text-[13px]',
              )}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="text-fg-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-[14px] font-medium"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>
    </Section>
  )
}

/** Doc 미리보기 — 현재 편집 중인 폼을 문서로 렌더(라이브 미리보기). */
function DocEntry({
  icon,
  title,
  meta,
}: {
  icon: ReactNode
  title: string
  meta?: string
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="bg-surface-muted text-fg-muted flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[14px] font-semibold">{title}</span>
        {meta && <span className="text-fg-subtle text-[12px]">{meta}</span>}
      </div>
    </div>
  )
}

function itemMeta(it: ResumeItem) {
  return [it.subtitle, it.period, it.description].filter(Boolean).join(' · ')
}

/** Doc — ResumeItem[] 섹션. 항목이 없으면 렌더하지 않음(작성된 섹션만 문서에 등장). */
function DocItemSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: ReactNode
  items: ResumeItem[]
}) {
  if (items.length === 0) return null
  return (
    <Section title={title}>
      <div className="flex flex-col gap-4">
        {items.map((it, i) => (
          <DocEntry
            key={`${it.title}-${i}`}
            icon={icon}
            title={it.title || '(제목 미입력)'}
            meta={itemMeta(it)}
          />
        ))}
      </div>
    </Section>
  )
}

/**
 * Doc 미리보기 — 현재 편집 중인 폼을 문서로 렌더(Edit과 라이브 연동).
 * 내용이 채워진 섹션만 표시한다 — Edit에서 작성해 '작성됨'이 되면 그 섹션이 문서에 나타난다.
 */
function DocView({ form, skills }: { form: ResumeForm; skills: string[] }) {
  const b = form.basicInfo
  const intros = form.coverLetters.filter((c) => c.content.trim())
  const contacts = [
    { icon: <Phone />, value: b.phone },
    { icon: <Mail />, value: b.email },
    { icon: <Calendar />, value: b.birth },
    { icon: <Code2 />, value: b.githubUrl },
    { icon: <Globe />, value: b.blogUrl },
  ].filter((c) => c.value.trim())

  const hasAny = Boolean(
    b.name.trim() ||
    contacts.length ||
    form.strength.trim() ||
    skills.length ||
    form.careers.length ||
    form.educations.length ||
    form.certificates.length ||
    form.awards.length ||
    form.trainings.length ||
    form.activities.length ||
    form.projects.length ||
    intros.length,
  )

  return (
    <div className="resume-print border-border flex flex-col gap-8 rounded-2xl border bg-white p-10">
      <div className="flex flex-col gap-3">
        {/* 이력서 문서 내용의 이름 — 페이지 h1은 공유 헤더가 소유하므로 h2로 유지 */}
        <h2 className="text-fg text-2xl font-bold">
          {b.name || '(이름 미입력)'}
        </h2>
        {contacts.length > 0 && (
          <div className="text-fg-muted flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px]">
            {contacts.map((c, i) => (
              <span
                key={i}
                className="[&>svg]:text-fg-subtle inline-flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
              >
                {c.icon}
                {c.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {form.strength.trim() && (
        <Section title="핵심역량/강점">
          <p className="text-fg-muted text-[14px] leading-relaxed whitespace-pre-line">
            {form.strength}
          </p>
        </Section>
      )}

      <DocItemSection
        title="학력사항"
        icon={<GraduationCap />}
        items={form.educations}
      />
      <DocItemSection
        title="경력사항"
        icon={<Briefcase />}
        items={form.careers}
      />
      <DocItemSection
        title="자격사항"
        icon={<Award />}
        items={form.certificates}
      />
      <DocItemSection title="수상내역" icon={<Star />} items={form.awards} />
      <DocItemSection
        title="교육경험"
        icon={<GraduationCap />}
        items={form.trainings}
      />
      <DocItemSection
        title="기타활동"
        icon={<FileText />}
        items={form.activities}
      />

      {skills.length > 0 && (
        <Section title="기술스택">
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="bg-accent-bg text-accent-strong rounded-full px-2.5 py-1 text-[12px] font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      <DocItemSection
        title="프로젝트 경험"
        icon={<FolderGit2 />}
        items={form.projects}
      />

      {intros.length > 0 && (
        <Section title="자기소개서">
          <div className="flex flex-col gap-5">
            {intros.map((it, i) => (
              <div key={`${it.question}-${i}`} className="flex flex-col gap-2">
                <span className="text-accent-strong text-[14px] font-bold">
                  {it.question}
                </span>
                <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
                  {it.content}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {!hasAny && (
        <span className="text-fg-subtle text-[13px]">
          아직 작성된 내용이 없어요. Edit 탭에서 작성하면 여기에 표시됩니다.
        </span>
      )}
    </div>
  )
}

/**
 * 이력서 편집기 (/student/resume/new · /:resumeId/edit) — 셸(사이드바 이력서 관리 + 공통 헤더) 안.
 * 폼은 mock 내용으로 채워(컨트롤드) 편집·저장이 실제 반영된다.
 * 저장 → 임시저장(작성 중) / 제출(작성 완료). 기존: PUT / 신규: POST 생성 후 PUT → 목록 등장.
 */
export default function ResumeEditorPage() {
  const navigate = useNavigate()
  const { resumeId } = useParams()
  const toast = useToast()
  const { data: detail } = useResume(resumeId)
  const createResume = useCreateResume()
  const updateResume = useUpdateResume()
  const submitting = createResume.isPending || updateResume.isPending
  const [mode, setMode] = useState<'edit' | 'doc'>('edit')
  const [form, setForm] = useState<ResumeForm | null>(null)
  const [skillsText, setSkillsText] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)
  usePageHeader('이력서 편집기')

  // 문항 추가 팝오버 — 바깥 클릭 시 닫기.
  useEffect(() => {
    if (!addOpen) return
    const onClick = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [addOpen])

  // 기술스택 — skillsText(콤마 구분)를 배열로 파싱. Doc 표시·작성 판정 공통 사용.
  const skills = useMemo(
    () =>
      skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [skillsText],
  )

  // 라이브 작성 현황 — 입력 즉시 섹션 배지/제출 가드와 동일한 기준으로 갱신.
  const doneSet = useMemo(() => {
    if (!form) return new Set<string>()
    return new Set(computeDoneSections({ ...form, skills }))
  }, [form, skills])

  // 편집기 진입 시 폼을 채운다 — 기존: 상세 로드값(mock) / 신규: 빈 폼.
  useEffect(() => {
    if (resumeId) {
      if (detail) {
        setForm(toForm(detail))
        setSkillsText(detail.skills.join(', '))
      }
    } else {
      setForm(blankForm())
      setSkillsText('')
    }
  }, [resumeId, detail])

  const patch = (p: Partial<ResumeForm>) =>
    setForm((f) => (f ? { ...f, ...p } : f))
  const patchBasic = (p: Partial<ResumeForm['basicInfo']>) =>
    setForm((f) => (f ? { ...f, basicInfo: { ...f.basicInfo, ...p } } : f))
  const setCover = (i: number, content: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            coverLetters: f.coverLetters.map((c, idx) =>
              idx === i ? { ...c, content } : c,
            ),
          }
        : f,
    )
  const setCoverQuestion = (i: number, question: string) =>
    setForm((f) =>
      f
        ? {
            ...f,
            coverLetters: f.coverLetters.map((c, idx) =>
              idx === i ? { ...c, question } : c,
            ),
          }
        : f,
    )
  // 문항 추가 — 객관식(표준 6문항/기타)에서 고른 제목으로 빈 블록 추가. 기타는 ''(직접 입력).
  const addCoverQuestion = (question: string) =>
    setForm((f) =>
      f
        ? { ...f, coverLetters: [...f.coverLetters, { question, content: '' }] }
        : f,
    )
  const removeCover = (i: number) =>
    setForm((f) =>
      f
        ? { ...f, coverLetters: f.coverLetters.filter((_, idx) => idx !== i) }
        : f,
    )

  // PDF 저장 — 브라우저 인쇄(=PDF로 저장). 인쇄 CSS(.resume-print)가 문서만 출력한다.
  // 인쇄 중에는 이력서 제목을 document.title 로 써서 기본 파일명이 되도록 하고, 끝나면 복원.
  const handlePrint = () => {
    if (!form) return
    const prev = document.title
    document.title = form.title.trim() || '이력서'
    const restore = () => {
      document.title = prev
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  // 저장 — status 를 명시적으로 전달한다. 임시저장: '작성 중' / 제출: '작성 완료'.
  // (완성도와 무관하게 항상 '작성 완료' 로 굳던 동작을 분리)
  const save = (status: ResumeStatus) => {
    if (!form) return
    const payload: ResumeUpdatePayload = {
      ...form,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status,
    }
    // 작성 완료(제출)는 11개 섹션이 모두 작성돼야 가능 — 비면 막고 어떤 섹션이 남았는지 안내.
    if (status === '작성 완료') {
      const missing = missingSections(payload)
      if (missing.length > 0) {
        toast.warning(
          `작성 완료하려면 모든 섹션을 작성해야 해요 · 미작성: ${missing.join(', ')}`,
        )
        return
      }
    }
    const done = () => {
      toast.success(
        status === '작성 완료' ? '이력서를 제출했어요' : '임시저장했어요',
      )
      navigate('/student/resume')
    }
    if (resumeId) {
      updateResume.mutate({ id: resumeId, payload }, { onSuccess: done })
    } else {
      // 새 이력서: 생성 후 작성한 내용으로 저장(전달된 status) → 목록 등장.
      createResume.mutate(
        { title: payload.title || '새 이력서' },
        {
          onSuccess: (created) =>
            updateResume.mutate(
              { id: created.id, payload },
              { onSuccess: done },
            ),
        },
      )
    }
  }

  return (
    <div className="flex flex-col">
      {/* 편집 툴바 */}
      <div className="border-border bg-surface sticky top-0 z-10 flex items-center justify-between border-b px-8 py-3.5">
        <button
          type="button"
          onClick={() => navigate('/student/resume')}
          className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </button>

        <div className="bg-surface-muted flex items-center gap-1 rounded-lg p-1">
          {(['doc', 'edit'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[13px] font-semibold',
                mode === m
                  ? 'bg-surface text-accent-strong shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {m === 'doc' ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              {m === 'doc' ? 'Doc' : 'Edit'}
            </button>
          ))}
        </div>

        {mode === 'edit' ? (
          <div className="flex items-center gap-2">
            <span className="text-fg-muted mr-1 hidden text-[13px] font-semibold tabular-nums sm:inline">
              {doneSet.size}/{SECTIONS.length} 작성
            </span>
            <button
              type="button"
              onClick={() => save('작성 중')}
              disabled={!form || submitting}
              className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[14px] font-semibold disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              임시저장
            </button>
            <button
              type="button"
              onClick={() => save('작성 완료')}
              disabled={!form || submitting}
              className="bg-accent-strong inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-bold text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? '제출 중…' : '제출'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePrint}
            disabled={!form}
            className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[14px] font-semibold disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            PDF 저장
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-[1040px] px-8 py-8">
        {!form ? (
          <div className="text-fg-muted p-8">이력서를 불러오는 중…</div>
        ) : mode === 'doc' ? (
          <DocView form={form} skills={skills} />
        ) : (
          <div className="border-border flex flex-col gap-8 rounded-2xl border bg-white p-10">
            <div className="flex items-center gap-3">
              <span className="text-fg-muted shrink-0 text-[14px] font-bold">
                이력서 제목
              </span>
              <input
                value={form.title}
                onChange={(e) => patch({ title: e.target.value })}
                maxLength={100}
                className="text-fg flex-1 text-[15px] font-bold focus:outline-none"
              />
              <span className="text-fg-subtle shrink-0 text-[13px]">
                {form.title.length}/100
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <input
                  value={form.basicInfo.name}
                  onChange={(e) => patchBasic({ name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="placeholder:text-fg-subtle text-fg min-w-0 flex-1 text-2xl font-bold focus:outline-none"
                />
                <SectionStatus done={doneSet.has('기본정보')} />
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <InlineField
                  icon={<Phone />}
                  placeholder="연락처"
                  value={form.basicInfo.phone}
                  onChange={(v) => patchBasic({ phone: v })}
                />
                <InlineField
                  icon={<Mail />}
                  placeholder="이메일"
                  value={form.basicInfo.email}
                  onChange={(v) => patchBasic({ email: v })}
                />
                <InlineField
                  icon={<Calendar />}
                  placeholder="생년월일"
                  value={form.basicInfo.birth}
                  onChange={(v) => patchBasic({ birth: v })}
                />
                <InlineField
                  icon={<Code2 />}
                  placeholder="Github URL"
                  value={form.basicInfo.githubUrl}
                  onChange={(v) => patchBasic({ githubUrl: v })}
                />
                <InlineField
                  icon={<Globe />}
                  placeholder="Blog URL"
                  value={form.basicInfo.blogUrl}
                  onChange={(v) => patchBasic({ blogUrl: v })}
                />
              </div>
            </div>

            <Section title="핵심역량/강점" done={doneSet.has('핵심역량/강점')}>
              <textarea
                value={form.strength}
                onChange={(e) => patch({ strength: e.target.value })}
                placeholder={
                  '채용 담당자들이 가장 먼저 읽게 되는 글입니다.\n경력을 기반으로 나의 역량과 강점을 소개해 주세요.\n5줄 이내로 간결하게 작성하는 것을 권장합니다.'
                }
                className="placeholder:text-fg-subtle text-fg min-h-[96px] w-full resize-none text-[14px] leading-relaxed focus:outline-none"
              />
            </Section>

            {ITEM_SECTIONS.map((s) => (
              <ItemSectionEditor
                key={s.key}
                title={s.title}
                addLabel={s.addLabel}
                items={form[s.key]}
                done={doneSet.has(s.title)}
                onChange={(items) => patch({ [s.key]: items })}
              />
            ))}

            <Section title="기술스택" done={doneSet.has('기술스택')}>
              <input
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="기술을 콤마(,)로 구분해 입력 — 예: Java, Spring Boot, MySQL"
                className="placeholder:text-fg-subtle text-fg w-full bg-transparent text-[14px] focus:outline-none"
              />
              {skillsText.trim() && (
                <div className="flex flex-wrap gap-2">
                  {skillsText
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s, i) => (
                      <span
                        key={`${s}-${i}`}
                        className="bg-accent-bg text-accent-strong rounded-full px-2.5 py-1 text-[12px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                </div>
              )}
            </Section>

            <ItemSectionEditor
              title="프로젝트 경험"
              addLabel="프로젝트 추가"
              items={form.projects}
              done={doneSet.has('프로젝트 경험')}
              onChange={(items) => patch({ projects: items })}
            />

            <Section title="자기소개서" done={doneSet.has('자기소개서')}>
              <div className="flex flex-col gap-6">
                {form.coverLetters.map((c, i) => {
                  const isStandard = (
                    INTRO_QUESTIONS as readonly string[]
                  ).includes(c.question)
                  return (
                    <div
                      key={i}
                      className="border-divider flex flex-col gap-3 border-b pb-6 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        {isStandard ? (
                          <span className="text-fg flex-1 text-[14px] font-bold">
                            {c.question}
                          </span>
                        ) : (
                          <input
                            value={c.question}
                            onChange={(e) =>
                              setCoverQuestion(i, e.target.value)
                            }
                            placeholder="문항 제목 입력 (기타)"
                            className="placeholder:text-fg-subtle text-fg flex-1 text-[14px] font-bold focus:outline-none"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeCover(i)}
                          aria-label="문항 삭제"
                          className="text-fg-subtle hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        value={c.content}
                        onChange={(e) => setCover(i, e.target.value)}
                        placeholder="상세 내용을 작성해주세요."
                        className="placeholder:text-fg-subtle text-fg min-h-[60px] resize-none text-[14px] focus:outline-none"
                      />
                    </div>
                  )
                })}

                {/* 문항 추가 — 표준 6문항(중복 비활성) + 기타(직접 입력) 객관식 */}
                <div className="relative w-fit" ref={addRef}>
                  <button
                    type="button"
                    onClick={() => setAddOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={addOpen}
                    className="text-fg-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-[14px] font-medium"
                  >
                    <Plus className="h-4 w-4" />
                    문항 추가
                  </button>
                  {addOpen && (
                    <div className="border-border absolute bottom-full left-0 z-30 mb-1 w-[340px] max-w-[80vw] rounded-lg border bg-white p-1 shadow-[0px_8px_24px_0px_rgba(18,23,38,0.12)]">
                      {INTRO_QUESTIONS.map((q) => {
                        const used = form.coverLetters.some(
                          (c) => c.question === q,
                        )
                        return (
                          <button
                            key={q}
                            type="button"
                            disabled={used}
                            onClick={() => {
                              addCoverQuestion(q)
                              setAddOpen(false)
                            }}
                            className={cn(
                              'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[13px]',
                              used
                                ? 'text-fg-subtle cursor-not-allowed'
                                : 'text-fg-muted hover:bg-surface-muted',
                            )}
                          >
                            <span className="truncate">{q}</span>
                            {used && (
                              <span className="text-fg-subtle shrink-0 text-[11px]">
                                추가됨
                              </span>
                            )}
                          </button>
                        )
                      })}
                      <div className="bg-divider my-1 h-px" />
                      <button
                        type="button"
                        onClick={() => {
                          addCoverQuestion('')
                          setAddOpen(false)
                        }}
                        className="text-accent-strong hover:bg-surface-muted flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-[13px] font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        기타 (직접 입력)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
