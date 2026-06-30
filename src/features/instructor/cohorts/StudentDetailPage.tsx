import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, type BadgeTone } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { StudentDetailTabKey } from '@/shared/types'
import { useSaveReviewComment, useStudentDetail } from '../api/console'
import { CERT_STATUS_META } from './meta'

const TABS: { key: StudentDetailTabKey; label: string }[] = [
  { key: 'quiz', label: '퀴즈' },
  { key: 'records', label: '기록실' },
  { key: 'projects', label: '프로젝트' },
  { key: 'troubleshooting', label: '트러블슈팅' },
  { key: 'endorsements', label: '강사 추천서' },
]

const SUPPLEMENT_STATUS = {
  responded: { label: '학생 응답', tone: 'success' as BadgeTone },
  waiting: { label: '학생 응답 대기', tone: 'warning' as BadgeTone },
}

// 수강생 상세 (/instructor/students/:studentId) — §4/P0 36. (Figma 1334:9714)
// 좌측 탭은 Figma '수강생 상세 좌측 5탭' 기준 — 이력서 탭은 프레임 미반영(후속).
// 검토 코멘트는 학생 비공개 · 보완 요청 이력은 최근 3건.
export default function StudentDetailPage() {
  const { studentId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, isPending, isError, refetch } = useStudentDetail(studentId)
  const saveComment = useSaveReviewComment(studentId)
  const [tab, setTab] = useState<StudentDetailTabKey>('quiz')
  const [comment, setComment] = useState('')
  usePageHeader(
    data ? `수강생 상세 — ${data.name}` : '수강생 상세',
    data
      ? `${data.uuidEmail.split(' · ')[0]} · ${data.cohortLabel} · 퀴즈·기록실·프로젝트·트러블슈팅·강사 추천서 통합 검토`
      : '퀴즈·기록실·프로젝트·트러블슈팅·강사 추천서 통합 검토',
  )

  // 상세 도착 시 기존 검토 코멘트로 초기화.
  useEffect(() => {
    if (data) setComment(data.reviewComment)
  }, [data])

  if (isPending) {
    return <div className="text-fg-muted p-8">수강생 정보를 불러오는 중…</div>
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="수강생 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const activeTab = data.tabs[tab]

  return (
    <div className="p-8">
      {/* 학생 정보 strip */}
      <div className="border-border bg-surface flex flex-wrap items-center gap-5 rounded-xl border px-5 py-4">
        <div className="flex items-center gap-4">
          <Avatar name={data.name} size={52} />
          <div>
            <p className="text-fg text-lg font-bold">{data.name}</p>
            <p className="text-fg-subtle text-xs">{data.uuidEmail}</p>
          </div>
        </div>
        <div className="bg-divider h-9 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">과정/기수</p>
          <p className="text-fg text-sm font-bold">{data.cohortLabel}</p>
        </div>
        <div className="bg-divider h-9 w-px" />
        <div>
          <p className="text-fg-subtle text-xs">증명서 상태</p>
          <div className="mt-1">
            <StatusBadge
              label={CERT_STATUS_META[data.certStatus].label}
              tone={CERT_STATUS_META[data.certStatus].tone}
            />
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border-border text-fg-muted hover:bg-surface-muted flex items-center gap-1 rounded-lg border px-3.5 py-2 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> 수강생 목록
          </button>
          <button
            type="button"
            onClick={() => toast.info('증명서 미리보기 — 후속 화면 (mock)')}
            className="bg-brand-deep flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-bold text-white"
          >
            증명서 미리보기 <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 요약 row — KPI 4 + 6축 mini + 경고 플래그 */}
      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_328px_200px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {data.kpis.map((k) => (
            <div
              key={k.label}
              className="border-border bg-surface rounded-xl border p-4"
            >
              <p className="text-fg-muted text-xs font-medium">{k.label}</p>
              {/* KPI 값은 brand 강조 (Figma 공통 KPI Card) */}
              <p className="text-brand mt-1.5 text-2xl font-bold">{k.value}</p>
              <p className="text-fg-subtle mt-1 text-[11px]">{k.hint}</p>
            </div>
          ))}
        </div>
        <div className="border-border bg-surface rounded-xl border p-4">
          <p className="text-fg text-xs font-bold">6축 점수 (SkillScore)</p>
          <div className="mt-3 grid grid-cols-6 gap-1 text-center">
            {data.skillScores.map((s) => (
              <div key={s.label}>
                <p className="text-fg-subtle text-[11px]">{s.label}</p>
                <p className="text-fg mt-1 text-base font-bold">{s.score}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-warning/40 bg-warning-bg/40 rounded-xl border p-4">
          <p className="text-warning text-xs font-bold">⚠ 경고 플래그</p>
          <p className="text-fg-muted mt-2 text-[11px]">{data.warningLine1}</p>
          <p className="text-fg-muted mt-1 text-[11px]">{data.warningLine2}</p>
        </div>
      </div>

      {/* 2-col: 좌측 5탭 + 우측 검토/보완 */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          {/* 활성 탭 = brand 틴트 pill (Figma 공통 Tabs Bar) */}
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm',
                  tab === t.key
                    ? 'bg-brand/10 text-brand font-bold'
                    : 'text-fg-muted hover:bg-surface-muted font-medium',
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'rounded px-1.5 py-px text-[10px] font-bold',
                    tab === t.key
                      ? 'bg-brand/15 text-brand'
                      : 'bg-surface-muted text-fg-subtle',
                  )}
                >
                  {data.tabs[t.key].items.length}
                </span>
              </button>
            ))}
          </div>

          <div className="border-border bg-surface mt-4 rounded-xl border">
            <div className="border-divider flex items-center justify-between border-b px-5 py-4">
              <div>
                <p className="text-fg text-sm font-bold">{activeTab.title}</p>
                <p className="text-fg-subtle text-xs">{activeTab.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (activeTab.ctaTo) navigate(activeTab.ctaTo)
                  else toast.info(`${activeTab.ctaLabel} — 후속 화면 (mock)`)
                }}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                {activeTab.ctaLabel}
              </button>
            </div>
            {activeTab.items.map((item) => (
              <div
                key={item.id}
                className="border-divider flex items-center gap-3 border-t px-5 py-3.5 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-fg truncate text-sm font-medium">
                    {item.title}
                  </p>
                  <p className="text-fg-subtle text-xs">{item.subtitle}</p>
                </div>
                <span className="text-fg w-20 shrink-0 text-right text-sm font-bold">
                  {item.value ?? '-'}
                </span>
                <div className="w-24 shrink-0">
                  <StatusBadge
                    label={item.statusLabel}
                    tone={item.statusTone}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (item.to) navigate(item.to)
                    else
                      toast.info(
                        `${item.title} ${item.actionLabel} — 후속 화면 (mock)`,
                      )
                  }}
                  className="border-border text-fg-muted hover:bg-surface-muted shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium"
                >
                  {item.actionLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 우측 사이드 */}
        <div className="flex h-fit flex-col gap-4">
          <div className="border-border bg-surface rounded-xl border p-4.5">
            <p className="text-fg text-sm font-bold">검토 코멘트</p>
            <p className="text-fg-subtle mt-0.5 text-xs">
              학생에게 비공개 · 운영자/강사만 조회
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              aria-label="검토 코멘트"
              className="border-border focus:border-brand text-fg mt-3 w-full rounded-lg border bg-white p-3 text-sm outline-none"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComment(data.reviewComment)}
                className="border-border text-fg-muted hover:bg-surface-muted rounded-lg border px-3 py-1.5 text-xs font-medium"
              >
                취소
              </button>
              <button
                type="button"
                disabled={saveComment.isPending}
                onClick={() =>
                  saveComment.mutate(comment, {
                    onSuccess: () =>
                      toast.success('검토 코멘트 저장 — 운영자/강사만 조회'),
                    onError: () => toast.danger('저장에 실패했어요'),
                  })
                }
                className="bg-brand-deep rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
              >
                저장
              </button>
            </div>
          </div>

          <div className="border-border bg-surface rounded-xl border p-4.5">
            <p className="text-fg text-sm font-bold">보완 요청 이력</p>
            <p className="text-fg-subtle mt-0.5 text-xs">
              학생에게 발송된 이력 · 최근 {data.supplements.length}건
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {data.supplements.map((s) => (
                <div
                  key={s.id}
                  className="bg-surface-muted rounded-lg px-3 py-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted text-xs">{s.date}</span>
                    <StatusBadge
                      label={SUPPLEMENT_STATUS[s.status].label}
                      tone={SUPPLEMENT_STATUS[s.status].tone}
                    />
                  </div>
                  <p className="text-fg mt-1.5 text-xs font-medium">
                    <span className="font-mono">{s.code}</span>
                    <span className="text-fg-subtle"> · {s.category}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
