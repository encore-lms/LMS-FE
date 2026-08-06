// 일지 작성 — 기본 정보 필드 그룹(대상 팀·회차·진행 일시·장소·참석 멘티, LogComposeForm 분리).
import { useState } from 'react'
import { ArrowRight, Check, Timer } from 'lucide-react'
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import { Avatar } from '@/components/ui/Avatar'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Select } from '@/components/ui/Select'
import { cn } from '@/shared/lib/cn'
import { todayYmd } from './logFormSchema'
import { ReservationPickModal } from './ReservationPickModal'
import type { MentoringLogTarget } from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import type { LogFormInput } from './logFormSchema'
import { durationLabel } from './logMeta'
import { HELPER } from './logComposeConstants'
import { AutoLockChip } from './logComposeAtoms'

const FIELD_LABEL = 'text-fg-subtle text-[11px] font-medium tracking-[0.66px]'
const INPUT_BOX =
  'border-border bg-surface text-fg placeholder:text-fg-subtle h-[46px] rounded-[10px] border px-3.5 text-sm font-medium outline-none focus:border-brand'

export type ComposeMode = 'new' | 'draft' | 'resubmit'

export function LogBasicInfoSection({
  mode,
  targets,
  target,
  teamId,
  round,
  sessionDate,
  startTime,
  endTime,
  placeType,
  attendedIds,
  actualMinutes,
  register,
  setValue,
  errors,
  onTeamChange,
  toggleAttendee,
}: {
  mode: ComposeMode
  targets: MentoringLogTarget[]
  target: MentoringLogTarget | undefined
  teamId: string
  round: number
  sessionDate: string
  startTime: string
  endTime: string
  placeType: LogFormInput['placeType']
  attendedIds: string[]
  actualMinutes: number
  register: UseFormRegister<LogFormInput>
  setValue: UseFormSetValue<LogFormInput>
  errors: FieldErrors<LogFormInput>
  onTeamChange: (teamId: string) => void
  toggleAttendee: (studentId: string) => void
}) {
  const [pickOpen, setPickOpen] = useState(false)
  return (
    <section className="bg-surface flex flex-col gap-4 rounded-2xl p-6 shadow-[0_1px_2px_rgba(18,23,38,0.05),0_0_0_1px_rgba(18,23,38,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-fg text-[15px] font-bold">기본 정보</h3>
          <p className="text-fg-muted text-[11px]">
            진행 일시·장소·실제 시간을 입력하세요 · 실제 시간 기준으로 인정
            시간이 자동 산정됩니다
          </p>
        </div>
        {/* 확정된 예약에서 일시·장소를 그대로 가져온다 — 손으로 옮겨 적으면 예약과 어긋난다. */}
        <button
          type="button"
          onClick={() => setPickOpen(true)}
          className="border-border text-fg shrink-0 rounded-lg border px-3 py-1.5 text-[12px] font-semibold"
        >
          예약 불러오기
        </button>
      </div>
      {/* 열렸을 때만 렌더한다 — 닫힌 채로도 예약을 조회하면 폼이 쓸데없이 네트워크를 탄다. */}
      {pickOpen && (
        <ReservationPickModal
          open
          onClose={() => setPickOpen(false)}
          onPick={(pick) => {
            if (mode === 'new' && pick.teamId) onTeamChange(pick.teamId)
            setValue('sessionDate', pick.sessionDate, { shouldValidate: true })
            setValue('startTime', pick.startTime, { shouldValidate: true })
            setValue('endTime', pick.endTime, { shouldValidate: true })
            setValue('placeType', pick.placeType, { shouldValidate: true })
            setValue('placeDetail', pick.placeDetail, { shouldValidate: true })
            setPickOpen(false)
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* 대상 팀 — 수정 모드에선 고정(작성 시 결정) */}
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>대상 팀 *</span>
          <Select
            aria-label="대상 팀"
            value={teamId}
            disabled={mode !== 'new'}
            onChange={(v) => onTeamChange(v)}
            options={targets.map((t) => ({
              value: t.teamId,
              label: `${t.cohortLabel} · ${t.teamName}`,
            }))}
            className="h-[46px] w-full"
          />
          {target && (
            <span className={HELPER}>
              {target.nextRound}회차 멘토링 · 누적 {target.accumulatedHours}h /
              배정 {target.allocatedHours}h · 잔여 {target.remainingHours}h
            </span>
          )}
          {errors.teamId && (
            <p className="text-danger text-[11px]">{errors.teamId.message}</p>
          )}
        </div>
        {/* 회차 — 자동 산정 잠금 */}
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>회차</span>
          <span className="bg-surface-muted flex h-[46px] items-center gap-1.5 rounded-[10px] px-3.5">
            <span className="text-fg text-base font-bold">{round}</span>
            <span className="text-fg-muted text-[13px] font-medium">회차</span>
            <AutoLockChip />
          </span>
          <span className={HELPER}>동일 팀 일지 누적 자동 산정</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* 진행 일시 — 날짜 + 시작 → 종료(분 단위) */}
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>진행 일시 *</span>
          <div className="flex flex-wrap items-center gap-2">
            {/* 공통 DateTimePicker — 날짜(달력) + 시작·종료 시각(분 단위 정밀: minuteStep=1) */}
            <div className="w-[136px]">
              <DateTimePicker
                mode="date"
                value={sessionDate ?? ''}
                onChange={(v) =>
                  setValue('sessionDate', v, { shouldValidate: true })
                }
                ariaLabel="진행 일자"
                placeholder="날짜 선택"
                max={todayYmd()}
              />
            </div>
            <div className="w-[150px]">
              <DateTimePicker
                mode="time"
                minuteStep={1}
                value={startTime ?? ''}
                onChange={(v) =>
                  setValue('startTime', v, { shouldValidate: true })
                }
                ariaLabel="시작 시각"
                placeholder="시작"
              />
            </div>
            <ArrowRight className="text-fg-subtle h-3.5 w-3.5 shrink-0" />
            <div className="w-[150px]">
              <DateTimePicker
                mode="time"
                minuteStep={1}
                value={endTime ?? ''}
                onChange={(v) =>
                  setValue('endTime', v, { shouldValidate: true })
                }
                ariaLabel="종료 시각"
                placeholder="종료"
              />
            </div>
          </div>
          <span className={HELPER}>
            시작·종료 시각을 분 단위까지 입력 · 합계 자동 산정
          </span>
          {(errors.sessionDate || errors.startTime || errors.endTime) && (
            <p className="text-danger text-[11px]">
              {errors.sessionDate?.message ??
                errors.startTime?.message ??
                errors.endTime?.message}
            </p>
          )}
        </div>
        {/* 실제 진행 시간 — 자동 계산 잠금 */}
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>실제 진행 시간 *</span>
          <span className="bg-surface-muted flex h-[46px] items-center gap-1.5 rounded-[10px] px-3.5">
            <Timer className="text-fg-muted h-3.5 w-3.5" />
            <span className="text-fg text-base font-bold">
              {actualMinutes > 0 ? durationLabel(actualMinutes) : '-'}
            </span>
            <AutoLockChip />
          </span>
          <span className={HELPER}>
            시작·종료 시각으로 자동 계산 · 시간 차감 기준
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 장소 유형 — 세그먼트 필 */}
        <div className="flex flex-col gap-1">
          <span className={FIELD_LABEL}>장소 유형 *</span>
          <div
            role="radiogroup"
            aria-label="장소 유형"
            className="flex flex-wrap items-center gap-2"
          >
            {(['offline', 'online', 'etc'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={placeType === v}
                onClick={() =>
                  setValue('placeType', v, { shouldValidate: true })
                }
                className={cn(
                  'flex items-center gap-1.5 rounded-[10px] px-3.5 py-2.5 text-[13px] whitespace-nowrap',
                  placeType === v
                    ? 'bg-brand text-on-color font-bold'
                    : 'border-border text-fg bg-surface hover:bg-surface-muted border font-medium',
                )}
              >
                {MENTORING_PLACE_TYPE_LABEL[v]}
                {placeType === v && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="log-place" className={FIELD_LABEL}>
            상세 장소 *
          </label>
          <input
            id="log-place"
            {...register('placeDetail')}
            placeholder="플레이데이터 강남캠퍼스 · 세미나실 B"
            className={cn(INPUT_BOX, 'w-full')}
          />
          {errors.placeDetail && (
            <p className="text-danger text-[11px]">
              {errors.placeDetail.message}
            </p>
          )}
        </div>
      </div>

      {/* 참석 멘티 — 칩 토글 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <span className={FIELD_LABEL}>참석 멘티 *</span>
          <span className="text-success text-[11px] font-bold">
            {attendedIds.length} / {target?.members.length ?? 0}명 참석
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(target?.members ?? []).map((m) => {
            const selected = attendedIds.includes(m.studentId)
            return (
              <button
                key={m.studentId}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleAttendee(m.studentId)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1',
                  selected
                    ? 'bg-success-bg border-success'
                    : 'border-border bg-surface opacity-60 hover:opacity-100',
                )}
              >
                <Avatar name={m.name} size={26} />
                <span className="text-fg text-xs font-semibold">{m.name}</span>
                <span className="bg-surface-muted text-fg-subtle rounded px-1 py-px text-[9px] font-bold">
                  {m.tagLabel ?? (m.role === 'pm' ? 'PM' : '팀원')}
                </span>
                {selected && <Check className="text-success h-3 w-3" />}
              </button>
            )
          })}
        </div>
        {errors.attendedIds && (
          <p className="text-danger text-[11px]">
            {errors.attendedIds.message}
          </p>
        )}
      </div>
    </section>
  )
}
