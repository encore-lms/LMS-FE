import { type ReactNode, useEffect, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  FileText,
  Paperclip,
  X,
  ZoomIn,
} from 'lucide-react'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { cn } from '@/shared/lib/cn'
import type {
  BlogRecordDetail,
  CertRecordDetail,
  RecordCellStatus,
  StudyRecordDetail,
} from '@/shared/types'

// 학습 기록 상세 — 우측 슬라이드 패널(블로그·스터디·자격증 공용, 강사·매니저 공용 2026-08-03).
// 강사(기본): 조회 전용 — "운영 매니저 결정"을 표시. 매니저: extraFooter로 검토 액션(승인·보완·반려)을
// 주입받아 렌더한다(액션 구현·API는 admin 소유 — features/admin/records/RecordReviewActions).
export type RecordPanelData =
  | { kind: 'blog'; recordId: string; detail: BlogRecordDetail }
  | { kind: 'study'; recordId: string; detail: StudyRecordDetail }
  | { kind: 'cert'; recordId: string; detail: CertRecordDetail }

const STATUS_BADGE: Record<
  RecordCellStatus,
  { label: string; tone: BadgeTone }
> = {
  approved: { label: '승인', tone: 'success' },
  pending: { label: '검토 중', tone: 'warning' },
  rejected: { label: '반려', tone: 'danger' },
  none: { label: '미제출', tone: 'neutral' },
}

const RATIOS = [50, 75, 100] as const

interface RecordDetailPanelProps {
  data: RecordPanelData | null
  onClose: () => void
  /** 매니저 검토 액션 등 하단 주입 영역 — 있으면 조회 전용 안내·매니저 결정 박스를 대체한다. */
  extraFooter?: ReactNode
}

