import { useMemo, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Coins,
  Eye,
  FileText,
  FolderOpen,
  Gamepad2,
  Info,
  PenLine,
  Save,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import type { CourseFeatureToggle, CourseLearningPolicy } from '@/shared/types'
import { useCourseConfig, useCourseList } from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'

// 토글 스위치 — 기능 토글·공개 정책 행 공용.
function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors',
        checked ? 'bg-brand' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'block h-5 w-5 rounded-full bg-white transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

// 기능 토글·공개 정책 키별 고유 아이콘 + 컬러 (Figma 1284:9243 기준).
type IconDef = { Icon: ComponentType<{ className?: string }>; tint: string }
const TOGGLE_ICON: Record<string, IconDef> = {
  mileage: { Icon: Coins, tint: 'bg-warning-bg text-warning' },
  play: { Icon: Gamepad2, tint: 'bg-accent-bg text-accent-strong' },
  records: { Icon: BookOpen, tint: 'bg-success-bg text-success' },
  blog: { Icon: PenLine, tint: 'bg-info-bg text-info' },
  library: { Icon: FolderOpen, tint: 'bg-brand/10 text-brand' },
  studentMenu: { Icon: Eye, tint: 'bg-accent-bg text-accent-strong' },
  certificate: { Icon: BadgeCheck, tint: 'bg-success-bg text-success' },
}
const DEFAULT_TOGGLE_ICON: IconDef = {
  Icon: FileText,
  tint: 'bg-surface-muted text-fg-muted',
}

// 토글 행 — 키별 컬러 아이콘 박스 + 이름(+변경됨 배지) + 설명 + 스위치.
function ToggleRow({
  toggle,
  changed,
  onChange,
}: {
  toggle: CourseFeatureToggle
  changed: boolean
  onChange: () => void
}) {
  const { Icon, tint } = TOGGLE_ICON[toggle.key] ?? DEFAULT_TOGGLE_ICON
  return (
    <div className="border-divider flex items-center gap-4 border-t px-5 py-3.5 first:border-t-0">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          tint,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
          {toggle.label}
          {changed && (
            <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
              변경됨
            </span>
          )}
        </p>
        <p className="text-fg-muted text-xs">{toggle.description}</p>
      </div>
      <Toggle
        checked={toggle.enabled}
        label={toggle.label}
        onChange={onChange}
      />
    </div>
  )
}

// 기능 토글·학습/공개 정책 기본값 — 후속 단위에서 BE 영속화 예정(현재 과정 공통 기본값).
const DEFAULT_FEATURE_TOGGLES: CourseFeatureToggle[] = [
  {
    key: 'mileage',
    label: '마일리지',
    description: '수강생 마일리지 적립·사용 메뉴 노출',
    enabled: true,
  },
  {
    key: 'play',
    label: 'PLAY',
    description: 'PLAY 게임(타자 등) 노출 — 마일리지와 연동',
    enabled: true,
  },
  {
    key: 'records',
    label: '학습 기록',
    description: '수강생 학습 기록 메뉴 노출',
    enabled: true,
  },
  {
    key: 'blog',
    label: '블로그',
    description: '수강생 블로그 작성·공개',
    enabled: false,
  },
  {
    key: 'library',
    label: '자료실',
    description: '과정 자료실 메뉴 노출',
    enabled: true,
  },
]
const DEFAULT_PUBLIC_TOGGLES: CourseFeatureToggle[] = [
  {
    key: 'studentMenu',
    label: '수강생 메뉴 노출',
    description: '수강생 사이드바에 본 과정 메뉴 노출',
    enabled: true,
  },
  {
    key: 'certificate',
    label: '증명서 반영',
    description: '수료·증명서에 본 과정 반영',
    enabled: true,
  },
]
const DEFAULT_LEARNING_POLICIES: CourseLearningPolicy[] = [
  {
    key: 'attendance',
    label: '출결 기준',
    description: 'HRD-Net 입실/퇴실 기준 · 폼 승인 정책 연동',
  },
  { key: 'quiz', label: '퀴즈 정책', description: '퀴즈 응시·재응시 기준' },
  {
    key: 'assignment',
    label: '과제 정책',
    description: '과제 제출·재제출 기준',
  },
]

const periodLabel = (start: string | null, end: string | null) =>
  start && end ? `${start} ~ ${end}` : '-'

// 교육 과정 설정 (/admin/settings/course-config) — 등록된 과정의 기본 정보 + 기능 토글·정책. (Figma 1284:9243)
// 과정 목록·기본 정보는 learning-service 실 데이터. 토글/정책은 현재 기본값(후속 단위에서 BE 영속화).
export default function CourseConfigPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: courses, isPending, isError, refetch } = useCourseList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [courseQuery, setCourseQuery] = useState('')
  // 토글 변경 dirty 셋 — '{group}:{key}' 단위로 켜짐/꺼짐 추적(mock, 저장 시 초기화).
  const [changes, setChanges] = useState<Record<string, boolean>>({})
  // 저장된 토글 값 영속(세션) — key: `${courseId}:${group}:${key}`. 저장 시 변경값 반영.
  const [applied, setApplied] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<
    (ActionModalSpec & { kind: 'save' | 'cancel' }) | null
  >(null)
  usePageHeader('운영 설정 · 교육 과정 설정')

  const courseId = selectedId ?? courses?.[0]?.courseId ?? null
  const { data: config } = useCourseConfig(courseId)

  const filteredCourses = useMemo(() => {
    const items = courses ?? []
    const needle = courseQuery.trim().toLowerCase()
    if (!needle) return items
    return items.filter((c) => c.title.toLowerCase().includes(needle))
  }, [courses, courseQuery])

  if (isPending) {
    return <div className="text-fg-muted py-10 text-center">불러오는 중…</div>
  }
  if (isError || !courses) {
    return (
      <Empty
        icon={<AlertTriangle className="h-6 w-6" />}
        title="과정 목록을 불러오지 못했어요"
        description="교육 과정 설정은 실 BE 전용입니다. ADMIN/MANAGER로 로그인했는지 확인한 뒤 다시 시도해 주세요."
        action={<Button onClick={() => refetch()}>다시 시도</Button>}
      />
    )
  }
  if (courses.length === 0) {
    return (
      <Empty
        icon={<FolderOpen className="h-6 w-6" />}
        title="등록된 과정이 없어요"
        description="'교육 과정 추가'에서 HRD 과정을 시스템 등록하면 여기서 설정할 수 있어요."
        action={
          <Button onClick={() => navigate('/admin/settings/courses/new')}>
            교육 과정 추가로 이동
          </Button>
        }
      />
    )
  }

  const changedCount = Object.values(changes).filter(Boolean).length
  const toggleChange = (group: string, key: string) =>
    setChanges((p) => ({ ...p, [`${group}:${key}`]: !p[`${group}:${key}`] }))
  const isChanged = (group: string, key: string) => !!changes[`${group}:${key}`]
  // 저장된 값(applied) 우선, 없으면 과정 기본값. 저장은 세션 동안 유지(mock).
  const baseEnabled = (group: string, t: CourseFeatureToggle) =>
    applied[`${courseId}:${group}:${t.key}`] ?? t.enabled
  // 변경 dirty면 시각적으로 토글 상태 반전 — 저장 전 미리보기.
  const effectiveEnabled = (group: string, t: CourseFeatureToggle) =>
    isChanged(group, t.key) ? !baseEnabled(group, t) : baseEnabled(group, t)

  const openSave = () =>
    setModal({
      kind: 'save',
      title: '교육 과정 설정 저장 확인',
      subtitle: '기능 토글과 공개 정책 변경을 저장합니다.',
      rows: [
        { label: '변경 건수', value: `${changedCount}건` },
        { label: '대상 과정', value: config?.title ?? '-' },
        { label: '영향', value: '수강생 메뉴 노출 재계산' },
        { label: '감사 로그', value: '정책 변경 이력 기록' },
      ],
      confirmLabel: '저장',
    })

  const openCancel = () =>
    setModal({
      kind: 'cancel',
      title: '교육 과정 설정 취소 확인',
      subtitle: '저장하지 않은 변경을 버리고 설정으로 돌아갑니다.',
      rows: [
        { label: '미저장 변경', value: `${changedCount}건` },
        { label: '저장 영향', value: '없음' },
        { label: '결과', value: '설정으로 이동' },
        { label: '주의', value: '버린 변경은 복구되지 않음' },
      ],
      confirmLabel: '버리기',
    })

  const onConfirm = (memo: string) => {
    if (!modal) return
    if (modal.kind === 'save') {
      // 변경된 토글의 미리보기 값을 applied에 영속 — 저장 후에도 상태 유지(세션, mock).
      setApplied((prev) => {
        const next = { ...prev }
        const persist = (group: string, toggles: CourseFeatureToggle[]) => {
          for (const t of toggles) {
            if (isChanged(group, t.key)) {
              next[`${courseId}:${group}:${t.key}`] = effectiveEnabled(group, t)
            }
          }
        }
        persist('feature', DEFAULT_FEATURE_TOGGLES)
        persist('public', DEFAULT_PUBLIC_TOGGLES)
        return next
      })
      // 저장 피드백은 토스트로 요약 — 변경 적용 후 dirty 초기화.
      toast.success(
        `교육 과정 설정 저장 — 변경 ${changedCount}건 · 감사 로그에 기록됨`,
      )
      if (memo.trim()) toast.info('매니저 메모가 감사 로그에 함께 기록됐어요')
      setChanges({})
      setModal(null)
    } else {
      setChanges({})
      setModal(null)
      navigate('/admin/settings')
    }
  }

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5 text-white">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-white/60">
            COURSE CONFIG · 과정별 기능·정책
          </p>
          <p className="mt-1 text-xl font-bold">교육 과정 설정</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
              <FileText className="h-3 w-3" /> {config?.title ?? '-'} 선택
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1">
              {config?.status === 'ended' ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              {config?.status === 'ended' ? '종료' : '운영 중'}
            </span>
            {changedCount > 0 && (
              <span className="bg-warning-bg text-warning rounded-full px-2.5 py-1 font-bold">
                변경된 설정 {changedCount}건
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openCancel}
            className="rounded-lg border border-white px-3.5 py-2 text-xs font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={openSave}
            className="text-fg flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold"
          >
            <Save className="h-3.5 w-3.5" /> 정책 저장
          </button>
        </div>
      </div>

      <SettingsTabs
        right={
          changedCount > 0 ? (
            <>
              <Info className="h-3 w-3" /> 변경 사항 미저장 — {changedCount}건
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3" /> 변경 사항 없음
            </>
          )
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
        {/* 과정 목록 */}
        <div className="border-border bg-surface h-fit rounded-xl border">
          <div className="px-4 pt-4 pb-3">
            <p className="text-fg text-sm font-bold">과정 목록</p>
            <input
              value={courseQuery}
              onChange={(e) => setCourseQuery(e.target.value)}
              placeholder="과정명 검색"
              aria-label="과정명 검색"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand mt-2 h-9 w-full rounded-lg border bg-white px-3 text-sm outline-none"
            />
          </div>
          {filteredCourses.map((c) => (
            <button
              key={c.courseId}
              type="button"
              onClick={() => {
                setSelectedId(c.courseId)
                setChanges({})
              }}
              className={cn(
                'border-divider flex w-full items-center justify-between border-t px-4 py-3 text-left',
                c.courseId === courseId
                  ? 'bg-accent-bg/50'
                  : 'hover:bg-surface-muted',
              )}
            >
              <div className="min-w-0">
                <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
                  {c.title}
                  {c.courseId === courseId && changedCount > 0 && (
                    <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                      {changedCount}
                    </span>
                  )}
                </p>
                <p className="text-fg-subtle text-xs">
                  기수 {c.cohortCount}개 · {periodLabel(c.startDate, c.endDate)}
                </p>
              </div>
              <StatusBadge
                label={c.status === 'operating' ? '운영 중' : '종료'}
                tone={c.status === 'operating' ? 'success' : 'neutral'}
              />
            </button>
          ))}
        </div>

        {/* 설정 패널 */}
        <div className="flex flex-col gap-4">
          {/* 기본 정보 */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
              <div className="bg-info-bg text-info flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">기본 정보</p>
                <p className="text-fg-subtle text-xs">
                  과정명·기간·운영 상태·기수
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 px-5 py-4">
              <div>
                <p className="text-fg-subtle text-[11px] font-medium">과정명</p>
                <p className="text-fg mt-0.5 text-sm font-medium">
                  {config?.title ?? '-'}
                </p>
              </div>
              <div>
                <p className="text-fg-subtle text-[11px] font-medium">기간</p>
                <p className="text-fg mt-0.5 text-sm font-medium tabular-nums">
                  {periodLabel(
                    config?.startDate ?? null,
                    config?.endDate ?? null,
                  )}
                </p>
              </div>
              <div>
                <p className="text-fg-subtle text-[11px] font-medium">
                  운영 상태
                </p>
                <p className="text-fg mt-0.5 flex items-center gap-1 text-sm font-medium">
                  {config?.status === 'ended' ? (
                    <XCircle className="text-fg-subtle h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="text-success h-3.5 w-3.5" />
                  )}
                  {config?.status === 'ended' ? '종료' : '운영 중'}
                </p>
              </div>
              <div className="w-full">
                <p className="text-fg-subtle text-[11px] font-medium">
                  기수 {config?.cohorts.length ?? 0}개
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(config?.cohorts ?? []).map((co) => (
                    <span
                      key={co.id}
                      className="border-border text-fg-muted inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                    >
                      <span className="text-fg font-semibold">{co.grade}</span>
                      <span className="tabular-nums">
                        {co.startDate} ~ {co.endDate}
                      </span>
                      <span
                        className={cn(
                          'rounded px-1 py-px text-[10px] font-bold',
                          co.status === 'ended'
                            ? 'bg-surface-muted text-fg-subtle'
                            : 'bg-success-bg text-success',
                        )}
                      >
                        {co.status === 'ended' ? '종료' : '운영'}
                      </span>
                    </span>
                  ))}
                  {(config?.cohorts ?? []).length === 0 && (
                    <span className="text-fg-subtle text-xs">기수 없음</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 기능 토글 */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
              <div className="bg-accent-bg text-accent-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">
                  기능 토글 {DEFAULT_FEATURE_TOGGLES.length}
                </p>
                <p className="text-fg-subtle text-xs">
                  수강생/매니저 사이드바 탭 노출 제어 · 끌 경우 신규 사용 차단
                </p>
              </div>
            </div>
            <div>
              {DEFAULT_FEATURE_TOGGLES.map((t) => (
                <ToggleRow
                  key={t.key}
                  toggle={{ ...t, enabled: effectiveEnabled('feature', t) }}
                  changed={isChanged('feature', t.key)}
                  onChange={() => toggleChange('feature', t.key)}
                />
              ))}
            </div>
          </div>

          {/* 학습 정책 */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
              <div className="bg-warning-bg text-warning flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">학습 정책</p>
                <p className="text-fg-subtle text-xs">
                  출결·퀴즈·과제 정책 — 마트 재계산 영향
                </p>
              </div>
            </div>
            <div>
              {DEFAULT_LEARNING_POLICIES.map((p, i) => (
                <div
                  key={p.key}
                  className={cn(
                    'border-divider px-5 py-3.5',
                    i > 0 && 'border-t',
                  )}
                >
                  <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
                    {p.label}
                    {isChanged('policy', p.key) && (
                      <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                        변경됨
                      </span>
                    )}
                  </p>
                  <p className="text-fg-muted text-xs">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 공개 정책 */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
              <div className="bg-success-bg text-success flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">공개 정책</p>
                <p className="text-fg-subtle text-xs">
                  수강생 메뉴 노출 여부 · 증명서 반영 여부
                </p>
              </div>
            </div>
            <div>
              {DEFAULT_PUBLIC_TOGGLES.map((t) => (
                <ToggleRow
                  key={t.key}
                  toggle={{ ...t, enabled: effectiveEnabled('public', t) }}
                  changed={isChanged('public', t.key)}
                  onChange={() => toggleChange('public', t.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        spec={modal}
        onClose={() => setModal(null)}
        onConfirm={onConfirm}
      />
    </div>
  )
}
