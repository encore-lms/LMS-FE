import { useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CircleCheck,
  Clipboard,
  Command,
  Download,
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
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Modal } from '@/components/ui/Modal'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useToast } from '@/components/ui/use-toast'
import { useProjectWorkspace } from '../../api/projects'
import { useTsList } from '../../api/troubleshooting'
import { TsCaseCard } from '../../troubleshooting/components/TsCaseCard'
import { useProjectTsLinks } from '../../troubleshooting/projectLinks'
import type { TsCase } from '../../troubleshooting/types'
import { ProjectFlowTestNav } from './ProjectFlowTestNav'
import {
  formatEditUntil,
  isEditWindowExpired,
  statusToPhase,
  useProjectFlow,
  type ProjectPhase,
} from './useProjectFlow'
import type {
  Badge,
  Tone,
  WorkspaceData,
  WsActivity,
  WsColumn,
  WsDoc,
  WsMeeting,
  WsMember,
  WsTab,
  WsTask,
} from '../types'
import { WorkspaceShell } from './WorkspaceShell'

// 담당자 이름 → 결정론적 아바타 색(타입에 avatarTone이 없어 이름 해시로 매핑)
const TONES: Tone[] = [
  'brand',
  'info',
  'warning',
  'danger',
  'accent',
  'success',
]
function toneOf(name: string): Tone {
  let h = 0
  for (let i = 0; i < name.length; i++)
    h = (h + name.charCodeAt(i)) % TONES.length
  return TONES[h]
}

const card =
  'border-border bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]'
const CHIP: Record<Tone, string> = {
  brand: 'bg-brand/10 text-brand',
  info: 'bg-info-bg text-info',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  accent: 'bg-accent-bg text-accent-strong',
  success: 'bg-success-bg text-success',
}
const SOLID: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}
const TEXT: Record<Tone, string> = {
  brand: 'text-brand',
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-danger',
  accent: 'text-accent-strong',
  success: 'text-success',
}

// 홈 KPI 아이콘 — 라벨 키워드로 매핑(Figma 342:1032 KPI 행).
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
function phaseCertBadge(phase: ProjectPhase): Badge {
  if (phase === 'certified') return { label: '인증 완료', tone: 'success' }
  if (phase === 'reviewing') return { label: '검토 중', tone: 'warning' }
  return { label: '검토 전', tone: 'info' }
}
const TABS: WsTab[] = [
  'home',
  'board',
  'calendar',
  'meetings',
  'docs',
  'issues',
  'team',
  'outcomes',
  'peer-evaluation',
  'certification',
]

// 프로젝트 워크스페이스 (/student/projects/:projectId ?tab=) — Figma 342:1032 외 9탭.
export default function WorkspacePage() {
  const { projectId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const tab: WsTab = (TABS as string[]).includes(raw ?? '')
    ? (raw as WsTab)
    : 'home'
  const { data, isPending, isError, refetch } = useProjectWorkspace(projectId)

  if (isPending)
    return <div className="text-fg-muted p-8">워크스페이스를 불러오는 중…</div>
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          title="워크스페이스를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const setTab = (t: WsTab) =>
    setParams(t === 'home' ? {} : { tab: t }, { replace: true })

  return (
    <>
      <WorkspaceShell
        title={data.title}
        meta={data.meta}
        active={tab}
        onTab={setTab}
      >
        {tab === 'home' && <HomeTab d={data} onTab={setTab} />}
        {tab === 'board' && <BoardTab d={data} />}
        {tab === 'calendar' && <CalendarTab d={data} />}
        {tab === 'meetings' && <MeetingsTab d={data} />}
        {tab === 'docs' && <DocsTab d={data} />}
        {tab === 'issues' && <IssuesTab d={data} />}
        {tab === 'team' && <TeamTab d={data} />}
        {tab === 'outcomes' && <OutcomesTab d={data} />}
        {tab === 'peer-evaluation' && <PeerTab d={data} />}
        {tab === 'certification' && <CertTab d={data} />}
      </WorkspaceShell>
      <ProjectFlowTestNav projectId={projectId} status={data.status} />
    </>
  )
}

/* 공용 소품 */
function Chip({ badge }: { badge: Badge }) {
  return (
    <span
      className={cn(
        'rounded px-1.5 py-0.5 text-[10px] font-bold',
        CHIP[badge.tone],
      )}
    >
      {badge.label}
    </span>
  )
}
function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-fg text-[16px] font-bold">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="bg-brand rounded-lg px-4 py-2 text-[12px] font-bold text-white"
        >
          {action}
        </button>
      )}
    </div>
  )
}
function Avatar({ name, tone }: { name: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white',
        SOLID[tone],
      )}
    >
      {name.slice(0, 1)}
    </span>
  )
}
function TaskCard({ t }: { t: WsTask }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-[12px] border p-3.5">
      <span className="text-fg text-[13px] font-bold">{t.title}</span>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
            SOLID[toneOf(t.assignee)],
          )}
        >
          {t.assignee.slice(0, 1)}
        </span>
        <span className="text-fg-subtle text-[11px]">
          {t.assignee} · {t.due}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {t.tags.map((tg, i) => (
          <Chip key={i} badge={tg} />
        ))}
      </div>
    </div>
  )
}

// 상세 모달 공용 — "라벨 · 값" 한 줄.
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-fg-muted text-[12px]">{label}</span>
      <span className="text-fg text-[12px] font-semibold">{value}</span>
    </div>
  )
}
// 팀원 프로필 활동 요약 박스.
function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="border-border flex flex-col gap-1 rounded-xl border p-3">
      <span className="text-fg-muted flex items-center gap-1.5 text-[11px]">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </span>
      <span className="text-fg text-[18px] font-bold">{value}</span>
    </div>
  )
}
// "2026-05-14 · 참석 4명" → 날짜·참석 인원 분해(인원 표기 없으면 undefined).
function parseMeetingMeta(meta: string): { date: string; attendees?: number } {
  const date = meta.split(' · ')[0] ?? meta
  const m = meta.match(/참석\s*(\d+)\s*명/)
  return { date, attendees: m ? Number(m[1]) : undefined }
}
// "PDF · 1.2MB" → 형식·부가정보 분해.
function parseDocMeta(meta: string): { type: string; detail: string } {
  const [type, detail] = meta.split(' · ')
  return { type: type ?? meta, detail: detail ?? '' }
}

