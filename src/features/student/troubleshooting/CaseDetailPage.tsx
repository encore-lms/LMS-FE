import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Modal } from '@/components/ui/Modal'
import { usePageHeader } from '@/shared/store'
import { apiClient } from '@/shared/api'
import { useRequestTsCertification, useTsCase } from '../api/troubleshooting'
import { useToast } from '@/components/ui/use-toast'
import { tsKeys } from './queryKeys'
import { useProjectTsLinks } from './projectLinks'
import {
  TS_LINKABLE_PROJECTS,
  type TsAttachment,
  type TsCaseDetail,
  type TsListData,
  type TsProjectLink,
} from './types'
import { ProjectLinkModal } from './components/ProjectLinkModal'
import { CaseContentForm } from './components/CaseContentForm'
import { TONE_SOFT } from '@/shared/lib/tone'

// 트러블슈팅 사례 상세 (/student/troubleshooting/:id) — 트러블슈팅 흐름의 단일 페이지.
//   - 작성 중(draft·미완료)   : 편집 폼(임시 저장·작성 완료). 프로젝트 연결 가능.
//   - 작성 완료(draft·완료)   : 상세(보기) + '인증 요청 준비'에서 인증 요청 / '수정'으로 복귀.
//   - 검토 중(reviewing)      : 상세(잠금). 내용 수정 불가, 강사 승인 대기.
//   - 인증 완료(certified)    : 상세(잠금) + '인증 완료' 배지 + 변경 제안만.
//   - 보기 전용(?view=1)      : 프로젝트 워크스페이스 연결 사례에서 진입. 액션 없이 내용만.
const card =
  'bg-surface rounded-2xl p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

