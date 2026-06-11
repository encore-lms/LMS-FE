import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type {
  BlogSubmissionDetail,
  CertificateSubmissionDetail,
  RecordCategory,
  RecordDecision,
  RecordEvidenceImage,
  StudySubmissionDetail,
} from '@/shared/types'
import {
  useRecordReviewAction,
  useRecordSubmissionDetail,
} from '../api/records'
import {
  recordCategoryFromSegment,
  type RecordSubmissionDetailView,
} from './detailMeta'

// 카테고리별 고정 문구 — Figma textContent 원문 그대로.
const DETAIL_META: Record<
  RecordCategory,
  {
    title: string // 헤더 타이틀
    leftTitle: string // 좌 패널 타이틀
    rightTitle: string // 우 패널 타이틀
    memoPlaceholder: string
  }
> = {
  blog: {
    title: '블로그 검토 상세',
    leftTitle: '블로그 제출 상세',
    rightTitle: '검토 체크',
    memoPlaceholder: '검토 메모 입력',
  },
  study: {
    title: '스터디 검토 상세',
    leftTitle: '스터디 증빙 상세',
    rightTitle: '처리 판단',
    memoPlaceholder: '보완 요청 사유 입력',
  },
  certificate: {
    title: '자격증 검토 상세',
    leftTitle: '자격증 검토 상세',
    rightTitle: '승인 처리',
    memoPlaceholder: '검토 메모 입력',
  },
}

// 검토 체크 4항목 — Figma대로 정적 불릿 안내문(체크박스 아님).
const BLOG_CHECKLIST = [
  '- 본인 작성 여부 확인',
  '- 주차/과정 맥락 일치',
  '- 개인정보 노출 없음',
  '- 코드/이미지 저작권 위험 없음',
]

// KPI '제출 상태' 값 — 큐 STATUS_META('보완 요청')와 달리 Figma KPI는 '보완' 단독 표기.
const KPI_STATUS_LABEL: Record<'pending' | 'changes_requested', string> = {
  pending: '대기',
  changes_requested: '보완',
}

// 필 공통 — Figma 필 전체에 border #e5e7eb가 깔려 있어 틴트 배경에도 border 유지.
const pill =
  'rounded-md border border-border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

interface Kpi {
  label: string
  value: ReactNode
  hint?: string
}

function buildKpis(d: RecordSubmissionDetailView): Kpi[] {
  const status = {
    label: '제출 상태',
    value: KPI_STATUS_LABEL[d.status],
    hint: d.statusCaption ?? d.submissionLabel,
  }
  switch (d.category) {
    case 'blog':
      return [
        status,
        { label: 'URL 점검', value: d.urlCheck.label, hint: d.urlCheck.note },
        {
          label: '개인정보',
          value: d.privacyCheck.label,
          hint: d.privacyCheck.note,
        },
        {
          label: '마일리지',
          value: d.mileageCandidate ? '후보' : '—',
          hint: d.mileageCandidate ?? '후보 없음',
        },
      ]
    case 'study':
      return [
        status,
        {
          label: '활동 시간',
          value: `${d.activityHours}h`,
          hint: d.activityTimeRange,
        },
        {
          label: '연속 달성',
          value: `${d.streakCount}회`,
          hint: '마일리지 후보',
        },
        {
          label: '증빙 품질',
          value: d.evidenceQuality.level === 'warning' ? '주의' : '정상',
          hint: d.evidenceQuality.note,
        },
      ]
    case 'certificate':
      return [
        status,
        {
          label: '증빙',
          value: `${d.evidenceImages.length}장`,
          hint: 'OCR 후보 있음',
        },
        {
          label: '인증 정책',
          value: d.policyAllowed ? '허용' : '불가',
          hint: d.allowedCertificates.join('/'),
        },
        {
          label: '마일리지',
          value: d.mileageCandidate ?? '—',
          hint: '승인 시 후보',
        },
      ]
  }
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-fg text-xs font-semibold">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function EvidenceThumb({
  image,
  caption,
  className,
}: {
  image: RecordEvidenceImage
  caption: string
  className?: string
}) {
  const blurry = image.quality === 'blurry'
  return (
    <div
      className={cn(
        'border-border flex items-center justify-center rounded-lg border text-sm',
        blurry
          ? 'bg-warning-bg text-warning'
          : 'bg-surface-muted text-fg-muted',
        className,
      )}
    >
      {blurry ? (image.note ?? '흐림 · 재제출 권장') : caption}
    </div>
  )
}

