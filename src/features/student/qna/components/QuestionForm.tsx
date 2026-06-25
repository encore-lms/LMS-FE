import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/shared/store'
import { useCreateQuestion } from '../../api/qna'
import { MarkdownEditor } from './MarkdownEditor'
import { QNA_CATEGORIES, type Tone } from '../types'

const card = 'border-border bg-surface rounded-2xl border p-6'
const input =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

// 새 질문 작성 폼 — 제목·카테고리·내용·태그. 트러블슈팅 CaseContentForm 패턴(축약).
export function QuestionForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const createQuestion = useCreateQuestion()

  const [title, setTitle] = useState('')
  const [categoryKey, setCategoryKey] = useState('lecture')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const addTag = (raw: string) => {
    const body = raw.trim().replace(/^#+/, '')
    if (!body) return
    const tag = `#${body}`
    if (tags.includes(tag) || tags.length >= 5) return
    setTags((p) => [...p, tag])
  }
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag))

  const canSubmit = title.trim().length > 0 && content.trim().length > 0
  const submit = () => {
    if (!canSubmit || createQuestion.isPending) return
    createQuestion.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        categoryKey,
        tags,
        authorName: user?.name,
      },
      {
        onSuccess: (detail) => {
          toast.success('질문을 등록했어요')
          navigate(`/student/qna/${detail.id}`)
        },
        onError: () => toast.danger('질문 등록에 실패했어요'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <section className={cn(card, 'flex flex-col gap-4')}>
        <div className="flex flex-col gap-0.5">
          <span className="text-fg text-[15px] font-bold">질문 작성</span>
          <span className="text-fg-subtle text-[11px]">
            구체적으로 적을수록 좋은 답변을 받을 수 있어요
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-fg text-[13px] font-bold">
            제목 <span className="text-danger">*</span>
          </span>
          <input
            className={input}
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="궁금한 점을 한 줄로 요약해 주세요"
          />
          <div className="flex justify-end">
            <span className="text-fg-subtle text-[11px]">
              {title.length} / 80
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-fg text-[13px] font-bold">
            카테고리 <span className="text-danger">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {QNA_CATEGORIES.map((c) => {
              const on = c.key === categoryKey
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategoryKey(c.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold',
                    on
                      ? 'border-brand bg-brand text-white'
                      : 'border-border text-fg-muted hover:border-brand/50',
                  )}
                >
                  {on ? (
                    <Check className="size-3" />
                  ) : (
                    <span
                      className={cn('size-1.5 rounded-full', DOT[c.tone])}
                    />
                  )}
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-fg text-[13px] font-bold">
            내용 <span className="text-danger">*</span>
          </span>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            maxLength={2000}
            minHeight={200}
            placeholder="상황·시도해 본 것·기대한 결과를 적어 주세요. 코드 블록(```)·이미지 붙여넣기 지원."
            onImageRejected={(msg) => toast.danger(msg)}
          />
          <div className="flex items-center justify-between">
            <span className="text-fg-subtle text-[11px]">
              마크다운·코드 블록·이미지 지원
            </span>
            <span className="text-fg-subtle text-[11px]">
              {content.length} / 2000
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-fg text-[13px] font-bold">태그</span>
            <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-bold">
              {tags.length} / 5
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="bg-brand flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-[12px] font-semibold text-white"
              >
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  aria-label={`${t} 제거`}
                  className="text-brand flex size-4 items-center justify-center rounded-full bg-white"
                >
                  <X className="size-2.5" strokeWidth={3} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag(tagInput)
                    setTagInput('')
                  }
                }}
                placeholder="+ 태그 추가"
                className="text-fg-subtle placeholder:text-fg-subtle focus:text-fg w-24 bg-transparent px-1 py-1 text-[12px] outline-none"
              />
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/student/qna')}
          className="border-border text-fg h-11 rounded-[10px] border px-5 text-[14px] font-semibold"
        >
          취소
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || createQuestion.isPending}
          className="bg-brand h-11 rounded-[10px] px-6 text-[14px] font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createQuestion.isPending ? '등록 중…' : '질문 등록'}
        </button>
      </div>
    </div>
  )
}
