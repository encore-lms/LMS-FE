import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Briefcase,
  Calendar,
  Code2,
  FileText,
  FolderGit2,
  Globe,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Star,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { formatDateDot } from '@/shared/lib/date'
import { DataBoundary } from '@/components/ui/DataBoundary'
import { ResumeTabSkeleton } from './TabSkeletons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useResume, useResumes } from '../../api/resume'
import { SECTIONS } from '../../resume/constants'
import type {
  ResumeDetail,
  ResumeItem,
  ResumeSummary,
} from '../../resume/types'
import { TabHead } from './TechTab'

// 증명서 탭6 이력서 — /student/resume 에서 작성한 이력서를 링크드인식 프로필로 보여준다.
// 데이터는 증명서 overview 와 별개로 이력서 API(useResumes/useResume)에서 직접 가져온다.
const card =
  'bg-surface rounded-2xl shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]'

/** 표시 기본값 — 최근 수정순, '작성 완료'가 있으면 그중 최신 우선 */
function pickDefault(resumes: ResumeSummary[]) {
  const sorted = [...resumes].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )
  return (sorted.find((r) => r.status === '작성 완료') ?? sorted[0])?.id
}

/** 프로토콜 없는 URL도 새 탭에서 열리도록 보정 */
function toHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

/** 연락처 한 칸 — 아이콘 + 값(링크면 a 태그) */
function ContactChip({
  icon,
  value,
  href,
}: {
  icon: ReactNode
  value: string
  href?: string
}) {
  const inner = (
    <>
      <span className="text-fg-subtle [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {value}
    </>
  )
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-fg-muted hover:text-brand inline-flex items-center gap-1.5 text-[13px] underline-offset-2 hover:underline"
    >
      {inner}
    </a>
  ) : (
    <span className="text-fg-muted inline-flex items-center gap-1.5 text-[13px]">
      {inner}
    </span>
  )
}

