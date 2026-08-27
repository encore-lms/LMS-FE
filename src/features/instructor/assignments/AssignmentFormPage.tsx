import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Download, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/use-toast'
import { URL_FORMAT_MESSAGE, isHttpUrl } from '@/shared/lib/url'
import { usePageHeader } from '@/shared/store'
import { apiClient } from '@/shared/api'
import type { AssignmentFileRef } from '@/shared/types'
import {
  useAssignmentCohortOptions,
  useAssignmentDetail,
  useDeleteAssignmentFile,
  useSaveAssignment,
  useUploadAssignmentFile,
} from '../api/assignments'
import { assignmentSchema, type AssignmentInput } from './assignment.schema'

const MAX_URLS = 5
const MAX_FILES = 5
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

// 과제·실습 생성/수정 — 강사(/instructor/assignments/*)·운영(/admin/education/assignments/*) 공용 폼.
// 첨부 자료는 URL 최대 5개 · 파일당 20MB·최대 5개. 점수/채점 정책 없음.
export default function AssignmentFormPage() {
  const { assignmentId } = useParams()
  const isEdit = !!assignmentId
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 진입 컨텍스트 — 강사 허브(cohortId) 또는 운영 허브(course+cohort). 둘 다 지원(공용 폼).
  // 저장·취소 시 진입한 허브 과제 탭으로 복귀하고, 생성 시 대상 기수를 고정한다.
  const cohortIdParam = searchParams.get('cohortId')
  const courseParam = searchParams.get('course')
  const cohortParam = searchParams.get('cohort')
  const isAdminCtx = !!(courseParam || cohortParam)
  const fromCohortId = cohortIdParam ?? cohortParam
  // 운영 허브는 기수를 경로로 받는다(/admin/education/{cohortId}) — 쿼리로 넘기면
  // 기수 목록이 잡아 허브가 아니라 목록으로 떨어졌다(2026-08-06 QA). 기수를 모르면 목록으로.
  const backTo = isAdminCtx
    ? cohortParam
      ? `/admin/education/${cohortParam}?tab=assignments`
      : '/admin/education'
    : fromCohortId
      ? `/instructor/cohorts/${fromCohortId}/education?tab=assignments`
      : '/instructor/assignments'
  const lockCohortId = isEdit ? null : fromCohortId
  const toast = useToast()
  const { data, isPending, isError, refetch } = useAssignmentDetail(
    assignmentId ?? null,
  )
  const { data: cohortOptions } = useAssignmentCohortOptions()
  const saveAssignment = useSaveAssignment(assignmentId)
  const uploadFile = useUploadAssignmentFile()
  const deleteFile = useDeleteAssignmentFile()
  const [urls, setUrls] = useState<string[]>([])
  // 기존 업로드된 파일(상세에서), 새로 고른 파일(저장 후 업로드), 삭제 예정 파일 id
  const [existingFiles, setExistingFiles] = useState<AssignmentFileRef[]>([])
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [removedFileIds, setRemovedFileIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const visibleExisting = existingFiles.filter(
    (f) => !removedFileIds.includes(f.id),
  )
  const fileCount = visibleExisting.length + stagedFiles.length
  usePageHeader(
    isEdit ? '과제·실습 수정' : '과제·실습 생성',
    '기수 전체 대상 과제 정보를 작성하고 URL·파일 자료를 첨부합니다',
  )

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    // dueAt 은 Controller(DateTimePicker)라 빈 문자열로 초기화 → 미입력 시 min(1) 메시지 노출
    defaultValues: { cohortId: '', dueAt: '' },
  })

  // 생성 모드 — 허브 진입이면 그 기수로 고정, 아니면 기수 옵션 로드 시 첫 기수 기본 선택.
  useEffect(() => {
    if (isEdit) return
    if (lockCohortId) {
      setValue('cohortId', lockCohortId)
      return
    }
    if (cohortOptions && cohortOptions.length > 0 && !getValues('cohortId')) {
      setValue('cohortId', cohortOptions[0].cohortId)
    }
  }, [isEdit, lockCohortId, cohortOptions, getValues, setValue])

  // 수정 모드 — 상세 도착 시 폼·첨부 자료 동기화.
  useEffect(() => {
    if (!data) return
    reset({
      cohortId: data.cohortId,
      title: data.title,
      dueAt: data.dueAt,
      description: data.description ?? '',
    })
    setUrls(data.urls)
    setExistingFiles(data.files)
    setStagedFiles([])
    setRemovedFileIds([])
  }, [data, reset])

  // 파일 선택 — 20MB 초과·최대 개수 초과는 제외하고 스테이징.
  const onPickFiles = (list: FileList | null) => {
    if (!list) return
    let remaining = MAX_FILES - fileCount
    const accepted: File[] = []
    for (const file of Array.from(list)) {
      if (remaining <= 0) {
        toast.warning(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`)
        break
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name}은(는) 20MB를 초과해 제외했습니다.`)
        continue
      }
      accepted.push(file)
      remaining -= 1
    }
    if (accepted.length > 0) setStagedFiles((prev) => [...prev, ...accepted])
  }

  // 기존 파일 다운로드(인증 blob).
  const downloadFile = async (f: AssignmentFileRef) => {
    try {
      const blob = await apiClient.getBlob(f.downloadUrl)
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = f.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(href)
    } catch {
      toast.danger('파일을 내려받지 못했어요')
    }
  }

  const saving =
    saveAssignment.isPending || uploadFile.isPending || deleteFile.isPending

  const onSave = handleSubmit(async (input) => {
    const links = urls.map((u) => u.trim()).filter(Boolean)
    if (links.some((u) => !isHttpUrl(u))) {
      toast.danger(`참고 링크: ${URL_FORMAT_MESSAGE}`)
      return
    }
    try {
      const saved = await saveAssignment.mutateAsync({
        cohortId: input.cohortId,
        title: input.title,
        dueAt: input.dueAt,
        description: input.description,
        urls: links,
      })
      const id = assignmentId ?? saved.id
      // 삭제 예정 파일 제거 → 새 파일 업로드(실 id 확보 후).
      for (const fileId of removedFileIds) {
        await deleteFile.mutateAsync({ assignmentId: id, fileId })
      }
      for (const file of stagedFiles) {
        await uploadFile.mutateAsync({ assignmentId: id, file })
      }
      toast.success(`${input.title} 저장 — 생성 즉시 공개`)
      // 허브 진입이면 허브 과제 탭으로 복귀, 아니면 생성/수정 후 상세 화면 이동(기존 정책).
      if (fromCohortId) navigate(backTo)
      else navigate(`/instructor/assignments/${id}`)
    } catch {
      toast.danger('저장에 실패했어요')
    }
  })

  return (
    <DataBoundary
      isPending={isEdit && isPending}
      isError={isEdit && (isError || !data)}
      onRetry={() => refetch()}
      loadingText="과제 정보를 불러오는 중…"
      errorTitle="과제 정보를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      <div className="p-8">
        <div className="mx-auto w-full max-w-4xl">
          {/* 과제 폼 */}
          <form
            onSubmit={onSave}
            className="bg-surface w-full rounded-xl p-6"
          >
            <div>
              <label className="flex w-full flex-col gap-[6px]">
                <span className="text-fg text-[13px] font-bold">
                  기수 <span className="text-danger">*</span>
                </span>
                {/* 허브 진입 시 대상 기수 고정(읽기 전용), 아니면 선택. */}
                {lockCohortId ? (
                  <div
                    aria-label="기수(고정)"
                    className="border-border bg-surface-muted text-fg flex h-[52px] w-full items-center rounded-lg border px-3 text-sm"
                  >
                    {cohortOptions?.find((c) => c.cohortId === lockCohortId)
                      ?.label ?? '기수 고정'}
                  </div>
                ) : (
                  /* RHF register는 name/ref 스프레드라 공용 Select와 호환 불가 → dueAt처럼 Controller로 연결 */
                  <Controller
                    control={control}
                    name="cohortId"
                    render={({ field }) => (
                      <Select
                        aria-label="기수"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        options={(cohortOptions ?? []).map((c) => ({
                          value: c.cohortId,
                          label: c.label,
                        }))}
                        placeholder="기수 없음"
                        className="h-[52px]"
                      />
                    )}
                  />
                )}
              </label>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Input
                label="과제 제목"
                required
                placeholder="JPA 연관관계 매핑 실습"
                error={errors.title?.message}
                {...register('title')}
              />
              {/* 마감일시 — 공용 DateTimePicker(datetime). 저장값 "YYYY-MM-DD HH:mm"(공백) ↔ picker 'T' 변환 */}
              <Controller
                control={control}
                name="dueAt"
                render={({ field }) => (
                  <DateTimePicker
                    mode="datetime"
                    label="마감일시"
                    required
                    placeholder="2026-05-24 23:59"
                    error={errors.dueAt?.message}
                    value={field.value ? field.value.replace(' ', 'T') : ''}
                    onChange={(v) =>
                      field.onChange(v ? v.replace('T', ' ') : '')
                    }
                  />
                )}
              />
            </div>
            <label className="mt-4 flex w-full flex-col gap-[6px]">
              <span className="text-fg text-[13px] font-bold">설명</span>
              <textarea
                rows={5}
                placeholder="과제 설명은 최대 5,000자까지 입력합니다. 제출은 텍스트, URL, 파일 중 하나 이상이면 가능합니다."
                className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none focus-visible:shadow-none"
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
                <span className="bg-surface-muted text-fg-muted inline-flex rounded-lg px-3.5 py-1.5 text-xs font-semibold">
                  URL 최대 {MAX_URLS}개
                </span>
                <span className="bg-surface-muted text-fg-muted inline-flex rounded-lg px-3.5 py-1.5 text-xs font-semibold">
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
                        className="border-border focus:border-brand text-fg placeholder:text-fg-subtle h-10 w-full rounded-[10px] border-2 bg-white px-3 text-sm outline-none focus-visible:shadow-none"
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
              {(visibleExisting.length > 0 || stagedFiles.length > 0) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleExisting.map((f) => (
                    <span
                      key={f.id}
                      className="bg-surface-muted text-fg-muted inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                      <button
                        type="button"
                        onClick={() => downloadFile(f)}
                        aria-label={`${f.name} 다운로드`}
                        className="text-fg-muted hover:text-brand inline-flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {f.name}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setRemovedFileIds((prev) => [...prev, f.id])
                        }
                        aria-label={`${f.name} 제거`}
                        className="text-fg-subtle hover:text-fg"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                  {stagedFiles.map((file, i) => (
                    <span
                      key={`staged-${i}`}
                      className="bg-brand/10 text-brand inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                      {file.name}
                      <span className="text-brand/70 text-[10px] font-semibold">
                        새 파일
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setStagedFiles((prev) =>
                            prev.filter((_, j) => j !== i),
                          )
                        }
                        aria-label={`${file.name} 제거`}
                        className="text-brand/70 hover:text-brand"
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
                  disabled={fileCount >= MAX_FILES}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-border text-fg hover:bg-surface-muted flex h-10 items-center gap-1 rounded-[10px] border px-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" /> 파일 추가
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    onPickFiles(e.target.files)
                    e.target.value = '' // 같은 파일 재선택 허용
                  }}
                />
              </div>
            </div>

            {/* 푸터 */}
            <div className="mt-8 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(backTo)}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '저장 중…' : '저장'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DataBoundary>
  )
}
