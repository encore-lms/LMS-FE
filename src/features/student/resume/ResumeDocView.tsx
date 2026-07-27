import type { ReactNode } from 'react'
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
  Phone,
  Star,
} from 'lucide-react'
import type { ResumeBasicInfo, ResumeCoverLetter, ResumeItem } from './types'

// 이력서 문서(Doc) 뷰 — 학생 편집기 미리보기 + 운영 이력서 상세에서 공용 사용.
// 디자인은 이전 LMS ResumeDocument 참고: 밑줄형 섹션 제목 + 40px 아이콘 카드 + 항목 구분선.
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

// 밑줄형 섹션(이전 LMS .doc-section-title) — 제목 자체에 굵은 하단 보더.
function DocSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-fg border-border-strong border-b-2 pb-2 text-[16px] font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  )
}

function DocEntry({
  icon,
  title,
  meta,
  withBorder,
}: {
  icon: ReactNode
  title: string
  meta?: string
  withBorder?: boolean
}) {
  return (
    <div
      className={
        'flex items-center gap-3.5' +
        (withBorder ? ' border-divider border-t pt-4' : '')
      }
    >
      <span className="bg-surface-muted text-fg-muted flex size-10 shrink-0 items-center justify-center rounded-[10px] [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-fg text-[14px] font-semibold">{title}</span>
        {meta && <span className="text-fg-subtle text-[12px]">{meta}</span>}
      </div>
    </div>
  )
}

function itemMeta(it: ResumeItem) {
  return [it.subtitle, it.period, it.description].filter(Boolean).join(' · ')
}

function DocItemSection({
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
    <DocSection title={title}>
      <div className="flex flex-col gap-4">
        {items.map((it, i) => (
          <DocEntry
            key={`${it.title}-${i}`}
            icon={icon}
            title={it.title || '(제목 미입력)'}
            meta={itemMeta(it)}
            withBorder={i > 0}
          />
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
  /** 문서 카드 외곽선 — 운영 상세 페이지처럼 자체 여백이 있으면 false로 끈다 */
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
    { icon: <Code2 />, value: b.githubUrl },
    { icon: <Globe />, value: b.blogUrl },
  ].filter((c) => c.value?.trim())

  const hasAny = Boolean(
    b.name?.trim() ||
    contacts.length ||
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
        'resume-print flex flex-col gap-8 rounded-2xl bg-white p-10' +
        (bordered ? ' border-border border' : '')
      }
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-fg text-2xl font-bold">
          {b.name || '(이름 미입력)'}
        </h2>
        {contacts.length > 0 && (
          <div className="text-fg-muted flex flex-wrap items-center gap-x-6 gap-y-1.5 text-[13px]">
            {contacts.map((c, i) => (
              <span
                key={i}
                className="[&>svg]:text-fg-subtle inline-flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5"
              >
                {c.icon}
                {c.value}
              </span>
            ))}
          </div>
        )}
      </div>

      {strength.trim() && (
        <DocSection title="핵심역량/강점">
          <p className="text-fg-muted text-[14px] leading-relaxed whitespace-pre-line">
            {strength}
          </p>
        </DocSection>
      )}

      {/* 이전 LMS 순서: 경력 → 학력 */}
      <DocItemSection title="경력사항" icon={<Briefcase />} items={careers} />
      <DocItemSection
        title="학력사항"
        icon={<GraduationCap />}
        items={educations}
      />
      <DocItemSection title="자격사항" icon={<Award />} items={certificates} />
      <DocItemSection title="수상내역" icon={<Star />} items={awards} />
      <DocItemSection
        title="교육경험"
        icon={<GraduationCap />}
        items={trainings}
      />
      <DocItemSection title="기타활동" icon={<FileText />} items={activities} />

      {skills.length > 0 && (
        <DocSection title="기술스택">
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span
                key={`${s}-${i}`}
                className="bg-accent-bg text-accent-strong rounded-full px-2.5 py-1 text-[12px] font-semibold"
              >
                {s}
              </span>
            ))}
          </div>
        </DocSection>
      )}

      <DocItemSection
        title="프로젝트 경험"
        icon={<FolderGit2 />}
        items={projects}
      />

      {intros.length > 0 && (
        <DocSection title="자기소개서">
          <div className="flex flex-col gap-5">
            {intros.map((it, i) => (
              <div key={`${it.question}-${i}`} className="flex flex-col gap-2">
                <span className="text-accent-strong text-[14px] font-bold">
                  {it.question}
                </span>
                <p className="text-fg-muted text-[13px] leading-relaxed whitespace-pre-line">
                  {it.content}
                </p>
              </div>
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
        'resume-print rounded-2xl bg-white p-10' +
        (bordered ? ' border-border border' : '')
      }
    >
      <p className="text-fg text-[14px] leading-7 break-words whitespace-pre-wrap">
        {content}
      </p>
    </div>
  )
}
