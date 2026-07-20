import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertCircle, Check, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { PeriodField } from './PeriodField'
import { INTRO_QUESTIONS } from './constants'
import type { ResumeCoverLetter, ResumeItem } from './types'

/** 섹션 작성 여부 배지 — 미작성은 눈에 띄게(앰버), 작성됨은 초록. */
export function SectionStatus({ done }: { done: boolean }) {
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
export function Section({
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

export function InlineField({
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
export function ItemSectionEditor({
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
            className="bg-surface-muted/40 flex flex-col gap-2 rounded-xl p-4"
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
            </div>
            <PeriodField
              value={it.period}
              onChange={(v) => update(i, { period: v })}
            />
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

/** 자기소개서 섹션 — 문항별 제목·내용 입력 + 문항 추가(팝오버)/삭제. */
export function CoverLetterSection({
  coverLetters,
  done,
  onSetContent,
  onSetQuestion,
  onAdd,
  onRemove,
}: {
  coverLetters: ResumeCoverLetter[]
  done: boolean
  onSetContent: (i: number, content: string) => void
  onSetQuestion: (i: number, question: string) => void
  onAdd: (question: string) => void
  onRemove: (i: number) => void
}) {
  const [addOpen, setAddOpen] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)

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

  return (
    <Section title="자기소개서" done={done}>
      <div className="flex flex-col gap-6">
        {coverLetters.map((c, i) => {
          const isStandard = (INTRO_QUESTIONS as readonly string[]).includes(
            c.question,
          )
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
                    onChange={(e) => onSetQuestion(i, e.target.value)}
                    placeholder="문항 제목 입력 (기타)"
                    className="placeholder:text-fg-subtle text-fg flex-1 text-[14px] font-bold focus:outline-none"
                  />
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="문항 삭제"
                  className="text-fg-subtle hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={c.content}
                onChange={(e) => onSetContent(i, e.target.value)}
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
                const used = coverLetters.some((c) => c.question === q)
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={used}
                    onClick={() => {
                      onAdd(q)
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
                  onAdd('')
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
  )
}
