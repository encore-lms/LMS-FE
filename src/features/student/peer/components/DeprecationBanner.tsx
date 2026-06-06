// 동료 평가 화면 공용 — 프로젝트 상호평가로 흡수된 보관 화면 안내(Figma 디자인 반영).
export function DeprecationBanner() {
  return (
    <div className="border-warning/40 bg-warning-bg/40 flex flex-col gap-1 rounded-xl border px-4 py-3">
      <span className="text-warning text-[12px] font-bold">
        2026-05-27 프로젝트 상호평가로 흡수된 화면입니다
      </span>
      <span className="text-fg-muted text-[11px] leading-4">
        동료 평가는 독립 기수 전체 평가가 아니라 프로젝트 완료 확인 후
        /student/projects/:projectId?tab=peer-evaluation 에서 진행합니다.
      </span>
    </div>
  )
}
