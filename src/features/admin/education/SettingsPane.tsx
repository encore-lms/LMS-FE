import { useState, type ReactNode } from 'react'
import {
  BookOpen,
  ChevronRight,
  Coins,
  Gamepad2,
  Settings,
} from 'lucide-react'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/use-toast'
import { CurriculumModal } from './CurriculumModal'
import { useCourseDetail } from './api'
import { useCourseConfig, useUpdateCohortSettings } from '../api/settings'

type ToggleKey = 'mileage' | 'play'

/** 섹션 머리 — 아이콘 배지 + 제목/설명. 카드 테두리 없이 여백과 선으로만 나눈다. */
function SectionHead({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-success-bg text-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-fg text-[15px] font-bold">{title}</h3>
        <p className="text-fg-subtle mt-0.5 text-[13px]">{description}</p>
      </div>
    </div>
  )
}

/** 설정 한 줄 — 왼쪽 아이콘·제목·설명, 오른쪽 컨트롤. 줄 사이는 얇은 선으로만. */
function SettingRow({
  icon,
  title,
  description,
  control,
}: {
  icon: ReactNode
  title: ReactNode
  description: string
  control: ReactNode
}) {
  return (
    <div className="border-divider flex flex-wrap items-center justify-between gap-4 border-b py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="bg-success-bg text-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-fg flex items-center gap-1.5 text-sm font-bold">
            {title}
          </p>
          <p className="text-fg-subtle mt-0.5 text-[13px]">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">{control}</div>
    </div>
  )
}

/** 오른쪽 이동 버튼 — 라벨 + 화살표. */
function GoButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-border text-fg hover:bg-surface-muted inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
      <ChevronRight className="text-fg-subtle h-4 w-4" />
    </button>
  )
}

/**
 * 과정 설정 탭 — 과정 정보 · 기능 설정.
 *
 * <p>카드 테두리를 두르지 않고 섹션 머리와 얇은 구분선으로만 나눈다. 설정은 훑어 내려가며
 * 켜고 끄는 화면이라, 항목마다 상자를 치면 눈이 상자 경계에 먼저 걸린다.</p>
 *
 * <p>마일리지·PLAY 는 운영 설정의 '교육 과정 설정'에서 옮겨 왔다. 토글을 눌러도 바로
 * 저장하지 않고 [저장]까지 기다린다 — 끄는 순간 수강생 메뉴에서 항목이 사라지므로 잘못 누른
 * 것을 되돌릴 틈이 있어야 한다.</p>
 */
