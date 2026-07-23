import { useEffect } from 'react'
import { ExternalLink, Paperclip, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useStudentAccounts } from '@/shared/api/students'
import type {
  ProjectCertReviewStatus,
  ProjectReviewDetail,
  TsReviewDetail,
  TsReviewStatus,
} from '@/shared/types'
import { useProjectReviewDetail, useTsReviewDetail } from '../api/reviews'

// 검토 상세 — 우측 슬라이드 패널(프로젝트·트러블슈팅 공용, RecordDetailPanel 패턴).
// 인증/보완 판단 근거를 확인하는 조회 전용 화면 — 액션은 목록 행 버튼이 담당.
export type ReviewDetailTarget = { kind: 'project' | 'ts'; id: string } | null

const PROJECT_STATUS: Record<
  ProjectCertReviewStatus | 'draft',
  { label: string; tone: BadgeTone }
> = {
  requested: { label: '인증 요청', tone: 'warning' },
  supplementing: { label: '보완 중', tone: 'danger' },
  certified: { label: '인증 완료', tone: 'success' },
  draft: { label: '작성 중', tone: 'neutral' },
}

const TS_STATUS: Record<
  TsReviewStatus | 'draft',
  { label: string; tone: BadgeTone }
> = {
  pending: { label: '검토 대기', tone: 'warning' },
  supplementing: { label: '보완 중', tone: 'danger' },
  certified: { label: '인증 완료', tone: 'success' },
  draft: { label: '작성 중', tone: 'neutral' },
}

interface ReviewDetailPanelProps {
  target: ReviewDetailTarget
  onClose: () => void
}