/* ── 홈 ── */
function HomeTab({
  d,
  onTab,
}: {
  d: WorkspaceData
  onTab: (t: WsTab) => void
}) {
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  // 완료 표시된 할 일은 처음부터 체크 상태로 시작(Figma의 마지막 항목).
  const [doneTasks, setDoneTasks] = useState<Set<string>>(
    () =>
      new Set(
        d.myTasks.filter((t) => t.due.includes('완료')).map((t) => t.title),
      ),
  )
  const toggleDone = (title: string) =>
    setDoneTasks((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
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
            className="bg-brand shrink-0 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
          >
            상호평가 작성
          </button>
        </div>
      )}

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                    className={cn('size-4', TEXT[s.tone])}
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
                  className={cn('h-full rounded-full', SOLID[s.tone])}
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
                    onClick={() => toggleDone(t.title)}
                    aria-label={`${t.title} 완료 전환`}
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
                      CHIP[tone],
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
              'bg-surface flex flex-col gap-3 rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)]',
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

/* ── 보드 ── */
function BoardTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [columns, setColumns] = useState(d.columns)
  const [addCol, setAddCol] = useState<number | null>(null)
  const drag = useRef<{ col: number; task: number } | null>(null)

  const drop = (toCol: number) => {
    const from = drag.current
    drag.current = null
    if (!from || from.col === toCol) return
    setColumns((cols) => {
      const next = cols.map((c) => ({ ...c, tasks: [...c.tasks] }))
      const [moved] = next[from.col].tasks.splice(from.task, 1)
      if (moved) next[toCol].tasks.push(moved)
      return next
    })
    toast.info('작업 상태를 변경했습니다')
  }
  const addTask = (colIdx: number, task: WsTask) =>
    setColumns((cols) =>
      cols.map((c, i) =>
        i === colIdx ? { ...c, tasks: [...c.tasks, task] } : c,
      ),
    )

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="보드"
        action="작업 추가"
        onAction={() => setAddCol(0)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col, ci) => (
          <section
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(ci)}
            className={cn(card, 'flex flex-col gap-3')}
          >
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">
                {col.label}{' '}
                <span className="text-fg-subtle text-[12px]">
                  {col.tasks.length}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAddCol(ci)}
                className="text-fg-muted hover:bg-surface-muted rounded-md px-2 py-1 text-[12px] font-semibold"
              >
                + 작업
              </button>
            </div>
            {col.tasks.map((t, ti) => (
              <div
                key={ti}
                draggable
                onDragStart={() => {
                  drag.current = { col: ci, task: ti }
                }}
                className="cursor-grab active:cursor-grabbing"
              >
                <TaskCard t={t} />
              </div>
            ))}
            {col.tasks.length === 0 && (
              <div className="border-border text-fg-subtle rounded-[12px] border border-dashed py-6 text-center text-[11px]">
                여기로 드래그
              </div>
            )}
          </section>
        ))}
      </div>
      {addCol !== null && (
        <AddTaskModal
          columns={columns}
          initialCol={addCol}
          onClose={() => setAddCol(null)}
          onAdd={(colIdx, task) => {
            addTask(colIdx, task)
            setAddCol(null)
            toast.success('작업을 추가했습니다')
          }}
        />
      )}
    </div>
  )
}

/* ── 작업 추가 모달 ── */
function AddTaskModal({
  columns,
  initialCol,
  onClose,
  onAdd,
}: {
  columns: WsColumn[]
  initialCol: number
  onClose: () => void
  onAdd: (colIdx: number, task: WsTask) => void
}) {
  const [colIdx, setColIdx] = useState(initialCol)
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')
  const [due, setDue] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'

  const submit = () => {
    if (!title.trim()) return
    onAdd(colIdx, {
      title: title.trim(),
      assignee: assignee.trim() || '미지정',
      due: due.trim() || '-',
      tags: [],
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="작업 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">컬럼</span>
          <select
            value={colIdx}
            onChange={(e) => setColIdx(Number(e.target.value))}
            className={field}
          >
            {columns.map((c, i) => (
              <option key={c.key} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="작업 제목"
            className={field}
          />
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">담당자</span>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="이름"
              className={field}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-fg text-[12px] font-bold">마감</span>
            <input
              value={due}
              onChange={(e) => setDue(e.target.value)}
              placeholder="D-3"
              className={field}
            />
          </label>
        </div>
      </div>
    </Modal>
  )
}

/* ── 캘린더 ── */
function CalendarTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [events, setEvents] = useState(d.calEvents)
  const [upcoming, setUpcoming] = useState(d.upcoming)
  const [adding, setAdding] = useState(false)
  const offset = (new Date('2026-05-01').getDay() + 6) % 7
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: 31 }, (_, i) => i + 1),
  ]
  const eventOf = (day: number) => events.find((e) => e.day === day)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title={d.calMonth}
        action="일정 추가"
        onAction={() => setAdding(true)}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex-1')}>
          <div className="text-fg-subtle grid grid-cols-7 gap-1 pb-2 text-center text-[11px] font-semibold">
            {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              const ev = day ? eventOf(day) : undefined
              return (
                <div
                  key={i}
                  className={cn(
                    'border-border flex min-h-[78px] flex-col items-start gap-1 rounded-lg border p-1.5',
                    !day && 'opacity-0',
                  )}
                >
                  <span className="text-fg-subtle text-[11px]">{day}</span>
                  {ev && <Chip badge={{ label: ev.label, tone: ev.tone }} />}
                </div>
              )
            })}
          </div>
        </section>
        <section className={cn(card, 'flex flex-col gap-3 lg:w-[280px]')}>
          <span className="text-fg text-[14px] font-bold">다가오는 일정</span>
          {upcoming.map((u, i) => (
            <div key={i} className="flex flex-col items-start gap-1">
              <span className="text-fg-subtle text-[11px]">{u.date}</span>
              <span className="text-fg text-[13px] font-semibold">
                {u.label}
              </span>
              <Chip badge={{ label: '일정', tone: u.tone }} />
            </div>
          ))}
        </section>
      </div>
      {adding && (
        <AddScheduleModal
          onClose={() => setAdding(false)}
          onAdd={(item) => {
            setEvents((prev) => [...prev, item])
            setUpcoming((prev) => [
              ...prev,
              { date: `5/${item.day}`, label: item.label, tone: item.tone },
            ])
            setAdding(false)
            toast.success('일정을 추가했습니다')
          }}
        />
      )}
    </div>
  )
}

function AddScheduleModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (item: { day: number; label: string; tone: Tone }) => void
}) {
  const [day, setDay] = useState('28')
  const [label, setLabel] = useState('')
  const [tone, setTone] = useState<Tone>('brand')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    const parsedDay = Number(day)
    if (!label.trim() || parsedDay < 1 || parsedDay > 31) return
    onAdd({ day: parsedDay, label: label.trim(), tone })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="일정 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!label.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">일자</span>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-[12px] font-bold">일정명</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="일정명"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-3">
          <span className="text-fg text-[12px] font-bold">유형</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className={field}
          >
            <option value="brand">작업</option>
            <option value="info">회의</option>
            <option value="warning">발표</option>
            <option value="accent">인증</option>
          </select>
        </label>
      </div>
    </Modal>
  )
}

/* ── 회의록 ── */
function MeetingsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [meetings, setMeetings] = useState(d.meetings)
  const [adding, setAdding] = useState(false)
  const [openMeeting, setOpenMeeting] = useState<WsMeeting | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="회의록"
        action="회의록 작성"
        onAction={() => setAdding(true)}
      />
      <section className={cn(card, 'flex flex-col')}>
        {meetings.map((m, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-4 py-3.5',
              i > 0 && 'border-divider border-t',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-fg text-[14px] font-bold">{m.title}</span>
              <span className="text-fg-subtle text-[11px]">{m.meta}</span>
            </div>
            <span className="text-fg-muted hidden text-[12px] sm:block">
              {m.summary}
            </span>
            <Chip badge={m.status} />
            <button
              type="button"
              onClick={() => setOpenMeeting(m)}
              className="border-border text-fg-muted shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
            >
              열기
            </button>
          </div>
        ))}
      </section>
      {openMeeting && (
        <MeetingDetailModal
          meeting={openMeeting}
          members={d.members}
          onClose={() => setOpenMeeting(null)}
        />
      )}
      {adding && (
        <AddMeetingModal
          onClose={() => setAdding(false)}
          onAdd={(meeting) => {
            setMeetings((prev) => [meeting, ...prev])
            setAdding(false)
            toast.success('회의록을 작성했습니다')
          }}
        />
      )}
    </div>
  )
}

function AddMeetingModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (meeting: WsMeeting) => void
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-05-28')
  const [summary, setSummary] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    if (!title.trim() || !summary.trim()) return
    onAdd({
      title: title.trim(),
      meta: `${date} · 참석 4명`,
      summary: summary.trim(),
      status: { label: '진행', tone: 'warning' },
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="회의록 작성"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || !summary.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="회의 제목"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">일자</span>
          <DateTimePicker
            mode="date"
            value={date}
            onChange={setDate}
            ariaLabel="회의 일자"
            placeholder="날짜 선택"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">요약</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="결정 사항 또는 액션 아이템"
            className={cn(field, 'min-h-24 resize-none py-2 leading-5')}
          />
        </label>
      </div>
    </Modal>
  )
}

