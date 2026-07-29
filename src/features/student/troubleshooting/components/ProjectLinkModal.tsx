import { useState } from 'react'
import { Check, FolderGit2, Link2Off } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/components/ui/Modal'
import { buttonClass } from '@/components/ui/buttonClass'
import { Empty } from '@/components/ui/Empty'
import type { TsLinkableProject, TsProjectLink } from '../types'

// 트러블슈팅 사례 ↔ 프로젝트 연결 모달 — 프로젝트만 선택(이슈 단위 연결은 제외).
// 목록은 수강생이 실제로 참여한 프로젝트(부모가 /student/projects 에서 받아 넘긴다).
// 예전에는 하드코딩된 상수 3건을 보여줬다 — 남의 프로젝트가 뜨고 연결도 저장되지 않았다.
interface ProjectLinkModalProps {
  open: boolean
  current: TsProjectLink | null
  /** 연결 후보 — 수강생 본인 프로젝트. 비어 있으면 안내를 띄운다. */
  projects: TsLinkableProject[]
  pending?: boolean
  onClose: () => void
  onLink: (link: TsProjectLink | null) => void
}

export function ProjectLinkModal({
  open,
  current,
  projects,
  pending = false,
  onClose,
  onLink,
}: ProjectLinkModalProps) {
  const [projectId, setProjectId] = useState(current?.projectId ?? '')

  const project: TsLinkableProject | undefined = projects.find(
    (p) => p.id === projectId,
  )
  const canLink = !!project && !pending

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
            className={buttonClass({ size: 'md' })}
          >
            {pending ? '연결 중…' : '연결'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-fg-muted -mt-1 text-[12px] leading-5">
          이 사례가 해결한 문제와 관련된 <b>프로젝트</b>를 연결하세요. 연결하면
          증명서에서 사례가 프로젝트와 함께 추적됩니다.
        </p>

        {projects.length === 0 ? (
          <Empty
            title="연결할 프로젝트가 없어요"
            description="프로젝트를 먼저 만들고 다시 시도해 주세요."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => {
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
        )}
      </div>
    </Modal>
  )
}
