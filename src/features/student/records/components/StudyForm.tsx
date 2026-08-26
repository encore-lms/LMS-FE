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
import { useCreateStudyRecord, useUpdateStudyRecord } from '../../api/records'
import {
  Crumbs,
  FieldLabel,
  FormatRow,
  FormBar,
  TextArea,
  TextInput,
} from './FormParts'
import { useFileUpload } from './useFileUpload'
import { useUploadRecordAttachments } from '../../api/records'

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
  // 임시저장 건 수정 — 제출한 적 없는 작성 중 기록이라 반려·재제출 문구를 쓰지 않는다.
  draft: {
    crumbs: ['기록실', '스터디', '수정'],
    title: '스터디 기록 수정',
    sub: '작성 중인 스터디 기록을 이어서 작성',
    back: '목록으로',
    submit: '제출',
    footer:
      '제출 후 검토된 스터디 활동 내역과 증빙 사진은 기록실에 표시됩니다.',
  },
}

// 스터디 등록 기본값 — 오늘 날짜 / 현재 시각(5분 슬롯에 맞춰 floor) / 시작+1시간.
/** 오늘(YYYY-MM-DD, 로컬) — 아직 오지 않은 날을 막는 기준. */
const 오늘 = () => new Date().toLocaleDateString('sv-SE')

// DateTimePicker 포맷: date='YYYY-MM-DD', time='HH:mm'(24시간제).
const pad2 = (n: number) => String(n).padStart(2, '0')
const toDateValue = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const toTimeValue = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
// 현재 시각을 5분 단위로 내림(피커 슬롯과 일치, 미래로 튀지 않게 floor).
function floored5Now() {
  const d = new Date()
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0)
  return d
}
// datetime 값('YYYY-MM-DDTHH:mm') — 시작=오늘 현재(5분 floor), 종료=시작+1시간(자정 넘기면 날짜도 이동).
const defaultStudyStartAt = () => {
  const d = floored5Now()
  return `${toDateValue(d)}T${toTimeValue(d)}`
}
const defaultStudyEndAt = () => {
  const d = floored5Now()
  d.setHours(d.getHours() + 1)
  return `${toDateValue(d)}T${toTimeValue(d)}`
}

