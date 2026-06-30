import { useEffect } from 'react'
import { ExternalLink, Paperclip, X } from 'lucide-react'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import type {
  InstructorRecordCategory,
  InstructorRecordRow,
  InstructorRecordStatus,
} from '@/shared/types'

const CATEGORY_LABEL: Record<InstructorRecordCategory, string> = {
  blog: '블로그',
  study: '스터디',
  cert: '자격증',
}

// 매니저가 결정한 상태별 표기 + 코멘트 영역 라벨(상세/확인/결과/사유를 상태로 통합).
const STATUS_META: Record<
  InstructorRecordStatus,
  { label: string; tone: BadgeTone; commentLabel: string; empty: string }
> = {
  pending: {
    label: '대기',
    tone: 'warning',
    commentLabel: '매니저 코멘트',
    empty: '아직 매니저 결정 전입니다.',
  },
  changes_requested: {
    label: '보완 요청',
    tone: 'danger',
    commentLabel: '보완 요청 내용',
    empty: '보완 요청 내용이 없습니다.',
  },
  approved: {
    label: '승인',
    tone: 'success',
    commentLabel: '승인 코멘트',
    empty: '코멘트가 없습니다.',
  },
  rejected: {
    label: '반려',
    tone: 'neutral',
    commentLabel: '반려 사유',
    empty: '사유가 기록되지 않았습니다.',
  },
}

interface RecordDetailPanelProps {
  row: InstructorRecordRow | null
  onClose: () => void
}

// 학습 기록 조회 상세 — 우측 슬라이드 패널 (docs §13: 행 클릭 시 슬라이드).
// 조회 전용 — URL·본문·첨부·매니저 코멘트 + 매니저 결정 결과만 표시(승인/반려 액션 없음).
export function RecordDetailPanel({ row, onClose }: RecordDetailPanelProps) {
  useEffect(() => {
    if (!row) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [row, onClose])

  if (!row) return null
  const meta = STATUS_META[row.status]
  const files = row.attachmentFiles ?? []

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
        className="border-border bg-surface flex h-full w-full max-w-[420px] flex-col border-l shadow-xl"
      >
        {/* 헤더 */}
        <div className="border-divider flex items-center justify-between border-b px-5 py-4">
          <div>
            <p className="text-fg text-base font-bold">{row.studentName}</p>
            <p className="text-fg-subtle text-xs">{row.cohortLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="상세 닫기"
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <X className="h-3.5 w-3.5" /> 닫기
          </button>
        </div>

        {/* 본문(스크롤) */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={CATEGORY_LABEL[row.category]} tone="info" />
            <StatusBadge label={meta.label} tone={meta.tone} />
            <span className="text-fg-subtle text-xs">
              제출 {row.submittedAt ?? '-'}
            </span>
            {row.attachments !== null && (
              <span className="text-fg-muted flex items-center gap-1 text-xs">
                <Paperclip className="h-3.5 w-3.5" /> {row.attachments}
              </span>
            )}
          </div>

          <div>
            <p className="text-fg-subtle text-xs">제목</p>
            <p className="text-fg mt-0.5 text-sm font-medium">{row.title}</p>
          </div>

          {row.url && (
            <div>
              <p className="text-fg-subtle text-xs">링크</p>
              <a
                href={row.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand mt-0.5 flex items-center gap-1 text-sm break-all"
              >
                {row.url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          <div>
            <p className="text-fg-subtle text-xs">본문</p>
            <p className="text-fg mt-0.5 text-sm whitespace-pre-wrap">
              {row.body}
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <p className="text-fg-subtle text-xs">
                첨부파일 ({files.length})
              </p>
              <div className="mt-1 flex flex-col gap-1.5">
                {files.map((f, i) => (
                  <button
                    key={`${row.id}-a${i}`}
                    type="button"
                    onClick={() =>
                      window.open(f.url, '_blank', 'noopener,noreferrer')
                    }
                    className="border-border hover:bg-surface-muted flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm"
                  >
                    <Paperclip className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
                    <span className="text-fg flex-1 truncate">{f.name}</span>
                    <ExternalLink className="text-fg-subtle h-3 w-3 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-border bg-surface-muted/40 rounded-lg border p-3">
            <p className="text-fg text-xs font-bold">{meta.commentLabel}</p>
            <p className="text-fg-muted mt-1 text-sm whitespace-pre-wrap">
              {row.managerComment || meta.empty}
            </p>
          </div>

          <p className="text-fg-subtle mt-auto text-xs">
            조회 전용 — 승인·반려·보완 요청은 운영 매니저가 처리합니다.
          </p>
        </div>
      </aside>
    </div>
  )
}
