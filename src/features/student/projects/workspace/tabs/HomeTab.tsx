import { useState } from 'react'
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  Clipboard,
  Command,
  FileText,
  Files,
  Link2,
  ListChecks,
  Send,
  Timer,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { useUpdateTaskStatus } from '../../../api/projects'
import { statusToPhase, useProjectFlow } from '../useProjectFlow'
import type {
  Tone,
  WorkspaceData,
  WsActivity,
  WsTab,
  WsTask,
} from '../../types'
import { Avatar, Chip } from '../components/ws-shared'
import { TONE_SOFT, TONE_SOLID, TONE_TEXT } from '@/shared/lib/tone'
import { card, phaseCertBadge } from '../components/ws-style'

function kpiIcon(label: string): LucideIcon {
  if (label.includes('이슈')) return TriangleAlert
  if (label.includes('회의')) return FileText
  if (label.includes('산출') || label.includes('문서')) return Files
  if (label.includes('인증')) return CircleCheck
  return Clipboard
}
// KPI 카드가 이동할 탭.
function kpiTarget(label: string): WsTab {
  if (label.includes('이슈')) return 'issues'
  if (label.includes('회의')) return 'meetings'
  if (label.includes('산출') || label.includes('문서')) return 'docs'
  if (label.includes('인증')) return 'certification'
  return 'board'
}
// KPI 우상단 링크 라벨.
function kpiLinkLabel(tab: WsTab): string {
  if (tab === 'meetings') return '회의록'
  if (tab === 'docs') return '문서·파일'
  if (tab === 'issues') return '이슈'
  if (tab === 'certification') return '인증'
  return '보드·작업'
}

// KPI 진행바 채움 — 퍼센트는 값, 'a / b'는 비율, 그 외(건수)는 시각적 채움(Figma는 전 카드에 바).
function kpiFill(stat: { value: string; unit: string; sub: string }): number {
  const n = Number(stat.value.replace(/[^\d.]/g, ''))
  if (stat.unit === '%')
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 30
  const m = stat.sub.match(/(\d+)\s*\/\s*(\d+)/)
  if (m && Number(m[2]) > 0)
    return Math.min(100, (Number(m[1]) / Number(m[2])) * 100)
  return Number.isFinite(n) ? Math.min(100, Math.max(8, n * 5)) : 30
}

// 활동 아이콘·톤 — kind 우선(완료 작업은 체크), kind 없으면 본문 키워드 추론(타 워크스페이스 폴백).
function activityVisual(a: WsActivity): { Icon: LucideIcon; tone: Tone } {
  if (a.kind === '작업' && /완료\s*$/.test(a.action))
    return { Icon: CircleCheck, tone: 'success' }
  switch (a.kind) {
    case '회의록':
      return { Icon: FileText, tone: 'info' }
    case '산출물':
      return { Icon: Link2, tone: 'accent' }
    case '이슈':
      return { Icon: TriangleAlert, tone: 'warning' }
    case '작업':
      return { Icon: Clipboard, tone: 'brand' }
  }
  if (/PR|머지|커밋|GitHub|브랜치|배포|push/i.test(a.action))
    return { Icon: Link2, tone: 'info' }
  if (a.action.includes('회의록')) return { Icon: FileText, tone: 'accent' }
  if (a.action.includes('이슈')) return { Icon: TriangleAlert, tone: 'warning' }
  if (a.action.includes('완료')) return { Icon: CircleCheck, tone: 'success' }
  return { Icon: Clipboard, tone: 'brand' }
}
// 완료 배너(§17) — 종료된 모든 프로젝트에 동일하게 노출(프로젝트별 데이터에 의존하지 않음).
const COMPLETION_BANNER = {
  title: '프로젝트가 완벽히 종료 되었네요',
  desc: '강사·운영 완료 확정 후 3일 안에 팀원 상호평가를 제출해야 내 증명서 협업 근거가 최신화됩니다.',
}