// 회의 상세 — 날짜·요약·참석자(팀원에서 참석 인원만큼 파생).
function MeetingDetailModal({
  meeting,
  members,
  onClose,
}: {
  meeting: WsMeeting
  members: WsMember[]
  onClose: () => void
}) {
  const { date, attendees } = parseMeetingMeta(meeting.meta)
  const attendList = attendees != null ? members.slice(0, attendees) : members
  const extra =
    attendees != null && attendees > attendList.length
      ? attendees - attendList.length
      : 0
  return (
    <Modal
      open
      onClose={onClose}
      title="회의록 상세"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-fg text-[16px] font-bold">
              {meeting.title}
            </span>
            <span className="text-fg-muted flex items-center gap-1.5 text-[12px]">
              <Calendar className="size-3.5" aria-hidden="true" />
              {date}
            </span>
          </div>
          <Chip badge={meeting.status} />
        </div>

        <div className="bg-surface-muted flex flex-col gap-1 rounded-xl p-4">
          <span className="text-fg-subtle text-[11px] font-semibold">
            핵심 요약
          </span>
          <span className="text-fg text-[13px] font-semibold">
            {meeting.summary}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
            <Users className="text-brand size-4" aria-hidden="true" />
            참석자
            {attendees != null && (
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[11px] font-bold">
                {attendees}명
              </span>
            )}
          </span>
          <div className="flex flex-col gap-2">
            {attendList.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <Avatar name={m.name} tone={m.avatarTone} />
                <div className="flex flex-col">
                  <span className="text-fg text-[12px] font-bold">
                    {m.name}
                    {m.kind === 'PM' && ' · PM'}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{m.role}</span>
                </div>
              </div>
            ))}
            {extra > 0 && (
              <span className="text-fg-subtle text-[11px]">외 {extra}명</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ── 문서·파일·위키 ── */
function DocsTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [activeCategory, setActiveCategory] = useState('전체')
  const [docs, setDocs] = useState(d.docs)
  const [adding, setAdding] = useState(false)
  const [openDoc, setOpenDoc] = useState<WsDoc | null>(null)
  const visibleDocs =
    activeCategory === '전체'
      ? docs
      : docs.filter((doc) => doc.category === activeCategory)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="문서·파일·위키"
        action="문서 추가"
        onAction={() => setAdding(true)}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-col gap-1.5 lg:w-[180px]')}>
          {d.docCategories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={cn(
                'rounded-lg px-3 py-2 text-left text-[12px] font-semibold',
                c === activeCategory
                  ? 'bg-brand/10 text-brand'
                  : 'text-fg-muted hover:bg-surface-muted',
              )}
            >
              {c}
            </button>
          ))}
        </section>
        <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
          {visibleDocs.map((doc, i) => (
            <div key={i} className={cn(card, 'flex flex-col gap-2')}>
              <span className="text-fg text-[14px] font-bold">{doc.title}</span>
              <span className="text-fg-subtle text-[11px]">{doc.meta}</span>
              <div className="mt-auto flex items-center justify-between pt-1">
                <Chip badge={doc.status} />
                <button
                  type="button"
                  onClick={() => setOpenDoc(doc)}
                  className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  열기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {openDoc && (
        <DocDetailModal doc={openDoc} onClose={() => setOpenDoc(null)} />
      )}
      {adding && (
        <AddDocModal
          categories={d.docCategories.filter((category) => category !== '전체')}
          onClose={() => setAdding(false)}
          onAdd={(doc) => {
            setDocs((prev) => [doc, ...prev])
            setAdding(false)
            toast.success('문서를 추가했습니다')
          }}
        />
      )}
    </div>
  )
}

function AddDocModal({
  categories,
  onClose,
  onAdd,
}: {
  categories: string[]
  onClose: () => void
  onAdd: (doc: WsDoc) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0] ?? '위키')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      meta: `${category} · 방금`,
      status: { label: '초안', tone: 'info' },
      category,
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="문서 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">제목</span>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="문서 제목"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">카테고리</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={field}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  )
}

// 문서 상세 — 형식·정보·카테고리·상태 + 미리보기 영역. 다운로드는 데모 토스트.
function DocDetailModal({ doc, onClose }: { doc: WsDoc; onClose: () => void }) {
  const toast = useToast()
  const { type, detail } = parseDocMeta(doc.meta)
  return (
    <Modal
      open
      onClose={onClose}
      title="문서 상세"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              toast.info(`${doc.title} 다운로드를 시작합니다`)
              onClose()
            }}
            className="bg-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-bold text-white"
          >
            <Download className="size-4" aria-hidden="true" />
            다운로드
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-brand/10 text-brand flex size-14 shrink-0 items-center justify-center rounded-2xl">
            <FileText className="size-7" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-fg text-[15px] font-bold">{doc.title}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-surface-muted text-fg-muted rounded-md px-2 py-0.5 text-[11px] font-semibold">
                {doc.category}
              </span>
              <Chip badge={doc.status} />
            </div>
          </div>
        </div>

        <div className="border-divider divide-divider flex flex-col divide-y rounded-xl border">
          <DetailRow label="형식" value={type} />
          <DetailRow label="정보" value={detail || '-'} />
          <DetailRow label="카테고리" value={doc.category} />
          <DetailRow label="상태" value={doc.status.label} />
        </div>

        <div className="border-border text-fg-subtle flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed py-8 text-center">
          <Files className="size-7" aria-hidden="true" />
          <span className="text-[12px]">{type} 미리보기 영역</span>
        </div>
      </div>
    </Modal>
  )
}

/* ── 이슈 ── */
// 이슈 탭 — 프로젝트(워크스페이스)에서 해결한 트러블슈팅 중 "인증 완료" 사례만 연결해
// 트러블슈팅 목록 화면과 같은 카드로 보여준다(연결 방향: 프로젝트 → 사례, 보기 전용).
// 카드를 누르면 공용 사례 상세를 보기 전용(?view=1)으로 연다.
function IssuesTab({ d }: { d: WorkspaceData }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending } = useTsList()
  const linkedIds = useProjectTsLinks((s) => s.links[d.id] ?? [])
  const unlink = useProjectTsLinks((s) => s.unlink)
  const [picking, setPicking] = useState(false)

  const cases = data?.cases ?? []
  // 연결된 사례 중 인증 완료만 노출(연결도 인증 완료만 허용하지만 상태 변동 방어).
  const linked = linkedIds
    .map((id) => cases.find((c) => c.id === id))
    .filter((c): c is TsCase => !!c && c.status === 'certified')

  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="연결된 트러블슈팅"
        action="트러블슈팅 연결"
        onAction={() => setPicking(true)}
      />
      <p className="text-fg-subtle -mt-2 text-[12px]">
        이 프로젝트에서 해결한 트러블슈팅 중 인증 완료된 사례만 연결해 보여줘요.
        카드를 누르면 사례 내용을 자세히 볼 수 있어요.
      </p>
      {isPending ? (
        <div className="text-fg-muted p-6 text-[13px]">
          트러블슈팅을 불러오는 중…
        </div>
      ) : linked.length === 0 ? (
        <Empty
          title="연결된 인증 트러블슈팅이 없어요"
          description="‘트러블슈팅 연결’로 인증 완료된 사례를 연결하세요."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {linked.map((c) => (
            <TsCaseCard
              key={c.id}
              c={c}
              actionLabel="보기"
              onOpen={(t) =>
                navigate(`/student/troubleshooting/${t.id}?view=1`)
              }
              onRemove={() => {
                unlink(d.id, c.id)
                toast.info('프로젝트 연결을 해제했어요 (사례는 그대로예요)')
              }}
            />
          ))}
        </div>
      )}
      {picking && (
        <TsLinkPickerModal
          projectId={d.id}
          cases={cases}
          linkedIds={linkedIds}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  )
}

