import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { RESUME_DOC, type ResumeDocEntry } from './mocks'

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

function AddSection({ title, addLabel }: { title: string; addLabel: string }) {
  return (
    <Section title={title}>
      <button
        type="button"
        className="text-fg-muted hover:text-fg inline-flex w-fit items-center gap-1.5 text-[14px] font-medium"
      >
        <Plus className="h-4 w-4" />
        {addLabel}
      </button>
    </Section>
  )
}

function InlineField({
  icon,
  placeholder,
}: {
  icon: ReactNode
  placeholder: string
}) {
  return (
    <span className="text-fg-subtle inline-flex items-center gap-1.5 text-[14px] [&>svg]:h-4 [&>svg]:w-4">
      {icon}
      <input
        placeholder={placeholder}
        className="placeholder:text-fg-subtle text-fg w-[140px] bg-transparent focus:outline-none"
      />
    </span>
  )
}

function IntroBlock({ label }: { label: string }) {
  return (
    <div className="border-divider flex flex-col gap-3 border-b pb-6 last:border-b-0">
      <span className="text-fg text-[14px] font-bold">{label}</span>
      <input
        placeholder="부제목을 작성하세요"
        className="placeholder:text-fg-subtle text-fg text-[14px] focus:outline-none"
      />
      <textarea
        placeholder="상세 내용을 작성해주세요."
        className="placeholder:text-fg-subtle text-fg min-h-[60px] resize-none text-[14px] focus:outline-none"
      />
    </div>
  )
}

const ITEM_SECTIONS = [
  { title: '경력사항', add: '항목 추가' },
  { title: '학력사항', add: '항목 추가' },
  { title: '기술스택', add: '기술스택 추가' },
  { title: '자격사항', add: '항목 추가' },
  { title: '수상내역', add: '항목 추가' },
  { title: '교육경험', add: '항목 추가' },
  { title: '기타활동', add: '항목 추가' },
  { title: '프로젝트 경험', add: '프로젝트 추가' },
]

const INTRO_BLOCKS = [
  '자기소개',
  '지원동기',
  '직무와 관련된 경험 중 어려움을 극복한 사례',
  '성장과정',
  '직무와 관련된 성격의 장단점',
  '지원한 회사에 대한 포부',
]

/** Doc 미리보기 — 작성된 이력서를 문서로 렌더. */
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

function DocView() {
  const d = RESUME_DOC
  return (
    <div className="border-border flex flex-col gap-8 rounded-2xl border bg-white p-10">
      <div className="flex flex-col gap-3">
        {/* 이력서 문서 내용의 이름 — 페이지 h1은 공유 헤더가 소유하므로 h2로 유지 */}
        <h2 className="text-fg text-2xl font-bold">{d.name}</h2>
        <div className="text-fg-muted flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px]">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="text-fg-subtle h-3.5 w-3.5" />
            {d.phone}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Mail className="text-fg-subtle h-3.5 w-3.5" />
            {d.email}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="text-fg-subtle h-3.5 w-3.5" />
            {d.birth}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Code2 className="text-fg-subtle h-3.5 w-3.5" />
            {d.github}
          </span>
        </div>
      </div>
      <Section title="경력사항">
        <div className="flex flex-col gap-4">
          {d.careers.map((c: ResumeDocEntry) => (
            <DocEntry
              key={c.title}
              icon={<Briefcase />}
              title={c.title}
              meta={c.meta}
            />
          ))}
        </div>
      </Section>
      <Section title="학력사항">
        <div className="flex flex-col gap-4">
          {d.educations.map((e: ResumeDocEntry) => (
            <DocEntry
              key={e.title}
              icon={<GraduationCap />}
              title={e.title}
              meta={e.meta}
            />
          ))}
        </div>
      </Section>
    </div>
  )
}

/**
 * 이력서 편집기 (/student/resume/new · /:resumeId/edit) — 셸(사이드바 이력서 관리 + 공통 헤더) 안.
 * Doc/Edit 토글 + 11개 섹션 폼. 작성/제출/저장은 UI까지(BE 연동 후속).
 */
export default function ResumeEditorPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'edit' | 'doc'>('edit')
  // 문서 안 이름 h1은 이력서 내용이므로 유지 — 페이지 제목만 공유 헤더에 등록.
  usePageHeader('이력서 편집기')

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
            className="bg-accent-strong inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[14px] font-bold text-white"
          >
            <Send className="h-4 w-4" />
            제출
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
        {mode === 'doc' ? (
          <DocView />
        ) : (
          <div className="border-border flex flex-col gap-8 rounded-2xl border bg-white p-10">
            <div className="flex items-center gap-3">
              <span className="text-fg-muted shrink-0 text-[14px] font-bold">
                이력서 제목
              </span>
              <input
                defaultValue="새 이력서"
                maxLength={100}
                className="text-fg flex-1 text-[15px] font-bold focus:outline-none"
              />
              <span className="text-fg-subtle shrink-0 text-[13px]">5/100</span>
            </div>

            <div className="flex flex-col gap-4">
              <input
                placeholder="이름을 입력하세요"
                className="placeholder:text-fg-subtle text-fg text-2xl font-bold focus:outline-none"
              />
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <InlineField icon={<Phone />} placeholder="연락처" />
                <InlineField icon={<Mail />} placeholder="이메일" />
                <InlineField icon={<Calendar />} placeholder="생년월일" />
                <InlineField icon={<Code2 />} placeholder="Github URL" />
                <InlineField icon={<Globe />} placeholder="Blog URL" />
              </div>
            </div>

            <Section title="핵심역량/강점">
              <textarea
                placeholder={
                  '채용 담당자들이 가장 먼저 읽게 되는 글입니다.\n경력을 기반으로 나의 역량과 강점을 소개해 주세요.\n5줄 이내로 간결하게 작성하는 것을 권장합니다.'
                }
                className="placeholder:text-fg-subtle text-fg min-h-[96px] w-full resize-none text-[14px] leading-relaxed focus:outline-none"
              />
            </Section>

            {ITEM_SECTIONS.map((s) => (
              <AddSection key={s.title} title={s.title} addLabel={s.add} />
            ))}

            <Section title="자기소개서">
              <div className="flex flex-col gap-6">
                {INTRO_BLOCKS.map((b) => (
                  <IntroBlock key={b} label={b} />
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}
