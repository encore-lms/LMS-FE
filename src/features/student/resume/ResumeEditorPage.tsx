import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Code2,
  FileText,
  Globe,
  Mail,
  Pencil,
  Phone,
  Save,
  Send,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useToast } from '@/components/ui/use-toast'
import { useCreateResume, useResume, useUpdateResume } from '../api/resume'
import { ResumeDocView } from './ResumeDocView'
import { SECTIONS, computeDoneSections, missingSections } from './constants'
import type { ResumeStatus, ResumeUpdatePayload } from './types'
import { ITEM_SECTIONS, blankForm, toForm, type ResumeForm } from './editorForm'
import {
  CoverLetterSection,
  InlineField,
  ItemSectionEditor,
  Section,
  SectionStatus,
} from './EditorSections'

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
  usePageHeader('이력서 편집기')

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
          <ResumeDocView data={{ ...form, skills }} />
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

            <CoverLetterSection
              coverLetters={form.coverLetters}
              done={doneSet.has('자기소개서')}
              onSetContent={setCover}
              onSetQuestion={setCoverQuestion}
              onAdd={addCoverQuestion}
              onRemove={removeCover}
            />
          </div>
        )}
      </div>
    </div>
  )
}
