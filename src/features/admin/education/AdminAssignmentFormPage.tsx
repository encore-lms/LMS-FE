import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useCourseConfig } from '../api/settings'
import { useCreateInstructorAssignment } from './api'

// 운영(매니저) 과제 등록 페이지 (/admin/education/assignments/new?course=&cohort=).
// 기존 과제 등록 모달을 페이지로 정합 — 강사 과제 생성 페이지와 동일한 중앙 정렬 카드 레이아웃.
export default function AdminAssignmentFormPage() {
  const [params] = useSearchParams()
  const courseId = params.get('course')
  const cohortId = params.get('cohort')
  const navigate = useNavigate()
  const toast = useToast()
  usePageHeader('과제 등록', '선택한 기수에 과제를 등록합니다 · 생성 즉시 공개')

  const backTo = `/admin/education?course=${courseId ?? ''}&cohort=${cohortId ?? ''}&tab=assignments`
  const { data: courseConfig } = useCourseConfig(courseId)
  const cohort = courseConfig?.cohorts?.find((c) => c.id === cohortId)
  const cohortLabel = cohort ? `${cohort.cohortNo}기` : '기수'
  const createA = useCreateInstructorAssignment()

  const [subject, setSubject] = useState('')
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('') // "YYYY-MM-DD HH:mm"
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState<string | undefined>(undefined)

  const onSave = () => {
    if (!cohortId) {
      toast.danger('대상 기수가 없어요 — 과제 탭에서 다시 진입해 주세요.')
      return
    }
    if (!title.trim()) {
      setTitleError('과제 제목을 입력해주세요')
      return
    }
    createA.mutate(
      {
        cohortId,
        subject: subject.trim() || undefined,
        title: title.trim(),
        dueAt: dueAt ? dueAt : undefined,
        description: description.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`과제 등록 — ${title.trim()} · 생성 즉시 공개`)
          navigate(backTo)
        },
        onError: () => toast.danger('과제 등록에 실패했어요'),
      },
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="bg-surface w-full rounded-xl p-6">
          <div className="flex flex-col gap-4">
            {/* 대상 기수(고정) — 과제 탭에서 진입한 기수 */}
            <label className="flex w-full flex-col gap-[6px]">
              <span className="text-fg text-[13px] font-bold">대상 기수</span>
              <div
                aria-label="대상 기수(고정)"
                className="border-border bg-surface-muted text-fg flex h-[52px] w-full items-center rounded-lg border px-3 text-sm"
              >
                {cohortLabel}
              </div>
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="과목/회차"
                placeholder="예: 백엔드 5회차"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Input
                label="과제 제목"
                required
                placeholder="예: JPA 연관관계 매핑 실습"
                error={titleError}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError) setTitleError(undefined)
                }}
              />
            </div>

            <DateTimePicker
              mode="datetime"
              label="마감일시"
              placeholder="2026-05-24 23:59"
              value={dueAt ? dueAt.replace(' ', 'T') : ''}
              onChange={(v) => setDueAt(v ? v.replace('T', ' ') : '')}
            />

            <label className="flex w-full flex-col gap-[6px]">
              <span className="text-fg text-[13px] font-bold">설명</span>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="과제 안내·제출 조건(최대 5,000자)"
                className="border-border focus:border-brand text-fg placeholder:text-fg-subtle w-full rounded-[10px] border-2 bg-white p-3 text-sm outline-none focus-visible:shadow-none"
              />
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(backTo)}
              >
                취소
              </Button>
              <Button onClick={onSave} disabled={createA.isPending}>
                {createA.isPending ? '등록 중…' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