export function StudyForm({
  mode,
  initial,
  recordId,
  isDraft = false,
}: {
  mode: 'create' | 'edit'
  initial?: StudyFormData
  recordId?: string
  /** 임시저장(작성 중) 기록 수정 중인지 — true면 저장 시 임시저장으로 유지(반려 재제출과 구분) */
  isDraft?: boolean
}) {
  const navigate = useNavigate()
  const c = mode === 'edit' && isDraft ? COPY.draft : COPY[mode]
  const createMutation = useCreateStudyRecord()
  const updateMutation = useUpdateStudyRecord(recordId ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  // 시작·종료를 각각 날짜+시간(datetime)으로 관리. create 모드는 오늘 현재(+1h) 기본값, edit 모드는 기존 값.
  const [startAt, setStartAt] = useState(() =>
    initial?.date && initial?.startTime
      ? `${initial.date}T${initial.startTime}`
      : defaultStudyStartAt(),
  )
  const [endAt, setEndAt] = useState(() =>
    initial?.date && initial?.endTime
      ? `${initial.date}T${initial.endTime}`
      : defaultStudyEndAt(),
  )
  // 제출 페이로드(date/startTime/endTime)는 startAt/endAt에서 파생. date는 시작 일자 기준.
  const date = startAt.slice(0, 10)
  const startTime = startAt.slice(11, 16)
  const endTime = endAt.slice(11, 16)
  const [body, setBody] = useState(initial?.body ?? '')
  const { files, add, remove } = useFileUpload(initial?.files ?? [])
  const [touched, setTouched] = useState(false)
  // 새로 고른 파일만 올린다 — 기존 첨부(서버 저장분)는 file 이 없다.
  const uploadMutation = useUploadRecordAttachments()
  const uploadThen = async (id: string, done: () => void) => {
    const list = files.map((f) => f.file).filter((f): f is File => !!f)
    if (list.length > 0) {
      await uploadMutation.mutateAsync({ id, files: list }).catch(() => {})
    }
    done()
  }
  usePageHeader(c.title, c.sub)

  // 전체 일시로 비교 → 자정을 넘겨도 정확(예: 22:00~다음날 01:00은 정상).
  const timeError = !!startAt && !!endAt && endAt <= startAt
  // 증빙 파일 외 핵심 입력 — 임시저장 기준. 제출은 여기에 증빙 1개 이상이 더 필요.
  const baseValid = !!(
    title.trim() &&
    startAt &&
    endAt &&
    body.trim() &&
    !timeError
  )
  const valid = baseValid && files.length > 0

  const submit = () => {
    if (!valid) {
      setTouched(true)
      return
    }
    // 제출은 검토 중으로 전환(등록·수정 공통). 수정은 변경 반영.
    if (mode === 'edit') {
      updateMutation.mutate(
        { title, date, startTime, endTime, body, draft: false },
        {
          onSuccess: () =>
            uploadThen(recordId ?? '', () =>
              navigate('/student/records?toast=study-updated'),
            ),
        },
      )
      return
    }
    createMutation.mutate(
      {
        title,
        date,
        startTime,
        endTime,
        fileCount: files.length,
        draft: false,
      },
      {
        onSuccess: (created) =>
          uploadThen(created.id, () =>
            navigate('/student/records?toast=study-created'),
          ),
      },
    )
  }

  // 임시저장 — 증빙 없이도 저장(작성 중·본인만). 등록 또는 임시저장 기록 수정에서 사용.
  const saveDraft = () => {
    if (!baseValid) {
      setTouched(true)
      return
    }
    if (mode === 'edit') {
      updateMutation.mutate(
        { title, date, startTime, endTime, body, draft: true },
        {
          onSuccess: () =>
            uploadThen(recordId ?? '', () =>
              navigate('/student/records?toast=study-saved'),
            ),
        },
      )
      return
    }
    createMutation.mutate(
      { title, date, startTime, endTime, fileCount: files.length, draft: true },
      {
        onSuccess: (created) =>
          uploadThen(created.id, () =>
            navigate('/student/records?toast=study-saved'),
          ),
      },
    )
  }
  // 임시저장은 등록·수정(반려 재제출 포함) 어디서든 가능.
  const canSaveDraft = true

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    add(e.target.files)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5 p-8">
      <Crumbs items={c.crumbs} />

      {mode === 'edit' && !isDraft && initial?.rejectReason && (
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
        <FieldLabel required hint="시작·종료 일시(월/일 시각)를 선택">
          일정
        </FieldLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DateTimePicker
            mode="datetime"
            value={startAt}
            onChange={setStartAt}
            placeholder="시작 (월/일 시각)"
            ariaLabel="스터디 시작 일시"
            // 이미 한 활동을 적는 칸이다 — 아직 오지 않은 날은 고를 수 없다.
            max={오늘()}
          />
          <DateTimePicker
            mode="datetime"
            value={endAt}
            onChange={setEndAt}
            placeholder="종료 (월/일 시각)"
            ariaLabel="스터디 종료 일시"
            max={오늘()}
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
        <FieldLabel hint="제출 시 1개 이상 필요 · 임시저장은 증빙 없이 가능">
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
        note={
          valid
            ? '● 제출 가능'
            : baseValid
              ? '증빙 추가 시 제출 가능 · 지금은 임시저장'
              : undefined
        }
        submitLabel={c.submit}
        onSubmit={submit}
        disabled={
          !valid || createMutation.isPending || updateMutation.isPending
        }
        secondaryLabel={canSaveDraft ? '임시저장' : undefined}
        onSecondary={canSaveDraft ? saveDraft : undefined}
        secondaryDisabled={
          !baseValid || createMutation.isPending || updateMutation.isPending
        }
        footer={c.footer}
      />
    </div>
  )
}
