import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import type { TypingPassage } from './types'

const LANGUAGES = ['Python', '한글', '영문']
const LEVELS = ['쉬움', '보통', '어려움']

/** 폼 입력값 — 추가/수정 시 페이지로 전달해 목록에 반영한다. */
export interface PassageFormValues {
  title: string
  content: string
  language: string
  level: string
  order: number
  active: boolean
}

export interface PassageFormModalProps {
  open: boolean
  /** 수정 대상(없으면 신규 추가) */
  passage: TypingPassage | null
  onClose: () => void
  /** 검증 통과 후 호출 — mode로 추가/수정 분기 + 입력값 전달 */
  onSubmit: (mode: 'create' | 'edit', values: PassageFormValues) => void
}

// 제시문 추가·수정 폼 모달 (Figma 1557:11159) — 제시문 폼 모달 기준 6필드.
// 제출 시 실제 생성·수정 mutation은 BE 계약(P0_15) 확정 후 — 현재는 검증 + onSubmit 콜백(mock).
export function PassageFormModal({
  open,
  passage,
  onClose,
  onSubmit,
}: PassageFormModalProps) {
  const mode: 'create' | 'edit' = passage ? 'edit' : 'create'
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [level, setLevel] = useState(LEVELS[1])
  const [order, setOrder] = useState('0')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

  // 모달이 열릴 때 대상 값으로 초기화(본문은 목록에 없어 빈값 — 수정 시 BE 로드 TODO).
  useEffect(() => {
    if (!open) return
    setTitle(passage?.title ?? '')
    setContent('')
    setLanguage(passage?.language ?? LANGUAGES[0])
    setLevel(passage?.level ?? LEVELS[1])
    setOrder(String(passage?.order ?? 0))
    setActive(passage ? passage.status === 'active' : true)
    setErrors({})
  }, [open, passage])

  const submit = () => {
    const next: { title?: string; content?: string } = {}
    if (!title.trim()) next.title = '제목을 입력해주세요'
    if (!content.trim()) next.content = '내용을 입력해주세요'
    setErrors(next)
    if (next.title || next.content) return
    onSubmit(mode, {
      title: title.trim(),
      content: content.trim(),
      language,
      level,
      order: Number(order) || 0,
      active,
    })
  }

  const selectClass =
    'border-border text-fg focus:border-brand h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'edit' ? '제시문 수정' : '제시문 추가'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={submit}>{mode === 'edit' ? '저장' : '추가'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="제목"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="80자 이내"
          error={errors.title}
        />

        <div className="flex w-full flex-col gap-[6px]">
          <label
            htmlFor="passage-content"
            className="text-fg text-[13px] font-bold"
          >
            내용 <span className="text-danger">*</span>
          </label>
          <textarea
            id="passage-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="타자 입력 대상 원문"
            aria-invalid={errors.content ? true : undefined}
            className={`border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-lg border-2 bg-white p-3 text-sm outline-none ${
              errors.content ? 'border-danger' : ''
            }`}
          />
          {errors.content && (
            <p role="alert" className="text-danger text-[13px]">
              {errors.content}
            </p>
          )}
          {mode === 'edit' && (
            <p className="text-fg-subtle text-xs">
              수정 시 기존 본문은 BE 연동 후 자동 로드됩니다 (P0_15).
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="passage-language"
              className="text-fg text-[13px] font-bold"
            >
              언어
            </label>
            <select
              id="passage-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={selectClass}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-[6px]">
            <label
              htmlFor="passage-level"
              className="text-fg text-[13px] font-bold"
            >
              난이도
            </label>
            <select
              id="passage-level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className={selectClass}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="정렬 순서"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />
        </div>

        <Checkbox
          checked={active}
          onChange={setActive}
          label="활성 (비활성 시 수강생 미노출)"
        />
      </div>
    </Modal>
  )
}
