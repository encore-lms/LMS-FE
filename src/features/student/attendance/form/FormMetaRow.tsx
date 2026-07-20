import type { AttendanceFormMeta } from '../types'
import { ATTENDANCE_STATUS_META } from '../components/attendanceStatusMeta'
import { formatSubmittedAt } from '../attendanceConstants'

// 폼 상단 공통 메타 — 대상 일자 / 과정·기수 / 최근 제출(읽기 전용). 본인 cohort 자동 매칭 안내.
function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 basis-56 flex-col gap-1.5">
      <span className="text-fg text-[13px] font-bold">{label}</span>
      <div className="border-border bg-surface-muted text-fg flex h-[52px] items-center rounded-[10px] border px-4 text-[15px] font-medium">
        {value}
      </div>
    </div>
  )
}

export function FormMetaRow({ meta }: { meta: AttendanceFormMeta }) {
  const latest = meta.latestSubmission
  const latestText = latest
    ? `${formatSubmittedAt(latest.submittedAt)} · ${ATTENDANCE_STATUS_META[latest.attendanceType].label}`
    : '없음'

  return (
    <section className="bg-surface flex flex-col gap-3 rounded-xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      <div className="flex flex-wrap gap-4">
        <MetaField label="출결 대상 일자" value={meta.targetDate} />
        <MetaField
          label="과정 / 기수"
          value={`${meta.courseName} ${meta.cohortName}`}
        />
        <MetaField label="최근 제출" value={latestText} />
      </div>
      <p className="text-fg-subtle text-xs">
        모바일 링크로 진입해도 로그인된 본인 계정의 과정/기수 기준으로
        제출됩니다.
      </p>
    </section>
  )
}
