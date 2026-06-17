import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/use-toast'
import { TestModeBar } from '@/components/dev/TestModeBar'
import { useCertFlow } from '../useCertFlow'
import type { CertificateOverview } from '../types'

// 정식 인증 요청 흐름(데모 상태 전이) + 미리보기 진입 — FE 목 전용 테스트 네비.
// 증명서 인셸 페이지 상단에 노출. [미리보기]는 사이드바 없는 전체화면 미리보기로 이동한다.
// BE 연동 시 상태 전이는 각 PATCH 엔드포인트로 교체하고, 미리보기 버튼만 남긴다.
export function CertRequestTestNav({ data }: { data: CertificateOverview }) {
  const navigate = useNavigate()
  const toast = useToast()
  const status = useCertFlow((s) => s.status)
  const setStatus = useCertFlow((s) => s.setStatus)

  const previewBtn = (
    <button
      type="button"
      onClick={() => navigate('/student/certificate/preview')}
      className="border-accent-strong text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-4 py-2 text-[13px] font-bold transition-colors"
    >
      👁 미리보기
    </button>
  )

  const ghostBtn =
    'border-accent-strong/50 text-accent-strong hover:bg-accent-strong/10 rounded-lg border px-3 py-2 text-[12px] font-bold transition-colors'
  const solidBtn =
    'bg-accent-strong rounded-lg px-4 py-2 text-[13px] font-bold text-white'

  return (
    <TestModeBar note="정식 인증 요청 흐름 (FE 목 · 상태 전이 시뮬레이션)">
      {status === 'draft' && (
        <>
          <button
            type="button"
            onClick={() => {
              setStatus('under_review')
              toast.success('정식 인증을 요청했어요 · 매니저 검토 대기')
            }}
            className={solidBtn}
          >
            ▶ 정식 인증 요청
          </button>
          {previewBtn}
        </>
      )}

      {status === 'under_review' && (
        <>
          <span className="text-accent-strong text-[12px] font-semibold">
            매니저 검토 중
          </span>
          <button
            type="button"
            onClick={() => {
              setStatus('draft')
              toast.info('인증 요청을 취소했어요')
            }}
            className={ghostBtn}
          >
            요청 취소
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus('changes_requested')
              toast.info('보완 요청이 도착했어요')
            }}
            className="bg-warning rounded-lg px-3 py-2 text-[12px] font-bold text-white"
          >
            보완 요청(시뮬)
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus('issued')
              toast.success('정식 인증이 완료됐어요')
            }}
            className="bg-success rounded-lg px-3 py-2 text-[12px] font-bold text-white"
          >
            승인(시뮬)
          </button>
          {previewBtn}
        </>
      )}

      {status === 'changes_requested' && (
        <>
          <span className="text-accent-strong text-[12px] font-semibold">
            보완 요청 {data.changeFlags.length}건 — 수정 후 재요청
          </span>
          <button
            type="button"
            onClick={() => navigate('/student/certificate/changes-requested')}
            className={solidBtn}
          >
            보완 요청 확인 →
          </button>
          {previewBtn}
        </>
      )}

      {status === 'issued' && (
        <>
          <span className="text-accent-strong text-[12px] font-semibold">
            정식 인증 완료 · 검증 ID {data.header.certId}
          </span>
          <button
            type="button"
            onClick={() => navigate('/student/certificate/publication')}
            className={solidBtn}
          >
            공개 설정 →
          </button>
          {previewBtn}
        </>
      )}
    </TestModeBar>
  )
}
