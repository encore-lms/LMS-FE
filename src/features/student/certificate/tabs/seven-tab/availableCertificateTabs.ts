import type { PublicCertificateSevenTabs } from '../../analysis'
import type { CertTab } from '../../types'

export function availableCertificateTabs(
  tabs: PublicCertificateSevenTabs,
): CertTab[] {
  return [
    'summary',
    'tech',
    'projects',
    'problem-solving',
    ...(tabs.growthReputation ? (['growth-reputation'] as const) : []),
    'resume',
    'ai-analysis',
  ]
}
