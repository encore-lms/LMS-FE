import { AlertCircle, Database, Minus } from 'lucide-react'
import type { CertificateTabResult, JsonValue } from '../../analysis'
import { TabHead } from '../TabHead'

export const sevenTabCard =
  'border-divider bg-surface rounded-2xl border p-5 shadow-[0px_2px_8px_0px_rgba(18,23,38,0.04)] sm:p-6'

const readinessLabel = {
  READY: '데이터 준비 완료',
  PARTIAL: '일부 데이터 준비',
  NOT_READY: '데이터 준비 전',
} as const

export function SevenTabShell({
  no,
  title,
  sub,
  tab,
  children,
}: {
  no: number
  title: string
  sub: string
  tab: CertificateTabResult
  children: React.ReactNode
}) {
  const ready = tab.readinessStatus === 'READY'
  const partial = tab.readinessStatus === 'PARTIAL'

  return (
    <div className="flex flex-col gap-4">
      <TabHead no={no} title={title} sub={sub}>
        <span className="text-fg-muted flex items-center gap-1.5 text-[11px] font-semibold">
          <Database className="size-3.5" aria-hidden="true" />
          근거 {tab.evidence.length}건
        </span>
        <span
          className={
            ready
              ? 'bg-success-bg text-success rounded-full px-2.5 py-1 text-[11px] font-bold'
              : partial
                ? 'bg-warning-bg text-warning rounded-full px-2.5 py-1 text-[11px] font-bold'
                : 'bg-surface-muted text-fg-muted rounded-full px-2.5 py-1 text-[11px] font-bold'
          }
        >
          {readinessLabel[tab.readinessStatus]}
        </span>
      </TabHead>

      {tab.missingRequirements.length > 0 && (
        <section
          role="status"
          className="border-warning/25 bg-warning-bg/50 flex gap-3 rounded-2xl border p-4"
        >
          <AlertCircle
            className="text-warning mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-fg text-[13px] font-bold">
              아직 채워지지 않은 데이터가 있어요
            </h3>
            <ul className="text-fg-muted mt-1.5 space-y-1 text-[12px] leading-5">
              {tab.missingRequirements.map((requirement) => (
                <li key={requirement.code}>{requirement.detail}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {tab.readinessStatus === 'NOT_READY' ? (
        <EmptyPanel>데이터 준비가 끝나면 이 탭의 결과가 생성됩니다.</EmptyPanel>
      ) : (
        children
      )}
    </div>
  )
}

export function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <section
      className={`${sevenTabCard} text-fg-muted flex min-h-36 flex-col items-center justify-center gap-2 text-center text-[13px]`}
    >
      <Minus className="text-fg-subtle size-5" aria-hidden="true" />
      {children}
    </section>
  )
}

export function Tags({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="text-fg-subtle">없음</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <span
          key={value}
          className="bg-brand/8 text-brand rounded-full px-2.5 py-1 text-[11px] font-semibold"
        >
          {value}
        </span>
      ))}
    </div>
  )
}

export function StringList({
  values,
  empty = '기록된 내용이 없습니다.',
}: {
  values: string[]
  empty?: string
}) {
  if (values.length === 0) {
    return <p className="text-fg-subtle text-[12px]">{empty}</p>
  }
  return (
    <ul className="text-fg-muted space-y-1.5 text-[12px] leading-5">
      {values.map((value, index) => (
        <li key={`${index}-${value}`} className="flex gap-2">
          <span className="text-brand" aria-hidden="true">
            •
          </span>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  )
}

const resumeSectionLabels: Record<string, string> = {
  strength: '강점 요약',
  educations: '학력',
  careers: '경력',
  certificates: '자격증',
  awards: '수상',
  trainings: '교육',
  activities: '활동',
  skills: '기술',
  projects: '프로젝트',
  coverLetters: '자기소개',
}

function JsonValueView({ value }: { value: JsonValue }) {
  if (value === null || value === '') {
    return <span className="text-fg-subtle">기록 없음</span>
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="whitespace-pre-wrap">{String(value)}</span>
  }
  if (typeof value === 'boolean') return <span>{value ? '예' : '아니요'}</span>
  if (Array.isArray(value)) {
    if (value.length === 0)
      return <span className="text-fg-subtle">기록 없음</span>
    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="border-divider border-l-2 pl-3">
            <JsonValueView value={item} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <dl className="space-y-2">
      {Object.entries(value).map(([key, item]) => (
        <div key={key} className="grid gap-1 sm:grid-cols-[120px_1fr]">
          <dt className="text-fg-subtle text-[11px] font-semibold">{key}</dt>
          <dd className="text-fg-muted m-0 min-w-0 text-[12px] leading-5">
            <JsonValueView value={item} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function ResumeContent({
  content,
}: {
  content: Record<string, JsonValue>
}) {
  const sections = Object.entries(content)
  if (sections.length === 0)
    return <EmptyPanel>공개 가능한 이력서 내용이 없습니다.</EmptyPanel>

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {sections.map(([key, value]) => (
        <section key={key} className={`${sevenTabCard} min-w-0`}>
          <h3 className="text-fg mb-3 text-[14px] font-bold">
            {resumeSectionLabels[key] ?? key}
          </h3>
          <div className="text-fg-muted text-[12px] leading-5">
            <JsonValueView value={value} />
          </div>
        </section>
      ))}
    </div>
  )
}