function BlogBody({ d }: { d: BlogSubmissionDetail }) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <Field label="제출 URL">
        <a
          href={d.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-info text-sm break-all hover:underline"
        >
          {d.externalUrl}
        </a>
      </Field>
      <Field label="미리보기 요약">
        <p className="text-fg-muted text-sm leading-relaxed">
          {d.previewSummary}
        </p>
      </Field>
      <Field label="증명서 반영 후보">
        <p className="text-fg-muted text-sm">
          {d.certificateCandidates.join(' · ')}
        </p>
      </Field>
    </div>
  )
}

function StudyBody({ d }: { d: StudySubmissionDetail }) {
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {d.evidenceImages.map((img) => (
          <EvidenceThumb
            key={img.id}
            image={img}
            caption="스터디 인증 이미지"
            className="aspect-[4/3]"
          />
        ))}
      </div>
      <Field label="활동 내용">
        <p className="text-fg-muted text-sm leading-relaxed">
          {d.activityNote}
        </p>
      </Field>
    </div>
  )
}

function CertificateBody({ d }: { d: CertificateSubmissionDetail }) {
  const [first] = d.evidenceImages
  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
        {first && (
          <EvidenceThumb
            image={first}
            caption="자격증 증빙 이미지"
            className="h-[220px] w-full max-w-[300px] shrink-0"
          />
        )}
        <Field label="OCR 추출">
          <div className="text-fg-muted flex flex-col gap-1 text-sm">
            <p>자격명: {d.ocr.certificateName}</p>
            {d.ocr.grade && <p>등급: {d.ocr.grade}</p>}
            <p>응시자: {d.ocr.holderName}</p>
            <p>취득일: {d.ocr.acquiredAt}</p>
          </div>
        </Field>
      </div>
      <Field label="정책 확인">
        <p className="text-fg-muted text-sm leading-relaxed">{d.policyNote}</p>
      </Field>
    </div>
  )
}

