import { useState } from 'react'
import { Check, FolderGit2, Link2Off } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import {
  TS_LINKABLE_PROJECTS,
  type TsLinkableProject,
  type TsProjectLink,
} from '../types'

// 트러블슈팅 사례 ↔ 프로젝트(이슈 단위) 연결 모달 — TS_PROJECT_LINK 플래그 뒤에서만 사용.
// 1) 프로젝트 선택 → 2) 그 안의 이슈 선택(또는 이슈 없이 프로젝트만) → 연결.
interface ProjectLinkModalProps {
  open: boolean
  current: TsProjectLink | null
  onClose: () => void
  onLink: (link: TsProjectLink | null) => void
}

export function ProjectLinkModal({
  open,
  current,
  onClose,
  onLink,
}: ProjectLinkModalProps) {
  const [projectId, setProjectId] = useState(current?.projectId ?? '')
  // '' = 아직 미선택, null = 이슈 없이 프로젝트만 연결, string = 특정 이슈.
  const [issueId, setIssueId] = useState<string | null>(
    current?.issueId ?? (current ? null : ''),
  )

  const project: TsLinkableProject | undefined = TS_LINKABLE_PROJECTS.find(
    (p) => p.id === projectId,
  )
  const canLink = !!project && issueId !== ''

  const selectProject = (id: string) => {
    setProjectId(id)
    setIssueId('') // 프로젝트 바꾸면 이슈 선택 초기화
  }

  const confirm = () => {
    if (!project) return
    const issue =
      issueId && issueId !== ''
        ? project.issues.find((i) => i.id === issueId)
        : undefined
    onLink({
      projectId: project.id,
      projectTitle: project.title,
      issueId: issue?.id,
      issueTitle: issue?.title,
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="프로젝트 연결"
      footer={
        <>
          {current && (
            <button
              type="button"
              onClick={() => onLink(null)}
              className="text-danger mr-auto flex items-center gap-1.5 text-[13px] font-semibold"
            >
              <Link2Off className="size-3.5" /> 연결 해제
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg h-10 rounded-[10px] border px-[18px] text-[14px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!canLink}
            className="bg-brand h-10 rounded-[10px] px-[18px] text-[14px] font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            연결
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted -mt-1 text-[12px] leading-5">
          이 사례가 해결한 문제를 프로젝트의 <b>이슈</b>에 연결하세요. 이슈까지
          지정하면 발생 → 해결 → 증빙이 한 줄로 이어집니다.
        </p>

        {/* 1단계 — 프로젝트 */}
        <div className="flex flex-col gap-2">
          <span className="text-fg text-[12px] font-bold">
            1 · 프로젝트 선택
          </span>
          <div className="flex flex-col gap-2">
            {TS_LINKABLE_PROJECTS.map((p) => {
              const on = p.id === projectId
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProject(p.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                    on
                      ? 'border-brand bg-brand/5'
                      : 'border-border hover:border-brand/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      on
                        ? 'bg-brand text-white'
                        : 'bg-surface-muted text-fg-muted',
                    )}
                  >
                    <FolderGit2 className="size-4" />
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-fg text-[13px] font-bold">
                      {p.title}
                    </span>
                    <span className="text-fg-subtle text-[11px]">
                      {p.kindLabel} · 이슈 {p.issues.length}건
                    </span>
                  </span>
                  {on && <Check className="text-brand size-4 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 2단계 — 이슈 */}
        {project && (
          <div className="flex flex-col gap-2">
            <span className="text-fg text-[12px] font-bold">
              2 · 이슈 선택{' '}
              <span className="text-fg-subtle font-medium">
                — {project.title}
              </span>
            </span>
            <div className="flex flex-col gap-1.5">
              {project.issues.map((i) => {
                const on = i.id === issueId
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setIssueId(i.id)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      on
                        ? 'border-brand bg-brand/5'
                        : 'border-border hover:border-brand/40',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] text-white',
                        on ? 'border-brand bg-brand' : 'border-border',
                      )}
                    >
                      {on && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="text-fg text-[12px] font-semibold">
                        {i.title}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        {i.meta}
                      </span>
                    </span>
                  </button>
                )
              })}
              {/* 이슈 없이 프로젝트만 연결(느슨한 연결) */}
              <button
                type="button"
                onClick={() => setIssueId(null)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2.5 text-left transition-colors',
                  issueId === null
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/40',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] text-white',
                    issueId === null
                      ? 'border-brand bg-brand'
                      : 'border-border',
                  )}
                >
                  {issueId === null && (
                    <Check className="size-2.5" strokeWidth={3} />
                  )}
                </span>
                <span className="text-fg-muted text-[12px] font-medium">
                  이슈 없이 프로젝트만 연결
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
