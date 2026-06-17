import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Image as ImageIcon,
  Plus,
  Upload,
  X,
} from 'lucide-react'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { usePageHeader } from '@/shared/store'
import type { StudyFormData } from '../types'
import {
  Crumbs,
  FieldLabel,
  FormatRow,
  FormBar,
  TextArea,
  TextInput,
} from './FormParts'
import { useFileUpload } from './useFileUpload'

const COPY = {
  create: {
    crumbs: ['기록실', '스터디', '새 등록'],
    title: '스터디 등록',
    sub: '진행한 스터디 활동을 시간·활동 내역·인증 사진으로 기록',
    back: '이전·취소',
    submit: '제출',
    footer:
      '제출 후 검토된 스터디 활동 내역과 증빙 사진은 기록실에 표시됩니다.',
  },
  edit: {
    crumbs: ['기록실', '스터디', '수정'],
    title: '스터디 기록 수정',
    sub: '반려된 스터디 기록을 보완해 다시 제출',
    back: '목록으로',
    submit: '재제출',
    footer:
      '수정 제출 후에는 운영 검토 상태로 전환되며, 승인 전까지 다시 수정할 수 있습니다.',
  },
}

export function StudyForm({
  mode,
  initial,
}: {
  mode: 'create' | 'edit'
  initial?: StudyFormData
}) {
  const navigate = useNavigate()
  const c = COPY[mode]
  const [title, setTitle] = useState(initial?.title ?? '')
  const [date, setDate] = useState(initial?.date ?? '')
  const [startTime, setStartTime] = useState(initial?.startTime ?? '')
  const [endTime, setEndTime] = useState(initial?.endTime ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const { files, add, remove } = useFileUpload(initial?.files ?? [])
  const [touched, setTouched] = useState(false)
  usePageHeader(c.title, c.sub)

  const timeError = !!startTime && !!endTime && endTime <= startTime
  const valid = !!(
    title.trim() &&
    date &&
    startTime &&
    endTime &&
    body.trim() &&
    files.length > 0 &&
    !timeError
  )

  const submit = () => {
    if (!valid) {
      setTouched(true)
      return
    }
    navigate(
      mode === 'edit'
        ? '/student/records?toast=study-updated'
        : '/student/records',
    )
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    add(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <Crumbs items={c.crumbs} />

      {mode === 'edit' && initial?.rejectReason && (
        <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-[14px] border p-4">
          <span className="text-danger flex items-center gap-1.5 text-[13px] font-bold">
            <AlertTriangle className="size-3.5 shrink-0" />
            {initial.rejectReason.title}
          </span>
          <span className="text-fg-muted text-[12px] leading-5">
            {initial.rejectReason.detail}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <FieldLabel required>제목</FieldLabel>
        <TextInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예) SKN22기 코테 스터디 1회차"
        />
      </div>

      {/* 일정 — 날짜·시작·종료 객관식 선택 */}
      <div className="flex flex-col gap-2">
        <FieldLabel required hint="날짜와 시작·종료 시각을 선택">
          일정
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <DateTimePicker
            mode="date"
            value={date}
            onChange={setDate}
            placeholder="날짜 선택"
            ariaLabel="스터디 날짜"
          />
          <DateTimePicker
            mode="time"
            value={startTime}
            onChange={setStartTime}
            placeholder="시작 시각"
            ariaLabel="시작 시각"
          />
          <DateTimePicker
            mode="time"
            value={endTime}
            onChange={setEndTime}
            placeholder="종료 시각"
            ariaLabel="종료 시각"
          />
        </div>
        {touched && timeError && (
          <span className="text-danger text-[11px]">
            종료 시각은 시작 시각보다 늦어야 합니다.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <FieldLabel
          required
          hint="주요 진행 내용·다음 스터디 준비 사항을 함께 작성"
        >
          스터디 활동 내역
        </FieldLabel>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="예) DP 문제 4개를 함께 풀이하며 접근 방식을 비교했습니다.&#10;오늘 정리한 내용, 어려웠던 점, 다음 스터디 전까지 각자 준비할 일을 적어 주세요."
        />
      </div>

      {/* 증빙자료 업로드 */}
      <div className="flex flex-col gap-2">
        <FieldLabel required hint="이미지 파일 · 첨부 최대 30MB">
          증빙자료
        </FieldLabel>
        <FormatRow />
        <div className="border-brand/50 bg-brand/5 mt-1 flex flex-col gap-4 rounded-2xl border border-dashed p-6">
          <label className="flex cursor-pointer flex-col items-center gap-2 py-2">
            <span className="border-brand text-brand flex size-11 items-center justify-center rounded-full border">
              <Upload className="size-[18px]" />
            </span>
            <span className="text-fg text-[14px] font-bold">
              사진을 클릭해 업로드
            </span>
            <span className="text-fg-subtle text-[12px]">
              한 번에 여러 장 선택 가능 · 이미지 파일
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onPick}
            />
          </label>

          {files.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="border-border bg-surface relative flex flex-col gap-2 rounded-[12px] border p-2.5"
                >
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    aria-label="제거"
                    className="border-border bg-surface text-fg-subtle hover:text-fg absolute top-1 right-1 z-10 flex size-5 items-center justify-center rounded-full border"
                  >
                    <X className="size-3" />
                  </button>
                  <div className="bg-surface-muted text-fg-subtle flex aspect-square items-center justify-center overflow-hidden rounded-lg">
                    {f.previewUrl ? (
                      <img
                        src={f.previewUrl}
                        alt={f.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="size-5" />
                    )}
                  </div>
                  <span className="text-fg truncate text-[11px] font-semibold">
                    {f.name}
                  </span>
                  <span className="text-fg-subtle text-[10px]">{f.size}</span>
                </div>
              ))}
              <label className="border-border text-fg-subtle hover:border-brand/50 flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[12px] border border-dashed text-[12px]">
                <Plus className="size-[18px]" />
                파일 추가하기
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPick}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <FormBar
        backLabel={c.back}
        onBack={() => navigate('/student/records')}
        note={valid ? '● 모든 항목 입력됨' : undefined}
        submitLabel={c.submit}
        onSubmit={submit}
        disabled={!valid}
        footer={c.footer}
      />
    </div>
  )
}
