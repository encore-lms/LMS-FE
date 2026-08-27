import { useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { useStudentAccounts } from '@/shared/api'
import { usePageHeader } from '@/shared/store'
import { CertHero } from '@/features/student/certificate/components/CertHero'
import { CertTabs } from '@/features/student/certificate/CertTabs'
import {
  isCertificateAnalysisReady,
  useCertificateAnalysis,
} from '@/features/student/certificate/analysis'
import { CertificateSevenTabPanel } from '@/features/student/certificate/tabs/seven-tab/CertificateSevenTabPanel'
import type {
  CertHeader,
  CertStage,
  CertTab,
} from '@/features/student/certificate/types'
import { useCourseConfig } from '../api/settings'
import { ApproveModal, ChangesRequestModal } from './ReviewModals'
import {
  useCertReviewList,
  useCertifyCertificate,
  useRequestCertChanges,
  useStartCertReview,
} from './api'
import type { CompetencyCertStatus } from './types'

const STATUS_META: Record<
  CompetencyCertStatus,
  { label: string; tone: 'neutral' | 'warning' | 'info' | 'success' }
> = {
  cohort_open: { label: '기수 미종료', tone: 'neutral' },
  data_pending: { label: '데이터 미준비', tone: 'warning' },
  data_ready: { label: '데이터 준비', tone: 'info' },
  requested: { label: '인증 요청', tone: 'warning' },
  reviewing: { label: '검토 중', tone: 'info' },
  changes_requested: { label: '보완 요청', tone: 'warning' },
  certified: { label: '인증 완료', tone: 'success' },
}

function toStage(status: CompetencyCertStatus): CertStage {
  if (status === 'certified') return 'certified'
  if (status === 'changes_requested') return 'changes_requested'
  if (status === 'requested' || status === 'reviewing') return 'reviewing'
  return 'before'
}

export default function CompetencyCertificateDetailPage() {
  const { studentId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<CertTab>('summary')
  const [modal, setModal] = useState<'approve' | 'changes' | null>(null)
  const toast = useToast()
  const cohortId = params.get('cohortId')
  const courseId = params.get('courseId')

  const students = useStudentAccounts(cohortId)
  const course = useCourseConfig(courseId)
  const reviews = useCertReviewList(cohortId)
  const analysisTarget = { scope: 'admin', studentId } as const
  const analysis = useCertificateAnalysis(analysisTarget)
  const student = students.data?.items.find((item) => item.id === studentId)
  const cohort = course.data?.cohorts.find((item) => item.id === cohortId)
  const review = reviews.data?.find((item) => item.studentUserId === studentId)
  const status: CompetencyCertStatus = review?.status ?? 'cohort_open'
  const analysisReady = isCertificateAnalysisReady(analysis.data)

  const startReview = useStartCertReview(cohortId)
  const requestChanges = useRequestCertChanges(cohortId)
  const certify = useCertifyCertificate(cohortId)

  const analysisCohort = analysis.data?.tabs?.summary.payload.cohort
  const studentName = student?.name ?? '수강생'
  const cohortName = cohort
    ? `${cohort.cohortNo}기`
    : (analysisCohort?.cohortNo ?? '')
  const header: CertHeader = {
    studentName,
    courseName: course.data?.title ?? analysisCohort?.courseTitle ?? '',
    cohortName,
    periodLabel:
      cohort?.startDate && cohort?.endDate
        ? `${cohort.startDate} — ${cohort.endDate}`
        : analysisCohort
          ? `${analysisCohort.startsAt} — ${analysisCohort.endsAt}`
          : '',
    certId:
      analysis.data?.snapshot?.snapshotHash
        .replace(/^sha256:/, '')
        .slice(0, 12) ??
      analysis.data?.statusDetail.runId?.slice(0, 12) ??
      '',
    isPublic: review?.published ?? false,
  }

  usePageHeader(
    `${studentName} 역량 증명서`,
    '현재 원천 버전의 7개 탭과 심사 상태를 확인합니다',
  )

  const contextPending =
    students.isPending || (!!courseId && course.isPending) || reviews.isPending
  const contextError =
    students.isError || (!!courseId && course.isError) || reviews.isError

  return (
    <div className="flex flex-col gap-4 p-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="border-border text-fg inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-semibold"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          목록으로
        </button>
        <span className="text-fg text-[15px] font-bold">{studentName}</span>
        {cohortName && (
          <span className="text-fg-subtle text-[12px]">{cohortName}</span>
        )}
        <StatusBadge
          tone={STATUS_META[status].tone}
          label={STATUS_META[status].label}
        />

        <div className="ml-auto flex items-center gap-2">
          <span className="text-fg-subtle text-[12px]">
            수강생 ID {studentId.slice(0, 8)}
          </span>
          {status === 'requested' && (
            <Button
              size="sm"
              disabled={!analysisReady || startReview.isPending}
              title={
                analysisReady
                  ? undefined
                  : '7개 탭이 모두 준비되어야 검토를 시작할 수 있습니다.'
              }
              onClick={() => startReview.mutate({ studentId })}
            >
              검토 시작
            </Button>
          )}
          {status === 'reviewing' && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setModal('changes')}
              >
                보완 요청
              </Button>
              <Button
                size="sm"
                disabled={!analysisReady}
                title={
                  analysisReady
                    ? undefined
                    : '7개 탭이 모두 준비되어야 승인할 수 있습니다.'
                }
                onClick={() => setModal('approve')}
              >
                정식 인증 승인
              </Button>
            </>
          )}
          {status === 'changes_requested' && (
            <span className="text-fg-subtle text-[12px]">
              수강생 재요청 대기 중
            </span>
          )}
        </div>
      </div>

      <DataBoundary
        isPending={contextPending}
        isError={contextError}
        onRetry={() => {
          void students.refetch()
          void course.refetch()
          void reviews.refetch()
        }}
        errorTitle="증명서 심사 정보를 불러오지 못했어요"
      >
        {!student ? (
          <Empty
            icon={<ShieldCheck />}
            title="수강생을 찾지 못했어요"
            description="선택한 기수의 실제 수강생 명단을 다시 확인해 주세요."
          />
        ) : analysisReady ? (
          <>
            <CertHero header={header} status={toStage(status)} />
            <CertTabs active={tab} onChange={setTab} />
            <CertificateSevenTabPanel active={tab} target={analysisTarget} />
          </>
        ) : (
          <CertificateSevenTabPanel active="summary" target={analysisTarget} />
        )}
      </DataBoundary>

      {student && (
        <>
          <ApproveModal
            open={modal === 'approve'}
            onClose={() => setModal(null)}
            student={{ name: student.name, cohort: cohortName }}
            analysis={{
              sourceVersion: analysis.data?.sourceVersion ?? null,
              analysisVersion: analysis.data?.analysisVersion ?? null,
              runId: analysis.data?.statusDetail.runId ?? null,
            }}
            pending={certify.isPending}
            onSubmit={() =>
              certify.mutate(
                { studentId },
                {
                  onSuccess: () => {
                    toast.success('정식 인증을 승인했어요')
                    setModal(null)
                  },
                  onError: () =>
                    toast.danger(
                      '승인하지 못했어요 · 잠시 후 다시 시도해 주세요',
                    ),
                },
              )
            }
          />
          <ChangesRequestModal
            open={modal === 'changes'}
            onClose={() => setModal(null)}
            student={{ name: student.name, cohort: cohortName }}
            pending={requestChanges.isPending}
            onSubmit={(comment) =>
              requestChanges.mutate(
                { studentId, body: { comment } },
                {
                  onSuccess: () => {
                    toast.success(
                      '보완 요청을 보냈어요 · 수강생에게 그대로 보입니다',
                    )
                    setModal(null)
                  },
                  onError: () =>
                    toast.danger(
                      '보완 요청을 보내지 못했어요 · 잠시 후 다시 시도해 주세요',
                    ),
                },
              )
            }
          />
        </>
      )}
    </div>
  )
}