export function ReviewDetailPanel({ target, onClose }: ReviewDetailPanelProps) {
  const projectQ = useProjectReviewDetail(
    target?.kind === 'project' ? target.id : null,
  )
  const tsQ = useTsReviewDetail(target?.kind === 'ts' ? target.id : null)
  // 멤버·작성자 이름 — learning BE는 userId만 주므로 학생 계정 join.
  const { data: students } = useStudentAccounts()
  const nameOf = (userId: string) =>
    (students?.items ?? []).find((s) => s.id === userId)?.name ?? '수강생'

  useEffect(() => {
    if (!target) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [target, onClose])

  if (!target) return null

  const active = target.kind === 'project' ? projectQ : tsQ
  const headTitle =
    target.kind === 'project'
      ? (projectQ.data?.name ?? '프로젝트 상세')
      : (tsQ.data?.title ?? '사례 상세')

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="검토 상세"
        onClick={(e) => e.stopPropagation()}
        className="border-border bg-surface flex h-full w-full max-w-[560px] flex-col border-l shadow-xl"
      >
        {/* 헤더 */}
        <div className="border-divider flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            <p className="text-fg truncate text-base font-bold">{headTitle}</p>
            <p className="text-fg-subtle mt-0.5 text-xs">
              {target.kind === 'project' ? '프로젝트 검토 상세' : '트러블슈팅 검토 상세'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="상세 닫기"
            className="border-border text-fg-muted hover:bg-surface-muted flex shrink-0 items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            <X className="h-3.5 w-3.5" /> 닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {active.isPending && (
            <p className="text-fg-muted py-10 text-center text-sm">
              상세를 불러오는 중…
            </p>
          )}
          {active.isError && (
            <div className="py-10 text-center">
              <p className="text-fg text-sm font-medium">
                상세를 불러오지 못했어요
              </p>
              <button
                type="button"
                onClick={() => active.refetch()}
                className="border-border text-fg-muted hover:bg-surface-muted mt-3 rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                다시 시도
              </button>
            </div>
          )}
          {target.kind === 'project' && projectQ.data && (
            <ProjectBody detail={projectQ.data} nameOf={nameOf} />
          )}
          {target.kind === 'ts' && tsQ.data && (
            <TsBody detail={tsQ.data} nameOf={nameOf} />
          )}
        </div>
      </aside>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5 first:mt-0">
      <p className="text-fg text-sm font-bold">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-fg-subtle text-xs">{label}</p>
      <p className="text-fg mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0)
    return <p className="text-fg-muted text-sm">등록된 항목이 없어요</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span
          key={t}
          className="bg-surface-muted text-fg-muted rounded px-2 py-0.5 text-xs font-medium"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

// 검토 코멘트 — 최근 인증/보완 사유(있을 때만).
function CommentBox({ comment }: { comment: string | null }) {
  if (!comment) return null
  return (
    <Section title="검토 코멘트">
      <p className="bg-surface-muted text-fg-muted rounded-lg px-3 py-2.5 text-sm whitespace-pre-wrap">
        {comment}
      </p>
    </Section>
  )
}

function ProjectBody({
  detail,
  nameOf,
}: {
  detail: ProjectReviewDetail
  nameOf: (userId: string) => string
}) {
  const status = PROJECT_STATUS[detail.status]
  return (
    <div>
      <div className="flex items-center gap-2">
        <StatusBadge label={status.label} tone={status.tone} />
        <StatusBadge label={detail.cohortLabel} tone="info" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MetaItem label="인증 요청일" value={detail.requestedAt ?? '-'} />
        <MetaItem label="인증일" value={detail.certifiedAt ?? '-'} />
        <MetaItem label="최근 수정일" value={detail.updatedAt ?? '-'} />
      </div>

      <Section title={`팀원 ${detail.members.length}명`}>
        {detail.members.length === 0 ? (
          <p className="text-fg-muted text-sm">팀원 정보가 없어요</p>
        ) : (
          <ul className="space-y-2">
            {detail.members.map((m) => (
              <li key={m.userId} className="flex items-center gap-2.5">
                <Avatar name={nameOf(m.userId)} size={28} />
                <span className="text-fg text-sm font-medium">
                  {nameOf(m.userId)}
                </span>
                {m.role && (
                  <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-px text-[10px] font-bold">
                    {m.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="기술 스택">
        <Chips items={detail.stack} />
      </Section>

      <Section title="산출물">
        {detail.artifacts.length === 0 ? (
          <p className="text-fg-muted text-sm">등록된 산출물이 없어요</p>
        ) : (
          <ul className="space-y-2">
            {detail.artifacts.map((a, i) => (
              <li
                key={`${a.title}-${i}`}
                className="bg-surface-muted flex items-center gap-2.5 rounded-lg px-3 py-2"
              >
                <StatusBadge label={a.type} tone="neutral" />
                <span className="text-fg min-w-0 flex-1 truncate text-sm">
                  {a.title}
                </span>
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${a.title} 열기`}
                    className="text-fg-muted hover:text-fg shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : a.fileName ? (
                  <span className="text-fg-subtle flex shrink-0 items-center gap-1 text-xs">
                    <Paperclip className="h-3.5 w-3.5" />
                    {a.fileName}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CommentBox comment={detail.reviewComment} />
    </div>
  )
}

function TsBody({
  detail,
  nameOf,
}: {
  detail: TsReviewDetail
  nameOf: (userId: string) => string
}) {
  const status = TS_STATUS[detail.status]
  const star: { title: string; body: string }[] = [
    { title: '문제 상황', body: detail.situation },
    { title: '해결 과정', body: detail.resolution },
    { title: '결과', body: detail.result },
  ]
  return (
    <div>
      <div className="flex items-center gap-2">
        <StatusBadge label={status.label} tone={status.tone} />
        <StatusBadge label={detail.cohortLabel} tone="info" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MetaItem label="수강생" value={nameOf(detail.studentUserId)} />
        <MetaItem
          label="해결 방식"
          value={detail.independent ? '독립 해결' : '협업 해결'}
        />
        <MetaItem
          label="소요 기간"
          value={detail.daysSpent > 0 ? `${detail.daysSpent}일` : '-'}
        />
        <MetaItem label="작성일" value={detail.createdAt ?? '-'} />
        <MetaItem label="연결 프로젝트" value={detail.project ?? '-'} />
        <MetaItem label="인증일" value={detail.certifiedAt ?? '-'} />
      </div>

      {star.map((s) => (
        <Section key={s.title} title={s.title}>
          <p className="bg-surface-muted text-fg rounded-lg px-3 py-2.5 text-sm whitespace-pre-wrap">
            {s.body || '작성된 내용이 없어요'}
          </p>
        </Section>
      ))}

      <Section title="태그·기술">
        <Chips items={[...detail.tags, ...detail.stack]} />
      </Section>

      <Section title="첨부">
        {detail.attachments.length === 0 ? (
          <p className="text-fg-muted text-sm">첨부가 없어요</p>
        ) : (
          <ul className="space-y-2">
            {detail.attachments.map((a) => (
              <li
                key={a.id}
                className="bg-surface-muted flex items-center gap-2.5 rounded-lg px-3 py-2"
              >
                <Paperclip className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
                <span className="text-fg min-w-0 flex-1 truncate text-sm">
                  {a.label || a.fileName || '첨부'}
                </span>
                {a.url && (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${a.label} 열기`}
                    className="text-fg-muted hover:text-fg shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <CommentBox comment={detail.reviewComment} />
    </div>
  )
}
