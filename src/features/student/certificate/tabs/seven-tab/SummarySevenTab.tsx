import type { CertificateSevenTabs } from '../../analysis'
import { EmptyPanel, SevenTabShell, sevenTabCard } from './SevenTabPrimitives'

export function SummarySevenTab({
  tab,
}: {
  tab: CertificateSevenTabs['summary']
}) {
  const { cohort, attendance, counts } = tab.payload
  return (
    <SevenTabShell
      no={1}
      title="종합 요약"
      sub="과정·출결·활동 데이터를 같은 분석 시점으로 요약합니다."
      tab={tab}
    >
      {cohort || attendance || counts ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${sevenTabCard} flex flex-col gap-4`}>
            <div>
              <span className="text-brand text-[11px] font-bold">
                교육 과정
              </span>
              <h3 className="text-fg mt-1 text-[18px] font-bold">
                {cohort?.courseTitle ?? '과정 정보 준비 중'}
              </h3>
              {cohort && (
                <p className="text-fg-muted mt-1 text-[12px]">
                  {cohort.cohortNo} · {cohort.startsAt} ~ {cohort.endsAt} ·{' '}
                  {cohort.durationDays}일
                </p>
              )}
            </div>
            <div className="border-divider grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
              {[
                ['평가', counts?.assessments ?? 0],
                ['자격증', counts?.certifications ?? 0],
                ['프로젝트', counts?.projects ?? 0],
                ['문제해결', counts?.troubleshootingCases ?? 0],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-fg-subtle text-[10px]">{label}</span>
                  <p className="text-fg mt-0.5 text-[20px] font-bold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${sevenTabCard} flex flex-col gap-4`}>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-brand text-[11px] font-bold">출결</span>
                <h3 className="text-fg mt-1 text-[18px] font-bold">
                  {attendance
                    ? `${attendance.attendanceRate.toFixed(1)}%`
                    : '집계 전'}
                </h3>
              </div>
              {attendance && (
                <span className="text-fg-subtle text-[11px]">
                  {attendance.firstDate} ~ {attendance.lastDate}
                </span>
              )}
            </div>
            {attendance ? (
              <dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {[
                  ['전체', attendance.totalDays],
                  ['출석', attendance.presentDays],
                  ['지각', attendance.lateDays],
                  ['조퇴', attendance.earlyLeaveDays],
                  ['결석', attendance.absentDays],
                  ['미확인', attendance.leaveMissingDays],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-surface-muted rounded-xl p-3 text-center"
                  >
                    <dt className="text-fg-subtle text-[10px]">{label}</dt>
                    <dd className="text-fg m-0 mt-1 text-[16px] font-bold">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <EmptyPanel>출결 집계 데이터가 없습니다.</EmptyPanel>
            )}
          </section>
        </div>
      ) : (
        <EmptyPanel>요약 데이터가 없습니다.</EmptyPanel>
      )}
    </SevenTabShell>
  )
}
