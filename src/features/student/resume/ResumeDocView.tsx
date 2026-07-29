import type { ReactNode } from 'react'
import {
  Award,
  BadgeCheck,
  Briefcase,
  Calendar,
  FileText,
  FolderGit2,
  GraduationCap,
  Link2,
  Mail,
  Phone,
} from 'lucide-react'
import type { ResumeBasicInfo, ResumeCoverLetter, ResumeItem } from './types'

// 이력서 문서(Doc) 뷰 — 학생 편집기 미리보기 + 강사·운영 이력서 상세에서 공용 사용.
// 레이아웃 정본은 참조 이미지(원티드형 문서): 큰 이름 헤더 → 핵심역량 불릿 →
// 아이콘 카드 + 파이프 메타의 경력/프로젝트/학력 → 아웃라인 스킬 칩 → 2열 보조 섹션 → 자기소개서 → 링크.
export interface ResumeDocData {
  basicInfo: ResumeBasicInfo
  strength: string
  educations: ResumeItem[]
  careers: ResumeItem[]
  certificates: ResumeItem[]
  awards: ResumeItem[]
  trainings: ResumeItem[]
  activities: ResumeItem[]
  skills: string[]
  projects: ResumeItem[]
  coverLetters: ResumeCoverLetter[]
}

const EMPTY_BASIC: ResumeBasicInfo = {
  name: '',
  phone: '',
  email: '',
  birth: '',
  githubUrl: '',
  blogUrl: '',
}

/** 섹션 제목 — 보조 섹션(2열)만 얇은 밑줄을 둔다. */
function DocSection({
  title,
  underline,
  children,
}: {
  title: string
  underline?: boolean
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2
        className={
          'text-fg text-[18px] font-bold' +
          (underline ? ' border-divider border-b pb-2.5' : '')
        }
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

/** 기간·부제처럼 짧은 메타를 얇은 세로선으로 잇는다(참조 이미지의 파이프 구분). */
function MetaRow({ parts }: { parts: (string | undefined)[] }) {
  const items = parts.map((p) => p?.trim()).filter(Boolean) as string[]
  if (items.length === 0) return null
  return (
    <div className="text-fg-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
      {items.map((t, i) => (
        <span key={`${t}-${i}`} className="flex items-center gap-x-3">
          {i > 0 && <span className="bg-border h-3 w-px" aria-hidden />}
          {t}
        </span>
      ))}
    </div>
  )
}

/** 설명 — 줄바꿈마다 · 불릿. 참조 이미지의 성과 나열 형태. */
function Bullets({ text, className }: { text: string; className?: string }) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[·•-]\s*/, '').trim())
    .filter(Boolean)
  if (lines.length === 0) return null
  return (
    <ul className={'flex flex-col gap-1.5 ' + (className ?? '')}>
      {lines.map((l, i) => (
        <li
          key={i}
          className="text-fg-muted flex gap-2 text-[14px] leading-relaxed"
        >
          <span className="text-fg-subtle shrink-0" aria-hidden>
            ·
          </span>
          <span>{l}</span>
        </li>
      ))}
    </ul>
  )
}

