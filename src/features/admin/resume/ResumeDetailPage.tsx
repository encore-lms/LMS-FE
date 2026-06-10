import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Send,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FEEDBACK, RESUME_DETAIL } from './mocks'

function SectionBlock({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-fg text-[16px] font-bold">{title}</h2>
        <div className="bg-border h-px w-full" />
      </div>
      {children}
    </section>
  )
}

function EntryItem({
  icon,
  title,
  meta,
  body,
}: {
  icon: ReactNode
  title: string
  meta?: string
  body?: string
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span className="bg-surface-muted text-fg-muted mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-fg text-[14px] font-semibold">{title}</span>
        {meta && <span className="text-fg-subtle text-[12px]">{meta}</span>}
        {body && (
          <p className="text-fg-muted mt-1 text-[13px] leading-relaxed whitespace-pre-line">
            {body}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * 이력서 상세·검토 (/admin/resume/:resumeId) — 운영 콘솔.
 * 로스터에서 이력서 클릭 시 진입. 좌: 이력서 전체 내용, 우: 섹션 현황 + 피드백 작성, 하단: 피드백 이력.
 */
export default function ResumeDetailPage() {
  const navigate = useNavigate()
  const d = RESUME_DETAIL
  usePageHeader(d.studentName, `${d.cohort} · ${d.resumeName}`)

  return (
    <div className="flex flex-col gap-5 p-8">
      <button
        type="button"
        onClick={() => navigate('/admin/resume')}
        className="border-border text-fg-muted hover:bg-surface-muted inline-flex w-fit items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[14px] font-semibold"
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </button>

      {/* 이력서 헤더 */}
      <div className="border-border bg-surface flex items-center justify-between gap-4 rounded-xl border p-5">
        <div className="flex items-center gap-3.5">
          <span className="bg-accent-strong flex size-12 items-center justify-center rounded-full text-[16px] font-bold text-white">
            {d.studentName.charAt(0)}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="text-fg text-[16px] font-bold">
              {d.studentName}
            </span>
            <span className="text-fg-subtle text-[13px]">
              {d.cohort} · {d.resumeName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5">
            <span className="bg-divider relative h-1.5 w-[150px] overflow-hidden rounded-full">
              <span
                className="bg-warning absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${d.completion}%` }}
              />
            </span>
            <span className="text-fg-muted text-[13px] font-semibold">
              완성도 {d.completion}%
            </span>
          </div>
          <StatusBadge label={d.status} tone="warning" />
        </div>
      </div>

      {/* 본문 2단 */}
      <div className="flex items-start gap-6">
        {/* 좌: 이력서 내용 */}
        <div className="flex flex-1 flex-col gap-8">
          <div className="flex flex-col gap-3">
            {/* 이력서 문서 내용의 이름 — 페이지 h1은 공유 헤더가 소유하므로 h2로 유지 */}
            <h2 className="text-fg text-2xl font-bold">{d.studentName}</h2>
            <div className="text-fg-subtle flex flex-wrap items-center gap-x-6 gap-y-1 text-[13px]">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {d.phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {d.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {d.birth}
              </span>
            </div>
          </div>

          <SectionBlock title="핵심역량/강점">
            <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
              {d.coreStrength}
            </p>
          </SectionBlock>

          <SectionBlock title="경력사항">
            <div className="flex flex-col gap-4">
              {d.careers.map((c) => (
                <EntryItem
                  key={c.title}
                  icon={<Briefcase />}
                  title={c.title}
                  meta={c.meta}
                />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock title="학력사항">
            <div className="flex flex-col gap-4">
              {d.educations.map((e) => (
                <EntryItem
                  key={e.title}
                  icon={<GraduationCap />}
                  title={e.title}
                  meta={e.meta}
                />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock title="자격사항">
            <div className="flex flex-col gap-4">
              {d.certificates.map((c) => (
                <EntryItem
                  key={c.title}
                  icon={<CheckCircle2 />}
                  title={c.title}
                  meta={c.meta}
                />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock title="수상내역">
            <div className="flex flex-col gap-4">
              {d.awards.map((a) => (
                <EntryItem
                  key={a.title}
                  icon={<Award />}
                  title={a.title}
                  meta={a.meta}
                />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock title="프로젝트 경험">
            <div className="flex flex-col gap-5">
              {d.projects.map((p) => (
                <EntryItem
                  key={p.title}
                  icon={<FileText />}
                  title={p.title}
                  meta={p.meta}
                  body={p.bullets}
                />
              ))}
            </div>
          </SectionBlock>

          <SectionBlock title="자기소개서">
            <div className="flex flex-col gap-5">
              {d.intros.map((it) => (
                <div key={it.title} className="flex flex-col gap-2">
                  <span className="text-accent-strong text-[14px] font-bold">
                    {it.title}
                  </span>
                  <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
                    {it.body}
                  </p>
                </div>
              ))}
            </div>
          </SectionBlock>
        </div>

        {/* 우: 섹션 현황 + 피드백 작성 */}
        <aside className="flex w-[340px] shrink-0 flex-col gap-4">
          <div className="border-border bg-surface flex flex-col gap-3.5 rounded-xl border p-[18px]">
            <span className="text-fg text-[14px] font-bold">
              섹션별 작성 현황
            </span>
            {d.sectionStatus.map((s) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {s.done ? (
                    <CheckCircle2 className="text-success h-4 w-4" />
                  ) : (
                    <Circle className="text-fg-subtle h-4 w-4" />
                  )}
                  <span
                    className={cn(
                      'text-[13px]',
                      s.done ? 'text-fg' : 'text-fg-muted',
                    )}
                  >
                    {s.name}
                  </span>
                </span>
                <span
                  className={cn(
                    'text-[12px] font-semibold',
                    s.done ? 'text-success' : 'text-fg-subtle',
                  )}
                >
                  {s.done ? '완료' : '미작성'}
                </span>
              </div>
            ))}
          </div>

          <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-[18px]">
            <span className="text-fg text-[14px] font-bold">피드백 작성</span>
            <span className="text-fg-muted text-[12px]">대상 섹션</span>
            <button
              type="button"
              className="border-border text-fg flex items-center justify-between rounded-lg border px-3 py-2.5 text-[13px]"
            >
              전체 (섹션 미지정)
              <ChevronDown className="text-fg-subtle h-4 w-4" />
            </button>
            <textarea
              placeholder="피드백 내용을 입력해주세요"
              className="border-border text-fg placeholder:text-fg-subtle focus:border-brand h-24 resize-none rounded-lg border p-3 text-[13px] focus:outline-none"
            />
            <span className="text-fg-subtle self-end text-[12px]">0자</span>
            <button
              type="button"
              disabled
              className="bg-surface-muted text-fg-subtle inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-bold"
            >
              <Send className="h-4 w-4" />
              피드백 등록
            </button>
          </div>
        </aside>
      </div>

      {/* 피드백 이력 */}
      <div className="border-border bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="text-fg text-[16px] font-bold">
          피드백 이력 ({FEEDBACK.length}건)
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="bg-accent-strong rounded-full px-3 py-1.5 text-[12px] font-semibold text-white">
            전체 {FEEDBACK.length}
          </span>
          {FEEDBACK.map((f) => (
            <span
              key={f.id}
              className="bg-surface-muted text-fg-muted rounded-full px-3 py-1.5 text-[12px] font-semibold"
            >
              {f.category} 1
            </span>
          ))}
        </div>
        <div className="flex flex-col">
          {FEEDBACK.map((f, i) => (
            <div
              key={f.id}
              className={cn(
                'flex flex-col gap-2 py-4',
                i > 0 && 'border-divider border-t',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="bg-accent-bg text-accent-strong rounded-md px-2 py-0.5 text-[12px] font-semibold">
                  {f.category}
                </span>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-fg-subtle text-[12px]">{f.date}</span>
                  <span className="text-fg-subtle text-[12px]">{f.author}</span>
                </div>
              </div>
              <p className="text-fg-muted text-[13px] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
