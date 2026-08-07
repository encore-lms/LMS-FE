import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { usePageHeader } from '@/shared/store'
import { CertHero } from '@/features/student/certificate/components/CertHero'
import { CertTabs } from '@/features/student/certificate/CertTabs'
import { SummaryTab } from '@/features/student/certificate/tabs/SummaryTab'
import { TechTab } from '@/features/student/certificate/tabs/TechTab'
import { ProjectsTab } from '@/features/student/certificate/tabs/ProjectsTab'
import { ProblemTab } from '@/features/student/certificate/tabs/ProblemTab'
import { GrowthTab } from '@/features/student/certificate/tabs/GrowthTab'
import { AiTab } from '@/features/student/certificate/tabs/AiTab'
import { CERT_V2 } from '@/features/student/certificate/config'
import {
  applyCertificateDemoStudent,
  getCertificateDemoStudent,
} from '@/features/student/certificate/demoStudents'
import { mockOverview } from '@/features/student/certificate/mocks'
import type { CertTab } from '@/features/student/certificate/types'
import { ApproveModal, ChangesRequestModal } from './ReviewModals'
import { useToast } from '@/components/ui/use-toast'
import {
  useCertReviewList,
  useCertifyCertificate,
  useRequestCertChanges,
  useStartCertReview,
} from './api'
import type { CompetencyCertStatus } from './types'

// 매니저 역량 증명서 상세 (/admin/certificates/:studentId) — 읽기 전용.
// 수강생이 보는 증명서와 같은 탭 구성을 그대로 띄운다 — 매니저가 보는 것과
// 실제 공개되는 것이 다르면 확인의 의미가 없다.
//
// 탭 전환은 이 화면 안에서 끝난다. 수강생용 CertPreview 를 쓰면 탭을 누를 때
// /student/certificate 로 튕겨 나가 매니저는 종합 요약밖에 못 본다.
//
// 이력서 탭은 뺐다 — 이력서는 로그인한 본인 것만 조회되는 API 라, 매니저가 열면
// 남의 증명서 자리에 자기 이력서가 뜬다.
const MANAGER_TABS: CertTab[] = [
  'summary',
  'tech',
  'projects',
  'problem-solving',
  'growth-reputation',
  ...(CERT_V2 ? (['ai-analysis'] as CertTab[]) : []),
]

// 지금은 데모 데이터다(?demo= 로 인물 지정). BE 가 붙으면 이 조립만 실제 조회로 바꾼다.

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

export default function CompetencyCertificateDetailPage() {
  const { studentId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<CertTab>('summary')
  const toast = useToast()

  const student = getCertificateDemoStudent(params.get('demo'))
  const cohortId = params.get('cohortId')
  // 상태·전이는 서버가 정본이다(2026-08-07, learning-service V51).
  const { data: reviewRows } = useCertReviewList(cohortId)
  const status: CompetencyCertStatus =
    reviewRows?.find((r) => r.studentUserId === studentId)?.status ?? 'data_ready'
  const startReview = useStartCertReview(cohortId)
  const requestChanges = useRequestCertChanges(cohortId)
  const certify = useCertifyCertificate(cohortId)
  const [modal, setModal] = useState<'approve' | 'changes' | null>(null)
  const data = useMemo(
    () => applyCertificateDemoStudent(mockOverview, student),
    [student],
  )

  usePageHeader(
    `${student.name} 역량 증명서`,
    '수강생에게 보이는 증명서를 그대로 확인합니다',
  )

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
        <span className="text-fg text-[15px] font-bold">{student.name}</span>
        <span className="text-fg-subtle text-[12px]">
          {student.cohortName} · {student.periodLabel}
        </span>
        <StatusBadge
          tone={STATUS_META[status].tone}
          label={STATUS_META[status].label}
        />
        {/* 실제 공개 전환은 수강생 본인이 한다 — 여기선 상태만 보여준다. */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-fg-subtle text-[12px]">
            수강생 ID {studentId.slice(0, 8)}
          </span>
          {/* 정식 인증 판단은 증명서를 본 자리에서 한다 — 예전에는 별도 '인증 검토 큐'로
              옮겨 가야 했다(2026-08-06 통합). */}
          {status === 'requested' && (
            <Button
              size="sm"
              disabled={startReview.isPending}
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
              <Button size="sm" onClick={() => setModal('approve')}>
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

      <CertHero header={data.header} status="certified" />
      <CertTabs active={tab} onChange={setTab} only={MANAGER_TABS} />

      {tab === 'summary' && (
        <SummaryTab
          s={data.summary}
          studentId={student.id}
          recommendations={data.growth.recommendations}
        />
      )}
      {tab === 'tech' && <TechTab studentId={student.id} />}
      {tab === 'projects' && <ProjectsTab p={data.projects} />}
      {tab === 'problem-solving' && <ProblemTab studentId={student.id} />}
      {tab === 'growth-reputation' && <GrowthTab g={data.growth} />}
      {tab === 'ai-analysis' && CERT_V2 && <AiTab studentId={student.id} />}

      <ApproveModal
        open={modal === 'approve'}
        onClose={() => setModal(null)}
        student={{ name: student.name, cohort: student.cohortName }}
        pending={certify.isPending}
        onSubmit={() =>
          certify.mutate(
            { studentId },
            {
              onSuccess: () => {
                toast.success('정식 인증을 승인했어요')
                setModal(null)
              },
              onError: () => toast.danger('승인하지 못했어요 · 잠시 후 다시 시도해 주세요'),
            },
          )
        }
      />
      <ChangesRequestModal
        open={modal === 'changes'}
        onClose={() => setModal(null)}
        student={{ name: student.name, cohort: student.cohortName }}
        pending={requestChanges.isPending}
        onSubmit={(comment) =>
          requestChanges.mutate(
            { studentId, body: { comment } },
            {
              onSuccess: () => {
                toast.success('보완 요청을 보냈어요 · 수강생에게 그대로 보입니다')
                setModal(null)
              },
              onError: () =>
                toast.danger('보완 요청을 보내지 못했어요 · 잠시 후 다시 시도해 주세요'),
            },
          )
        }
      />
    </div>
  )
}