/** 경력·프로젝트·학력 — 40px 아이콘 카드 + 제목 + 파이프 메타 + 불릿 설명. */
function TimelineSection({
  title,
  icon,
  iconClass,
  items,
}: {
  title: string
  icon: ReactNode
  iconClass: string
  items: ResumeItem[]
}) {
  if (!items || items.length === 0) return null
  return (
    <DocSection title={title}>
      <div className="flex flex-col gap-7">
        {items.map((it, i) => (
          <div key={`${it.title}-${i}`} className="flex gap-4">
            <span
              className={
                'flex size-10 shrink-0 items-center justify-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px] ' +
                iconClass
              }
            >
              {icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-fg text-[15px] font-bold">
                {it.title || '(제목 미입력)'}
              </p>
              <MetaRow parts={[it.period, it.subtitle]} />
              {it.description?.trim() && (
                <Bullets text={it.description} className="mt-1" />
              )}
            </div>
          </div>
        ))}
      </div>
    </DocSection>
  )
}

/** 자격·수상·교육·활동 — 2열 그리드에 들어가는 컴팩트 섹션(원형 아이콘). */
function CompactSection({
  title,
  icon,
  items,
}: {
  title: string
  icon: ReactNode
  items: ResumeItem[]
}) {
  if (!items || items.length === 0) return null
  return (
    <DocSection title={title} underline>
      <div className="flex flex-col gap-5">
        {items.map((it, i) => (
          <div key={`${it.title}-${i}`} className="flex items-start gap-3">
            <span className="bg-surface-muted text-fg-muted flex size-9 shrink-0 items-center justify-center rounded-full [&>svg]:h-4 [&>svg]:w-4">
              {icon}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-fg text-[14px] font-semibold">
                {it.title || '(제목 미입력)'}
              </p>
              <MetaRow parts={[it.period, it.subtitle]} />
              {it.description?.trim() && (
                <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
                  {it.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </DocSection>
  )
}

export function ResumeDocView({
  data,
  bordered = true,
}: {
  data: Partial<ResumeDocData>
  /** 문서 카드 외곽선 — 운영·강사 상세처럼 자체 여백이 있으면 false로 끈다 */
  bordered?: boolean
}) {
  const b = data.basicInfo ?? EMPTY_BASIC
  const skills = data.skills ?? []
  const educations = data.educations ?? []
  const careers = data.careers ?? []
  const certificates = data.certificates ?? []
  const awards = data.awards ?? []
  const trainings = data.trainings ?? []
  const activities = data.activities ?? []
  const projects = data.projects ?? []
  const strength = data.strength ?? ''
  const intros = (data.coverLetters ?? []).filter((c) => c.content?.trim())

  const contacts = [
    { icon: <Phone />, value: b.phone },
    { icon: <Mail />, value: b.email },
    { icon: <Calendar />, value: b.birth },
  ].filter((c) => c.value?.trim())

  const links = [
    { label: 'GitHub', url: b.githubUrl },
    { label: '블로그', url: b.blogUrl },
  ].filter((l) => l.url?.trim())

  // 자격·수상, 교육·활동을 2열로 짝지어 배치(참조 이미지의 보조 섹션 그리드).
  const gridPairs: { key: string; left: ReactNode; right: ReactNode }[] = [
    {
      key: 'cert-award',
      left: (
        <CompactSection
          title="자격증"
          icon={<BadgeCheck />}
          items={certificates}
        />
      ),
      right: <CompactSection title="수상내역" icon={<Award />} items={awards} />,
    },
    {
      key: 'train-act',
      left: (
        <CompactSection
          title="교육경험"
          icon={<GraduationCap />}
          items={trainings}
        />
      ),
      right: (
        <CompactSection title="기타활동" icon={<FileText />} items={activities} />
      ),
    },
  ].filter((p) => p.left || p.right)

  const hasAny = Boolean(
    b.name?.trim() ||
      contacts.length ||
      links.length ||
      strength.trim() ||
      skills.length ||
      careers.length ||
      educations.length ||
      certificates.length ||
      awards.length ||
      trainings.length ||
      activities.length ||
      projects.length ||
      intros.length,
  )

  return (
    <div
      className={
        'resume-print flex flex-col gap-11 rounded-2xl bg-white px-12 py-11' +
        (bordered ? ' border-border border' : '')
      }
    >
      {/* 헤더 — 이름과 연락처 */}
      <div className="flex flex-col gap-3.5">
        <h1 className="text-fg text-[32px] leading-tight font-bold">
          {b.name || '(이름 미입력)'}
        </h1>
        {contacts.length > 0 && (
          <div className="text-fg-muted flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[14px]">
            {contacts.map((c, i) => (
              <span
                key={i}
                className="[&>svg]:text-fg-subtle inline-flex items-center gap-2 [&>svg]:h-4 [&>svg]:w-4"
              >
                {c.icon}
                {c.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {strength.trim() && (
        <DocSection title="핵심역량">
          <Bullets text={strength} />
        </DocSection>
      )}

      <TimelineSection
        title="경력"
        icon={<Briefcase />}
        iconClass="bg-brand-deep text-white"
        items={careers}
      />
      <TimelineSection
        title="프로젝트"
        icon={<FolderGit2 />}
        iconClass="bg-brand text-white"
        items={projects}
      />
      <TimelineSection
        title="학력"
        icon={<GraduationCap />}
        iconClass="bg-surface-muted text-fg"
        items={educations}
      />

      {skills.length > 0 && (
        <DocSection title="스킬">
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="border-border text-fg rounded-lg border px-3 py-1.5 text-[13px]"
              >
                {s}
              </span>
            ))}
          </div>
        </DocSection>
      )}

      {gridPairs.map((p) => (
        <div key={p.key} className="grid gap-x-12 gap-y-11 sm:grid-cols-2">
          {p.left}
          {p.right}
        </div>
      ))}

      {intros.length > 0 && (
        <DocSection title="자기소개서">
          <div className="flex flex-col gap-6">
            {intros.map((it, i) => (
              <div key={`${it.question}-${i}`} className="flex flex-col gap-2">
                <span className="text-fg text-[15px] font-bold">
                  {it.question}
                </span>
                <p className="text-fg-muted text-[14px] leading-relaxed whitespace-pre-line">
                  {it.content}
                </p>
              </div>
            ))}
          </div>
        </DocSection>
      )}

      {links.length > 0 && (
        <DocSection title="링크">
          <div className="text-fg flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
            <Link2 className="text-fg-subtle h-4 w-4" aria-hidden />
            {links.map((l, i) => (
              <span key={l.label} className="flex items-center gap-x-3">
                {i > 0 && <span className="text-fg-subtle">/</span>}
                <a
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {l.label}
                </a>
              </span>
            ))}
          </div>
        </DocSection>
      )}

      {!hasAny && (
        <span className="text-fg-subtle text-[13px]">
          아직 작성된 내용이 없어요.
        </span>
      )}
    </div>
  )
}

/**
 * 저장된 이력서 content(JSON 문자열) → 문서 데이터.
 * JSON 객체가 아니면 null — 호출 측에서 평문으로 처리한다. 빈 값은 빈 문서.
 */
export function parseResumeDoc(
  content: string | null,
): Partial<ResumeDocData> | null {
  if (!content || !content.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(content)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Partial<ResumeDocData>)
      : null
  } catch {
    return null
  }
}

/**
 * 이력서 content를 화면에 렌더하는 정본 — 운영·강사 상세에서 공용.
 * content는 문서 구조 JSON이라 그대로 출력하면 원문이 노출된다(강사 이력서 탭 결함).
 * JSON이 아닌 레거시 평문은 본문을 잃지 않도록 그대로 보여준다.
 */
export function ResumeContentView({
  content,
  bordered = true,
}: {
  content: string | null
  bordered?: boolean
}) {
  const doc = parseResumeDoc(content)
  if (doc) return <ResumeDocView data={doc} bordered={bordered} />
  return (
    <div
      className={
        'resume-print rounded-2xl bg-white px-12 py-11' +
        (bordered ? ' border-border border' : '')
      }
    >
      <p className="text-fg text-[14px] leading-7 break-words whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
