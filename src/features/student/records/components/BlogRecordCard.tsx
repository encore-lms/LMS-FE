import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { AlertTriangle, ExternalLink, Link2, X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/buttonClass'
import type { BlogRecord, RecordStatus } from '../types'

// 블로그 기록 카드 — 상태별 표시 + 수정/삭제. 블로그 상세는 우측 iframe 패널, 스터디/자격증은 상세 모달.
const STATUS: Record<RecordStatus, { cls: string }> = {
  draft: { cls: 'bg-surface-muted text-fg-muted' },
  approved: { cls: 'bg-success-bg text-success' },
  reviewing: { cls: 'bg-accent-bg text-accent-strong' },
  rejected: { cls: 'bg-danger-bg text-danger' },
}

export function BlogRecordCard({
  record,
  onEdit,
  onDelete,
}: {
  record: BlogRecord
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // URL은 블로그 기록에만 의미가 있다(스터디·자격증은 증빙 파일 기반).
  const showUrl = record.category === 'blog' && !!record.url
  const isBlog = record.category === 'blog'
  // 모든 기록은 카드를 눌러 상세를 확인한다. 블로그만 모달 대신 우측 iframe 패널로 연다.
  const clickable = true
  const categoryLabel =
    record.category === 'blog'
      ? '블로그'
      : record.category === 'study'
        ? '스터디'
        : '자격증'

  // 카드 내부 버튼 클릭이 카드(상세 모달) 클릭으로 번지지 않게 막는다.
  const stop = (fn: () => void) => (e: MouseEvent) => {
    e.stopPropagation()
    fn()
  }
  const openDetail = () => {
    if (isBlog) {
      setDetailOpen(true)
      return
    }
    setDetailOpen(true)
  }

  return (
    <>
      <section
        className={cn(
          'border-border bg-surface flex flex-col gap-3 rounded-2xl border p-5',
          clickable && 'hover:border-brand/40 cursor-pointer transition-colors',
        )}
        onClick={clickable ? openDetail : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-expanded={isBlog ? detailOpen : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openDetail()
                }
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-surface-muted rounded-md px-2.5 py-1 text-[11px]">
              <span className="text-fg font-bold">{record.weekLabel}</span>{' '}
              <span className="text-fg-muted">{record.dateRange}</span>
            </span>
            <span
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-bold',
                STATUS[record.status].cls,
              )}
            >
              {record.statusLabel}
            </span>
          </div>
          <span className="text-fg-subtle shrink-0 text-[11px]">
            {record.submittedAt} · {record.statusAt}
          </span>
        </div>

        <h3 className="text-fg text-[16px] font-bold">{record.title}</h3>

        {record.status === 'draft' && (
          <span className="bg-surface-muted text-fg-muted w-fit rounded-md px-2 py-1 text-[11px] font-semibold">
            임시저장 · 나에게만 보여요
          </span>
        )}

        {showUrl && (
          <div className="flex items-center gap-1.5 text-[12px]">
            <Link2 className="text-fg-subtle size-3.5 shrink-0" />
            <span className="text-fg-muted truncate">{record.url}</span>
            <a
              href={record.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-brand shrink-0 font-semibold"
            >
              원문 보기 →
            </a>
          </div>
        )}

        {record.rejectReason && (
          <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-2 rounded-[12px] border p-3.5">
            <span className="text-danger flex items-center gap-1.5 text-[12px] font-bold">
              <AlertTriangle className="size-3.5 shrink-0" />
              {record.rejectReason.title}
            </span>
            <div className="flex items-center gap-3 pt-0.5">
              <button
                type="button"
                onClick={stop(() => onEdit(record.id))}
                className="bg-danger rounded-md px-3 py-1.5 text-[11px] font-bold text-white"
              >
                수정 후 재제출
              </button>
              <button
                type="button"
                onClick={stop(() => setRejectOpen(true))}
                className="text-fg-muted text-[11px] font-semibold hover:underline"
              >
                자세히 →
              </button>
            </div>
          </div>
        )}

        <div className="border-divider flex items-center justify-between border-t pt-3">
          <span className="text-fg-subtle text-[12px]">
            {record.instructor}
          </span>
          <div className="flex items-center gap-2">
            {record.canEdit && (
              <button
                type="button"
                onClick={stop(() => onEdit(record.id))}
                className={buttonClass({ size: 'sm' })}
              >
                수정
              </button>
            )}
            {record.canDelete && (
              <button
                type="button"
                onClick={stop(() => onDelete(record.id))}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
              >
                삭제
              </button>
            )}
          </div>
        </div>
      </section>

      {isBlog && (
        <BlogPreviewPanel
          open={detailOpen}
          record={record}
          onClose={() => setDetailOpen(false)}
        />
      )}

      {/* 반려 사유 모달 — "자세히"로 진입 */}
      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        size="md"
        title="반려 사유"
      >
        {record.rejectReason && (
          <div className="flex flex-col gap-2">
            <span className="text-danger flex items-center gap-1.5 text-[14px] font-bold">
              <AlertTriangle className="size-4 shrink-0" />
              {record.rejectReason.title}
            </span>
            <p className="text-fg-muted text-[14px] leading-6">
              {record.rejectReason.detail}
            </p>
          </div>
        )}
      </Modal>

      {/* 스터디·자격증 상세 모달 — 블로그는 매니저 화면처럼 우측 iframe 패널로 진입 */}
      <Modal
        open={!isBlog && detailOpen}
        onClose={() => setDetailOpen(false)}
        size="md"
        title={`${categoryLabel} 상세`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-bold',
                STATUS[record.status].cls,
              )}
            >
              {record.statusLabel}
            </span>
            <span className="text-fg-subtle text-[12px]">
              {record.weekLabel} · {record.dateRange}
            </span>
          </div>
          <h3 className="text-fg text-[18px] font-bold">{record.title}</h3>
          <dl className="flex flex-col gap-2 text-[13px]">
            {record.category === 'blog' && record.url && (
              <div className="flex gap-2">
                <dt className="text-fg-subtle w-20 shrink-0">링크</dt>
                <dd className="min-w-0 flex-1">
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand block truncate font-semibold"
                  >
                    {record.url}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-fg-subtle w-20 shrink-0">제출/검토</dt>
              <dd className="text-fg">
                {record.submittedAt} · {record.statusAt}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-fg-subtle w-20 shrink-0">검토자</dt>
              <dd className="text-fg">{record.instructor}</dd>
            </div>
          </dl>
          {record.rejectReason && (
            <div className="border-danger/40 bg-danger-bg/50 flex flex-col gap-1 rounded-[12px] border p-3.5">
              <span className="text-danger text-[12px] font-bold">
                {record.rejectReason.title}
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                {record.rejectReason.detail}
              </span>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}

function BlogPreviewPanel({
  open,
  record,
  onClose,
}: {
  open: boolean
  record: BlogRecord
  onClose: () => void
}) {
  const status = STATUS[record.status]
  const panelRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const [previewState, setPreviewState] = useState<
    'empty' | 'loading' | 'ready' | 'delayed' | 'blocked'
  >(record.url ? 'loading' : 'empty')
  // 슬라이드 인/아웃 애니메이션: mounted=DOM 유지, entered=열린 위치(translate-x-0) 적용
  const [mounted, setMounted] = useState(false)
  const [entered, setEntered] = useState(false)

  onCloseRef.current = onClose

  // open 토글 → 마운트 직후 다음 프레임에 슬라이드 인, 닫힐 때 슬라이드 아웃 후 300ms에 언마운트
  useEffect(() => {
    if (open) {
      setMounted(true)
      const raf = requestAnimationFrame(() => setEntered(true))
      return () => cancelAnimationFrame(raf)
    }
    setEntered(false)
    const timer = window.setTimeout(() => setMounted(false), 300)
    return () => window.clearTimeout(timer)
  }, [open])

  // 우측 패널이 떠 있는 동안 배경 스크롤을 잠그고 ESC 닫기/포커스 복귀를 처리한다.
  useEffect(() => {
    if (!mounted) return
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    const prevOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      previousFocusRef.current?.focus({ preventScroll: true })
    }
  }, [mounted])

  // 일부 블로그는 X-Frame-Options/CSP로 iframe 표시가 막힌다. 지연 시 새 탭 안내를 명확히 보여준다.
  useEffect(() => {
    if (!open) return
    if (!record.url) {
      setPreviewState('empty')
      return
    }

    setPreviewState('loading')
    const timer = window.setTimeout(() => {
      setPreviewState((current) =>
        current === 'loading' ? 'delayed' : current,
      )
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [open, record.url])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        onClick={onClose}
        className={cn(
          'flex-1 bg-black/40 transition-opacity duration-300 ease-out',
          entered ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-label="블로그 상세 미리보기"
        className={cn(
          'bg-surface flex h-full w-[760px] max-w-[92vw] flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform',
          entered ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="border-border flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-fg truncate text-base font-bold">
                {record.title}
              </span>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
                  status.cls,
                )}
              >
                {record.statusLabel}
              </span>
            </div>
            <p className="text-fg-subtle mt-0.5 truncate text-xs">
              {record.weekLabel} · {record.dateRange} · {record.submittedAt}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {record.url && (
              <a
                href={record.url}
                target="_blank"
                rel="noreferrer"
                className="border-border text-fg-muted hover:bg-surface-muted inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold"
              >
                새 탭
                <ExternalLink className="size-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="블로그 상세 닫기"
              className="text-fg-subtle hover:bg-surface-muted hover:text-fg rounded-md p-1"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {record.url && (
          <div className="border-border bg-surface-muted text-fg-subtle flex items-center gap-2 border-b px-5 py-2 text-xs">
            <Link2 className="size-3.5 shrink-0" />
            <span className="truncate">{record.url}</span>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {record.url ? (
            <div className="relative h-full min-h-[420px]">
              <iframe
                src={record.url}
                title={`${record.title} 블로그 미리보기`}
                className="h-full w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                onLoad={() => setPreviewState('ready')}
                onError={() => setPreviewState('blocked')}
              />
              {previewState === 'loading' && (
                <div className="border-border bg-surface/95 text-fg-muted absolute top-4 left-4 rounded-lg border px-3 py-2 text-xs shadow-sm">
                  블로그 미리보기를 불러오는 중입니다.
                </div>
              )}
              {(previewState === 'delayed' || previewState === 'blocked') && (
                <div
                  aria-live="polite"
                  className="border-warning/40 bg-warning-bg/95 absolute right-4 bottom-4 max-w-[360px] rounded-lg border p-3 shadow-lg"
                >
                  <p className="text-fg text-xs font-bold">
                    미리보기가 제한될 수 있습니다.
                  </p>
                  <p className="text-fg-muted mt-1 text-xs leading-5">
                    블로그 보안 정책 때문에 화면이 비어 보이면 새 탭에서 확인해
                    주세요.
                  </p>
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand mt-2 inline-flex items-center gap-1 text-xs font-bold"
                  >
                    새 탭으로 보기
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              )}
              {previewState === 'ready' && (
                <p className="text-fg-subtle bg-surface/90 pointer-events-none absolute right-2 bottom-2 rounded px-2 py-1 text-[11px]">
                  미리보기가 보이지 않으면 우측 상단 “새 탭”으로 확인
                </p>
              )}
            </div>
          ) : (
            <div className="text-fg-muted flex h-full min-h-[420px] items-center justify-center text-sm">
              등록된 블로그 URL이 없습니다.
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
