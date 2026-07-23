import { useQuery } from '@tanstack/react-query'
import { CERTIFICATE_MOCK_STUDENT_ID, fetchCertificateDetailTabs } from './ai'
import { certKeys } from './queryKeys'

export function useCertificateDetailTabs(
  studentId = CERTIFICATE_MOCK_STUDENT_ID,
) {
  return useQuery({
    queryKey: certKeys.detailTabs(studentId),
    queryFn: () => fetchCertificateDetailTabs(studentId),
  })
}