// 생애주기 단계 → 인증 상태 배지(목 데이터 대신 시뮬레이션 단계를 따른다).
export function HomeTab({
  d,
  onTab,
}: {
  d: WorkspaceData
  onTab: (t: WsTab) => void
}) {
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const toast = useToast()
  const updateStatusM = useUpdateTaskStatus(d.id)
  // 체크하면 실 BE에 작업을 완료(DONE) 처리 — 완료된 작업은 다음 조회 시 내 작업에서 빠진다.
  const [doneTasks, setDoneTasks] = useState<Set<string>>(() => new Set())
  const completeTask = (t: WsTask) => {
    if (!t.id || doneTasks.has(t.title)) return
    setDoneTasks((prev) => new Set(prev).add(t.title)) // 낙관적 체크
    updateStatusM.mutate(
      { taskId: t.id, status: 'DONE' },
      {
        onSuccess: () => toast.success('작업을 완료 처리했습니다'),
        onError: () => {
          setDoneTasks((prev) => {
            const n = new Set(prev)
            n.delete(t.title)
            return n
          })
          toast.danger('완료 처리에 실패했어요.')
        },
      },
    )
  }
  // 마감 임박 = 미완료 + 마감(D-n) 표기가 있는 할 일.
  const dueSoonCount = d.myTasks.filter(
    (t) => /D-\d/.test(t.due) && !doneTasks.has(t.title),
  ).length

  return (
    <div className="flex flex-col gap-4">
      {/* 완료·상호평가 안내 배너 — 종료(완료 확정 이후, active 아님)면 모든 프로젝트에 동일 노출. 상호평가 탭과 동일 조건. */}
      {phase !== 'active' && (
        <div className="bg-brand/10 border-brand/20 flex items-center justify-between gap-4 rounded-2xl border p-5">
          <div className="flex items-center gap-3.5">
            <span className="bg-brand flex size-11 shrink-0 items-center justify-center rounded-full text-white">
              <CircleCheck className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[15px] font-bold">
                {COMPLETION_BANNER.title}
              </span>
              <span className="text-fg-muted text-[12px] leading-5">
                {COMPLETION_BANNER.desc}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTab('peer-evaluation')}
            className={buttonClass({ size: 'sm', className: 'shrink-0' })}
          >
            상호평가 작성
          </button>
        </div>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {d.stats.map((s) => {
          const Icon = kpiIcon(s.label)
          const target = kpiTarget(s.label)
          const fill = kpiFill(s)
          return (
            <button
              key={s.label}
              type="button"
              onClick={() => onTab(target)}
              className={cn(
                card,
                'hover:border-brand/40 flex min-h-[136px] flex-col gap-3 text-left transition-colors',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-fg-muted flex items-center gap-1.5 text-[12px] font-semibold">
                  <Icon
                    className={cn('size-4', TONE_TEXT[s.tone])}
                    aria-hidden="true"
                  />
                  {s.label}
                </span>
                <span className="text-fg-subtle flex items-center gap-0.5 text-[11px] font-semibold">
                  {kpiLinkLabel(target)}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </span>
              </div>
              <span className="text-fg text-[28px] leading-none font-bold">
                {s.value}
                {s.unit && (
                  <span className="text-fg-muted ml-0.5 text-[14px]">
                    {s.unit}
                  </span>
                )}
              </span>
              <div className="bg-surface-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn('h-full rounded-full', TONE_SOLID[s.tone])}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <span className="text-fg-subtle mt-auto text-[11px]">
                {s.sub}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* 좌측: 내 할 일 · 최근 활동 */}
        <div className="flex flex-1 flex-col gap-4">
          <section className={cn(card, 'flex flex-col')}>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <ListChecks className="text-brand size-4" aria-hidden="true" />
                <h2 className="text-fg text-[15px] font-bold">내 할 일</h2>
                {dueSoonCount > 0 && (
                  <span className="bg-danger-bg text-danger rounded-full px-2 py-0.5 text-[11px] font-bold">
                    마감 임박 {dueSoonCount}건
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onTab('board')}
                className="text-fg-subtle hover:text-brand flex items-center gap-0.5 text-[12px] font-semibold"
              >
                보드·작업 전체 보기
                <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </div>
            {d.myTasks.map((t, i) => {
              const done = doneTasks.has(t.title)
              const urgent = t.tags.some((tg) => tg.tone === 'danger')
              const category =
                t.tags.find((tg) => tg.tone !== 'danger') ?? t.tags[0]
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 py-3',
                    i > 0 && 'border-divider border-t',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => completeTask(t)}
                    aria-label={`${t.title} 완료 처리`}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold transition-colors',
                      done
                        ? 'bg-success border-success text-white'
                        : 'border-border text-fg-subtle',
                    )}
                  >
                    {done ? '✓' : ''}
                  </button>
                  {category && <Chip badge={category} />}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className={cn(
                        'truncate text-[13px] font-semibold',
                        done ? 'text-fg-subtle line-through' : 'text-fg',
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="text-fg-subtle text-[11px]">{t.due}</span>
                  </div>
                  {urgent && !done && (
                    <span className="bg-danger-bg text-danger flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold">
                      <Timer className="size-3" aria-hidden="true" />
                      긴급
                    </span>
                  )}
                </div>
              )
            })}
          </section>

          <section className={cn(card, 'flex flex-col')}>
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Timer className="text-fg-muted size-4" aria-hidden="true" />
                <h2 className="text-fg text-[15px] font-bold">최근 활동</h2>
                <span className="bg-surface-muted text-fg-subtle rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  최근 7일
                </span>
              </div>
              <button
                type="button"
                onClick={() => onTab('board')}
                className="text-fg-subtle hover:text-brand flex items-center gap-0.5 text-[12px] font-semibold"
              >
                전체 보기
                <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </div>
            {d.activities.map((a, i) => {
              const { Icon, tone } = activityVisual(a)
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 py-3',
                    i > 0 && 'border-divider border-t',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      TONE_SOFT[tone],
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-fg text-[12px] font-bold">
                        {a.who}
                      </span>
                      {a.kind && (
                        <span className="bg-surface-muted text-fg-subtle rounded px-1.5 py-0.5 text-[10px] font-bold">
                          {a.kind}
                        </span>
                      )}
                    </div>
                    <span className="text-fg-muted truncate text-[12px]">
                      {a.action}
                    </span>
                  </div>
                  <span className="text-fg-subtle shrink-0 text-[11px]">
                    {a.when}
                  </span>
                </div>
              )
            })}
          </section>
        </div>

        {/* 우측: 인증 상태 · 팀원 · 성과 지표 · 기술 스택 */}
        <div className="flex flex-col gap-4 lg:w-[380px]">
          <section
            className={cn(
              'bg-surface flex flex-col gap-3 rounded-2xl border p-5 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]',
              phase === 'certified'
                ? 'border-success/50'
                : phase === 'reviewing'
                  ? 'border-warning/50'
                  : 'border-border',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleCheck
                  className="text-success size-4"
                  aria-hidden="true"
                />
                <span className="text-fg text-[14px] font-bold">인증 상태</span>
              </div>
              <Chip badge={phaseCertBadge(phase)} />
            </div>
            {(phase === 'reviewing' || phase === 'certified') && d.certInfo ? (
              <div className="flex flex-col gap-2 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted flex items-center gap-1.5">
                    <Calendar className="size-3.5" aria-hidden="true" />
                    요청일
                  </span>
                  <span className="text-fg font-semibold">
                    {d.certInfo.requestedAt}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted flex items-center gap-1.5">
                    <Send className="size-3.5" aria-hidden="true" />
                    검토자
                  </span>
                  <span className="text-fg font-semibold">
                    {d.certInfo.reviewer}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted flex items-center gap-1.5">
                    <Timer className="size-3.5" aria-hidden="true" />
                    {phase === 'certified' ? '인증일' : '예상 회신'}
                  </span>
                  <span className="text-fg font-semibold">
                    {d.certInfo.eta}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-fg-muted text-[12px]">
                    최근 변경 제안
                  </span>
                  <Chip badge={d.certRecentChange.status} />
                </div>
                <span className="text-fg text-[13px] font-semibold">
                  {d.certRecentChange.label}
                </span>
                <span className="text-fg-subtle text-[11px]">
                  {d.certRecentChange.date}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onTab('certification')}
              className="border-border text-fg hover:border-brand/50 flex items-center justify-center gap-1 rounded-lg border py-2.5 text-[12px] font-semibold transition-colors"
            >
              인증 요청 탭 보기
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          </section>

          <section className={cn(card, 'flex flex-col gap-2.5')}>
            <div className="flex items-center gap-2">
              <Users className="text-brand size-4" aria-hidden="true" />
              <span className="text-fg text-[14px] font-bold">팀원</span>
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[11px] font-bold">
                {d.members.length}명
              </span>
            </div>
            {d.members.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <Avatar name={m.name} tone={m.avatarTone} />
                <div className="flex flex-1 flex-col">
                  <span className="text-fg text-[12px] font-bold">
                    {m.name}
                    {m.kind === 'PM' && ' (본인)'}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{m.role}</span>
                </div>
                <span
                  className="bg-success size-2 rounded-full"
                  aria-hidden="true"
                />
              </div>
            ))}
          </section>

          <section className={cn(card, 'flex flex-col gap-2.5')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleCheck
                  className="text-success size-4"
                  aria-hidden="true"
                />
                <span className="text-fg text-[14px] font-bold">성과 지표</span>
              </div>
              <button
                type="button"
                onClick={() => onTab('outcomes')}
                className="text-fg-subtle hover:text-brand flex items-center gap-0.5 text-[11px] font-semibold"
              >
                성과·기술
                <ArrowRight className="size-3" aria-hidden="true" />
              </button>
            </div>
            {d.metrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between text-[12px]"
              >
                <span className="text-fg-muted">{m.label}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-fg-subtle">{m.before}</span>
                  <span className="text-fg-subtle">→</span>
                  <span
                    className={cn(
                      'font-bold',
                      m.good ? 'text-success' : 'text-danger',
                    )}
                  >
                    {m.after}
                  </span>
                </span>
              </div>
            ))}
          </section>

          <section className={cn(card, 'flex flex-col gap-2.5')}>
            <div className="flex items-center gap-2">
              <Command className="text-brand size-4" aria-hidden="true" />
              <span className="text-fg text-[14px] font-bold">기술 스택</span>
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[11px] font-bold">
                {d.stack.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {d.stack.map((s) => (
                <span
                  key={s}
                  className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
