import { useNavigate } from 'react-router-dom'
import { Globe, Lock } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useToast } from '@/components/ui/use-toast'
import {
  useCertPublicationSettings,
  useCertStatus,
  useUpdateCertPublication,
} from '../../api/certificate'

/**
 * 증명서 화면 하단 공개 바.
 *
 * <p>외부 검증 URL 을 열고 닫는 스위치다. 공개하면 채용 담당자 같은 외부 검증자가
 * 링크로 증명서를 확인할 수 있고, 끄면 링크를 열어도 비공개 안내만 보인다.</p>
 *
 * <p>정식 인증 전에는 켤 수 없다 — 검증되지 않은 증명서를 밖에 내보내면 안 된다.</p>
 */
export function CertPublishBar() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: cert } = useCertStatus()
  // 공개 여부는 서버가 정본 — 검증 페이지는 다른 기기에서 열리므로 프론트 상태로는 못 넘긴다.
  const { data: settings } = useCertPublicationSettings()
  const updatePublication = useUpdateCertPublication()
  const published = settings?.published ?? false

  const certified = cert?.stage === 'certified'

  const toggle = () => {
    if (!certified) {
      toast.info('정식 인증이 끝난 뒤에 공개할 수 있어요')
      return
    }
    updatePublication.mutate(
      { published: !published },
      {
        onSuccess: (next) =>
          toast.success(
            next.published
              ? '외부 검증 URL 을 공개했어요'
              : '외부 검증 URL 을 비공개로 바꿨어요',
          ),
        onError: () => toast.danger('공개 설정을 저장하지 못했어요'),
      },
    )
  }

  return (
    // 예전엔 fixed + left-[232px] 로 사이드바 폭을 하드코딩했다. 사이드바를 접거나 좁은
    // 화면에서 숨으면 그 232px 이 그대로 남아 바가 왼쪽으로 붕 뜬 채 좁아 보였다.
    // sticky 로 두면 본문 칸 안에 있으므로 폭이 저절로 따라온다(하단 여백은 부모의 pb-28).
    <div className="bg-brand-deep sticky bottom-6 z-30 flex items-center justify-between gap-4 rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            published ? 'bg-white/20' : 'bg-white/10',
          )}
          aria-hidden="true"
        >
          {published ? (
            <Globe className="size-4.5" />
          ) : (
            <Lock className="size-4.5" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-[13px] font-bold">
            외부 검증 URL · {published ? '공개 중' : '비공개'}
          </span>
          <span className="text-[11px] text-white/70">
            {certified
              ? published
                ? '검증자가 링크로 증명서를 확인할 수 있어요 · 동료 평판·코멘트는 공개 설정에서 따로 켜요'
                : '지금은 링크를 열어도 비공개 안내만 보여요 · 공개하면 검증자가 확인할 수 있어요'
              : '정식 인증이 끝나면 공개할 수 있어요'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/student/certificate/publication')}
          className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          공개 설정
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={published}
          aria-label="외부 검증 URL 공개"
          disabled={!certified}
          onClick={toggle}
          className={cn(
            'rounded-lg px-5 py-2.5 text-[13px] font-bold transition-colors',
            published
              ? 'bg-white/15 text-white hover:bg-white/25'
              : 'bg-brand text-white hover:bg-brand/90',
            !certified && 'cursor-not-allowed opacity-50',
          )}
        >
          {published ? '비공개로 전환' : '공개하기'}
        </button>
      </div>
    </div>
  )
}
