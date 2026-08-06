import { AnalysisEvidenceTooltip } from './AnalysisEvidenceTooltip'

function compactLine(value: string, maxLength = 96) {
  const compact = value.replaceAll(/\s+/g, ' ').trim()
  if (compact.length <= maxLength) return compact
  return `${compact.slice(0, maxLength).trim()}…`
}

function sectionLimit(label: string) {
  if (label === '분석 흐름') return 2
  if (label === '산출 결과') return 5
  return 6
}

export function AiAnalysisEvidence({
  label,
  evidence,
  sections,
  flow,
}: {
  label: string
  evidence: string[]
  sections?: Array<{ label: string; items: string[] }>
  flow?: string[]
}) {
  const uniqueEvidence = [...new Set(evidence.filter(Boolean))]
  const normalizedSections = (
    sections ??
    (flow
      ? [
          { label: '실제 데이터', items: uniqueEvidence },
          { label: '분석 흐름', items: flow },
        ]
      : undefined)
  )?.map((section) => ({
    ...section,
    items: [
      ...new Set(
        section.items.filter(Boolean).map((item) => compactLine(item)),
      ),
    ].slice(0, sectionLimit(section.label)),
  }))

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
      {normalizedSections && normalizedSections.length > 0 ? (
        <span className="flex flex-col gap-3">
          {normalizedSections.map((section) => (
            <span key={section.label} className="block">
              <strong className="text-fg block text-[11px] font-bold">
                {section.label}
              </strong>
              <span className="mt-1 block">
                {section.items.map((item) => (
                  <span key={item} className="block">
                    · {item}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </span>
      ) : uniqueEvidence.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {uniqueEvidence.map((item) => (
            <li key={item}>· {item}</li>
          ))}
        </ul>
      ) : (
        <span>현재 연결된 근거가 없습니다.</span>
      )}
    </AnalysisEvidenceTooltip>
  )
}
