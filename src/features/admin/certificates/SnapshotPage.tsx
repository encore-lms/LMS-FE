import { useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { KpiCard } from '@/components/data/KpiCard'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useSnapshot } from '../api/reviews'

const TABS = [
  '종합 요약',
  '기술·검증',
  '프로젝트',
  '문제해결·협업',
  '성장·평판',
]

// 스냅샷 상세 (/admin/certificates/:certificateId/snapshot) — Flow 11.
// certified 증명서의 동결 스냅샷(읽기 전용) — 5탭 미리보기 + 공개 payload + 외부 검증 URL. (Figma "스냅샷 상세 v2")
export default function SnapshotPage() {
  const { certificateId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useSnapshot(certificateId)
  const [tab, setTab] = useState(0)
  const verifyRef = useRef<HTMLElement>(null)
  usePageHeader(
    '스냅샷 상세',
    'certified 증명서의 동결 스냅샷 · 매니저·운영팀 전용',
  )

  if (isPending) {
    return <div className="text-fg-muted p-8">스냅샷을 불러오는 중…</div>
  }
  if (isError) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="스냅샷을 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }

  const s = data
  const copyUrl = () => {
    navigator.clipboard?.writeText(s.verify.url)
    toast.success('공개 검증 URL이 복사됐어요')
  }
  const previewVerify = () =>
    verifyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const publicBadge = s.isPublic ? '공개' : 'isPublic = false'

  return (
    <div className="p-8">
      {/* 제목은 공유 헤더로 이동 — 뒤로가기 + 공개 상태 배지만 본문에 유지 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-fg-muted hover:text-fg flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 검토 상세로
        </button>
        <StatusBadge
          label={s.isPublic ? '공개' : '비공개'}
          tone={s.isPublic ? 'success' : 'neutral'}
        />
      </div>

      <div className="bg-brand mt-4 rounded-xl px-6 py-5 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={s.student.name} size={56} />
            <div>
              <StatusBadge label="certified" tone="success" />
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-bold">{s.student.name}</span>
                <span className="text-sm text-white/70">
                  {s.student.certId} · {s.student.cohort}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              onClick={() => toast.info('JSON 다운로드 (mock)')}
            >
              <Download className="h-4 w-4" /> JSON 다운로드
            </Button>
            <Button variant="secondary" onClick={previewVerify}>
              <ExternalLink className="h-4 w-4" /> 외부 검증 URL 미리보기
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">생성 시각</p>
            <p className="mt-0.5 text-sm font-medium">{s.issuedAt}</p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">certificateId</p>
            <p className="mt-0.5 truncate font-mono text-sm">
              {s.certificateId}
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">snapshotHash</p>
            <p className="mt-0.5 truncate font-mono text-sm">
              {s.verify.snapshotHash}
            </p>
          </div>
          <div className="rounded-lg bg-white/10 px-3 py-2">
            <p className="text-xs text-white/60">publicToken</p>
            <p className="mt-0.5 truncate font-mono text-sm">{s.publicToken}</p>
          </div>
        </div>
      </div>

      <section className="border-border bg-surface mt-6 rounded-xl border">
        <div className="border-divider flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-fg font-bold">동결 스냅샷 콘텐츠</h2>
            <p className="text-fg-subtle mt-1 text-xs">
              수강생 5탭 증명서와 동일 · 발급 시점 동결
            </p>
          </div>
          <StatusBadge label={publicBadge} tone="neutral" />
        </div>
        <div className="p-5">
          <div className="border-divider -mt-2 mb-4 flex gap-1 border-b">
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(i)}
                className={cn(
                  'px-3 py-2 text-sm font-medium',
                  tab === i
                    ? 'text-brand border-brand border-b-2'
                    : 'text-fg-muted hover:text-fg',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab !== 0 ? (
            <p className="text-fg-subtle py-8 text-center text-sm">
              {TABS[tab]} 탭은 종합 요약과 동일 구조 — 동결 스냅샷
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <KpiCard
                  label="교육시간"
                  value={`${s.metrics.trainingHours}h`}
                  hint="HRD 기준"
                />
                <KpiCard
                  label="출석률"
                  value={`${(s.metrics.attendance * 100).toFixed(1)}%`}
                  tone="success"
                  hint="정상"
                />
                <KpiCard
                  label="시험 평균"
                  value={s.metrics.quizAvg}
                  hint="평균 이상"
                />
                <KpiCard
                  label="제출률"
                  value={`${Math.round(s.metrics.submissionRate * 100)}%`}
                  hint={s.metrics.submissionRaw}
                />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <span className="text-fg text-sm font-bold">
                    6축 점수 · 수료 동결
                  </span>
                  <span className="text-fg-subtle text-xs">
                    평균 <span className="text-fg font-bold">{s.skillAvg}</span>{' '}
                    / 100
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {s.skills.map((sk) => (
                    <div key={sk.key} className="flex items-center gap-3">
                      <span className="text-fg-muted w-12 shrink-0 text-xs">
                        {sk.key}
                      </span>
                      <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-brand h-full rounded-full"
                          style={{ width: `${sk.score}%` }}
                        />
                      </div>
                      <span className="text-fg w-7 shrink-0 text-right text-sm font-medium">
                        {sk.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <span className="text-fg text-sm font-bold">
                  대표 근거 — 외부 공개 항목
                </span>
                <ul className="mt-2 flex flex-col gap-2">
                  {s.evidence.map((e) => (
                    <li
                      key={e.title}
                      className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="text-fg text-sm font-medium">
                        {e.title}
                      </span>
                      <span className="text-fg-subtle text-xs">{e.sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2">
                  <span className="text-fg text-sm font-bold">
                    공개 payload — JSON (동결)
                  </span>
                  <StatusBadge label="민감정보 없음" tone="success" />
                </div>
                <pre className="bg-surface-muted text-fg-muted mt-2 max-h-72 overflow-auto rounded-lg p-3 text-xs">
                  {s.payloadJson}
                </pre>
              </div>
            </>
          )}
        </div>
      </section>

      <section
        ref={verifyRef}
        className="border-border bg-surface mt-6 rounded-xl border p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-fg font-bold">외부 검증 URL · 무결성 정보</h2>
          <StatusBadge label={publicBadge} tone="neutral" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <span className="text-fg truncate font-mono text-xs">
              {s.verify.url}
            </span>
            <button
              type="button"
              onClick={copyUrl}
              aria-label="검증 URL 복사"
              className="text-fg-muted hover:text-fg shrink-0"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="border-border rounded-lg border px-3 py-2">
            <p className="text-fg-subtle text-xs">snapshotHash</p>
            <p className="text-fg font-mono text-xs">{s.verify.snapshotHash}</p>
          </div>
          <div className="border-border rounded-lg border px-3 py-2">
            <p className="text-fg-subtle text-xs">verificationId</p>
            <p className="text-fg font-mono text-xs">
              {s.verify.verificationId}
            </p>
          </div>
        </div>
      </section>

      <div className="bg-brand-deep mt-6 flex items-center justify-between gap-4 rounded-xl px-6 py-4 text-white">
        <p className="text-xs">
          스냅샷은 동결돼 있어요 — 데이터 변경 시 새 스냅샷이 생성됩니다.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            검토 상세로 돌아가기
          </Button>
          <Button onClick={() => toast.info('JSON 다운로드 (mock)')}>
            <Download className="h-4 w-4" /> JSON 다운로드
          </Button>
        </div>
      </div>
    </div>
  )
}
