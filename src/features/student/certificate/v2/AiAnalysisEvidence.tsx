import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'

export function AiAnalysisEvidence({
  label,
  evidence,
}: {
  label: string
  evidence: string[]
}) {
  return (
    <AnalysisEvidenceTooltip
      label={label}
      ariaLabel={`${label} 근거 보기`}
      triggerClassName="border-border bg-surface text-fg-subtle hover:text-fg size-4 rounded-full border"
      triggerContent={
        <span
          className="text-[10px] leading-none font-extrabold"
          aria-hidden="true"
        >
          !
        </span>
      }
    >
      {evidence.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {evidence.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      ) : (
        <span>현재 연결된 근거가 없습니다.</span>
      )}
    </AnalysisEvidenceTooltip>
  )
}
