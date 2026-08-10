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

/**
 * 공개 payload 의 과정 문자열을 히어로가 쓰는 세 조각으로 나눈다.
 *
 * <p>`cohort` 는 "SK네트웍스 Family AI 캠프 34기" 처럼 과정명을 이미 품고 있고,
 * 히어로는 `courseName · cohortName` 으로 다시 이어 붙인다. 그대로 넘기면
 * "… 캠프 · … 캠프 34기" 가 되어 과정명이 두 번 나온다.</p>
 */
function splitCourse(student: PublicCertificatePayload['student']) {
  const [courseName = '', ...rest] = student.courseSummary.split(' · ')
  // 기수 칩에서는 앞의 과정명을 떼고 "34기" 만 남긴다.
  const cohortName = student.cohort.startsWith(courseName)
    ? student.cohort.slice(courseName.length).trim() || student.cohort
    : student.cohort
  return { courseName, cohortName, periodLabel: rest.join(' · ') }
}

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
          ...splitCourse(payload.student),
          certId: verificationId,
          isPublic: true,
          status: 'certified',
        }}
        status="certified"
      />

      <CertTabs active={tab} onChange={setTab} only={only} />

      {tab === 'summary' && (
        <SummaryTab s={mockOverview.summary} studentId={PUBLIC_STUDENT_ID} />
      )}

      {tab === 'projects' && <ProjectsTab p={mockOverview.projects} />}

      {tab === 'ai-analysis' && CERT_V2 && (
        <AiTab studentId={PUBLIC_STUDENT_ID} />
      )}

      {tab === 'growth-reputation' && (
        <DataBoundary
          isPending={score.isPending}
          isError={score.isError || !score.data}
          onRetry={() => void score.refetch()}
          skeleton={<TechTabSkeleton />}
          errorTitle="평가·추천을 불러오지 못했어요"
        >
          {score.data && (
            <GrowthTab g={mockOverview.growth} score={score.data} />
          )}
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