export default function CaseDetailPage() {
  const { id = '' } = useParams()
  // 신규 임시 id(ts_…)는 아직 BE에 없다 — 빈 작성 폼으로 시작(조회 skip은 useTsCase에서).
  const isNew = id.startsWith('ts_')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useTsCase(id)
  const [linkModal, setLinkModal] = useState(false)
  const [certModal, setCertModal] = useState(false)
  // 프로젝트 연결은 projectLinks 스토어(사례↔프로젝트 단일 소스) — 워크스페이스와 동기.
  const connectedPid = useProjectTsLinks((s) => s.projectIdFor(id))
  const connectCase = useProjectTsLinks((s) => s.connectCase)
  const disconnectCase = useProjectTsLinks((s) => s.disconnectCase)
  const toast = useToast()
  // 프로젝트 연결 사례에서 들어오면 보기 전용 — 편집/요청/FAB를 모두 숨긴다.
  const viewOnly = params.get('view') === '1'

  // 페이지 제목 — 진입 맥락별로 다르게.
  const status = data?.status
  const completed = !!data?.completed
  const inList = !!queryClient
    .getQueryData<TsListData>(tsKeys.list())
    ?.cases.some((c) => c.id === id)
  // 태그 — 상세(TsCaseDetail)엔 없어 목록 캐시에서 가져온다(첨부 근거와 함께 표시).
  const caseTags =
    queryClient
      .getQueryData<TsListData>(tsKeys.list())
      ?.cases.find((c) => c.id === id)?.tags ?? []
  usePageHeader(
    viewOnly
      ? '트러블슈팅 사례'
      : status === 'certified'
        ? '트러블슈팅 사례 상세'
        : status === 'reviewing'
          ? '트러블슈팅 사례 검토중'
          : completed
            ? '트러블슈팅 사례 인증요청'
            : inList
              ? '트러블슈팅 사례 이어작성'
              : '새 트러블슈팅 사례',
    viewOnly
      ? '연결된 트러블슈팅 사례의 내용을 확인합니다.'
      : status === 'certified'
        ? '인증 완료된 사례예요. 수정은 변경 제안으로 진행해요.'
        : status === 'reviewing'
          ? '강사 인증 검토 중이에요. 완료 전까지 내용은 잠깁니다.'
          : completed
            ? '작성을 마쳤어요. 프로젝트 연결을 확인하고 인증을 요청하세요.'
            : '상황·해결·결과를 기록하고 프로젝트 연결·작성 완료를 진행해요.',
  )

  const isCertified = data?.status === 'certified'
  const isReviewing = data?.status === 'reviewing'
  const isDraft = data?.status === 'draft'
  // draft(작성 중·작성 완료)는 항상 편집 가능. 인증 요청(검토 중)부터 잠금, 인증 완료는 변경 제안만.
  const editing = !viewOnly && isDraft
  const goChangeRequest = () =>
    navigate(`/student/troubleshooting/${data?.id}/change-requests/new`)

  // 프로젝트 연결 — projectLinks 스토어에서 파생(사례가 연결된 프로젝트).
  const link: TsProjectLink | null = connectedPid
    ? {
        projectId: connectedPid,
        projectTitle:
          TS_LINKABLE_PROJECTS.find((p) => p.id === connectedPid)?.title ??
          connectedPid,
      }
    : null
  const projectLinked = !!link
  const onLinkChange = (next: TsProjectLink | null) => {
    if (next) connectCase(next.projectId, id)
    else disconnectCase(id)
    setLinkModal(false)
    toast.success(
      next
        ? `프로젝트에 연결했어요 — ${next.projectTitle}`
        : '프로젝트 연결을 해제했어요.',
    )
  }

  // 인증 요청(검토 중 전환) — 실 API(POST /{id}/certification-request). SUBMITTED + REQUESTED.
  const certMutation = useRequestTsCertification()
  const onCertify = () => {
    setCertModal(false)
    certMutation.mutate(id, {
      onSuccess: () =>
        toast.success('인증 요청을 보냈어요 · 강사 검토 대기 (검토 중)'),
      onError: () => toast.danger('인증 요청에 실패했어요'),
    })
    // 홈으로 가지 않고 머문다 — 상태가 검토 중으로 바뀌며 같은 페이지가 잠금 화면으로 전환된다.
  }

  // 근거 파일 다운로드 — 인증 헤더가 필요하므로 apiClient(blob)로 받아 브라우저 저장을 트리거.
  const downloadAttachment = async (a: TsAttachment) => {
    try {
      const res = await apiClient.get(
        `/student/troubleshooting/${id}/attachments/${a.id}/file`,
        { responseType: 'blob' },
      )
      const objectUrl = URL.createObjectURL(res.data as Blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = a.label
      link.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.danger('파일을 내려받지 못했어요')
    }
  }

  return (
    <DataBoundary
      isPending={!isNew && isPending}
      isError={!isNew && (isError || !data)}
      onRetry={refetch}
      loadingText="사례를 불러오는 중…"
      errorTitle="사례를 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
      className="p-8"
    >
      {isNew && (
        <div className="flex flex-col gap-5 p-8">
          <CaseContentForm
            caseId={id}
            projectLink={link}
            onConnectProject={() => setLinkModal(true)}
            onRequestCert={() => setCertModal(true)}
          />
        </div>
      )}
      {!isNew && data && (
        <div className={cn('flex flex-col gap-5 p-8', editing && 'pb-28')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-bold',
                  isCertified ? TONE_SOFT.success : TONE_SOFT.accent,
                )}
              >
                {data.statusLabel}
              </span>
              <span
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] font-bold',
                  TONE_SOFT[data.categoryTone],
                )}
              >
                {data.category}
              </span>
              {!viewOnly && !isCertified && !projectLinked && (
                <span
                  className={cn(
                    'rounded px-2 py-0.5 text-[11px] font-bold',
                    TONE_SOFT.warning,
                  )}
                >
                  프로젝트 미연결
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!viewOnly && isCertified && (
                <button
                  type="button"
                  onClick={goChangeRequest}
                  className={buttonClass({ size: 'sm' })}
                >
                  변경 제안
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  viewOnly ? navigate(-1) : navigate('/student/troubleshooting')
                }
                className="border-border text-fg-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
              >
                {viewOnly ? '뒤로' : '목록으로'}
              </button>
            </div>
          </div>

          {editing ? (
            <CaseContentForm
              caseId={id}
              projectLink={link}
              onConnectProject={() => setLinkModal(true)}
              onRequestCert={() => setCertModal(true)}
            />
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              <section className={cn(card, 'flex flex-1 flex-col gap-5')}>
                <div className="flex flex-col gap-1">
                  <span className="text-fg-subtle text-[11px]">사례 제목</span>
                  <h2 className="text-fg text-[18px] font-bold">
                    {data.title}
                  </h2>
                </div>
                {[
                  { label: '상황', text: data.situation },
                  { label: '해결', text: data.resolution },
                  { label: '결과', text: data.result },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="border-divider flex flex-col gap-1.5 border-t pt-4"
                  >
                    <span className="text-fg text-[14px] font-bold">
                      {b.label}
                    </span>
                    <p className="text-fg-muted text-[13px] leading-6">
                      {b.text}
                    </p>
                  </div>
                ))}
                <div className="border-divider flex items-center gap-2 border-t pt-4">
                  <span className="text-fg-subtle text-[11px]">
                    연결 프로젝트
                  </span>
                  <span className="text-fg text-[12px] font-semibold">
                    {link ? link.projectTitle : '연결된 프로젝트 없음'}
                  </span>
                </div>
                <div className="border-divider flex flex-col gap-2 border-t pt-4">
                  <span className="text-fg-subtle text-[11px]">첨부 근거</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {data.attachments.map((a) => {
                      const isLink = a.kind === 'link'
                      const cls =
                        'border-border hover:border-brand/50 flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-left transition-colors'
                      const inner = (
                        <>
                          <span
                            className={cn(
                              'flex size-9 shrink-0 items-center justify-center rounded-lg',
                              isLink
                                ? 'bg-info-bg text-info'
                                : 'bg-success-bg text-success',
                            )}
                          >
                            {isLink ? (
                              <Link2 className="size-4" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="text-fg truncate text-[12px] font-semibold">
                              {a.label}
                            </span>
                            <span className="text-fg-subtle text-[11px]">
                              {isLink ? '링크 열기' : '파일 내려받기'}
                            </span>
                          </div>
                        </>
                      )
                      return isLink ? (
                        <a
                          key={a.id}
                          href={a.url ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={cls}
                        >
                          {inner}
                        </a>
                      ) : (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => downloadAttachment(a)}
                          className={cls}
                        >
                          {inner}
                        </button>
                      )
                    })}
                  </div>
                </div>
                {caseTags.length > 0 && (
                  <div className="border-divider flex flex-col gap-2 border-t pt-4">
                    <span className="text-fg-subtle text-[11px]">태그</span>
                    <div className="flex flex-wrap gap-1.5">
                      {caseTags.map((t) => (
                        <span
                          key={t}
                          className="bg-brand/10 text-brand rounded-full px-2.5 py-0.5 text-[12px] font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <div className="flex flex-col gap-4 lg:w-[320px]">
                {/* 검토 중 — 잠금(수정 불가), 강사 승인 대기 */}
                {!viewOnly && isReviewing && (
                  <section className={cn(card, 'flex flex-col gap-3')}>
                    <span className="text-warning text-[14px] font-bold">
                      검토 중
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      강사 인증 검토를 기다리고 있어요. 인증 완료 전까지 내용은
                      잠겨 있어요.
                    </span>
                    <div
                      className={cn(
                        'flex items-start gap-2 rounded-lg p-2.5 text-[11px] leading-4',
                        link ? 'bg-success-bg' : 'bg-warning-bg',
                      )}
                    >
                      <Link2
                        className={cn(
                          'mt-px size-3.5 shrink-0',
                          link ? 'text-success' : 'text-warning',
                        )}
                      />
                      <span className="text-fg font-medium">
                        {link ? link.projectTitle : '연결된 프로젝트가 없어요'}
                      </span>
                    </div>
                  </section>
                )}

                {/* 인증 완료 — 잠금, 변경 제안만 */}
                {!viewOnly && isCertified && (
                  <section className={cn(card, 'flex flex-col gap-3')}>
                    <span className="text-success text-[14px] font-bold">
                      ✓ 인증 완료
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      인증이 완료된 사례예요. 내용은 잠겨 있고, 수정하려면 변경
                      제안으로 요청하세요.
                    </span>
                    <button
                      type="button"
                      onClick={goChangeRequest}
                      className={buttonClass({ size: 'sm' })}
                    >
                      변경 제안
                    </button>
                  </section>
                )}

                <section className={cn(card, 'flex flex-col gap-3')}>
                  <span className="text-fg text-[14px] font-bold">
                    상태 이력
                  </span>
                  {data.timeline.map((t) => (
                    <div key={t.key} className="flex items-start gap-2.5">
                      <span
                        className={cn(
                          'mt-1 size-2.5 shrink-0 rounded-full',
                          t.state === 'current'
                            ? 'bg-brand'
                            : t.state === 'done'
                              ? 'bg-success'
                              : 'bg-border',
                        )}
                      />
                      <div className="flex flex-col">
                        <span
                          className={cn(
                            'text-[13px] font-semibold',
                            t.state === 'todo' ? 'text-fg-subtle' : 'text-fg',
                          )}
                        >
                          {t.label}
                        </span>
                        <span className="text-fg-subtle text-[11px]">
                          {t.sub}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            </div>
          )}

          {!viewOnly && (
            <ProjectLinkModal
              open={linkModal}
              current={link}
              onClose={() => setLinkModal(false)}
              onLink={onLinkChange}
            />
          )}

          {certModal && (
            <CertifyModal
              data={data}
              projectValue={link ? link.projectTitle : '미연결'}
              onClose={() => setCertModal(false)}
              onConfirm={onCertify}
            />
          )}
        </div>
      )}
    </DataBoundary>
  )
}

function CertifyModal({
  data,
  projectValue,
  onClose,
  onConfirm,
}: {
  data: TsCaseDetail
  projectValue: string
  onClose: () => void
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState<boolean[]>(() =>
    data.certChecklist.map(() => true),
  )
  const allChecked = checked.every(Boolean)
  const toggle = (i: number) =>
    setChecked((p) => p.map((v, j) => (j === i ? !v : v)))
  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title="인증 요청"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChecked}
            className={buttonClass({ size: 'md' })}
          >
            인증 요청
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted -mt-1 text-[12px]">
          프로젝트 연결과 체크리스트를 확인하고 강사 검토 큐로 제출합니다.
        </p>
        <Field label="프로젝트 연결" value={projectValue} />
        <Field label="교과목/검토자" value={data.certReviewer} />
        <div className="flex flex-col gap-2">
          <span className="text-fg text-[12px] font-bold">
            요청 전 체크리스트
          </span>
          {data.certChecklist.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className="flex items-start gap-2 text-left"
            >
              <span
                className={cn(
                  'mt-px flex size-4 shrink-0 items-center justify-center rounded text-[10px] text-white transition-colors',
                  checked[i] ? 'bg-success' : 'border-border bg-surface border',
                )}
              >
                {checked[i] && '✓'}
              </span>
              <span className="text-fg-muted text-[12px] leading-4">{c}</span>
            </button>
          ))}
        </div>
        <div className="bg-info-bg/60 text-fg-muted rounded-lg p-3 text-[11px] leading-4">
          제출 후 상태가 검토 중이 되며, 인증 완료 전까지 내용은 잠깁니다.
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-fg text-[12px] font-bold">{label}</span>
      <span className="border-border bg-surface text-fg rounded-[10px] border px-4 py-3 text-[13px]">
        {value}
      </span>
    </div>
  )
}
