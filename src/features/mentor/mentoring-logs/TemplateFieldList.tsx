// 적용된 템플릿 항목 리스트 — 작성 모달(LogTemplateModal)·상세 모달(LogDetailModal) 공용.
// 행 문법: [순번 | 항목명 | 필수/선택 | 설명(우측 정렬)].
// 항목명은 줄바꿈 없이 고정, 설명만 남은 폭에서 말줄임 — 한글 항목명이 접히는 것을 막는다.
import { cn } from '@/shared/lib/cn'
import type { MentoringLogFieldSnapshot } from '../types'
import { RequiredChip } from './LogChips'

export function TemplateFieldList({
  fields,
  className,
}: {
  fields: MentoringLogFieldSnapshot[]
  /** 껍데기 변형 — 작성 모달은 테두리 카드, 상세 모달은 muted 배경. */
  className?: string
}) {
  return (
    <ul className={cn('divide-divider flex flex-col divide-y', className)}>
      {fields.map((field) => (
        <li
          key={field.fieldSnapshotId}
          className="flex items-center gap-2 px-4 py-2.5"
        >
          <span className="text-fg-subtle w-4 shrink-0 text-[11px] font-bold">
            {field.order}
          </span>
          <span className="text-fg shrink-0 text-[13px] font-semibold whitespace-nowrap">
            {field.name}
          </span>
          <RequiredChip required={field.required} />
          <span
            className="text-fg-subtle ml-auto min-w-0 truncate text-[11px]"
            title={field.description}
          >
            {field.description}
          </span>
        </li>
      ))}
    </ul>
  )
}
