import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import type { OpsAccount, OpsAccountStatus, OpsRole } from '@/shared/types'

const ROLE_LABEL: Record<OpsRole, string> = {
  MANAGER: '매니저',
  INSTRUCTOR: '강사',
  MENTOR: '멘토',
}
const ROLE_TONE: Record<OpsRole, BadgeTone> = {
  MANAGER: 'accent',
  INSTRUCTOR: 'info',
  MENTOR: 'success',
}
const STATUS_LABEL: Record<OpsAccountStatus, string> = {
  active: '활성',
  invited: '초대 전',
  inactive: '비활성',
}
const STATUS_TONE: Record<OpsAccountStatus, BadgeTone> = {
  active: 'success',
  invited: 'warning',
  inactive: 'neutral',
}

interface AccountDetailModalProps {
  account: OpsAccount | null
  /** override 반영된 역할 */
  role: OpsRole
  /** override 반영된 담당 범위 표기 */
  scope: string
  /** override 반영된 상태 */
  status: OpsAccountStatus
  /** 담당 매니저 여부 — true일 때만 하단 '수정' 노출 */
  canEdit: boolean
  onClose: () => void
  /** 하단 '수정' — 수정 모달로 전환 */
  onEdit: () => void
}

// 운영 계정 상세 보기 — 표 행 클릭 시 열림(읽기 전용). 수정은 하단 '수정' 버튼으로만 진입.
export function AccountDetailModal({
  account,
  role,
  scope,
  status,
  canEdit,
  onClose,
  onEdit,
}: AccountDetailModalProps) {
  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title="사용자 정보"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-4 py-2 text-sm font-bold"
          >
            닫기
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="bg-brand-deep text-on-color hover:bg-brand-deep/90 rounded-lg px-4 py-2 text-sm font-bold"
            >
              수정
            </button>
          )}
        </>
      }
    >
      {account && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={account.name} size={48} />
            <div className="min-w-0">
              <p className="text-fg flex items-center gap-1.5 text-base font-bold">
                {account.name}
                {account.isSelf && (
                  <span className="bg-accent-bg text-accent-strong rounded px-1 py-px text-[10px] font-bold">
                    본인
                  </span>
                )}
              </p>
              <p className="text-fg-subtle text-sm">{account.email}</p>
            </div>
          </div>

          <dl className="border-border flex flex-col gap-3 rounded-xl border p-4 text-sm">
            <div className="flex items-center gap-3">
              <dt className="text-fg-muted w-24 shrink-0">역할</dt>
              <dd>
                <StatusBadge label={ROLE_LABEL[role]} tone={ROLE_TONE[role]} />
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="text-fg-muted w-24 shrink-0">상태</dt>
              <dd>
                <StatusBadge
                  label={STATUS_LABEL[status]}
                  tone={STATUS_TONE[status]}
                />
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-24 shrink-0">담당 범위</dt>
              <dd className="text-fg">{scope}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="text-fg-muted w-24 shrink-0">최근 로그인</dt>
              <dd className="text-fg">{account.lastLoginAt ?? '-'}</dd>
            </div>
            {account.scopeWarning && (
              <div className="flex gap-3">
                <dt className="text-fg-muted w-24 shrink-0">안내</dt>
                <dd className="text-warning">{account.scopeWarning}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  )
}