// 학습 기록 검토 상세 3종 (/admin/records/{blog|study|certificates}/:submissionId)
// — 운영(MANAGER) 단독 검토. KPI 4종 + [좌]제출 상세 / [우]검토 체크·결정.
// (Figma 블로그 1515:10927 · 스터디 1515:11144 · 자격증 1515:11361)
export default function RecordReviewDetailPage({
  segment,
}: {
  segment: string
}) {
  const { submissionId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const category = recordCategoryFromSegment(segment)
  const meta = category ? DETAIL_META[category] : null
  usePageHeader(
    meta?.title ?? '학습 기록 검토 상세',
    `/admin/records/${segment}/:submissionId`,
  )
  const [reason, setReason] = useState('')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const { data, isPending, isError, refetch } = useRecordSubmissionDetail(
    category ?? 'blog',
    category ? submissionId : '',
  )
  const reviewAction = useRecordReviewAction()

  const goQueue = () => navigate('/admin/records/review')

  // 라우트는 3종 고정이라 보통 도달하지 않지만, 세그먼트 드리프트 대비 Empty 가드.
  if (!category || !meta) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="지원하지 않는 카테고리예요"
          description="블로그·스터디·자격증 검토 상세만 제공돼요."
          action={<Button onClick={goQueue}>학습 기록 검토로</Button>}
        />
      </div>
    )
  }
  if (isPending) {
    return <div className="text-fg-muted p-8">검토 상세를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="검토 상세를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const d = data
  const hasReason = reason.trim().length > 0
  const busy = reviewAction.isPending

  const decide = (decision: RecordDecision) => {
    reviewAction.mutate(
      {
        recordId: d.id,
        category: d.category,
        decision,
        // TODO: reasonCode enum은 BE 확정 대기 — Figma에 사유 코드 선택 UI 없음, comment만 채운다.
        payload: { studentVisibleComment: reason.trim() },
      },
      {
        onSuccess: () => {
          const name = d.student.name
          if (decision === 'approve') {
            toast.success(
              `승인 처리 — ${name}${
                d.mileageCandidate ? ' · 마일리지 지급 후보 생성' : ''
              }`,
            )
          } else if (decision === 'changes') {
            toast.warning(`보완 요청 — ${name} · 학생에게 알림 발송`)
          } else {
            toast.danger(`반려 — ${name} · 사유 코멘트 학생에게 발송`)
          }
          goQueue()
        },
        onError: () =>
          toast.danger('처리에 실패했어요 — 잠시 후 다시 시도해 주세요.'),
      },
    )
  }

  // 스터디 안내문 — 첫 문장은 흐림 증빙 위치에 따라 가변, 뒷 문장은 고정(Figma 원문).
  const blurryIdx =
    d.category === 'study'
      ? d.evidenceImages.findIndex((img) => img.quality === 'blurry')
      : -1
  const studyGuidance =
    (blurryIdx >= 0
      ? `증빙 ${blurryIdx + 1}번 이미지가 흐려 스터디 참석자 확인이 어렵습니다. `
      : '') + '보완 요청 시 수강생 기록실에 상태와 알림이 전달됩니다.'
  const certGuidance =
    '승인 전 이름/취득일/자격 유형을 확인하세요. 미지급 마일리지는 승인 후 별도 지급 후보로 생성됩니다.'

  return (
    <div className="p-8">
      {/* 액션 필 행 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goQueue}
          className={cn(pill, 'bg-surface-muted text-fg-muted hover:text-fg')}
        >
          <ArrowLeft className="mr-1 inline h-3 w-3" /> 학습 기록 검토
        </button>
        <div className="flex items-center gap-3">
          {d.category === 'blog' && (
            <a
              href={d.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(pill, 'bg-info-bg text-info hover:bg-info-bg/70')}
            >
              새 탭 열기
            </a>
          )}
          {d.category === 'study' && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className={cn(pill, 'bg-info-bg text-info hover:bg-info-bg/70')}
            >
              라이트박스
            </button>
          )}
          {d.category === 'certificate' && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className={cn(pill, 'bg-info-bg text-info hover:bg-info-bg/70')}
            >
              이미지 확대
            </button>
          )}
          {d.category !== 'certificate' ? (
            <button
              type="button"
              disabled={!hasReason || busy}
              onClick={() => decide('changes')}
              className={cn(
                pill,
                'bg-warning-bg text-warning hover:bg-warning-bg/70',
              )}
            >
              보완 요청
            </button>
          ) : (
            <button
              type="button"
              // 후보 확인 결과 화면은 디자인 부재(openQuestions) — 목 단계 토스트로 대응.
              onClick={() =>
                toast.info(
                  `지급 후보 확인 — ${d.mileageCandidate ?? '후보 없음'} · 승인 시 지급 후보 생성`,
                )
              }
              className={cn(pill, 'bg-brand text-on-color hover:bg-brand/90')}
            >
              후보 확인
            </button>
          )}
        </div>
      </div>

      {/* KPI 4종 */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {buildKpis(d).map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            hint={k.hint}
          />
        ))}
      </div>

      {/* 2패널 — 좌 제출 상세 / 우 검토 체크·결정 */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="border-border bg-surface rounded-xl border p-5">
          <h2 className="text-fg text-lg font-bold">{meta.leftTitle}</h2>
          <p className="text-fg-muted mt-1 text-sm">
            {d.student.name} · {d.student.cohort} · {d.submissionLabel}
          </p>
          {d.category === 'blog' && <BlogBody d={d} />}
          {d.category === 'study' && <StudyBody d={d} />}
          {d.category === 'certificate' && <CertificateBody d={d} />}
        </section>

        <section className="border-border bg-surface flex flex-col rounded-xl border p-5">
          <h2 className="text-fg text-lg font-bold">{meta.rightTitle}</h2>
          {d.category === 'blog' && (
            <ul className="text-fg-muted mt-4 flex flex-col gap-1.5 text-sm">
              {BLOG_CHECKLIST.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {d.category === 'study' && (
            <p className="text-fg-muted mt-4 text-sm leading-relaxed">
              {studyGuidance}
            </p>
          )}
          {d.category === 'certificate' && (
            <p className="text-fg-muted mt-4 text-sm leading-relaxed">
              {certGuidance}
            </p>
          )}

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            aria-label="검토 메모"
            placeholder={meta.memoPlaceholder}
            className="border-border bg-surface-muted focus:border-brand text-fg placeholder:text-fg-subtle mt-6 w-full rounded-md border p-3 text-sm outline-none"
          />

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!hasReason || busy}
              onClick={() => decide('reject')}
              className={cn(
                pill,
                'bg-danger-bg text-danger hover:bg-danger-bg/70 px-4',
              )}
            >
              반려
            </button>
            {d.category === 'study' && (
              <button
                type="button"
                disabled={!hasReason || busy}
                onClick={() => decide('changes')}
                className={cn(
                  pill,
                  'bg-warning-bg text-warning hover:bg-warning-bg/70 px-4',
                )}
              >
                보완
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => decide('approve')}
              className={cn(
                pill,
                'bg-brand text-on-color hover:bg-brand/90 px-4',
              )}
            >
              승인
            </button>
          </div>
        </section>
      </div>

      {/* 라이트박스 — 오버레이 디자인 부재(openQuestions): 공통 Modal로 증빙 확대 표시 */}
      {(d.category === 'study' || d.category === 'certificate') && (
        <Modal
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title="증빙 이미지"
          size="lg"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {d.evidenceImages.map((img) => (
              <EvidenceThumb
                key={img.id}
                image={img}
                caption={
                  d.category === 'study'
                    ? '스터디 인증 이미지'
                    : '자격증 증빙 이미지'
                }
                className="aspect-[4/3]"
              />
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
