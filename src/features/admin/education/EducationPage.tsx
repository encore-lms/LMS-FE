import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Empty } from '@/components/ui/Empty'
import { DataTable, type Column } from '@/components/data/DataTable'
import { KpiCard } from '@/components/data/KpiCard'
import { useToast } from '@/components/ui/use-toast'
import { usePageHeader } from '@/shared/store'
import { useEducationOverview } from './api'
import type { EducationModuleRow } from './types'

// 과정·기수·교과목 통합 관리 (/admin/education) — 운영(MANAGER/ADMIN) 신규.
// Figma 1543:11011. 단위기간·주차 기반 교과목/모듈을 기수 하위로 묶어 관리한다.
// 교과목 추가·주차 자동 생성·교과목 수정 흐름은 별도 시안 미설계 → 토스트 안내 + TODO.
export default function EducationPage() {
  usePageHeader('과정·기수·교과목', '단위기간·주차 기반 교과목/모듈 통합 관리')
  const { data, isPending, isError, refetch } = useEducationOverview()
  const toast = useToast()

  if (isPending) {
    return (
      <div className="text-fg-muted p-8">
        과정·기수·교과목 정보를 불러오는 중…
      </div>
    )
  }
  if (isError || !data) {
    return (
      <div className="p-8">
        <Empty
          icon={<AlertTriangle />}
          title="과정·기수·교과목 정보를 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={<Button onClick={() => refetch()}>다시 시도</Button>}
        />
      </div>
    )
  }

  const { summary, rows } = data

  const columns: Column<EducationModuleRow>[] = [
    {
      key: 'cohort',
      header: '과정/기수',
      cell: (r) => (
        <span className="text-fg text-[13px] font-medium">{r.cohortLabel}</span>
      ),
    },
    {
      key: 'module',
      header: '교과목/모듈',
      cell: (r) => <span className="text-fg text-[13px]">{r.moduleName}</span>,
    },
    {
      key: 'unit',
      header: '기간',
      className: 'w-28',
      cell: (r) => <span className="text-fg text-[13px]">{r.unit}</span>,
    },
    {
      key: 'owner',
      header: '담당자',
      className: 'w-32',
      cell: (r) => <span className="text-fg text-[13px]">{r.owner}</span>,
    },
    {
      key: 'linked',
      header: '연결 기능',
      cell: (r) => (
        <span className="text-fg-muted text-[13px]">{r.linkedFeatures}</span>
      ),
    },
    {
      key: 'action',
      header: '액션',
      className: 'w-20',
      cell: (r) => (
        <button
          type="button"
          // TODO: 교과목 수정 모달(P0_22 BE 계약 확정 후)
          onClick={() =>
            toast.info(`${r.moduleName} 수정 화면은 준비 중입니다.`)
          }
          className="text-brand text-[13px] font-semibold hover:underline"
        >
          수정
        </button>
      ),
    },
  ]

  return (
    <div className="p-8">
      {/* 본문 인트로 — 통합 관리 취지 */}
      <div>
        <h2 className="text-fg text-xl font-bold">
          과정·기수·교과목 통합 관리
        </h2>
        <p className="text-fg-muted mt-1.5 text-[13px]">
          이전 LMS에는 교과목 엔티티가 없으므로 신규 LMS에서는 단위기간과 주차를
          바탕으로 교과목/모듈을 확장합니다.
        </p>
      </div>

      {/* KPI 4종 — 과정 · 기수 · 교과목/모듈 · 주차 기준 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="과정"
          value={summary.courses}
          hint={`HRD 연동 ${summary.coursesHrdLinked}`}
        />
        <KpiCard
          label="기수"
          value={summary.cohorts}
          hint={`운영중 ${summary.cohortsActive}`}
        />
        <KpiCard
          label="교과목/모듈"
          value={summary.modules}
          hint="신규 설계 영역"
        />
        <KpiCard
          label="주차 기준"
          value={summary.weeks}
          hint="기록실/퀴즈 연결"
        />
      </div>

      {/* 모듈 표 */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          empty="등록된 교과목/모듈이 없어요"
        />
        <div className="text-fg-subtle mt-3 flex items-center justify-between text-xs">
          <span>총 {rows.length}건</span>
          <span className="bg-surface-muted text-fg-muted rounded-md px-2.5 py-1 font-bold">
            1 / 1
          </span>
        </div>
      </div>

      {/* 교과목 설계 반영 기준 — 안내 콜아웃 */}
      <div className="border-success/30 bg-success-bg mt-6 rounded-xl border p-5">
        <p className="text-success text-[17px] font-bold">
          교과목 설계 반영 기준
        </p>
        <p className="text-success/90 mt-2 text-[13px] leading-relaxed">
          이전 LMS는 Education/Cohort만 영속화하고 교과목은 별도 CRUD가
          없었습니다. 신규 LMS에서는 교과목을 기수 하위 모듈로 두고,
          단위기간·주차·담당 강사/멘토·퀴즈·기록실 제출 기준을 연결하는 방식이
          적합합니다.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            // TODO: 교과목 추가 모달(P0_22 BE 계약 확정 후)
            onClick={() => toast.info('교과목 추가 화면은 준비 중입니다.')}
            className="bg-brand hover:bg-brand/90 h-9 rounded-md px-4 text-[13px] font-semibold text-white transition-colors"
          >
            교과목 추가
          </button>
          <button
            type="button"
            // TODO: 주차 자동 생성(단위기간 → 주차 펼침, BE 계약 확정 후)
            onClick={() => toast.info('주차 자동 생성은 준비 중입니다.')}
            className="bg-info-bg text-info border-border hover:bg-info-bg/70 h-9 rounded-md border px-4 text-[13px] font-semibold transition-colors"
          >
            주차 자동 생성
          </button>
        </div>
      </div>
    </div>
  )
}
