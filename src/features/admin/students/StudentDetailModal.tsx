import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { StudentAccount } from '@/shared/types'

interface StudentDetailModalProps {
  account: StudentAccount | null
  /** 진입 맥락 라벨 — 로그인 차단/해제 등 (행 액션에서 전달) */
  actionLabel?: string
  onClose: () => void
  onSave: (memo: string) => void
}

// 학생 계정 상세 — 실행 전 처리 요약 + 매니저 메모 확인 모달. (Figma 1306:8182)
// 계정 행/액션 클릭 시 열리며, 저장 결과는 감사 로그에 남는다(mock).
export function StudentDetailModal({
  account,
  actionLabel,
  onClose,
  onSave,
}: StudentDetailModalProps) {
  const [memo, setMemo] = useState('')

  // 다른 학생으로 모달이 바뀌면 입력 중이던 메모를 비운다.
  useEffect(() => {
    setMemo('')
  }, [account?.id])

  const rows = account
    ? [
        { label: '학생', value: `${account.name} · ${account.id}` },
        {
          label: '계정 상태',
          value: account.loginBlocked
            ? '로그인 차단'
            : `정상 · 마지막 로그인 ${account.lastLoginAt ?? '미접속'}`,
        },
        {
          label: 'HRD 상태',
          value:
            account.trainingStatus === 'dropout'
              ? 'trainingStatus 중도탈락'
              : 'trainingStatus 정상 · 최근 동기화 적용',
        },
        {
          label: '보안 액션',
          value: actionLabel ?? '없음 — 계정 정보 조회',
        },
      ]
    : []

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title="학생 계정 상세"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => onSave(memo)}>저장</Button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-4 text-sm">
        계정 상태·HRD 동기화·보안 액션을 확인합니다.
      </p>

      <div className="border-border rounded-xl border p-4">
        <p className="text-fg text-sm font-bold">처리 요약</p>
        <p className="text-fg-subtle mt-0.5 text-xs">
          실행 전 확인할 주요 항목입니다.
        </p>
        <dl className="mt-3 flex flex-col gap-2">
          {rows.map((r) => (
            <div key={r.label} className="flex gap-3 text-sm">
              <dt className="text-fg-muted w-20 shrink-0">{r.label}</dt>
              <dd className="text-fg">{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={3}
        aria-label="매니저 메모"
        placeholder="매니저 메모 (선택) — 처리 사유를 남기면 감사 로그에 함께 기록됩니다"
        className="border-border focus:border-brand text-fg placeholder:text-fg-subtle bg-surface mt-4 w-full rounded-lg border p-3 text-sm outline-none focus-visible:shadow-none"
      />

      <div className="bg-info-bg mt-4 flex items-start gap-2 rounded-lg p-3">
        <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-fg text-xs font-medium">권한 확인</p>
          <p className="text-fg-muted text-xs">
            현재 매니저 권한으로 실행 가능하며 결과는 감사 로그에 남습니다.
          </p>
        </div>
      </div>
    </Modal>
  )
}
