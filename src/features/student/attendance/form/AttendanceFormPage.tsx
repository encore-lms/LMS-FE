import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { usePageHeader } from '@/shared/store'
import type { AttendanceFormPayload, AttendanceFormSubmission } from '../types'
import {
  useAttendanceFormMeta,
  useSubmitAttendanceForm,
} from '../../api/attendance'
import { InfoBanner } from '../components/InfoBanner'
import {
  attendanceFormSchema,
  ATTENDANCE_FORM_DEFAULTS,
  type AttendanceFormValues,
} from './attendanceFormSchema'
import { OverwriteWarningBanner } from './OverwriteWarningBanner'
import { FormMetaRow } from './FormMetaRow'
import { FormStepCard } from './FormStepCard'
import { AttendanceFormFooter } from './AttendanceFormFooter'
import { SubmitSuccessCard } from './SubmitSuccessCard'
import { AttendanceTypeStep } from './steps/AttendanceTypeStep'
import { OfficialLeaveStep } from './steps/OfficialLeaveStep'
import { EvidenceUploadStep } from './steps/EvidenceUploadStep'
import { NoteStep } from './steps/NoteStep'

// 폼 값 → 제출 페이로드. 선택한 유형에 해당하는 조건부 필드만 담고, 공가 미사용 시 공가 필드는 비운다.
function toPayload(values: AttendanceFormValues): AttendanceFormPayload {
  const payload: AttendanceFormPayload = {
    attendanceType: values.attendanceType,
    officialLeaveUsed: values.officialLeaveUsed,
    officialLeaveType: values.officialLeaveUsed
      ? values.officialLeaveType
      : null,
    officialLeaveOtherReason:
      values.officialLeaveUsed && values.officialLeaveType === 'OTHER'
        ? values.officialLeaveOtherReason
        : null,
    note: values.note ? values.note : null,
  }
  if (values.attendanceType === 'LATE') {
    payload.expectedArrivalTime = values.expectedArrivalTime
  }
  if (values.attendanceType === 'EARLY_LEAVE') {
    payload.expectedLeaveTime = values.expectedLeaveTime
  }
  if (values.attendanceType === 'OUTING') {
    payload.outingStartTime = values.outingStartTime
    payload.outingEndTime = values.outingEndTime
  }
  return payload
}

/**
 * 출결 폼 작성 (/student/attendance/form) — STUDENT 전용(라우터 가드).
 * 화면 타이틀/설명은 공유 헤더(usePageHeader)에 주입. 4스텝(유형·공가·증빙·비고) + 덮어쓰기 경고 + 성공 카드.
 * 폼 상태는 RHF + Zod(조건부 필수). 데이터/상태만 여기서 다루고 각 영역은 자식 컴포넌트가 그린다.
 */
export default function AttendanceFormPage() {
  const navigate = useNavigate()
  const { data: meta, isPending, isError, refetch } = useAttendanceFormMeta()
  const submitMutation = useSubmitAttendanceForm()
  const uploadAttachments = useUploadAttendanceAttachments()
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitted, setSubmitted] = useState<AttendanceFormSubmission | null>(
    null,
  )
  usePageHeader('출결 폼 작성')

  // 예상 입실 시간 기본값 = 현재 시각(HH:MM). 수강생이 이후 자유롭게 변경 가능.
  const now = new Date()
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`
  const methods = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      ...ATTENDANCE_FORM_DEFAULTS,
      expectedArrivalTime: nowTime,
    },
  })

  const onSubmit = methods.handleSubmit((values) => {
    submitMutation.mutate(toPayload(values), {
      onSuccess: (submission) => {
        setSubmitted(submission)
        // 증빙은 제출이 만들어진 뒤에야 붙일 수 있다(첨부는 제출 id에 매인다).
        if (attachments.length > 0 && submission?.id) {
          uploadAttachments.mutate({ id: submission.id, files: attachments })
        }
      },
    })
  })

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
      loadingText="출결 폼을 불러오는 중…"
      errorTitle="출결 폼을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {meta &&
        (submitted ? (
          <div className="flex flex-col gap-6 p-8">
            <SubmitSuccessCard
              submission={submitted}
              onHome={() => navigate('/student/attendance')}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-8">
            {meta.latestSubmission && (
              <OverwriteWarningBanner latest={meta.latestSubmission} />
            )}
            <FormMetaRow meta={meta} />
            {submitMutation.isError && (
              <InfoBanner tone="warning" title="제출에 실패했습니다">
                잠시 후 다시 시도해 주세요.
              </InfoBanner>
            )}
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} className="flex flex-col gap-6">
                <FormStepCard step={1} title="출결 유형" badge="required">
                  <AttendanceTypeStep />
                </FormStepCard>
                <FormStepCard step={2} title="공가 사용" badge="toggle">
                  <OfficialLeaveStep />
                </FormStepCard>
                <FormStepCard step={3} title="증빙 첨부" badge="recommended">
                  <EvidenceUploadStep
                    files={attachments}
                    onChange={setAttachments}
                  />
                </FormStepCard>
                <NoteStep />
                <AttendanceFormFooter
                  onCancel={() => navigate('/student/attendance')}
                  submitting={submitMutation.isPending}
                />
              </form>
            </FormProvider>
          </div>
        ))}
    </DataBoundary>
  )
}
