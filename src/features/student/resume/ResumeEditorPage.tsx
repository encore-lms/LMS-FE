import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Code2,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  Trash2,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useToast } from '@/components/ui/use-toast'
import { useCreateResume, useResume, useUpdateResume } from '../api/resume'
import type { ResumeDetail, ResumeItem, ResumeUpdatePayload } from './types'

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

const ITEM_SECTIONS: { key: ItemKey; title: string; addLabel: string }[] = [
  { key: 'careers', title: '경력사항', addLabel: '항목 추가' },
  { key: 'educations', title: '학력사항', addLabel: '항목 추가' },
  { key: 'certificates', title: '자격사항', addLabel: '항목 추가' },
  { key: 'awards', title: '수상내역', addLabel: '항목 추가' },
  { key: 'trainings', title: '교육경험', addLabel: '항목 추가' },
  { key: 'activities', title: '기타활동', addLabel: '항목 추가' },
  { key: 'projects', title: '프로젝트 경험', addLabel: '프로젝트 추가' },
]

const INTRO_QUESTIONS = [
  '자기소개',
  '지원동기',
  '직무와 관련된 경험 중 어려움을 극복한 사례',
  '성장과정',
  '직무와 관련된 성격의 장단점',
  '지원한 회사에 대한 포부',
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

/** 섹션(제목 + 구분선 + 본문). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-fg text-[17px] font-bold">{title}</h2>
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
  onChange,
}: {
  title: string
  addLabel: string
  items: ResumeItem[]
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
    <Section title={title}>
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

function DocView({ form }: { form: ResumeForm }) {
  const b = form.basicInfo
  return (
    <div className="border-border flex flex-col gap-8 rounded-2xl border bg-white p-10">
      <div className="flex flex-col gap-3">
        {/* 이력서 문서 내용의 이름 — 페이지 h1은 공유 헤더가 소유하므로 h2로 유지 */}
        <h2 className="text-fg text-2xl font-bold">
          {b.name || '(이름 미입력)'}
        </h2>
        <div className="text-fg-muted flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="text-fg-subtle h-3.5 w-3.5" />
            {b.phone || '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="text-fg-subtle h-3.5 w-3.5" />
            {b.email || '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="text-fg-subtle h-3.5 w-3.5" />
            {b.birth || '—'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="text-fg-subtle h-3.5 w-3.5" />
            {b.githubUrl || '—'}
          </span>
        </div>
      </div>
      <Section title="경력사항">
        <div className="flex flex-col gap-4">
          {form.careers.length === 0 ? (
            <span className="text-fg-subtle text-[13px]">미입력</span>
          ) : (
            form.careers.map((c, i) => (
              <DocEntry
                key={`${c.title}-${i}`}
                icon={<Briefcase />}
                title={c.title || '(제목 미입력)'}
                meta={itemMeta(c)}
              />
            ))
          )}
        </div>
      </Section>
      <Section title="학력사항">
        <div className="flex flex-col gap-4">
          {form.educations.length === 0 ? (
            <span className="text-fg-subtle text-[13px]">미입력</span>
          ) : (
            form.educations.map((e, i) => (
              <DocEntry
                key={`${e.title}-${i}`}
                icon={<GraduationCap />}
                title={e.title || '(제목 미입력)'}
                meta={itemMeta(e)}
              />
            ))
          )}
        </div>
      </Section>
    </div>
  )
}

/**
 * 이력서 편집기 (/student/resume/new · /:resumeId/edit) — 셸(사이드바 이력서 관리 + 공통 헤더) 안.
 * 폼은 mock 내용으로 채워(컨트롤드) 편집·제출이 실제 반영된다.
 * 제출 → 기존: PUT(작성 완료) / 신규: POST 생성 후 PUT(작성 완료) → 목록 등장.
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
  usePageHeader('이력서 편집기')

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

  const handleSubmit = () => {
    if (!form) return
    const payload: ResumeUpdatePayload = {
      ...form,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      status: '작성 완료',
    }
    const done = () => {
      toast.success(resumeId ? '이력서를 제출했어요' : '새 이력서를 추가했어요')
      navigate('/student/resume')
    }
    if (resumeId) {
      updateResume.mutate({ id: resumeId, payload }, { onSuccess: done })
    } else {
      // 새 이력서: 생성 후 작성한 내용으로 저장(작성 완료) → 목록 등장.
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form || submitting}
            className="bg-accent-strong inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-bold text-white disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? '제출 중…' : '제출'}
          </button>
        ) : (
          <button
            type="button"
            className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-[14px] font-semibold"
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
          <DocView form={form} />
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
              <input
                value={form.basicInfo.name}
                onChange={(e) => patchBasic({ name: e.target.value })}
                placeholder="이름을 입력하세요"
                className="placeholder:text-fg-subtle text-fg text-2xl font-bold focus:outline-none"
              />
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

            <Section title="핵심역량/강점">
              <textarea
                value={form.strength}
                onChange={(e) => patch({ strength: e.target.value })}
                placeholder={
                  '채용 담당자들이 가장 먼저 읽게 되는 글입니다.\n경력을 기반으로 나의 역량과 강점을 소개해 주세요.\n5줄 이내로 간결하게 작성하는 것을 권장합니다.'
                }
                className="placeholder:text-fg-subtle text-fg min-h-[96px] w-full resize-none text-[14px] leading-relaxed focus:outline-none"
              />
            </Section>

            <Section title="기술스택">
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

            {ITEM_SECTIONS.map((s) => (
              <ItemSectionEditor
                key={s.key}
                title={s.title}
                addLabel={s.addLabel}
                items={form[s.key]}
                onChange={(items) => patch({ [s.key]: items })}
              />
            ))}

            <Section title="자기소개서">
              <div className="flex flex-col gap-6">
                {form.coverLetters.map((c, i) => (
                  <div
                    key={`${c.question}-${i}`}
                    className="border-divider flex flex-col gap-3 border-b pb-6 last:border-b-0"
                  >
                    <span className="text-fg text-[14px] font-bold">
                      {c.question}
                    </span>
                    <textarea
                      value={c.content}
                      onChange={(e) => setCover(i, e.target.value)}
                      placeholder="상세 내용을 작성해주세요."
                      className="placeholder:text-fg-subtle text-fg min-h-[60px] resize-none text-[14px] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
