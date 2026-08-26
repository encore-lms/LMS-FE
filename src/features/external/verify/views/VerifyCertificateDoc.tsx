import { useState } from 'react'
import { CertHero } from '@/features/student/certificate/components/CertHero'
import { CertTabs } from '@/features/student/certificate/CertTabs'
import { CertificateSevenTabContent } from '@/features/student/certificate/tabs/seven-tab/CertificateSevenTabContent'
import { availableCertificateTabs } from '@/features/student/certificate/tabs/seven-tab/availableCertificateTabs'
import { CertPublicDocContext } from '@/features/student/certificate/publicDoc'
import type { CertTab } from '@/features/student/certificate/types'
import type { PublicCertificatePayload } from '../types'

/** 공개 검증은 인증 시점 Snapshot에 저장된 공개 탭만 렌더하며 별도 API를 조회하지 않는다. */
export function VerifyCertificateDoc({
  payload,
  verificationId,
}: {
  payload: PublicCertificatePayload
  verificationId: string
}) {
  const [tab, setTab] = useState<CertTab>('summary')
  const only = availableCertificateTabs(payload.tabs)
  const cohort = payload.tabs.summary.payload.cohort

  return (
    <CertPublicDocContext.Provider value={true}>
      <div className="flex flex-col gap-5">
        <CertHero
          header={{
            // 공개 Snapshot은 이름·연락처를 포함하지 않는다. 검증 문서의 정체성은 검증 ID로 표시한다.
            studentName: '수강역량증명서',
            courseName: cohort?.courseTitle ?? '',
            cohortName: cohort?.cohortNo ?? '',
            periodLabel: cohort ? `${cohort.startsAt} — ${cohort.endsAt}` : '',
            certId: verificationId,
            isPublic: true,
            status: 'certified',
          }}
          status="certified"
        />

        <CertTabs active={tab} onChange={setTab} only={only} />
        <CertificateSevenTabContent active={tab} tabs={payload.tabs} />
      </div>
    </CertPublicDocContext.Provider>
  )
}
