import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { FileText, Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { Markdown } from '@/components/ui/Markdown'
import { usePageHeader } from '@/shared/store'
import { apiClient } from '@/shared/api'
import { useLinkTsProject, useTsCase } from '../api/troubleshooting'
import { useProjectList } from '../api/projects'
import { useToast } from '@/components/ui/use-toast'
import { tsKeys } from './queryKeys'
import {
  type TsAttachment,
  type TsLinkableProject,
  type TsListData,
  type TsProjectLink,
} from './types'
import { ProjectLinkModal } from './components/ProjectLinkModal'
import { CaseContentForm } from './components/CaseContentForm'
import { TONE_SOFT } from '@/shared/lib/tone'

// 트러블슈팅 사례 상세 (/student/troubleshooting/:id) — 트러블슈팅 흐름의 단일 페이지.
//   - 작성 중(draft·미완료)   : 편집 폼(임시 저장·작성 완료). 프로젝트 연결 가능.
//   - 검토 중(reviewing)      : 상세(잠금). 내용 수정 불가, 강사 승인 대기.
//   - 보기 전용(?view=1)      : 프로젝트 워크스페이스 연결 사례에서 진입. 액션 없이 내용만.
//   - 프로젝트 작성(?projectId=): 프로젝트 이슈 탭에서 진입. 그 프로젝트로 고정해 작성하고
//                                저장하면 이슈 탭으로 돌아간다(연결 대상은 바꾸지 않는다).
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
  // 프로젝트 연결은 사례의 projectId(BE) 가 정본 — 증명서 추적도 이 값을 쓴다.
  // 예전에는 zustand 스토어 + 하드코딩 목록이라 새로고침하면 사라졌다.
  const { data: projectList } = useProjectList()
  const linkProject = useLinkTsProject(id)
  const toast = useToast()
  // 프로젝트 연결 사례에서 들어오면 보기 전용 — 편집/요청/FAB를 모두 숨긴다.
  const viewOnly = params.get('view') === '1'
  // 프로젝트 이슈 탭에서 시작한 작성 — 연결 대상이 이미 정해져 있다.
  const boundProjectId = params.get('projectId')
  const backTo = boundProjectId
    ? `/student/projects/${boundProjectId}?tab=issues`
    : null

  // 페이지 제목 — 진입 맥락별로 다르게.
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
      : inList
        ? '트러블슈팅 사례 이어 작성'
        : '새 트러블슈팅 사례',
    viewOnly
      ? '연결된 트러블슈팅 사례의 내용을 확인합니다.'
      : '상황·해결·결과를 기록해요. 프로젝트 이슈 탭에 바로 남습니다.',
  )

  // 인증 제도 폐기(2026-08-19) — 잠금 상태가 없다. 본인 사례는 언제든 고칠 수 있고,
  // 팀원 사례는 이슈 탭이 ?view=1 로 열어 보기 전용이 된다(쓰기는 서버가 작성자만 허용).
  const editing = !viewOnly

  // 프로젝트 연결 — 서버 값 그대로. 단 신규 초안(ts_…)은 BE에 사례가 아직 없어
  // 연결 선택을 로컬에 들고 있다가 저장(create) 바디의 projectId로 함께 보낸다.
  const [draftLink, setDraftLink] = useState<TsProjectLink | null>(null)
  // 프로젝트에서 시작했으면 그 프로젝트가 곧 연결 대상이다 — 고를 것도, 고를 수도 없다.
  const boundLink: TsProjectLink | null = boundProjectId
    ? {
        projectId: boundProjectId,
        projectTitle:
          projectList?.projects.find((p) => p.id === boundProjectId)?.title ??
          '연결된 프로젝트',
      }
    : null
  const link: TsProjectLink | null = isNew
    ? (boundLink ?? draftLink)
    : (data?.projectLink ?? null)
  const projectLinked = !!link
  // 연결 후보 — 수강생 본인 프로젝트(팀·개인 모두). 작성 중 프로젝트에도 미리 연결할 수 있다.
  const linkableProjects: TsLinkableProject[] = (
    projectList?.projects ?? []
  ).map((p) => ({
    id: p.id,
    title: p.title,
    kindLabel: p.kindLabel,
    desc: p.teamLabel,
  }))
  const onLinkChange = (next: TsProjectLink | null) => {
    // 신규 초안 — BE 호출 없이 로컬 보관. 임시 저장/작성 완료(create) 시 projectId로 반영된다.
    if (isNew) {
      setDraftLink(next)
      setLinkModal(false)
      toast.success(
        next
          ? `프로젝트에 연결했어요 — ${next.projectTitle} (저장 시 반영)`
          : '프로젝트 연결을 해제했어요.',
      )
      return
    }
    if (linkProject.isPending) return
    linkProject.mutate(next?.projectId ?? null, {
      onSuccess: () => {
        setLinkModal(false)
        toast.success(
          next
            ? `프로젝트에 연결했어요 — ${next.projectTitle}`
            : '프로젝트 연결을 해제했어요.',
        )
      },
      onError: () =>
        toast.danger(
          next
            ? '프로젝트 연결에 실패했어요'
            : '프로젝트 연결 해제에 실패했어요',
        ),
    })
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
            projectLocked={!!boundLink}
            returnTo={backTo}
            onConnectProject={() => setLinkModal(true)}
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
                  TONE_SOFT.accent,
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
              {!viewOnly && !projectLinked && (
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
              <button
                type="button"
                onClick={() =>
                  viewOnly
                    ? navigate(-1)
                    : navigate(backTo ?? '/student/projects')
                }
                className="border-border text-fg-muted rounded-lg border px-4 py-2 text-[12px] font-semibold"
              >
                {viewOnly ? '뒤로' : '프로젝트로'}
              </button>
            </div>
          </div>

          {editing ? (
            <CaseContentForm
              caseId={id}
              projectLink={link}
              returnTo={backTo}
              onConnectProject={() => setLinkModal(true)}
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
                    {/* 작성은 마크다운으로 받는다 — 원문 그대로 찍으면 문법이 글자로 보인다. */}
                    <Markdown className="text-[13px]">{b.text}</Markdown>
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
                {/* 인증 제도 폐기(2026-08-19) — 검토 중·인증 완료 잠금 패널을 걷어냈다. */}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 연결 모달은 신규 초안(작성 폼)에서도 열려야 하므로 분기 밖 공통 렌더 —
          예전엔 기존 사례 분기 안에만 있어 초안에서 버튼을 눌러도 무반응이었다. */}
      {!viewOnly && (
        <ProjectLinkModal
          projects={linkableProjects}
          pending={linkProject.isPending}
          open={linkModal}
          current={link}
          onClose={() => setLinkModal(false)}
          onLink={onLinkChange}
        />
      )}
    </DataBoundary>
  )
}
