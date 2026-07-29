import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { usePageHeader } from '@/shared/store'
import { useToast } from '@/components/ui/use-toast'
import type { BlogFormData } from '../types'
import { useCreateBlogRecord, useUpdateBlogRecord } from '../../api/records'
import { Crumbs, FieldLabel, FormBar, TextInput } from './FormParts'
import { WeekPicker } from './WeekPicker'

// 외부 블로그 URL은 http(s) 형식만 허용한다.
function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// 블로그 등록/수정 폼 본문 — 주차 선택 + 제목 + 외부 URL. mode 로 등록/수정 분기.
// (블로그는 임시저장 없이 제출만 — 주차당 1개)
const COPY = {
  create: {
    title: '블로그 등록',
    sub: '안내된 블로그 양식에 맞춰 작성한 외부 URL을 주차 단위로 제출',
    crumbs: ['기록실', '블로그', '새 등록'],
    pillSuffix: '현재 주차',
    backLabel: '이전 취소',
    note: '주차 당 1개만 제출 가능',
    submit: '제출',
    footer:
      '주차당 1개 블로그 글만 등록 가능합니다. 승인 여부는 3~10일 내 안내됩니다.',
  },
  edit: {
    title: '블로그 기록 수정',
    sub: '반려된 블로그 기록을 보완해 다시 제출',
    crumbs: ['기록실', '블로그', '수정'],
    pillSuffix: '반려 기록',
    backLabel: '목록으로',
    note: '반려 기록은 수정 후 다시 검토됩니다',
    submit: '재제출',
    footer:
      '수정 제출 후에는 운영 검토 상태로 전환되며, 승인 전까지 다시 수정할 수 있습니다.',
  },
}

export function BlogForm({
  mode,
  data,
  recordId,
}: {
  mode: 'create' | 'edit'
  data: BlogFormData
  recordId?: string
}) {
  const navigate = useNavigate()
  const toast = useToast()
  const c = COPY[mode]
  const createMutation = useCreateBlogRecord()
  const updateMutation = useUpdateBlogRecord(recordId ?? '')
  const [selectedNo, setSelectedNo] = useState(data.selectedNo)
  const [title, setTitle] = useState(data.title)
  const [url, setUrl] = useState(data.url)
  const [touched, setTouched] = useState(false)
  usePageHeader(c.title, c.sub)

  // 서버 오류 메시지 추출(주차 중복 409 등) — 없으면 일반 안내.
  const errorMessage = (err: unknown) => {
    const msg = (
      err as { response?: { data?: { message?: string } } } | undefined
    )?.response?.data?.message
    return msg ?? '제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  }

  const urlValid = isHttpUrl(url)
  const urlError = touched && !urlValid
  const titleValid = !!title.trim()
  const valid = urlValid && titleValid
  const pending = createMutation.isPending || updateMutation.isPending

  const sel = data.weeks.find((w) => w.no === selectedNo)
  const selectedPill = sel
    ? `선택: ${sel.label} · ${sel.range} (${c.pillSuffix})`
    : '주차를 선택하세요'

  // 제출 — 제목·URL 필수. 등록/수정 모두 검토 중으로 전환된다(블로그는 임시저장 없음).
  const submit = () => {
    if (!valid) {
      setTouched(true)
      return
    }
    if (mode === 'edit') {
      updateMutation.mutate(
        { url, title: title.trim() },
        {
          onSuccess: () => navigate('/student/records?toast=blog-updated'),
          onError: (err) => toast.danger(errorMessage(err)),
        },
      )
      return
    }
    createMutation.mutate(
      {
        weekNo: selectedNo,
        weekLabel: sel?.label ?? `${selectedNo}주차`,
        dateRange: sel?.range ?? '',
        title: title.trim(),
        url,
      },
      {
        onSuccess: () => navigate('/student/records?toast=blog-created'),
        onError: (err) => toast.danger(errorMessage(err)),
      },
    )
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <Crumbs items={c.crumbs} />

      {mode === 'edit' && data.rejectReason ? (
        <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-[14px] border p-4">
          <span className="text-danger flex items-center gap-1.5 text-[13px] font-bold">
            <AlertTriangle className="size-3.5 shrink-0" />
            {data.rejectReason.title}
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            {data.rejectReason.detail}
          </span>
        </div>
      ) : (
        <div className="border-info/40 bg-info-bg/60 flex flex-col gap-1 rounded-[14px] border p-4">
          <span className="text-info flex items-center gap-1.5 text-[13px] font-bold">
            ⓘ 블로그 기록 기준
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            학습 과정·문제 해결·회고 내용을 사실 기반으로 작성해 주세요. 공개 전
            개인정보와 외부 비공개 자료 포함 여부를 확인합니다.
          </span>
        </div>
      )}

      <WeekPicker
        cohortLabel={data.cohortLabel}
        weeks={data.weeks}
        moreLabel={data.moreLabel}
        selectedNo={selectedNo}
        onSelect={setSelectedNo}
        selectedPill={selectedPill}
        locked={mode === 'edit'}
      />

      <div className="flex flex-col gap-2">
        <FieldLabel required hint="기록실 목록에 표시될 글 제목">
          제목
        </FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => setTouched(true)}
          error={touched && !titleValid}
          placeholder="예) JPA 영속성 컨텍스트의 1차 캐시 정리"
        />
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          required
          hint="공개된 블로그의 https URL만 등록할 수 있습니다 (운영자 검수 진행)"
        >
          외부 블로그 글 URL
        </FieldLabel>
        <TextInput
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          error={urlError}
          inputMode="url"
          placeholder="https://your-blog.example.com/posts/..."
        />
        {urlError ? (
          <span className="text-danger flex items-center gap-1 text-[11px]">
            <AlertTriangle className="size-3 shrink-0" />
            올바른 URL 형식이 아닙니다. https:// 를 포함한 전체 주소를 입력해
            주세요.
          </span>
        ) : (
          <span className="text-fg-subtle text-[11px]">
            ⓘ 주소창의 https:// 포함 전체 URL을 붙여넣어 주세요.
          </span>
        )}
      </div>

      <FormBar
        backLabel={c.backLabel}
        onBack={() => navigate('/student/records')}
        note={c.note}
        submitLabel={c.submit}
        onSubmit={submit}
        disabled={!valid || pending}
        footer={c.footer}
      />
    </div>
  )
}
