import type { Dispatch, SetStateAction } from 'react'
import { Check, Clock, Flag } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { TS_CATEGORIES, type Tone } from '../types'
import { TONE_SOLID } from '@/shared/lib/tone'
import { card, input } from './caseFormConstants'

interface CaseBasicInfoSectionProps {
  title: string
  setTitle: Dispatch<SetStateAction<string>>
  category: string
  setCategory: Dispatch<SetStateAction<string>>
  customCategories: string[]
  customInput: string
  setCustomInput: Dispatch<SetStateAction<string>>
  addCustomCategory: () => void
  date: string
  setDate: Dispatch<SetStateAction<string>>
  dayCount: string
  setDayCount: Dispatch<SetStateAction<string>>
  independent: boolean
  setIndependent: Dispatch<SetStateAction<boolean>>
}

export function CaseBasicInfoSection({
  title,
  setTitle,
  category,
  setCategory,
  customCategories,
  customInput,
  setCustomInput,
  addCustomCategory,
  date,
  setDate,
  dayCount,
  setDayCount,
  independent,
  setIndependent,
}: CaseBasicInfoSectionProps) {
  return (
    <section className={cn(card, 'flex flex-col gap-4')}>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[15px] font-bold">기본 정보</span>
        <span className="text-fg-subtle text-[11px]">
          사례를 한 줄로 요약할 제목과 분류를 입력하세요
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-bold">
          제목 <span className="text-danger">*</span>
        </span>
        <input
          className={input}
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="문제와 해결 핵심을 한 줄로"
        />
        <div className="flex items-center justify-between">
          <span className="text-fg-subtle text-[11px]">
            문제와 해결 핵심을 한 줄로 — 60자 이내 권장
          </span>
          <span className="text-fg-subtle text-[11px]">
            {title.length} / 60
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-fg text-[13px] font-bold">
          카테고리 <span className="text-danger">*</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            ...TS_CATEGORIES,
            ...customCategories.map((key) => ({
              key,
              tone: 'success' as Tone,
            })),
          ].map((c) => {
            const on = c.key === category
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategory(c.key)}
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
                    className={cn('size-1.5 rounded-full', TONE_SOLID[c.tone])}
                  />
                )}
                {c.key}
              </button>
            )
          })}
        </div>
        {category === '기타' && (
          <div className="mt-1 flex items-center gap-2">
            <input
              className={cn(input, 'flex-1')}
              value={customInput}
              maxLength={20}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomCategory()
                }
              }}
              placeholder="카테고리를 직접 입력하고 추가하세요"
              aria-label="기타 카테고리 직접 입력"
            />
            <button
              type="button"
              onClick={addCustomCategory}
              disabled={!customInput.trim()}
              className="border-brand text-brand shrink-0 rounded-[10px] border px-4 py-3 text-[13px] font-semibold disabled:opacity-40"
            >
              추가
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-bold">
              문제 발생일 <span className="text-danger">*</span>
            </span>
            <DateTimePicker
              mode="date"
              value={date}
              onChange={setDate}
              ariaLabel="문제 발생일"
              placeholder="날짜 선택"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[13px] font-bold">해결 소요</span>
            <div className="relative">
              <Clock className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
              <input
                className={cn(input, 'pr-9 pl-10')}
                value={dayCount}
                inputMode="numeric"
                onChange={(e) =>
                  setDayCount(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="예) 3"
                aria-label="해결 소요 일수"
              />
              <span className="text-fg-muted pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px]">
                일
              </span>
            </div>
          </div>
        </div>
        <span className="text-fg-subtle text-[11px]">
          실제 문제가 발생한 일자와 해결까지 소요된 영업일
        </span>
      </div>
      <button
        type="button"
        onClick={() => setIndependent((v) => !v)}
        className="bg-surface-muted/50 flex items-center justify-between rounded-xl p-3.5"
      >
        <div className="flex items-center gap-2.5 text-left">
          <span className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Flag className="size-[18px]" />
          </span>
          <div className="flex flex-col">
            <span className="text-fg text-[13px] font-bold">독립 해결</span>
            <span className="text-fg-subtle text-[11px]">
              동료·강사·외부 도움 없이 본인 주도로 해결한 사례
            </span>
          </div>
        </div>
        <span
          className={cn(
            'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
            independent ? 'bg-brand' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'size-5 rounded-full bg-white transition-transform',
              independent && 'translate-x-5',
            )}
          />
        </span>
      </button>
    </section>
  )
}