/** 링크드인식 섹션 카드 — 아이콘 배지 + 제목 + 본문 */
function ProfileSection({
  icon,
  title,
  count,
  children,
}: {
  icon: ReactNode
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className={cn(card, 'flex flex-col gap-4 p-6')}>
      <div className="flex items-center gap-2.5">
        <span className="bg-accent-bg text-accent-strong flex size-8 items-center justify-center rounded-[10px] [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <span className="text-fg text-[15px] font-bold">{title}</span>
        {count !== undefined && (
          <span className="bg-surface-muted text-fg-muted rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/** 경력/학력/프로젝트 공통 타임라인 항목 — 좌측 점·세로선 레일 */
function TimelineEntry({ it, last }: { it: ResumeItem; last: boolean }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span className="bg-brand mt-1.5 size-2.5 shrink-0 rounded-full" />
        {!last && <span className="bg-divider mt-1 w-px flex-1" />}
      </div>
      <div className={cn('flex flex-col gap-1', !last && 'pb-5')}>
        <span className="text-fg text-[14px] font-bold">
          {it.title || '(제목 미입력)'}
        </span>
        {(it.subtitle || it.period) && (
          <span className="text-fg-muted flex flex-wrap items-center gap-x-2 text-[12.5px]">
            {it.subtitle && <span className="font-medium">{it.subtitle}</span>}
            {it.subtitle && it.period && (
              <span className="text-fg-subtle">·</span>
            )}
            {it.period && (
              <span className="text-fg-subtle inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {it.period}
              </span>
            )}
          </span>
        )}
        {it.description && (
          <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
            {it.description}
          </p>
        )}
      </div>
    </div>
  )
}

function TimelineSection({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: ResumeItem[]
}) {
  if (items.length === 0) return null
  return (
    <ProfileSection icon={icon} title={title} count={items.length}>
      <div className="flex flex-col">
        {items.map((it, i) => (
          <TimelineEntry
            key={`${it.title}-${i}`}
            it={it}
            last={i === items.length - 1}
          />
        ))}
      </div>
    </ProfileSection>
  )
}

/** 자격·수상 등 짧은 항목용 콤팩트 행 */
function CompactSection({
  icon,
  title,
  items,
}: {
  icon: ReactNode
  title: string
  items: ResumeItem[]
}) {
  if (items.length === 0) return null
  return (
    <ProfileSection icon={icon} title={title} count={items.length}>
      <div className="flex flex-col">
        {items.map((it, i) => (
          <div
            key={`${it.title}-${i}`}
            className={cn(
              'flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0',
              i > 0 && 'border-divider border-t',
            )}
          >
            <span className="text-fg text-[13.5px] font-semibold">
              {it.title || '(제목 미입력)'}
            </span>
            {(it.subtitle || it.period || it.description) && (
              <span className="text-fg-subtle text-[12px]">
                {[it.subtitle, it.period, it.description]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </ProfileSection>
  )
}

/** 프로필 히어로 — 커버 밴드 + 아바타 + 이름/연락처/액션 */
function ProfileHero({ d }: { d: ResumeDetail }) {
  const b = d.basicInfo
  // 링크드인 헤드라인 자리 — 강점 첫 줄을 한 줄 소개로 쓴다(없으면 이력서 제목).
  const headline = d.strength.trim().split('\n')[0] || d.title
  const contacts = [
    { icon: <Mail />, value: b.email, href: b.email && `mailto:${b.email}` },
    { icon: <Phone />, value: b.phone },
    { icon: <Calendar />, value: b.birth },
    {
      icon: <Code2 />,
      value: b.githubUrl,
      href: b.githubUrl && toHref(b.githubUrl),
    },
    { icon: <Globe />, value: b.blogUrl, href: b.blogUrl && toHref(b.blogUrl) },
  ].filter((c) => c.value?.trim())

  return (
    <section className={cn(card, 'overflow-hidden')}>
      {/* 커버 밴드 — 링크드인 배경 이미지 자리. 히어로/배너는 brand 단색(그라데이션 금지, 2026-06-08 가드레일) */}
      <div className="bg-brand h-24" />
      <div className="flex flex-col gap-4 px-7 pb-6">
        {/* 증명서는 '보여지는 문서'다 — 편집·관리 진입 버튼은 두지 않는다(이력서 관리 화면에서 한다). */}
        <span className="border-surface bg-brand-deep -mt-10 flex size-20 shrink-0 items-center justify-center rounded-full border-4 text-[28px] font-bold text-white">
          {b.name?.trim().charAt(0) || '?'}
        </span>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-fg text-[22px] font-bold">
              {b.name || '(이름 미입력)'}
            </h3>
            <StatusBadge
              label={d.status}
              tone={d.status === '작성 완료' ? 'success' : 'warning'}
            />
          </div>
          {headline && (
            <p className="text-fg-muted text-[14px] leading-relaxed">
              {headline}
            </p>
          )}
          {contacts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1">
              {contacts.map((c, i) => (
                <ContactChip
                  key={i}
                  icon={c.icon}
                  value={c.value}
                  href={c.href || undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** 상세 프로필 본문 — 링크드인 섹션 순서(소개→경력→학력→프로젝트→기술→자격·수상→기타) */
function ResumeProfile({ d }: { d: ResumeDetail }) {
  const intros = d.coverLetters.filter((c) => c.content.trim())
  // 강점 첫 줄은 히어로 헤드라인으로 올라가므로, 소개 카드에는 전문을 그대로 둔다.
  return (
    <div className="flex flex-col gap-4">
      <ProfileHero d={d} />

      {d.strength.trim() && (
        <ProfileSection icon={<Star />} title="소개 · 핵심역량">
          <p className="text-fg-muted text-[14px] leading-relaxed whitespace-pre-line">
            {d.strength}
          </p>
        </ProfileSection>
      )}

      <TimelineSection icon={<Briefcase />} title="경력" items={d.careers} />
      <TimelineSection
        icon={<GraduationCap />}
        title="학력"
        items={d.educations}
      />
      <TimelineSection
        icon={<FolderGit2 />}
        title="프로젝트"
        items={d.projects}
      />

      {d.skills.length > 0 && (
        <ProfileSection
          icon={<Code2 />}
          title="기술스택"
          count={d.skills.length}
        >
          <div className="flex flex-wrap gap-2">
            {d.skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="bg-accent-bg text-accent-strong rounded-full px-3 py-1.5 text-[12.5px] font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </ProfileSection>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <CompactSection icon={<Award />} title="자격" items={d.certificates} />
        <CompactSection icon={<Star />} title="수상" items={d.awards} />
        <CompactSection
          icon={<GraduationCap />}
          title="교육경험"
          items={d.trainings}
        />
        <CompactSection
          icon={<FileText />}
          title="기타활동"
          items={d.activities}
        />
      </div>

      {intros.length > 0 && (
        <ProfileSection
          icon={<FileText />}
          title="자기소개서"
          count={intros.length}
        >
          <div className="flex flex-col gap-5">
            {intros.map((c, i) => (
              <div key={`${c.question}-${i}`} className="flex flex-col gap-1.5">
                <span className="text-accent-strong text-[13.5px] font-bold">
                  {c.question}
                </span>
                <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}
    </div>
  )
}

/** 이력서가 아직 없을 때 — 작성 유도 빈 상태 */
function EmptyState() {
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed p-12 text-center">
      <span className="bg-surface-muted text-fg-subtle flex size-12 items-center justify-center rounded-full">
        <FileText className="h-5 w-5" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-fg text-[15px] font-bold">
          아직 작성한 이력서가 없어요
        </span>
        <span className="text-fg-muted text-[13px]">
          이력서를 작성하면 이 탭에서 프로필 형태로 보여드려요.
        </span>
      </div>
      <Link
        to="/student/resume/new"
        className="bg-accent-strong mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
        이력서 작성하러 가기
      </Link>
    </div>
  )
}

export function ResumeTab() {
  const listQ = useResumes()
  const resumes = listQ.data?.resumes ?? []
  // 선택 상태는 사용자가 칩을 눌렀을 때만 — 기본값은 목록에서 파생(완료 최신 우선).
  const [selectedId, setSelectedId] = useState<string>()
  const activeId =
    selectedId && resumes.some((r) => r.id === selectedId)
      ? selectedId
      : pickDefault(resumes)
  const detailQ = useResume(activeId)
  const d = detailQ.data

  return (
    <div className="flex flex-col gap-4">
      <TabHead
        no={6}
        title="이력서"
        sub="이력서 관리에서 작성한 내용을 프로필 형태로 보여줍니다 · 수정은 이력서 편집에서"
      >
        {d && (
          <>
            <span className="text-fg-muted text-[11px] font-semibold">
              ● 섹션 완료 {d.doneSections.length}/{SECTIONS.length}
            </span>
            <span className="text-fg-muted text-[11px] font-semibold">
              ● 최종 수정 {formatDateDot(d.updatedAt) || d.updatedAt}
            </span>
          </>
        )}
      </TabHead>

      <DataBoundary
        isPending={listQ.isPending || (Boolean(activeId) && detailQ.isPending)}
        isError={listQ.isError || detailQ.isError}
        onRetry={() => {
          if (listQ.isError) listQ.refetch()
          if (detailQ.isError) detailQ.refetch()
        }}
        skeleton={<ResumeTabSkeleton />}
        errorTitle="이력서를 불러오지 못했어요"
        errorDescription="잠시 후 다시 시도해 주세요."
      >
        {resumes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* 이력서가 여러 개면 칩으로 전환 — 기본은 완료 최신본 */}
            {resumes.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {resumes.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12.5px] font-semibold',
                      r.id === activeId
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border text-fg-muted hover:bg-surface-muted',
                    )}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
            {d && <ResumeProfile d={d} />}
          </>
        )}
      </DataBoundary>
    </div>
  )
}
