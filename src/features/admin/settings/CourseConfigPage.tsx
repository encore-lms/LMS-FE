import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Coins,
  FileText,
  FolderOpen,
  Gamepad2,
  Info,
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
import type { CourseCohort } from '@/shared/types'
import {
  useCourseConfig,
  useCourseList,
  useUpdateCohortSettings,
} from '../api/settings'
import { ActionModal, type ActionModalSpec } from './ActionModal'
import { SettingsTabs } from './SettingsTabs'

type ToggleKey = 'mileage' | 'play'

const TOGGLES: { key: ToggleKey; label: string; Icon: typeof Coins }[] = [
  { key: 'mileage', label: '마일리지', Icon: Coins },
  { key: 'play', label: 'PLAY', Icon: Gamepad2 },
]

const periodLabel = (start: string | null, end: string | null) =>
  start && end ? `${start} ~ ${end}` : '-'

// 토글 스위치.
function Switch({
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

// 교육 과정 설정 (/admin/settings/course-config) — 등록 과정의 기본 정보 + 기수별 기능 토글(mileage·play).
// 토글은 정본 CohortFeatureConfig 기준으로 기수 단위 저장. 저장 시 변경된 기수만 PUT.
export default function CourseConfigPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { data: courses, isPending, isError, refetch } = useCourseList()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [courseQuery, setCourseQuery] = useState('')
  // 토글 변경 dirty 셋 — '{cohortId}:{toggleKey}' 단위로 추적(저장 시 초기화).
  const [changes, setChanges] = useState<Record<string, boolean>>({})
  const [modal, setModal] = useState<
    (ActionModalSpec & { kind: 'save' | 'cancel' }) | null
  >(null)
  const updateCohort = useUpdateCohortSettings()
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

  const cohorts = config?.cohorts ?? []
  const dirtyKey = (cohortId: string, key: ToggleKey) => `${cohortId}:${key}`
  const isChanged = (cohortId: string, key: ToggleKey) =>
    !!changes[dirtyKey(cohortId, key)]
  // base는 BE 저장값(cohort.mileageEnabled/playEnabled). 변경 dirty면 반전(저장 전 미리보기).
  const baseEnabled = (cohort: CourseCohort, key: ToggleKey) =>
    key === 'mileage' ? cohort.mileageEnabled : cohort.playEnabled
  const effective = (cohort: CourseCohort, key: ToggleKey) =>
    isChanged(cohort.id, key)
      ? !baseEnabled(cohort, key)
      : baseEnabled(cohort, key)
  const toggle = (cohortId: string, key: ToggleKey) =>
    setChanges((p) => ({
      ...p,
      [dirtyKey(cohortId, key)]: !p[dirtyKey(cohortId, key)],
    }))

  const changedCount = Object.values(changes).filter(Boolean).length
  const changedCohorts = cohorts.filter(
    (c) => isChanged(c.id, 'mileage') || isChanged(c.id, 'play'),
  )

  const openSave = () =>
    setModal({
      kind: 'save',
      title: '교육 과정 설정 저장 확인',
      subtitle: '기수별 기능 토글(마일리지·PLAY) 변경을 저장합니다.',
      rows: [
        { label: '대상 과정', value: config?.title ?? '-' },
        { label: '변경 기수', value: `${changedCohorts.length}개` },
        { label: '변경 토글', value: `${changedCount}건` },
        { label: '영향', value: '수강생 메뉴 노출 재계산' },
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

  const onConfirm = async () => {
    if (!modal) return
    if (modal.kind === 'cancel') {
      setChanges({})
      setModal(null)
      navigate('/admin/settings')
      return
    }
    if (!courseId || changedCohorts.length === 0) {
      setModal(null)
      return
    }
    try {
      // 변경된 기수만 순차 저장(각 PUT이 최신 상세를 반환해 캐시 갱신).
      for (const c of changedCohorts) {
        await updateCohort.mutateAsync({
          courseId,
          cohortId: c.id,
          mileageEnabled: effective(c, 'mileage'),
          playEnabled: effective(c, 'play'),
        })
      }
      toast.success(
        `교육 과정 설정 저장 — ${changedCohorts.length}개 기수 · 감사 로그에 기록됨`,
      )
      setChanges({})
      setModal(null)
    } catch {
      toast.danger('기수 기능 토글 저장에 실패했어요')
    }
  }

  return (
    <div className="p-8">
      {/* 히어로 */}
      <div className="bg-brand mt-4 flex flex-wrap items-start justify-between gap-4 rounded-xl px-6 py-5 text-white">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-white/60">
            COURSE CONFIG · 과정별 기능
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
            disabled={changedCount === 0}
            className="text-fg flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold disabled:opacity-50"
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
                <p className="text-fg text-sm font-medium">{c.title}</p>
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
                <p className="text-fg-subtle text-xs">과정명·기간·운영 상태</p>
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
            </div>
          </div>

          {/* 기수별 기능 토글 */}
          <div className="border-border bg-surface rounded-xl border">
            <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
              <div className="bg-accent-bg text-accent-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-fg text-sm font-bold">
                  기수별 기능 토글 · {cohorts.length}개 기수
                </p>
                <p className="text-fg-subtle text-xs">
                  기수별 마일리지·PLAY 노출 제어 · 끌 경우 수강생 메뉴에서 숨김
                </p>
              </div>
            </div>
            <div>
              {cohorts.map((c) => (
                <div
                  key={c.id}
                  className="border-divider flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3.5 first:border-t-0"
                >
                  <div className="min-w-0">
                    <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
                      {c.cohortNo}기
                      <StatusBadge
                        label={c.status === 'operating' ? '운영' : '종료'}
                        tone={c.status === 'operating' ? 'success' : 'neutral'}
                      />
                      {(isChanged(c.id, 'mileage') ||
                        isChanged(c.id, 'play')) && (
                        <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                          변경됨
                        </span>
                      )}
                    </p>
                    <p className="text-fg-subtle text-xs tabular-nums">
                      {c.startDate} ~ {c.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    {TOGGLES.map(({ key, label, Icon }) => (
                      <div key={key} className="flex items-center gap-2">
                        <Icon className="text-fg-muted h-4 w-4" />
                        <span className="text-fg-muted text-xs font-medium">
                          {label}
                        </span>
                        <Switch
                          checked={effective(c, key)}
                          label={`${c.cohortNo}기 ${label}`}
                          onChange={() => toggle(c.id, key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {cohorts.length === 0 && (
                <p className="text-fg-subtle px-5 py-8 text-center text-sm">
                  기수가 없어요
                </p>
              )}
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
