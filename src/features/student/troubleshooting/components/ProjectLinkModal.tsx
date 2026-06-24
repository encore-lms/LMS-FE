import { useState } from 'react'
import { Check, FolderGit2, Link2Off } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import {
  TS_LINKABLE_PROJECTS,
  type TsLinkableProject,
  type TsProjectLink,
} from '../types'

// 트러블슈팅 사례 ↔ 프로젝트 연결 모달 — 프로젝트만 선택(이슈 단위 연결은 제외).
// 프로젝트 선택 → 연결. 연결 해제도 지원.
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

  const project: TsLinkableProject | undefined = TS_LINKABLE_PROJECTS.find(
    (p) => p.id === projectId,
  )
  const canLink = !!project

  const confirm = () => {
    if (!project) return
    onLink({ projectId: project.id, projectTitle: project.title })
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
          이 사례가 해결한 문제와 관련된 <b>프로젝트</b>를 연결하세요. 연결하면
          증명서에서 사례가 프로젝트와 함께 추적됩니다.
        </p>

        <div className="flex flex-col gap-2">
          {TS_LINKABLE_PROJECTS.map((p) => {
            const on = p.id === projectId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProjectId(p.id)}
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
                    {p.kindLabel} · {p.desc}
                  </span>
                </span>
                {on && <Check className="text-brand size-4 shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