// 연결 피커 — 인증 완료된 사례만 토글로 연결/해제한다.
function TsLinkPickerModal({
  projectId,
  cases,
  linkedIds,
  onClose,
}: {
  projectId: string
  cases: TsCase[]
  linkedIds: string[]
  onClose: () => void
}) {
  const toast = useToast()
  const link = useProjectTsLinks((s) => s.link)
  const unlink = useProjectTsLinks((s) => s.unlink)
  const certified = cases.filter((c) => c.status === 'certified')
  const toggle = (c: TsCase) => {
    if (linkedIds.includes(c.id)) {
      unlink(projectId, c.id)
      toast.info('연결을 해제했어요')
    } else {
      link(projectId, c.id)
      toast.success('트러블슈팅을 연결했어요')
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="트러블슈팅 연결"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white"
        >
          완료
        </button>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="text-fg-subtle text-[12px]">
          인증 완료된 트러블슈팅 사례만 연결할 수 있어요.
        </p>
        {certified.length === 0 ? (
          <div className="text-fg-subtle py-6 text-center text-[13px]">
            연결할 인증 완료 사례가 없어요.
          </div>
        ) : (
          certified.map((c) => {
            const on = linkedIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left',
                  on ? 'border-brand bg-brand/5' : 'border-border',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white',
                    on ? 'bg-brand' : 'border-border bg-surface border',
                  )}
                >
                  {on && '✓'}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-fg truncate text-[13px] font-semibold">
                    {c.title}
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    {c.category} · {c.days}
                  </span>
                </div>
                <span className="bg-success-bg text-success shrink-0 rounded px-2 py-0.5 text-[10px] font-bold">
                  인증 완료
                </span>
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}

/* ── 팀 관리 ── */
function TeamTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [members, setMembers] = useState(d.members)
  const [inviting, setInviting] = useState(false)
  const [openMember, setOpenMember] = useState<WsMember | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [removing, setRemoving] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="팀원 관리"
        action="팀원 초대"
        onAction={() => setInviting(true)}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col py-2')}>
          {members.map((m, i) => (
            <div
              key={m.name}
              className={cn(
                'flex items-center gap-4 py-5',
                i > 0 && 'border-divider border-t',
              )}
            >
              <Avatar name={m.name} tone={m.avatarTone} />
              <div className="flex w-40 flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-fg text-[13px] font-bold">
                    {m.name}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-bold',
                      m.kind === 'PM'
                        ? 'bg-accent-bg text-accent-strong'
                        : 'bg-surface-muted text-fg-muted',
                    )}
                  >
                    {m.kind}
                  </span>
                </div>
                <span className="text-fg-subtle text-[11px]">
                  기여도 {m.contrib}%
                </span>
                <span className="text-fg-subtle text-[11px]">{m.role}</span>
              </div>
              <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="bg-brand h-full rounded-full"
                  style={{ width: `${m.contrib}%` }}
                />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenMember(m)}
                  className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  상세
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(i)}
                  className="border-border text-fg-muted rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setRemoving(i)}
                  disabled={m.kind === 'PM'}
                  title={
                    m.kind === 'PM'
                      ? 'PM은 삭제할 수 없어요. 다른 팀원에게 PM을 위임한 뒤 삭제하세요.'
                      : undefined
                  }
                  className="border-border text-danger hover:bg-danger-bg rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </section>
        <section className={cn(card, 'flex flex-col gap-4 lg:w-[300px]')}>
          <span className="text-fg text-[14px] font-bold">역할 정책</span>
          {d.rolePolicy.map((r, i) => (
            <span key={i} className="text-fg-muted text-[12px] leading-5">
              {i + 1}. {r}
            </span>
          ))}
        </section>
      </div>
      {openMember && (
        <MemberProfileModal
          member={openMember}
          d={d}
          onClose={() => setOpenMember(null)}
        />
      )}
      {editing !== null && members[editing] && (
        <EditMemberModal
          member={members[editing]}
          othersTotal={members.reduce(
            (acc, mm, idx) => (idx === editing ? acc : acc + mm.contrib),
            0,
          )}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            setMembers((prev) =>
              prev.map((mm, idx) => {
                if (idx === editing) return { ...mm, ...patch }
                // PM 위임 — 다른 멤버를 PM으로 지정하면 기존 PM은 팀원으로 강등.
                if (patch.kind === 'PM' && mm.kind === 'PM')
                  return { ...mm, kind: '팀원' }
                return mm
              }),
            )
            setEditing(null)
            toast.success('팀원 정보를 수정했습니다')
          }}
        />
      )}
      {removing !== null && members[removing] && (
        <Modal
          open
          onClose={() => setRemoving(null)}
          title="팀원 삭제"
          size="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setRemoving(null)}
                className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = members[removing].name
                  setMembers((prev) =>
                    prev.filter((_, idx) => idx !== removing),
                  )
                  setRemoving(null)
                  toast.success(`${name} 님을 팀에서 삭제했습니다`)
                }}
                className="bg-danger rounded-lg px-4 py-2 text-[13px] font-bold text-white"
              >
                삭제
              </button>
            </>
          }
        >
          <p className="text-fg-muted text-[13px] leading-6">
            <span className="text-fg font-bold">{members[removing].name}</span>{' '}
            ({members[removing].role}) 님을 팀에서 삭제할까요? 삭제하면 기여도
            막대와 상호평가 대상에서 제외됩니다.
          </p>
        </Modal>
      )}
      {inviting && (
        <InviteMemberModal
          onClose={() => setInviting(false)}
          onAdd={(member) => {
            setMembers((prev) => [...prev, member])
            setInviting(false)
            toast.success('팀원을 초대했습니다')
          }}
        />
      )}
    </div>
  )
}

function InviteMemberModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (member: WsMember) => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('백엔드')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      role,
      kind: '팀원',
      contrib: 0,
      avatarTone: 'info',
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 초대"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!name.trim()}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            초대
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">이름</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="팀원 이름"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">역할</span>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="역할"
            className={field}
          />
        </label>
      </div>
    </Modal>
  )
}

