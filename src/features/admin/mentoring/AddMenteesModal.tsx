import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/use-toast'
import { apiErrorOf, useAddTeamMembers, useCohortStudents } from './api'
import { SearchInput } from '@/components/ui/SearchInput'

interface AddMenteesModalProps {
  open: boolean
  onClose: () => void
  teamId: string
  cohortId: string
  /** 이미 팀에 속한 멘티 userId — 목록에서 제외 */
  existingIds: string[]
}

/** 멘티(팀원) 추가 — 기수 수강생 중 아직 팀에 없는 인원을 다중 선택해 추가. */
export function AddMenteesModal({
  open,
  onClose,
  teamId,
  cohortId,
  existingIds,
}: AddMenteesModalProps) {
  const toast = useToast()
  const options = useCohortStudents(cohortId)
  const addMembers = useAddTeamMembers()
  const [selected, setSelected] = useState<string[]>([])
  const [q, setQ] = useState('')

  const candidates = useMemo(() => {
    const set = new Set(existingIds)
    const list = (options.data?.students ?? []).filter(
      (s) => !set.has(s.userId),
    )
    const needle = q.trim().toLowerCase()
    return needle
      ? list.filter((s) => s.name.toLowerCase().includes(needle))
      : list
  }, [options.data, existingIds, q])

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const close = () => {
    setSelected([])
    setQ('')
    onClose()
  }

  const submit = () => {
    if (selected.length === 0) {
      toast.danger('추가할 수강생을 1명 이상 선택해 주세요.')
      return
    }
    addMembers.mutate(
      { teamId, studentUserIds: selected },
      {
        onSuccess: () => {
          toast.success(`멘티 ${selected.length}명을 추가했어요.`)
          close()
        },
        onError: (error) =>
          toast.danger(apiErrorOf(error).message ?? '멘티 추가에 실패했어요.'),
      },
    )
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="멘티 추가"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
          <Button onClick={submit} disabled={addMembers.isPending}>
            {addMembers.isPending ? '추가 중…' : '추가'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-fg-muted text-xs font-bold">
          수강생 선택 ({selected.length}명 선택됨)
        </p>
        <div className="relative">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="이름 검색"
            ariaLabel="수강생 이름 검색"
            className="h-10 w-full"
          />
        </div>
        <div className="border-border max-h-64 overflow-y-auto rounded-lg border">
          {options.isPending ? (
            <p className="text-fg-subtle p-4 text-center text-xs">
              수강생을 불러오는 중…
            </p>
          ) : candidates.length === 0 ? (
            <p className="text-fg-subtle p-4 text-center text-xs">
              추가할 수 있는 수강생이 없어요
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {candidates.map((s) => (
                <li key={s.userId}>
                  <label className="hover:bg-surface-muted flex cursor-pointer items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(s.userId)}
                      onChange={() => toggle(s.userId)}
                      className="accent-brand h-4 w-4"
                    />
                    <span className="text-fg text-sm font-medium">
                      {s.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  )
}
