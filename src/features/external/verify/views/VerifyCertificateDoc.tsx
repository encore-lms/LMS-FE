import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { CertHero } from '@/features/student/certificate/components/CertHero'
import { CertTabs } from '@/features/student/certificate/CertTabs'
import {
  fetchCertificateDetailTabs,
  fetchCertificateScore,
} from '@/features/student/certificate/ai'
import { SummaryTab } from '@/features/student/certificate/tabs/SummaryTab'
import { TechTabContent } from '@/features/student/certificate/tabs/TechTab'
import { ProblemTabContent } from '@/features/student/certificate/tabs/ProblemTab'
import { ProjectsTab } from '@/features/student/certificate/tabs/ProjectsTab'
import { GrowthTab } from '@/features/student/certificate/tabs/GrowthTab'
import { AiTab } from '@/features/student/certificate/tabs/AiTab'
import {
  ProblemTabSkeleton,
  TechTabSkeleton,
} from '@/features/student/certificate/tabs/TabSkeletons'
import { mockOverview } from '@/features/student/certificate/mocks'
import { CERT_V2 } from '@/features/student/certificate/config'
import type { CertTab } from '@/features/student/certificate/types'
import type { PublicCertificatePayload } from '../types'

/**
 * 공개 검증에 보여줄 증명서 본문.
 *
 * <p>수강생 미리보기(/student/certificate)와 <b>같은 히어로·탭·탭 콘텐츠</b>를 쓴다.
 * 화면을 따로 그리면 두 곳이 갈라지고, 검증자는 본인이 보여준 것과 다른 문서를 보게 된다.</p>
 *
 * <p>공개 범위만 다르다.</p>
 * <ul>
 *   <li><b>이력서 제외</b> — 전화번호·생년월일·이메일이 들어 있다. 링크만 알면 누구나 여는 페이지다.</li>
 *   <li><b>평가·추천</b> — 수강생이 공개 설정에서 켰을 때만(peerReputationPublic).</li>
 * </ul>
 */

const PUBLIC_STUDENT_ID = 'verify-public'

export function VerifyCertificateDoc({
  payload,
  verificationId,
}: {
  payload: PublicCertificatePayload
  verificationId: string
}) {
  const [tab, setTab] = useState<CertTab>('summary')

  // 이력서는 공개 대상이 아니고, 평가·추천은 수강생이 켠 경우에만 연다.
  const only: CertTab[] = [
    'summary',
    'tech',
    'projects',
    'problem-solving',
    ...(payload.peerReputationPublic
      ? (['growth-reputation'] as CertTab[])
      : []),
    ...(CERT_V2 ? (['ai-analysis'] as CertTab[]) : []),
  ]

  const detail = useQuery({
    queryKey: ['verifyCertificateDetail', PUBLIC_STUDENT_ID],
    queryFn: () => fetchCertificateDetailTabs(PUBLIC_STUDENT_ID),
    enabled: tab === 'tech' || tab === 'problem-solving',
  })
  const score = useQuery({
    queryKey: ['verifyCertificateScore', PUBLIC_STUDENT_ID],
    queryFn: () => fetchCertificateScore(PUBLIC_STUDENT_ID),
    enabled: tab === 'growth-reputation',
  })

  return (
    <div className="flex flex-col gap-5">
      <CertHero
        header={{
          studentName: payload.student.nameKo,
          courseName: payload.student.courseSummary.split(' · ')[0],
          cohortName: payload.student.cohort,
          periodLabel: payload.student.courseSummary
            .split(' · ')
            .slice(1)
            .join(' · '),
          certId: verificationId,
          isPublic: true,
          status: 'certified',
        }}
        status="certified"
      />

      <CertTabs active={tab} onChange={setTab} only={only} />

      {tab === 'summary' && <SummaryTab s={mockOverview.summary} studentId={PUBLIC_STUDENT_ID} />}

      {tab === 'projects' && <ProjectsTab p={mockOverview.projects} />}

      {tab === 'ai-analysis' && CERT_V2 && <AiTab studentId={PUBLIC_STUDENT_ID} />}

      {tab === 'growth-reputation' && (
        <DataBoundary
          isPending={score.isPending}
          isError={score.isError || !score.data}
          onRetry={() => void score.refetch()}
          skeleton={<TechTabSkeleton />}
          errorTitle="평가·추천을 불러오지 못했어요"
        >
          {score.data && <GrowthTab g={mockOverview.growth} score={score.data} />}
        </DataBoundary>
      )}

      {(tab === 'tech' || tab === 'problem-solving') && (
        <DataBoundary
          isPending={detail.isPending}
          isError={detail.isError || !detail.data}
          onRetry={() => void detail.refetch()}
          skeleton={
            tab === 'tech' ? <TechTabSkeleton /> : <ProblemTabSkeleton />
          }
          errorTitle="증명서 상세를 불러오지 못했어요"
        >
          {detail.data &&
            (tab === 'tech' ? (
              <TechTabContent tech={detail.data.tech} />
            ) : (
              <ProblemTabContent problem={detail.data.problem} />
            ))}
        </DataBoundary>
      )}
    </div>
  )
}