// 팀원 정보 수정 — 역할·구분(PM 위임)·기여도. 기여도 합 100% 원칙(문서 §기여도)을
// 팀 합계로 라이브 표시해 초과 시 경고한다.
function EditMemberModal({
  member,
  othersTotal,
  onClose,
  onSave,
}: {
  member: WsMember
  othersTotal: number
  onClose: () => void
  onSave: (patch: {
    role: string
    contrib: number
    kind: WsMember['kind']
  }) => void
}) {
  const [role, setRole] = useState(member.role)
  const [contrib, setContrib] = useState(String(member.contrib))
  const [kind, setKind] = useState<WsMember['kind']>(member.kind)
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const contribNum = Number(contrib)
  const validContrib =
    contrib.trim() !== '' &&
    Number.isFinite(contribNum) &&
    contribNum >= 0 &&
    contribNum <= 100
  const teamTotal = othersTotal + (validContrib ? contribNum : 0)
  const over = teamTotal > 100
  const submit = () => {
    if (!role.trim() || !validContrib) return
    onSave({ role: role.trim(), contrib: contribNum, kind })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 정보 수정"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!role.trim() || !validContrib}
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            저장
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="bg-surface-muted flex items-center gap-3 rounded-xl p-3">
          <Avatar name={member.name} tone={member.avatarTone} />
          <span className="text-fg text-[14px] font-bold">{member.name}</span>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">역할</span>
          <input
            autoFocus
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="역할"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">구분</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as WsMember['kind'])}
            className={field}
          >
            <option value="팀원">팀원</option>
            <option value="PM">PM (위임 시 기존 PM은 팀원으로 변경)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">기여도 (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={contrib}
            onChange={(e) => setContrib(e.target.value)}
            placeholder="0 ~ 100"
            className={field}
          />
        </label>
        <div
          className={cn(
            'rounded-lg px-3 py-2 text-[12px] font-semibold',
            over
              ? 'bg-danger-bg text-danger'
              : 'bg-surface-muted text-fg-muted',
          )}
        >
          팀 기여도 합계 {teamTotal}%{' '}
          {over ? '· 100%를 초과합니다 (합 100% 권장)' : '/ 100%'}
        </div>
      </div>
    </Modal>
  )
}

