import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { useCertificateTemplate } from './api'
import type {
  CertFieldAction,
  CertFieldStatus,
  CertTemplateFieldRow,
} from './types'

type TemplateTab = 'public' | 'internal' | 'snapshot'

const TABS: { key: TemplateTab; label: string }[] = [
  { key: 'public', label: '공개 필드' },
  { key: 'internal', label: '내부 필드' },
  { key: 'snapshot', label: '스냅샷 정책' },
]

const STATUS_META: Record<CertFieldStatus, { label: string; tone: BadgeTone }> =
  {
    normal: { label: '정상', tone: 'success' },
    warning: { label: '주의', tone: 'warning' },
  }

const ACTION_LABEL: Record<CertFieldAction, string> = {
  edit: '편집',
  review: '검토',
  mask: '마스킹',
}

// 증명서 템플릿 (/admin/certificate-template) — 운영(MANAGER/ADMIN) 신규.
// Figma 1521:10895. 섹션별 공개/내부 필드 매핑 + 스냅샷 정책 관리.
// 공개 필드 탭이 정본(Figma 동결). 내부/스냅샷 탭은 같은 데이터에서 파생한 우측 패널만 교체.
// 미리보기·정책 저장·행 편집/검토/마스킹 흐름은 별도 시안 미설계 → 토스트 안내 + TODO.
export default function CertificateTemplatePage() {
  usePageHeader(
    '증명서 템플릿',
    '공개/내부 필드·스냅샷 정책 — 증명서 템플릿 관리',
  )
  const { data, isPending, isError, refetch } = useCertificateTemplate()
  const toast = useToast()
  const [tab, setTab] = useState<TemplateTab>('public')

  if (isPending) {
    return <div className="text-fg-muted p-8">증명서 템플릿을 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="증명서 템플릿을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, fields, preview } = data

  const columns: Column<CertTemplateFieldRow>[] = [
    {
      key: 'section',
      header: '섹션',
      className: 'w-32',
      cell: (r) => (
        <span className="text-fg text-[13px] font-semibold">{r.section}</span>
      ),
    },
    {
      key: 'public',
      header: '공개',
      cell: (r) => <span className="text-fg text-[13px]">{r.publicField}</span>,
    },
    {
      key: 'internal',
      header: '내부',
      cell: (r) => (
        <span className="text-fg-muted font-mono text-[12px]">
          {r.internalField}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      className: 'w-20',
      cell: (r) => (
        <StatusBadge
          label={STATUS_META[r.status].label}
          tone={STATUS_META[r.status].tone}
        />
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-20',
      cell: (r) => (
        <button
          type="button"
          // TODO: 필드 편집/검토/마스킹 모달(P0_24 BE 계약 확정 후)
          onClick={() =>
            toast.info(
              `${r.section} ${ACTION_LABEL[r.action]}은(는) 준비 중입니다.`,
            )
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          {ACTION_LABEL[r.action]}
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 탭(공개/내부/스냅샷) + 우측 액션(미리보기·정책 저장) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-border bg-surface inline-flex gap-1 rounded-lg border p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                tab === t.key
                  ? 'bg-brand text-on-color'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            // TODO: 증명서 공개 미리보기 모달(P0_24)
            onClick={() => toast.info('미리보기는 준비 중입니다.')}
            className="bg-accent-bg text-accent-strong hover:bg-accent-bg/70 h-9 rounded-md px-4 text-[13px] font-semibold transition-colors"
          >
            미리보기
          </button>
          <button
            type="button"
            // TODO: 템플릿 정책 저장(버전 증가·스냅샷 영향, P0_24)
            onClick={() => toast.info('정책 저장은 준비 중입니다.')}
            className="bg-brand hover:bg-brand/90 text-on-color h-9 rounded-md px-4 text-[13px] font-semibold transition-colors"
          >
            정책 저장
          </button>
        </div>
      </div>

      {/* KPI 5종 */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="템플릿 버전"
          value={summary.version}
          hint={summary.versionState}
        />
        <KpiCard
          label="공개 필드"
          value={summary.publicFields}
          hint="수강생 표시"
        />
        <KpiCard
          label="내부 필드"
          value={summary.internalFields}
          hint="운영/검토용"
        />
        <KpiCard
          label="스냅샷 잠금"
          value={`${summary.snapshotLockStages}단계`}
          hint="승인 시 고정"
        />
        <KpiCard
          label="정책 경고"
          value={summary.policyWarnings}
          hint="공개 위험"
          tone={summary.policyWarnings > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* 메인 — 필드 매핑 표(좌) + 탭별 우측 패널 */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <DataTable
            columns={columns}
            rows={fields}
            rowKey={(r) => r.id}
            empty="등록된 필드가 없어요"
          />
        </div>

        <aside className="w-full lg:w-[420px] lg:shrink-0">
          {tab === 'public' && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <p className="text-fg text-lg font-bold">증명서 공개 미리보기</p>
              <p className="text-fg-muted mt-2 text-[13px]">
                {preview.studentName} · {preview.cohortLabel}
              </p>
              <p className="text-fg mt-6 text-xs font-semibold">핵심 역량</p>
              <p className="text-fg-muted mt-1.5 text-[13px]">
                {preview.coreCompetency}
              </p>
              <p className="text-fg mt-5 text-xs font-semibold">
                대표 프로젝트
              </p>
              <p className="text-fg-muted mt-1.5 text-[13px]">
                {preview.representativeProject}
              </p>
              <p className="text-warning mt-7 text-xs font-semibold">
                공개 위험
              </p>
              <p className="text-warning/90 mt-1.5 text-[13px]">
                원문 코멘트와 운영 메모는 공개 필드에서 제외됩니다.
              </p>
            </div>
          )}

          {tab === 'internal' && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <p className="text-fg text-lg font-bold">내부 필드 미리보기</p>
              <p className="text-fg-muted mt-2 text-[13px]">
                운영/검토 전용 — 수강생·외부에 노출되지 않습니다.
              </p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {fields.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-fg-muted text-[13px]">
                      {f.section}
                    </span>
                    <span className="text-fg font-mono text-[12px]">
                      {f.internalField}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'snapshot' && (
            <div className="border-border bg-surface rounded-xl border p-5">
              <p className="text-fg text-lg font-bold">스냅샷 잠금</p>
              <p className="text-fg-muted mt-2 text-[13px]">
                정식 인증 승인 시 {summary.snapshotLockStages}단계로 고정됩니다.
              </p>
              <p className="text-fg-muted mt-5 text-[13px] leading-relaxed">
                공개 필드와 내부 필드가 snapshotPayload로 동결되어 이후 템플릿
                변경의 영향을 받지 않습니다.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* 스냅샷 정책 — 하단 콜아웃(항상 노출) */}
      <div className="border-warning/30 bg-warning-bg/50 mt-6 rounded-xl border p-5">
        <p className="text-warning text-base font-bold">스냅샷 정책</p>
        <p className="text-warning/90 mt-2 text-[13px] leading-relaxed">
          정식 인증 승인 시 공개 필드와 내부 필드가 snapshotPayload로
          고정됩니다. 템플릿 변경은 이후 발급분에만 적용하고 기존 스냅샷은 감사
          로그를 통해 추적합니다.
        </p>
      </div>
    </div>
  )
}
