import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import {
  fetchCertificateDetailTabs,
  fetchCertificateScore,
} from '@/features/student/certificate/ai'
import { TechTabContent } from '@/features/student/certificate/tabs/TechTab'
import { ProblemTabContent } from '@/features/student/certificate/tabs/ProblemTab'
import { ProjectsTab } from '@/features/student/certificate/tabs/ProjectsTab'
import { GrowthTab } from '@/features/student/certificate/tabs/GrowthTab'
import {
  ProblemTabSkeleton,
  ProjectsTabSkeleton,
  TechTabSkeleton,
} from '@/features/student/certificate/tabs/TabSkeletons'
import { mockOverview } from '@/features/student/certificate/mocks'
import type { PublicCertificatePayload } from '../types'

/**
 * 공개 검증 페이지의 증명서 탭.
 *
 * <p>수강생 미리보기(/student/certificate)와 <b>같은 탭 컴포넌트</b>를 그대로 쓴다.
 * 화면을 따로 그리면 두 곳이 갈라지고, 검증자는 본인이 보여준 것과 다른 문서를 보게 된다.</p>
 *
 * <p>공개 범위는 미리보기와 다르다.</p>
 * <ul>
 *   <li><b>이력서 제외</b> — 전화번호·생년월일·이메일이 들어 있다. 링크만 알면 누구나 여는 페이지다.</li>
 *   <li><b>평가·추천</b> — 수강생이 공개 설정에서 켰을 때만(peerReputationPublic).</li>
 *   <li>AI 분석 제외 — 해석은 본인 학습용이지 검증 대상이 아니다.</li>
 * </ul>
 */

type PublicTab = 'tech' | 'projects' | 'problem' | 'growth'

const CERTIFICATE_PUBLIC_STUDENT_ID = 'verify-public'

export function VerifyCertificateTabs({
  payload,
}: {
  payload: PublicCertificatePayload
}) {
  const tabs: { key: PublicTab; label: string }[] = [
    { key: 'tech', label: '기술·검증' },
    { key: 'projects', label: '프로젝트' },
    { key: 'problem', label: '문제해결' },
    ...(payload.peerReputationPublic
      ? [{ key: 'growth' as const, label: '평가·추천' }]
      : []),
  ]
  const [active, setActive] = useState<PublicTab>('tech')

  const detail = useQuery({
    queryKey: ['verifyCertificateDetail', CERTIFICATE_PUBLIC_STUDENT_ID],
    queryFn: () => fetchCertificateDetailTabs(CERTIFICATE_PUBLIC_STUDENT_ID),
  })
  const score = useQuery({
    queryKey: ['verifyCertificateScore', CERTIFICATE_PUBLIC_STUDENT_ID],
    queryFn: () => fetchCertificateScore(CERTIFICATE_PUBLIC_STUDENT_ID),
    enabled: active === 'growth',
  })

  return (
    <section className="flex flex-col gap-4">
      {/* 탭 바 — 미리보기(CertTabs)와 같은 모양. 최소 폭 아래로는 가로 스크롤. */}
      <nav className="bg-surface flex w-full gap-1 overflow-x-auto rounded-[14px] p-1.5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              'min-w-fit flex-1 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap',
              t.key === active
                ? 'bg-brand/10 text-brand'
                : 'text-fg-muted hover:bg-surface-muted',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {active === 'projects' ? (
        <DataBoundary
          isPending={false}
          isError={false}
          skeleton={<ProjectsTabSkeleton />}
        >
          <ProjectsTab p={mockOverview.projects} />
        </DataBoundary>
      ) : active === 'growth' ? (
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
      ) : (
        <DataBoundary
          isPending={detail.isPending}
          isError={detail.isError || !detail.data}
          onRetry={() => void detail.refetch()}
          skeleton={
            active === 'tech' ? <TechTabSkeleton /> : <ProblemTabSkeleton />
          }
          errorTitle="증명서 상세를 불러오지 못했어요"
        >
          {detail.data &&
            (active === 'tech' ? (
              <TechTabContent tech={detail.data.tech} />
            ) : (
              <ProblemTabContent problem={detail.data.problem} />
            ))}
        </DataBoundary>
      )}
    </section>
  )
}