// 팀원 프로필 — 기여도 + 워크스페이스 데이터에서 담당 작업·이슈 집계, 상호평가 협업 태그.
function MemberProfileModal({
  member,
  d,
  onClose,
}: {
  member: WsMember
  d: WorkspaceData
  onClose: () => void
}) {
  // 본인(PM)은 보드/내 할 일에서 '나'로 기재되므로 별칭으로 함께 집계.
  const aliases =
    member.kind === 'PM' ? new Set([member.name, '나']) : new Set([member.name])
  const boardTasks = d.columns.reduce(
    (acc, col) => acc + col.tasks.filter((t) => aliases.has(t.assignee)).length,
    0,
  )
  const myTaskCount =
    member.kind === 'PM'
      ? d.myTasks.filter((t) => aliases.has(t.assignee)).length
      : 0
  const taskCount = boardTasks + myTaskCount
  const issueCount = d.issues.filter((it) =>
    it.meta.includes(member.name),
  ).length
  const peer = d.peerTargets.find((p) => p.name === member.name)
  return (
    <Modal
      open
      onClose={onClose}
      title="팀원 프로필"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
        >
          닫기
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              'flex size-16 shrink-0 items-center justify-center rounded-full text-[24px] font-bold text-white',
              SOLID[member.avatarTone],
            )}
          >
            {member.name.slice(0, 1)}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-fg text-[18px] font-bold">
                {member.name}
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  member.kind === 'PM'
                    ? 'bg-accent-bg text-accent-strong'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {member.kind}
              </span>
            </div>
            <span className="text-fg-muted text-[12px]">{member.role}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-fg-muted">기여도</span>
            <span className="text-fg font-bold">{member.contrib}%</span>
          </div>
          <div className="bg-surface-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-brand h-full rounded-full"
              style={{ width: `${member.contrib}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatBox
            icon={ListChecks}
            label="담당 작업"
            value={`${taskCount}건`}
          />
          <StatBox
            icon={TriangleAlert}
            label="담당 이슈"
            value={`${issueCount}건`}
          />
        </div>

        {peer && peer.tags.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-fg-subtle text-[11px] font-semibold">
              상호평가 협업 태그
            </span>
            <div className="flex flex-wrap gap-1.5">
              {peer.tags.map((tg, i) => (
                <Chip key={i} badge={tg} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

/* ── 성과·기술스택 ── */
function OutcomesTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [metrics, setMetrics] = useState(d.metrics)
  const [adding, setAdding] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <SectionHead
        title="성과 지표"
        action="지표 추가"
        onAction={() => setAdding(true)}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {metrics.map((m) => (
          <section key={m.label} className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">{m.label}</span>
            <div className="flex items-end gap-6">
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">Before</span>
                <span className="text-fg-muted text-[20px] font-bold">
                  {m.before}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-fg-subtle text-[11px]">After</span>
                <span className="text-brand text-[20px] font-bold">
                  {m.after}
                </span>
              </div>
            </div>
            <span
              className={cn(
                'w-fit rounded px-1.5 py-0.5 text-[11px] font-bold',
                m.good
                  ? 'bg-success-bg text-success'
                  : 'bg-danger-bg text-danger',
              )}
            >
              {m.delta}
            </span>
          </section>
        ))}
      </div>
      <section className={cn(card, 'flex flex-col gap-3')}>
        <span className="text-fg text-[14px] font-bold">기술 스택</span>
        <div className="flex flex-wrap gap-2">
          {d.stack.map((s) => (
            <span
              key={s}
              className="bg-surface-muted text-fg-muted rounded-lg px-3 py-1.5 text-[12px] font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </section>
      {adding && (
        <AddMetricModal
          onClose={() => setAdding(false)}
          onAdd={(metric) => {
            setMetrics((prev) => [...prev, metric])
            setAdding(false)
            toast.success('지표를 추가했습니다')
          }}
        />
      )}
    </div>
  )
}

function AddMetricModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (metric: WorkspaceData['metrics'][number]) => void
}) {
  const [label, setLabel] = useState('')
  const [before, setBefore] = useState('')
  const [after, setAfter] = useState('')
  const [delta, setDelta] = useState('')
  const field =
    'border-border focus:border-brand h-10 w-full rounded-lg border px-3 text-[13px] outline-none'
  const submit = () => {
    if (!label.trim() || !before.trim() || !after.trim() || !delta.trim())
      return
    onAdd({
      label: label.trim(),
      before: before.trim(),
      after: after.trim(),
      delta: delta.trim(),
      good: !delta.trim().startsWith('-'),
    })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="지표 추가"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="border-border text-fg rounded-lg border px-4 py-2 text-[13px] font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={
              !label.trim() || !before.trim() || !after.trim() || !delta.trim()
            }
            className="bg-brand rounded-lg px-4 py-2 text-[13px] font-bold text-white disabled:opacity-40"
          >
            추가
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-[12px] font-bold">지표명</span>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="지표명"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">Before</span>
          <input
            value={before}
            onChange={(e) => setBefore(e.target.value)}
            placeholder="Before"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-fg text-[12px] font-bold">After</span>
          <input
            value={after}
            onChange={(e) => setAfter(e.target.value)}
            placeholder="After"
            className={field}
          />
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fg text-[12px] font-bold">증감</span>
          <input
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="+12%"
            className={field}
          />
        </label>
      </div>
    </Modal>
  )
}

/* ── 상호평가 ── */
function PeerTab({ d }: { d: WorkspaceData }) {
  const toast = useToast()
  const [submitted, setSubmitted] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      d.peerTargets.flatMap((target) =>
        target.axes.map((axis) => [`${target.name}:${axis.key}`, axis.score]),
      ),
    ),
  )
  const [comments, setComments] = useState<Record<string, string>>({})
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const setScore = (name: string, key: string, score: number) =>
    setScores((prev) => ({ ...prev, [`${name}:${key}`]: score }))

  // 완료 확정 전(진행 중)에는 상호평가가 열리지 않음 (§17)
  if (phase === 'active') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 상호평가</h2>
        <section
          className={cn(
            card,
            'flex flex-col items-center gap-2 py-12 text-center',
          )}
        >
          <Timer className="text-fg-subtle size-8" aria-hidden="true" />
          <span className="text-fg text-[14px] font-bold">
            아직 상호평가가 열리지 않았어요
          </span>
          <span className="text-fg-muted max-w-md text-[12px] leading-5">
            강사·운영이 프로젝트 완료를 확정하면 팀원 상호평가를 진행할 수
            있어요.
          </span>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-fg text-[16px] font-bold">프로젝트 상호평가</h2>
        <span className="text-fg-subtle text-[12px]">
          완료된 프로젝트의 팀원을 평가합니다. 평가 정보와 코멘트는 팀원에게
          공개되지 않습니다.
        </span>
      </div>
      <section className={cn(card, 'flex items-center justify-between gap-4')}>
        <div className="flex flex-col gap-1">
          <span className="text-fg text-[14px] font-bold">
            필수 제출 · 마감 {d.peerDue}
          </span>
          <span className="text-fg-muted text-[12px]">
            PM 포함 모든 멤버가 자기 자신을 제외한 팀원을 평가합니다. 마감
            전까지 수정 가능하며, 최종본이 증명서에 반영됩니다.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Chip
            badge={
              submitted
                ? { label: '제출 완료', tone: 'success' }
                : d.peerMyStatus
            }
          />
          <Chip badge={d.peerTeamStatus} />
        </div>
      </section>
      {d.peerTargets.map((t) => (
        <section key={t.name} className={cn(card, 'flex flex-col gap-3')}>
          <div className="flex items-center gap-2">
            <span className="text-fg text-[14px] font-bold">{t.name}</span>
            <span className="text-fg-subtle text-[11px]">{t.role}</span>
            <span className="text-fg-subtle ml-auto text-[11px]">
              5개 축은 모두 필수, 코멘트는 선택입니다.
            </span>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {t.axes.map((a) => (
              <div key={a.key} className="flex items-center gap-2">
                <span className="text-fg w-16 shrink-0 text-[12px] font-medium">
                  {a.key}
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.5}
                  value={scores[`${t.name}:${a.key}`]}
                  onChange={(e) =>
                    setScore(t.name, a.key, Number(e.target.value))
                  }
                  aria-label={`${t.name} ${a.key} 점수`}
                  className="accent-brand flex-1"
                />
                <span className="text-fg w-7 shrink-0 text-right text-[12px] font-bold">
                  {scores[`${t.name}:${a.key}`].toFixed(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-fg-subtle text-[11px]">카테고리 태그</span>
              {t.tags.map((tg, i) => (
                <Chip key={i} badge={tg} />
              ))}
            </div>
            <textarea
              value={comments[t.name] ?? ''}
              onChange={(e) =>
                setComments((prev) => ({ ...prev, [t.name]: e.target.value }))
              }
              placeholder="선택 코멘트: 프로젝트에서 드러난 협업/기여 근거를 적어주세요."
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand min-h-10 flex-1 resize-none rounded-lg border px-3 py-2 text-[11px] focus:outline-none"
            />
          </div>
        </section>
      ))}
      <div className="border-border flex items-center justify-between border-t pt-4">
        <span className="text-fg-subtle text-[11px]">
          제출 후에도 마감 전까지 수정할 수 있습니다. 미제출 시 본인 증명서의
          프로젝트 협업 근거가 제한됩니다.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.info('상호평가를 임시 저장했습니다')}
            className="border-border text-fg rounded-lg border px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitted(true)
              toast.success('상호평가를 제출했습니다')
            }}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold text-white"
          >
            제출
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 인증 요청 ── */
function CertTab({ d }: { d: WorkspaceData }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [checks, setChecks] = useState(d.certChecklist)
  const phase = useProjectFlow((s) => s.phases[d.id]) ?? statusToPhase(d.status)
  const setPhase = useProjectFlow((s) => s.setPhase)
  const editRequest = useProjectFlow((s) => s.editRequests[d.id])
  // 만료된 승인은 잠금으로 표시(자동 잠금 정리는 변경 제안 화면에서 수행).
  const editStatus = isEditWindowExpired(editRequest)
    ? 'none'
    : (editRequest?.status ?? 'none')
  const allDone = checks.every((check) => check.status.tone === 'success')
  const submit = () => {
    if (!allDone) {
      toast.warning('요청 전 체크리스트를 모두 완료해 주세요')
      return
    }
    setPhase(d.id, 'reviewing')
    toast.success('인증 요청을 제출했습니다')
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-fg text-[16px] font-bold">프로젝트 인증 요청</h2>
      <div className="flex flex-col gap-4 lg:flex-row">
        <section className={cn(card, 'flex flex-1 flex-col gap-1')}>
          <span className="text-fg pb-2 text-[14px] font-bold">
            요청 전 체크리스트
          </span>
          {checks.map((c, i) => {
            const done = c.status.tone === 'success'
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
                  onClick={() =>
                    setChecks((prev) =>
                      prev.map((item, idx) =>
                        idx === i
                          ? {
                              ...item,
                              status: done
                                ? { label: '필요', tone: 'danger' }
                                : { label: '완료', tone: 'success' },
                            }
                          : item,
                      ),
                    )
                  }
                  aria-label={`${c.label} 완료 전환`}
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    done
                      ? 'bg-success text-white'
                      : 'border-border text-fg-subtle border',
                  )}
                >
                  {done ? '✓' : ''}
                </button>
                <span className="text-fg flex-1 text-[13px] font-semibold">
                  {c.label}
                </span>
                <Chip badge={c.status} />
              </div>
            )
          })}
        </section>
        <div className="flex flex-col gap-4 lg:w-[320px]">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[14px] font-bold">인증 상태</span>
              <Chip badge={phaseCertBadge(phase)} />
            </div>
            <span className="text-fg-muted text-[12px] leading-5">
              {phase === 'certified'
                ? editStatus === 'approved'
                  ? `수정 권한이 열렸어요. ${formatEditUntil(editRequest?.editAllowedUntil)}까지 원본을 직접 수정할 수 있어요.`
                  : editStatus === 'requested'
                    ? '수정 권한 요청이 강사 승인 대기 중이에요.'
                    : editStatus === 'submitted'
                      ? '수정 완료를 제출했어요. 강사 최종 확인을 기다리는 중이에요.'
                      : '인증이 완료된 프로젝트입니다. 원본 수정은 강사에게 수정 권한을 요청한 뒤 가능합니다.'
                : phase === 'reviewing'
                  ? '담당 강사가 산출물과 발표 내용을 검토하고 있어요. 승인되면 인증이 완료됩니다.'
                  : phase === 'completed'
                    ? '요청하면 담당 강사가 산출물과 발표 내용을 검토합니다. 인증 완료 후 프로젝트는 증명서 대표 후보가 됩니다.'
                    : '프로젝트 진행 중이에요. 기간이 종료되어 완료 확정되면 인증을 요청할 수 있습니다.'}
            </span>
            {phase === 'certified' ? (
              <div className="bg-success-bg text-success flex items-center justify-center gap-1.5 rounded-lg py-3 text-[13px] font-bold">
                <CircleCheck className="size-4" aria-hidden="true" />
                인증 완료
              </div>
            ) : phase === 'reviewing' ? (
              <div className="bg-warning-bg text-warning flex items-center justify-center gap-1.5 rounded-lg py-3 text-[13px] font-bold">
                <Timer className="size-4" aria-hidden="true" />
                강사 검토 중
              </div>
            ) : phase === 'completed' ? (
              <button
                type="button"
                onClick={submit}
                className="bg-brand rounded-lg py-3 text-[13px] font-bold text-white"
              >
                인증 요청 제출
              </button>
            ) : (
              <div className="border-border text-fg-subtle flex items-center justify-center rounded-lg border border-dashed py-3 text-[12px] font-semibold">
                기간 종료 후 인증 요청 가능
              </div>
            )}
            {phase === 'certified' && (
              <>
                {editStatus === 'approved' && editRequest?.editAllowedUntil && (
                  <div className="bg-success-bg/60 text-success flex items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-bold">
                    <Timer className="size-3.5" aria-hidden="true" />
                    수정 가능 ~ {formatEditUntil(editRequest.editAllowedUntil)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/student/projects/${d.id}/change-requests/new`)
                  }
                  className={cn(
                    'rounded-lg py-2.5 text-[13px] font-semibold',
                    editStatus === 'approved'
                      ? 'bg-brand text-white'
                      : 'border-border text-fg border',
                  )}
                >
                  {editStatus === 'none'
                    ? '수정 권한 요청'
                    : editStatus === 'requested'
                      ? '승인 대기 중 — 요청 보기'
                      : editStatus === 'approved'
                        ? '수정 진행 · 완료 제출'
                        : '최종 확인 대기 — 제출 보기'}
                </button>
              </>
            )}
          </section>
          <section className={cn(card, 'flex flex-col gap-2')}>
            <span className="text-fg text-[14px] font-bold">
              최근 변경 제안
            </span>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[13px] font-semibold">
                {d.certRecentChange.label}
              </span>
              <Chip badge={d.certRecentChange.status} />
            </div>
            <span className="text-fg-subtle text-[11px]">
              {d.certRecentChange.date}
            </span>
          </section>
        </div>
      </div>
    </div>
  )
}
