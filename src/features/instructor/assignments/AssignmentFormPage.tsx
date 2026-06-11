import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useAssignmentDetail } from '../api/assignments'
import { assignmentSchema, type AssignmentInput } from './assignment.schema'

const COHORT_OPTIONS = ['DA 3기']

const MAX_URLS = 5
const MAX_FILES = 5

// 생성 정책 (Figma 2750:1667) — 폼 우측 고정 안내.
const POLICY_NOTES = [
  '생성 즉시 공개',
  '대상은 기수 전체만 가능',
  '공개 후 수정 알림 없음',
  '생성/수정 후 상세 화면 이동',
]

// 과제·실습 생성/수정 (/instructor/assignments/new · /:assignmentId) — P0 30. (Figma 2750:1547)
// 첨부 자료는 URL 최대 5개 · 파일당 20MB·최대 5개. 점수/채점 정책 없음.
export default function AssignmentFormPage() {
  const { assignmentId } = useParams()
  const isEdit = !!assignmentId
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useAssignmentDetail(
    assignmentId ?? null,
  )
  const [urls, setUrls] = useState<string[]>([])
  const [files, setFiles] = useState<string[]>([])
  usePageHeader(
    isEdit ? '과제·실습 수정' : '과제·실습 생성',
    '기수 전체 대상 과제 정보를 작성하고 URL·파일 자료를 첨부합니다',
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { cohortLabel: COHORT_OPTIONS[0] },
  })

  // 수정 모드 — 상세 도착 시 폼·첨부 자료 동기화.
  useEffect(() => {
    if (!data) return
    reset({
      cohortLabel: data.cohortLabel,
      subject: data.subject,
      title: data.title,
      dueAt: data.dueAt,
      description: data.description,
    })
    setUrls(data.urls)
    setFiles(data.files)
  }, [data, reset])

  if (isEdit && isPending) {
    return <div className="text-fg-muted p-8">과제 정보를 불러오는 중…</div>
  }
  if (isEdit && (isError || !data)) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="과제 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const onSave = handleSubmit((input) => {
    toast.success(`${input.title} 저장 — 생성 즉시 공개 (mock)`)
    // 생성 정책: 생성/수정 후 상세 화면 이동.
    navigate(`/instructor/assignments/${assignmentId ?? 'assign-jpa-mapping'}`)
  })

  return (
    <div className="p-8">
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_336px]">
        {/* 과제 폼 */}
        <form
          onSubmit={onSave}
          className="border-border bg-surface rounded-xl border p-6"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex w-full flex-col gap-[6px]">
              <span className="text-fg text-[13px] font-bold">
                기수 <span className="text-danger">*</span>
              </span>
              <select
                aria-label="기수"
                className="border-border focus:border-brand text-fg h-[52px] rounded-[10px] border-2 bg-white px-4 text-[15px] font-medium outline-none"
                {...register('cohortLabel')}
              >
                {COHORT_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="과목/회차"
              required
              placeholder="백엔드 5회차"
              error={errors.subject?.message}
              {...register('subject')}
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Input
              label="과제 제목"
              required
              placeholder="JPA 연관관계 매핑 실습"
              error={errors.title?.message}
              {...register('title')}
            />
            <Input
              label="마감일시"
              required
              placeholder="2026-05-24 23:59"
              error={errors.dueAt?.message}
              {...register('dueAt')}
            />
          </div>
          <label className="mt-4 flex w-full flex-col gap-[6px]">
            <span className="text-fg text-[13px] font-bold">설명</span>
            <textarea
              rows={5}
              placeholder="과제 설명은 최대 5,000자까지 입력합니다. 제출은 텍스트, URL, 파일 중 하나 이상이면 가능합니다."
              className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none"
              {...register('description')}
            />
            {errors.description && (
              <span className="text-danger text-xs">
                {errors.description.message}
              </span>
            )}
          </label>

          {/* 첨부 자료 */}
          <div className="mt-6">
            <p className="text-fg text-[13px] font-bold">첨부 자료</p>
            <div className="mt-2 flex gap-2">
              <span className="border-border bg-surface-muted text-fg-muted inline-flex rounded-lg border px-3.5 py-1.5 text-xs font-semibold">
                URL 최대 {MAX_URLS}개
              </span>
              <span className="border-border bg-surface-muted text-fg-muted inline-flex rounded-lg border px-3.5 py-1.5 text-xs font-semibold">
                파일당 20MB · 최대 {MAX_FILES}개
              </span>
            </div>
            {urls.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {urls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={url}
                      onChange={(e) =>
                        setUrls((prev) =>
                          prev.map((u, j) => (j === i ? e.target.value : u)),
                        )
                      }
                      placeholder="https://"
                      aria-label={`첨부 URL ${i + 1}`}
                      className="border-border focus:border-brand text-fg placeholder:text-fg-subtle h-10 w-full rounded-[10px] border-2 bg-white px-3 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setUrls((prev) => prev.filter((_, j) => j !== i))
                      }
                      aria-label={`첨부 URL ${i + 1} 제거`}
                      className="text-fg-subtle hover:text-fg hover:bg-surface-muted rounded-md p-1.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((f) => (
                  <span
                    key={f}
                    className="border-border bg-surface-muted text-fg-muted inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() =>
                        setFiles((prev) => prev.filter((x) => x !== f))
                      }
                      aria-label={`${f} 제거`}
                      className="text-fg-subtle hover:text-fg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={urls.length >= MAX_URLS}
                onClick={() => setUrls((prev) => [...prev, ''])}
                className="border-border text-fg hover:bg-surface-muted flex h-10 items-center gap-1 rounded-[10px] border px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> URL 추가
              </button>
              <button
                type="button"
                disabled={files.length >= MAX_FILES}
                onClick={() =>
                  toast.info('파일 업로드는 백엔드 연동 후 제공 (mock)')
                }
                className="border-border text-fg hover:bg-surface-muted flex h-10 items-center gap-1 rounded-[10px] border px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" /> 파일 추가
              </button>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-8 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-10 text-sm"
              onClick={() => navigate('/instructor/assignments')}
            >
              취소
            </Button>
            <Button type="submit" className="h-10 text-sm">
              저장
            </Button>
          </div>
        </form>

        {/* 생성 정책 패널 */}
        <aside className="border-border bg-surface rounded-xl border p-6">
          <p className="text-fg text-base font-bold">생성 정책</p>
          <ul className="mt-4 flex flex-col gap-3">
            {POLICY_NOTES.map((note) => (
              <li key={note} className="text-fg-muted text-sm">
                - {note}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
