import { useEffect, useMemo, useState } from 'react'
import { Info, Minus, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import type { OpsAccount } from '@/shared/types'

// 담당 범위 편집 카탈로그 (mock) — 과정이 먼저, 그 아래 기수. 검색은 과정·기수를 합쳐 매칭.
const SCOPE_CATALOG: { course: string; cohorts: string[] }[] = [
  { course: 'SKN', cohorts: ['22기', '21기', '20기'] },
  { course: '한화', cohorts: ['21기', '20기', '19기'] },
  { course: 'AI 캠프', cohorts: ['22기', '21기', '20기'] },
  { course: 'DA', cohorts: ['5기', '4기'] },
  { course: 'DE', cohorts: ['3기', '2기'] },
]

const entryOf = (course: string, cohort: string) => `${course} ${cohort}`

// 현재 scope 문자열에서 'X NN기' 형태만 골라 초기 선택으로 복원 (mock).
// '전체 운영 · 모든 과정·기수' 같은 전체 권한/placeholder는 매칭되지 않아 빈 선택으로 시작.
function parseScope(scope: string): string[] {
  return scope
    .split(' · ')
    .map((s) => s.trim())
    .filter((s) => /\d+기/.test(s))
}

interface ScopeModalProps {
  /** non-null이면 해당 계정 기준으로 모달이 열린다. */
  account: OpsAccount | null
  onClose: () => void
  onSave: (account: OpsAccount, scope: string[]) => void
}

// 담당 범위 변경 모달 — 과정 > 기수 카탈로그에서 + 로 담고 - 로 빼며, 과정 무관 검색을 지원한다.
// 같은 과정의 여러 기수(SKN 22기·SKN 21기)는 함께 담을 수 있고, 같은 기수는 중복 추가되지 않는다.
export function ScopeModal({ account, onClose, onSave }: ScopeModalProps) {
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  // 다른 계정으로 모달이 바뀌면 검색어·선택을 해당 계정 기준으로 초기화.
  useEffect(() => {
    if (!account) return
    setQ('')
    setSelected(parseScope(account.scope))
  }, [account])

  // 검색: 과정명·기수·'과정 기수' 합친 문자열 어디든 매칭(과정에 상관없이 기수로도 검색).
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return SCOPE_CATALOG.map((g) => ({
      course: g.course,
      cohorts: g.cohorts.filter((c) => {
        if (!needle) return true
        return (
          entryOf(g.course, c).toLowerCase().includes(needle) ||
          g.course.toLowerCase().includes(needle) ||
          c.toLowerCase().includes(needle)
        )
      }),
    })).filter((g) => g.cohorts.length > 0)
  }, [q])

  const add = (entry: string) =>
    setSelected((p) => (p.includes(entry) ? p : [...p, entry]))
  const remove = (entry: string) =>
    setSelected((p) => p.filter((e) => e !== entry))

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      size="lg"
      title={account ? `담당 범위 변경 — ${account.name}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={() => account && onSave(account, selected)}>
            저장
          </Button>
        </>
      }
    >
      <p className="text-fg-muted -mt-1 mb-3 text-sm">
        과정을 먼저 고르고 기수를 + 로 추가합니다. 같은 과정의 여러 기수를 함께
        담당할 수 있어요.
      </p>

      {/* 검색 — 과정 무관, 기수로도 찾기 */}
      <label className="border-border focus-within:border-brand mb-3 flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
        <Search className="text-fg-subtle h-4 w-4 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="과정·기수 검색 — 예: SKN 22기, 한화 21기"
          aria-label="과정·기수 검색"
          className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        {/* 카탈로그 */}
        <div className="border-border flex flex-col rounded-xl border">
          <p className="border-divider text-fg-subtle border-b px-3 py-2 text-xs font-semibold">
            과정 · 기수
          </p>
          <div className="max-h-72 overflow-y-auto p-2">
            {groups.length === 0 ? (
              <p className="text-fg-subtle px-2 py-8 text-center text-xs">
                검색 결과가 없어요
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.course} className="mb-2 last:mb-0">
                  <p className="text-fg px-1 py-1 text-xs font-bold">
                    {g.course}
                  </p>
                  <div className="flex flex-col gap-1">
                    {g.cohorts.map((c) => {
                      const entry = entryOf(g.course, c)
                      const added = selected.includes(entry)
                      return (
                        <button
                          key={entry}
                          type="button"
                          onClick={() => add(entry)}
                          disabled={added}
                          aria-label={`${entry} 추가`}
                          className={cn(
                            'flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm',
                            added
                              ? 'text-fg-subtle bg-surface-muted cursor-default'
                              : 'text-fg hover:bg-surface-muted',
                          )}
                        >
                          <span>{c}</span>
                          {added ? (
                            <span className="text-[11px] font-medium">
                              추가됨
                            </span>
                          ) : (
                            <Plus className="text-brand h-4 w-4" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 선택된 담당 범위 */}
        <div className="border-border flex flex-col rounded-xl border">
          <p className="border-divider text-fg-subtle border-b px-3 py-2 text-xs font-semibold">
            선택된 담당 범위{selected.length > 0 && ` · ${selected.length}`}
          </p>
          <div className="max-h-72 overflow-y-auto p-2">
            {selected.length === 0 ? (
              <p className="text-fg-subtle px-2 py-8 text-center text-xs">
                아직 추가된 기수가 없어요
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {selected.map((entry) => (
                  <div
                    key={entry}
                    className="bg-surface-muted flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm"
                  >
                    <span className="text-fg">{entry}</span>
                    <button
                      type="button"
                      onClick={() => remove(entry)}
                      aria-label={`${entry} 제거`}
                      className="text-fg-subtle hover:text-danger"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-info-bg mt-3 flex items-start gap-2 rounded-lg p-3">
        <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-fg-muted text-xs">
          같은 과정의 다른 기수(예: SKN 22기 · SKN 21기)는 함께 담당할 수 있고,
          같은 기수는 중복으로 추가되지 않습니다. 저장 시 변경은 감사 로그에
          기록됩니다.
        </p>
      </div>
    </Modal>
  )
}