export function RecordDetailPanel({
  data,
  onClose,
  extraFooter,
}: RecordDetailPanelProps) {
  const [ratio, setRatio] = useState<(typeof RATIOS)[number]>(75)

  useEffect(() => {
    if (!data) return
    setRatio(75)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, onClose])

  if (!data) return null

  const wide = data.kind === 'blog'
  const status = data.detail.status
  // 헤더 배지는 블로그만(주차 옆). 스터디는 본문 제목 옆, 자격증은 카드에 표시.
  const showHeaderStatus = data.kind === 'blog'

  const subLabel =
    data.kind === 'blog'
      ? data.detail.weekLabel
      : data.kind === 'cert'
        ? `${data.detail.certType} 제출 상세`
        : '' // 스터디: 제목은 본문에서 크게 표시

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="학습 기록 상세"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'border-border bg-surface flex h-full w-full flex-col border-l shadow-xl',
          wide ? 'max-w-[760px]' : 'max-w-[460px]',
        )}
      >
        {/* 헤더 */}
        <div className="border-divider flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-fg truncate text-base font-bold">
              {data.detail.studentName}
            </p>
            {/* 승인 배지는 주차(부제) 옆 — 그 주차의 승인 상태 표시 */}
            {(subLabel || showHeaderStatus) && (
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-fg-subtle min-w-0 truncate text-xs">
                  {subLabel}
                </p>
                {showHeaderStatus && (
                  <span className="shrink-0">
                    <StatusBadge
                      label={STATUS_BADGE[status].label}
                      tone={STATUS_BADGE[status].tone}
                    />
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {data.kind === 'blog' && (
              <a
                href={data.detail.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="새 탭에서 열기"
                className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" /> 새 탭
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="상세 닫기"
              className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              <X className="h-3.5 w-3.5" /> 닫기
            </button>
          </div>
        </div>

        {data.kind === 'blog' && (
          <BlogBody
            detail={data.detail}
            ratio={ratio}
            onRatio={setRatio}
            extraFooter={extraFooter}
          />
        )}
        {data.kind === 'study' && (
          <StudyBody detail={data.detail} extraFooter={extraFooter} />
        )}
        {data.kind === 'cert' && (
          <CertBody detail={data.detail} extraFooter={extraFooter} />
        )}
      </aside>
    </div>
  )
}

// ── 블로그: URL + 화면 비율 토글 + iframe 미리보기 ──
function BlogBody({
  detail,
  ratio,
  onRatio,
  extraFooter,
}: {
  detail: BlogRecordDetail
  ratio: (typeof RATIOS)[number]
  onRatio: (r: (typeof RATIOS)[number]) => void
  extraFooter?: ReactNode
}) {
  const scale = ratio / 100
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* URL + 제출일(우측) */}
      <div className="border-divider flex items-center gap-3 border-b px-5 py-2.5 text-sm">
        <a
          href={detail.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand flex min-w-0 items-center gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{detail.url}</span>
        </a>
        <span className="text-fg-subtle ml-auto shrink-0 text-xs whitespace-nowrap">
          제출일 {detail.submittedAt}
        </span>
      </div>

      {/* 화면 비율 토글 */}
      <div className="border-divider flex items-center gap-2 border-b px-5 py-2">
        <span className="text-fg-subtle text-xs font-medium">화면 비율</span>
        <div className="bg-surface-muted flex gap-1 rounded-lg p-0.5">
          {RATIOS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRatio(r)}
              aria-pressed={ratio === r}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-semibold',
                ratio === r
                  ? 'text-accent-strong bg-white shadow-sm'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* iframe 미리보기 */}
      <div className="bg-surface-muted relative flex-1 overflow-hidden">
        <iframe
          src={detail.url}
          title="블로그 미리보기"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          style={{
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
          className="border-0 bg-white"
        />
        <p className="text-fg-subtle bg-surface/90 pointer-events-none absolute right-2 bottom-2 rounded px-2 py-1 text-[11px]">
          미리보기가 보이지 않으면 상단 URL로 확인
        </p>
      </div>

      <div className="border-divider border-t px-5 py-4">
        {extraFooter ?? (
          <ManagerDecision
            status={detail.status}
            comment={detail.managerComment}
          />
        )}
      </div>
    </div>
  )
}

// ── 스터디: 제목·상태 + 정보 카드 + 증빙 자료(사진 레이아웃) ──
function StudyBody({
  detail,
  extraFooter,
}: {
  detail: StudyRecordDetail
  extraFooter?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
      {/* 제목 + 승인 배지 */}
      <div className="flex items-center gap-2">
        <p className="text-fg min-w-0 text-base font-bold">{detail.title}</p>
        <span className="ml-auto shrink-0">
          <StatusBadge
            label={STATUS_BADGE[detail.status].label}
            tone={STATUS_BADGE[detail.status].tone}
          />
        </span>
      </div>

      {/* 정보 카드 */}
      <div className="border-border bg-surface-muted/50 space-y-2.5 rounded-xl border p-4">
        <InfoRow
          icon={<Calendar />}
          label="제출일"
          value={detail.submittedAt}
        />
        <InfoRow icon={<Clock />} label="진행 시간" value={detail.timeRange} />
        <InfoRow
          icon={<Paperclip />}
          label="첨부 파일"
          value={`${detail.attachmentCount}개`}
        />
      </div>

      {/* 증빙 자료 */}
      <div>
        <p className="text-fg-subtle mb-1.5 text-xs font-medium">증빙 자료</p>
        <EvidenceBox url={detail.evidenceImageUrl} className="h-64" />
      </div>

      {extraFooter}
    </div>
  )
}

// ── 자격증: 마일리지 배너 + 자격증 카드(종류·등급·상태·날짜·파일·증빙) ──
function CertBody({
  detail,
  extraFooter,
}: {
  detail: CertRecordDetail
  extraFooter?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* 마일리지 배너 */}
      <div className="border-divider bg-surface-muted flex items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <p className="text-fg-subtle flex items-center gap-1 text-xs font-medium">
            <Coins className="h-3.5 w-3.5" /> 마일리지
          </p>
          <p className="text-fg mt-0.5 text-2xl font-bold">
            {detail.mileage.toLocaleString()}P
          </p>
          {detail.mileageBreakdown && (
            <p className="text-fg-subtle text-xs">{detail.mileageBreakdown}</p>
          )}
        </div>
        {detail.mileage > 0 && (
          <StatusBadge
            label={detail.paid ? '지급 완료' : '지급 대기'}
            tone={detail.paid ? 'success' : 'warning'}
            icon={detail.paid ? <CheckCircle2 /> : undefined}
          />
        )}
      </div>

      <div className="px-5 py-5">
        {/* 자격증 카드 */}
        <div className="border-border rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="bg-accent-bg text-accent-strong rounded-md px-2 py-0.5 text-xs font-bold">
              {detail.certType}
            </span>
            <span className="text-fg text-sm font-bold">
              {detail.grade} 합격
            </span>
            <span className="ml-auto">
              <StatusBadge
                label={STATUS_BADGE[detail.status].label}
                tone={STATUS_BADGE[detail.status].tone}
              />
            </span>
          </div>

          <div className="text-fg-subtle mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {detail.acquiredAt}
            </span>
            {/* 파일명이 길면 잘라서 보여준다(전체는 title). */}
            <span className="flex min-w-0 items-center gap-1">
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={detail.fileName}>
                {detail.fileName}
              </span>
            </span>
          </div>

          <div className="mt-3">
            <EvidenceBox url={detail.evidenceImageUrl} className="h-56" />
          </div>
        </div>

        {/* 매니저 코멘트(있을 때) */}
        {detail.managerComment && (
          <div className="border-border bg-surface-muted/40 text-fg-muted mt-4 rounded-lg border p-3 text-sm whitespace-pre-wrap">
            {detail.managerComment}
          </div>
        )}

        {extraFooter ?? (
          // 강사 조회 안내 — 승인/반려 버튼 대체
          <p className="text-fg-subtle mt-4 text-center text-xs">
            강사는 조회만 가능 — 승인·반려는 운영 매니저가 처리합니다.
          </p>
        )}
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-fg-subtle flex items-center gap-1.5 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
        {label}
      </span>
      <span className="text-fg ml-auto font-medium">{value}</span>
    </div>
  )
}

// 증빙 이미지 — mock은 실제 URL이 없어 확대 아이콘 플레이스홀더로 표시.
function EvidenceBox({
  url,
  className,
}: {
  url: string | null
  className?: string
}) {
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('relative block overflow-hidden rounded-lg', className)}
      >
        <img src={url} alt="증빙 자료" className="h-full w-full object-cover" />
        <span className="bg-surface/85 text-fg-muted absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow">
          <ZoomIn className="h-5 w-5" />
        </span>
      </a>
    )
  }
  return (
    <div
      className={cn(
        'border-border bg-surface-muted text-fg-subtle flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-xs',
        className,
      )}
    >
      <ZoomIn className="h-8 w-8" />
      증빙 자료 미리보기
    </div>
  )
}

// 운영 매니저 결정 표시(조회 전용) — 강사 액션 버튼 없음.
function ManagerDecision({
  status,
  comment,
  extra,
}: {
  status: RecordCellStatus
  comment: string | null
  extra?: ReactNode
}) {
  const b = STATUS_BADGE[status]
  return (
    <div className="border-border bg-surface-muted/40 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <p className="text-fg text-xs font-bold">운영 매니저 결정</p>
        <StatusBadge label={b.label} tone={b.tone} />
      </div>
      {extra}
      <p className="text-fg-muted mt-1.5 text-sm whitespace-pre-wrap">
        {comment ||
          (status === 'pending'
            ? '아직 운영 매니저 검토 전입니다.'
            : '코멘트가 없습니다.')}
      </p>
      <p className="text-fg-subtle mt-2 text-xs">
        강사는 조회만 가능 — 승인·반려·보완 요청은 운영 매니저가 처리합니다.
      </p>
    </div>
  )
}