export function SettingsPane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const toast = useToast()
  const detail = useCourseDetail(courseId, cohortId)
  const config = useCourseConfig(courseId)
  const updateCohort = useUpdateCohortSettings()
  const [curriculumOpen, setCurriculumOpen] = useState(false)
  // 저장 전 미리보기 — 값이 아니라 '뒤집혔는지'를 들고 있어야 서버 값이 바뀌어도 어긋나지 않는다.
  const [flipped, setFlipped] = useState<Record<ToggleKey, boolean>>({
    mileage: false,
    play: false,
  })

  const d = detail.data
  const cohort = config.data?.cohorts?.find((c) => c.id === cohortId) ?? null
  const cohortLabel = cohort ? `${cohort.cohortNo}기` : ''

  const saved = (key: ToggleKey) =>
    key === 'mileage' ? !!cohort?.mileageEnabled : !!cohort?.playEnabled
  const effective = (key: ToggleKey) =>
    flipped[key] ? !saved(key) : saved(key)
  const dirty = flipped.mileage || flipped.play

  const save = async () => {
    if (!cohort) return
    try {
      await updateCohort.mutateAsync({
        courseId,
        cohortId,
        mileageEnabled: effective('mileage'),
        playEnabled: effective('play'),
      })
      setFlipped({ mileage: false, play: false })
      toast.success('기능 설정을 저장했어요 · 감사 로그에 기록됨')
    } catch {
      toast.danger('기능 설정 저장에 실패했어요')
    }
  }

  // 2열 정의 목록 — 왼쪽 줄과 오른쪽 줄을 짝지어 놓는다.
  const infoPairs: [string, string][][] = d
    ? [
        [
          ['과정명', d.title],
          [
            '훈련기간',
            d.trainingStart && d.trainingEnd
              ? `${d.trainingStart} ~ ${d.trainingEnd} (총 ${d.trainingDays}일 / ${d.trainingHours}시간)`
              : `총 ${d.trainingDays}일 / ${d.trainingHours}시간`,
          ],
        ],
        [
          ['훈련과정 구분', d.trainingType],
          ['지원 금액', d.supportAmount],
        ],
        [
          ['NCS 분류', d.ncsName],
          ['소재지', d.address],
        ],
        [
          ['훈련기관', d.institution],
          ['담당자', d.manager],
        ],
      ]
    : []

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-fg text-2xl font-bold">과정 설정</h2>
        <p className="text-fg-subtle mt-1.5 text-sm">
          과정 정보와 다양한 기능을 설정하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 과정 정보 */}
      <section className="flex flex-col gap-5">
        <SectionHead
          icon={<BookOpen className="h-5 w-5" />}
          title="과정 정보"
          description="해당 과정에 대한 기본 정보를 확인합니다."
        />
        <DataBoundary
          isPending={detail.isPending}
          isError={detail.isError || !d}
          onRetry={() => detail.refetch()}
          skeleton={<SkeletonText lines={6} />}
          errorTitle="과정 정보를 불러오지 못했어요"
          errorDescription="HRD 훈련과정ID가 없는 기수이거나 HRD-Net 연결을 확인해 주세요."
        >
          {d && (
            <dl className="grid gap-x-12 gap-y-5 sm:grid-cols-2">
              {infoPairs.flat().map(([label, value]) => (
                <div key={label} className="flex gap-6 text-sm">
                  <dt className="text-fg-muted w-24 shrink-0">{label}</dt>
                  <dd className="text-fg min-w-0 font-medium break-words">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DataBoundary>
      </section>

      {/* 기능 설정 */}
      <section className="flex flex-col gap-2">
        <SectionHead
          icon={<Settings className="h-5 w-5" />}
          title="기능 설정"
          description="수강생에게 제공할 기능을 설정합니다."
        />
        <div className="mt-3">
          <SettingRow
            icon={<Coins className="h-4 w-4" />}
            title={
              <>
                마일리지
                {flipped.mileage && (
                  <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                    변경됨
                  </span>
                )}
              </>
            }
            description="수강생 메뉴에서 마일리지를 노출합니다."
            control={
              <>
                <Switch
                  checked={effective('mileage')}
                  label="마일리지 사용"
                  onChange={() =>
                    setFlipped((p) => ({ ...p, mileage: !p.mileage }))
                  }
                />
                <span className="text-fg-muted w-11 text-[13px]">
                  {effective('mileage') ? '활성화' : '비활성'}
                </span>
              </>
            }
          />
          <SettingRow
            icon={<Gamepad2 className="h-4 w-4" />}
            title={
              <>
                PLAY
                {flipped.play && (
                  <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                    변경됨
                  </span>
                )}
              </>
            }
            description="수강생 메뉴에서 PLAY 기능을 제공합니다."
            control={
              <>
                <Switch
                  checked={effective('play')}
                  label="PLAY 사용"
                  onChange={() => setFlipped((p) => ({ ...p, play: !p.play }))}
                />
                <span className="text-fg-muted w-11 text-[13px]">
                  {effective('play') ? '활성화' : '비활성'}
                </span>
              </>
            }
          />
          <SettingRow
            icon={<BookOpen className="h-4 w-4" />}
            title="커리큘럼 설정"
            description="주차별 학습 내용과 커리큘럼을 설정하고 관리합니다."
            control={
              <GoButton
                label="커리큘럼 설정"
                onClick={() => setCurriculumOpen(true)}
              />
            }
          />
        </div>

        {dirty && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setFlipped({ mileage: false, play: false })}
              className="border-border text-fg hover:bg-surface-muted inline-flex h-9 items-center rounded-lg border px-3.5 text-[13px] font-semibold"
            >
              되돌리기
            </button>
            <button
              type="button"
              onClick={save}
              disabled={updateCohort.isPending}
              className="bg-brand-deep hover:bg-brand-deep/90 inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-bold text-white disabled:opacity-60"
            >
              {updateCohort.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        )}
      </section>

      <CurriculumModal
        open={curriculumOpen}
        onClose={() => setCurriculumOpen(false)}
        cohortId={cohortId}
        cohortLabel={cohortLabel}
      />
    </div>
  )
}
