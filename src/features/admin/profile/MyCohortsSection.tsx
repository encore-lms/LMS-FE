import { Layers } from 'lucide-react'
import { SkeletonText } from '@/components/ui/Skeleton'
import { useMyCohorts } from '../api/dashboard'

// 담당 과정·기수 카드 — 운영(MANAGER/ADMIN) 전용 프로필 부가 섹션.
// useMyCohorts가 /admin/courses(운영 전용 권한)를 조회하므로 공용 ProfilePage 본체가 아닌
// 여기(admin)에 두고, AdminProfilePage가 슬롯으로 주입한다.
export function MyCohortsSection() {
  const myCohorts = useMyCohorts()

  return (
    <section className="border-border bg-surface rounded-xl border p-6">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="text-fg-muted h-4 w-4" />
        <p className="text-fg text-[15px] font-bold">담당 과정·기수</p>
      </div>
      {myCohorts.isPending ? (
        <SkeletonText lines={2} className="max-w-sm" />
      ) : (myCohorts.data?.length ?? 0) === 0 ? (
        <p className="text-fg-subtle text-[13px]">
          배정된 담당 기수가 없어요. 설정 &gt; 계정 관리에서 배정할 수 있습니다.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {myCohorts.data!.map((c) => (
            <li
              key={c.cohortId}
              className="border-border bg-surface-muted/50 text-fg flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold"
            >
              {c.courseName} {c.cohortNo}기
              <span className="text-fg-subtle text-[11px] font-normal">
                {c.startDate.replaceAll('-', '.')}~
                {c.endDate.replaceAll('-', '.')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
