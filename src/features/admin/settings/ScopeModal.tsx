import { useEffect, useMemo, useState } from 'react'
import { Check, Info, Minus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import type { OpsAccount } from '@/shared/types'

// 담당 범위 편집 카탈로그 (mock) — 과정이 먼저, 그 아래 기수.
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

// 담당 범위 변경 모달 — 과정을 먼저 고르면 그 과정의 기수가 나타나고, 기수를 눌러 선택/해제한다.
// 여러 과정에서 기수를 담을 수 있고, 같은 기수는 한 번만 담긴다.
export function ScopeModal({ account, onClose, onSave }: ScopeModalProps) {
  const [q, setQ] = useState('')
  const [activeCourse, setActiveCourse] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  // 다른 계정으로 모달이 바뀌면 검색어·선택 과정·선택 기수를 초기화.
  useEffect(() => {
    if (!account) return
    setQ('')
    setActiveCourse(null)
    setSelected(parseScope(account.scope))
  }, [account])

  // 과정 검색 — 과정명 또는 그 과정의 기수가 검색어에 걸리면 노출(과정 무관 기수 검색 지원).
  const courses = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return SCOPE_CATALOG
    return SCOPE_CATALOG.filter(
      (g) =>
        g.course.toLowerCase().includes(needle) ||
        g.cohorts.some((c) =>
          entryOf(g.course, c).toLowerCase().includes(needle),
        ),
    )
  }, [q])

  const active = activeCourse
    ? SCOPE_CATALOG.find((g) => g.course === activeCourse)
    : undefined

  const countOf = (course: string) =>
    selected.filter((e) => e.startsWith(`${course} `)).length

  const toggle = (entry: string) =>
    setSelected((p) =>
      p.includes(entry) ? p.filter((e) => e !== entry) : [...p, entry],
    )
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
        과정을 먼저 선택하면 그 과정의 기수가 나타납니다. 기수를 눌러 선택하거나
        해제하세요.
      </p>

      {/* 과정 검색 */}
      <label className="border-border focus-within:border-brand mb-3 flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
        <Search className="text-fg-subtle h-4 w-4 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="과정 검색 — 예: SKN, 한화 (기수로도 검색)"
          aria-label="과정 검색"
          className="text-fg placeholder:text-fg-subtle w-full bg-transparent text-sm outline-none"
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        {/* 1단계: 과정 선택 */}
        <div className="border-border flex flex-col rounded-xl border">
          <p className="border-divider text-fg-subtle border-b px-3 py-2 text-xs font-semibold">
            1. 과정 선택
          </p>
          <div className="max-h-72 overflow-y-auto p-2">
            {courses.length === 0 ? (
              <p className="text-fg-subtle px-2 py-8 text-center text-xs">
                검색 결과가 없어요
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {courses.map((g) => {
                  const count = countOf(g.course)
                  const isActive = g.course === activeCourse
                  return (
                    <button
                      key={g.course}
                      type="button"
                      onClick={() => setActiveCourse(g.course)}
                      aria-pressed={isActive}
                      className={cn(
                        'flex items-center justify-between rounded-md px-2.5 py-2 text-left text-sm',
                        isActive
                          ? 'bg-accent-bg text-accent-strong font-semibold'
                          : 'text-fg hover:bg-surface-muted',
                      )}
                    >
                      <span>{g.course}</span>
                      {count > 0 && (
                        <span className="bg-brand-deep rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2단계: 기수 선택/해제 */}
        <div className="border-border flex flex-col rounded-xl border">
          <p className="border-divider text-fg-subtle border-b px-3 py-2 text-xs font-semibold">
            2. 기수 선택{active ? ` · ${active.course}` : ''}
          </p>
          <div className="max-h-72 overflow-y-auto p-2">
            {!active ? (
              <p className="text-fg-subtle px-2 py-8 text-center text-xs">
                왼쪽에서 과정을 먼저 선택하세요
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {active.cohorts.map((c) => {
                  const entry = entryOf(active.course, c)
                  const on = selected.includes(entry)
                  return (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => toggle(entry)}
                      aria-pressed={on}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm',
                        on ? 'text-fg' : 'text-fg-muted hover:bg-surface-muted',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          on
                            ? 'border-brand bg-brand text-white'
                            : 'border-border bg-white',
                        )}
                      >
                        {on && <Check className="h-3 w-3" />}
                      </span>
                      <span>{c}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 선택된 담당 범위 요약 */}
      <div className="border-border mt-3 rounded-xl border p-3">
        <p className="text-fg-subtle mb-2 text-xs font-semibold">
          선택된 담당 범위{selected.length > 0 && ` · ${selected.length}`}
        </p>
        {selected.length === 0 ? (
          <p className="text-fg-subtle text-xs">아직 선택된 기수가 없어요</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((entry) => (
              <span
                key={entry}
                className="bg-surface-muted text-fg flex items-center gap-1 rounded-md px-2 py-1 text-xs"
              >
                {entry}
                <button
                  type="button"
                  onClick={() => remove(entry)}
                  aria-label={`${entry} 제거`}
                  className="text-fg-subtle hover:text-danger"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-info-bg mt-3 flex items-start gap-2 rounded-lg p-3">
        <Info className="text-info mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-fg-muted text-xs">
          여러 과정의 기수를 함께 담당할 수 있고, 같은 기수는 한 번만 담깁니다.
          저장 시 변경은 감사 로그에 기록됩니다.
        </p>
      </div>
    </Modal>
  )
}
