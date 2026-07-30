import { useState } from 'react'
import { Coins, Gamepad2, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { SkeletonText } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/Switch'
import { useToast } from '@/components/ui/use-toast'
import { useCourseConfig, useUpdateCohortSettings } from '../api/settings'

type ToggleKey = 'mileage' | 'play'

const TOGGLES: {
  key: ToggleKey
  label: string
  Icon: typeof Coins
  hint: string
}[] = [
  {
    key: 'mileage',
    label: '마일리지',
    Icon: Coins,
    hint: '끄면 수강생 메뉴에서 마일리지가 숨겨집니다',
  },
  {
    key: 'play',
    label: 'PLAY',
    Icon: Gamepad2,
    hint: '끄면 수강생 메뉴에서 PLAY가 숨겨집니다',
  },
]

/**
 * 기수 기능 사용 여부 — 마일리지·PLAY.
 *
 * <p>운영 설정의 '교육 과정 설정'에 있던 토글을 기수 허브로 옮겨 왔다. 거기서는 과정을 고르고
 * 기수 목록을 훑어 해당 줄을 찾아야 했는데, 이 화면은 이미 기수 하나를 열어 둔 자리라 스위치
 * 두 개만 있으면 된다.</p>
 *
 * <p>토글을 누르면 바로 저장하지 않고 [저장]까지 기다린다 — 끄는 순간 수강생 메뉴에서 항목이
 * 사라지므로 잘못 누른 것을 되돌릴 틈이 있어야 한다.</p>
 */
export function FeatureTogglePane({
  courseId,
  cohortId,
}: {
  courseId: string
  cohortId: string
}) {
  const toast = useToast()
  const { data, isPending, isError, refetch } = useCourseConfig(courseId)
  const updateCohort = useUpdateCohortSettings()
  // 저장 전 미리보기 — 값이 아니라 '뒤집혔는지'를 들고 있어야 서버 값이 바뀌어도 어긋나지 않는다.
  const [flipped, setFlipped] = useState<Record<ToggleKey, boolean>>({
    mileage: false,
    play: false,
  })

  const cohort = data?.cohorts?.find((c) => c.id === cohortId) ?? null
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
      toast.success('기능 사용 여부를 저장했어요 · 감사 로그에 기록됨')
    } catch {
      toast.danger('기능 사용 여부 저장에 실패했어요')
    }
  }

  return (
    <DataBoundary
      isPending={isPending}
      isError={isError}
      onRetry={() => refetch()}
      skeleton={
        <div className="py-6">
          <SkeletonText lines={4} />
        </div>
      }
      errorTitle="기능 설정을 불러오지 못했어요"
      errorDescription="잠시 후 다시 시도해 주세요."
    >
      <div className="border-border bg-surface rounded-xl border">
        <div className="border-divider flex items-center gap-3 border-b px-5 py-4">
          <div className="bg-accent-bg text-accent-strong flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-fg text-sm font-bold">기능 사용 여부</p>
            <p className="text-fg-subtle text-xs">
              이 기수 수강생에게 보일 기능을 켜고 끕니다
            </p>
          </div>
        </div>

        {cohort ? (
          <>
            {TOGGLES.map(({ key, label, Icon, hint }) => (
              <div
                key={key}
                className="border-divider flex flex-wrap items-center justify-between gap-4 border-t px-5 py-4 first:border-t-0"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon className="text-fg-muted h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-fg flex items-center gap-1.5 text-sm font-medium">
                      {label}
                      {flipped[key] && (
                        <span className="bg-warning-bg text-warning rounded px-1 py-px text-[10px] font-bold">
                          변경됨
                        </span>
                      )}
                    </p>
                    <p className="text-fg-subtle text-xs">{hint}</p>
                  </div>
                </div>
                <Switch
                  checked={effective(key)}
                  label={`${label} 사용`}
                  onChange={() =>
                    setFlipped((p) => ({ ...p, [key]: !p[key] }))
                  }
                />
              </div>
            ))}
            {dirty && (
              <div className="border-divider flex items-center justify-end gap-2 border-t px-5 py-3.5">
                <Button
                  variant="secondary"
                  onClick={() => setFlipped({ mileage: false, play: false })}
                >
                  되돌리기
                </Button>
                <Button onClick={save} disabled={updateCohort.isPending}>
                  {updateCohort.isPending ? '저장 중…' : '저장'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-fg-subtle px-5 py-8 text-center text-sm">
            기수 정보를 찾을 수 없어요
          </p>
        )}
      </div>
    </DataBoundary>
  )
}
