import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  Info,
  Link2,
  Send,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/Button'
import { useToast } from '@/components/ui/use-toast'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { tsKeys } from '../queryKeys'
import { buildCaseDetail, buildTimeline } from '../detail'
import { TS_STATUS_META } from '../flow'
import {
  TS_CATEGORIES,
  type TsCase,
  type TsListData,
  type TsProjectLink,
  type Tone,
} from '../types'

// 트러블슈팅 사례 내용 편집 폼 — 상세 페이지의 '작성 중(draft·미완료)' 모드에서만 쓰인다.
// 하단 바 = [임시 저장](→이어 작성, 계속 작성) · [작성 완료](→draft·완료로 저장 후 목록으로).
// 작성 완료 사례는 목록에서 '사례 열기' → 상세의 '인증 요청 준비'에서 인증 요청. 삭제는 목록에서.
const card = 'border-border bg-surface rounded-2xl border p-6'
const input =
  'border-border bg-surface text-fg placeholder:text-fg-subtle focus:border-brand w-full rounded-[10px] border px-4 py-3 text-[14px] focus:outline-none'

const DOT: Record<Tone, string> = {
  brand: 'bg-brand',
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
  accent: 'bg-accent-strong',
  success: 'bg-success',
}

// 카테고리 표시명 → 목록 필터 키
const CATEGORY_KEY: Record<string, string> = {
  DB: 'DB',
  '배포·인프라': 'deploy',
  성능: 'perf',
  '네트워크·API': 'net',
  보안: 'etc',
  기타: 'etc',
}

const STAR = [
  {
    key: 'situation',
    label: '상황 (Situation)',
    sub: '무엇이 어떻게 잘못되고 있었는지, 사용자/시스템에 어떤 영향이 있었는지',
    Icon: Info,
    box: 'bg-info-bg text-info',
  },
  {
    key: 'resolution',
    label: '해결 (Resolution)',
    sub: '원인 파악부터 실제 조치까지 해결 과정을 기록',
    Icon: Send,
    box: 'bg-accent-bg text-accent-strong',
  },
  {
    key: 'result',
    label: '결과 (Result)',
    sub: '수치로 본 결과와 학습한 점',
    Icon: CheckCircle2,
    box: 'bg-success-bg text-success',
  },
] as const

const RECOMMENDED_TAGS = [
  '#컨슈머그룹',
  '#ack정책',
  '#dedup',
  '#트랜잭션',
  '#격리수준',
  '#스케일아웃',
  '#모니터링',
]

interface UploadFile {
  id: string
  name: string
  size: string
}
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
let fileSeq = 0

// 첨부 허용 형식 — 이미지·PDF·로그/텍스트. accept 속성 + 추가 시 확장자/용량 필터로 이중 방어.
const ACCEPT_TYPES =
  '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.log,.txt,.md,.json,.yml,.yaml'
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|svg|pdf|log|txt|md|json|ya?ml)$/i
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface CaseContentFormProps {
  caseId: string
  /** 현재 프로젝트 연결 — 표시·진행 상태에 사용(상세 페이지가 소유). */
  projectLink: TsProjectLink | null
  /** 프로젝트 연결 모달 열기(상세 페이지 소유). */
  onConnectProject: () => void
  /** 인증 요청 — 내용 저장 후 상세 페이지의 인증 요청(체크리스트) 모달을 연다. */
  onRequestCert: () => void
}

export function CaseContentForm({
  caseId,
  projectLink,
  onConnectProject,
  onRequestCert,
}: CaseContentFormProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const existing = queryClient
    .getQueryData<TsListData>(tsKeys.list())
    ?.cases.find((c) => c.id === caseId)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [category, setCategory] = useState(existing?.category ?? 'DB')
  // 기존 카테고리가 기본 카탈로그에 없으면(직접 입력한 '기타') 커스텀 칩으로 복원.
  const [customCategories, setCustomCategories] = useState<string[]>(
    existing && !TS_CATEGORIES.some((c) => c.key === existing.category)
      ? [existing.category]
      : [],
  )
  const [customInput, setCustomInput] = useState('')
  const [date, setDate] = useState('2026-04-22')
  // 해결 소요 — 숫자만 입력받고 '일'은 고정 단위. 기존 값(예 "3일")에서 숫자만 추출.
  const [dayCount, setDayCount] = useState(
    () => existing?.days?.match(/\d+/)?.[0] ?? '',
  )
  const [independent, setIndependent] = useState(existing?.independent ?? true)
  const [star, setStar] = useState<Record<string, string>>({
    situation: existing?.situation ?? '',
    resolution: existing?.resolution ?? '',
    result: existing?.result ?? '',
  })
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  // 근거 링크 — 파일 외에 PR·블로그·문서 등 링크도 근거로 첨부(변경 제안과 동일 규약).
  const [links, setLinks] = useState<string[]>([])
  const [linkInput, setLinkInput] = useState('')

  const filled = STAR.filter((s) => star[s.key]?.trim()).length
  const projectLinked = !!projectLink
  const certProjectValue = projectLink ? projectLink.projectTitle : '미연결'

  const addTag = (raw: string) => {
    const body = raw.trim().replace(/^#+/, '')
    if (!body) return
    const tag = `#${body}`
    if (tags.includes(tag) || tags.length >= 5) return
    setTags((p) => [...p, tag])
  }
  const removeTag = (tag: string) => setTags((p) => p.filter((t) => t !== tag))

  // '기타' 직접 입력 — 입력값을 커스텀 카테고리 칩으로 추가하고 바로 선택.
  const addCustomCategory = () => {
    const name = customInput.trim()
    if (!name) return
    const exists =
      TS_CATEGORIES.some((c) => c.key === name) ||
      customCategories.includes(name)
    if (!exists) setCustomCategories((p) => [...p, name])
    setCategory(name)
    setCustomInput('')
  }

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const accepted: UploadFile[] = []
    let rejected = 0
    for (const f of Array.from(list)) {
      // 확장자/용량 이중 방어 — accept를 우회한 드래그·붙여넣기도 막는다.
      if (!ALLOWED_EXT.test(f.name) || f.size > MAX_FILE_SIZE) {
        rejected += 1
        continue
      }
      accepted.push({
        id: `u${++fileSeq}`,
        name: f.name,
        size: formatSize(f.size),
      })
    }
    if (accepted.length) setFiles((p) => [...p, ...accepted])
    if (rejected)
      toast.info('지원하지 않는 형식이거나 10MB를 초과한 파일은 제외했어요')
  }
  const removeFile = (id: string) =>
    setFiles((p) => p.filter((f) => f.id !== id))
  const addLink = () => {
    const v = linkInput.trim()
    if (!v) return
    // URL만 허용 — http(s):// 형식이 아니면 추가하지 않는다.
    if (!/^https?:\/\/.+/i.test(v)) {
      toast.danger('올바른 URL을 입력해 주세요 (http:// 또는 https://로 시작)')
      return
    }
    if (links.includes(v)) return
    setLinks((p) => [...p, v])
    setLinkInput('')
  }
  const removeLink = (url: string) =>
    setLinks((p) => p.filter((l) => l !== url))

  // 저장 — 항상 draft로 저장하고 completed 플래그만 다르게 둔다(목록·상세 캐시 함께 갱신).
  //   completed=false (임시 저장) → 이어 작성. completed=true (작성 완료) → 상세에서 인증 요청.
  // 프로젝트 연결은 상세 페이지가 소유하므로 빌드 결과에 현재 연결값을 덮어쓴다.
  const persist = (completed: boolean) => {
    const isCustom = customCategories.includes(category)
    const tone =
      TS_CATEGORIES.find((c) => c.key === category)?.tone ??
      (isCustom ? 'success' : 'brand')
    const meta = TS_STATUS_META.draft
    const next: TsCase = {
      id: caseId,
      category,
      categoryKey: CATEGORY_KEY[category] ?? 'etc',
      categoryTone: tone,
      status: 'draft',
      statusLabel: completed ? '작성 완료' : meta.statusLabel,
      completed,
      independent,
      days: dayCount ? `${dayCount}일` : '진행 중',
      accentTone: meta.accentTone,
      title: title.trim() || '제목 없는 사례',
      createdAt: existing?.createdAt ?? '작성 방금',
      updatedAt: '최근 수정 방금',
      situation: star.situation,
      resolution: star.resolution,
      result: star.result,
      tags,
      // 작성 완료면 목록에서 '인증요청'(→상세 인증 요청), 미완료면 '이어 작성'.
      actionLabel: completed ? '인증요청' : meta.actionLabel,
    }
    queryClient.setQueryData<TsListData>(tsKeys.list(), (old) => {
      if (!old) return old
      const has = old.cases.some((c) => c.id === caseId)
      return {
        ...old,
        cases: has
          ? old.cases.map((c) => (c.id === caseId ? next : c))
          : [next, ...old.cases],
      }
    })
    const detail = buildCaseDetail(next)
    queryClient.setQueryData(tsKeys.case(caseId), {
      ...detail,
      projectLink,
      certProject: projectLink ? projectLink.projectTitle : detail.certProject,
    })
  }

  const saveDraft = () => {
    persist(false)
    toast.success('임시 저장했어요 · 이어서 작성할 수 있어요')
  }
  const complete = () => {
    persist(true)
    toast.success('작성을 완료했어요 · 목록에서 ‘사례 열기’로 인증 요청하세요')
    navigate('/student/troubleshooting')
  }

  const prepChecklist = [
    { label: '제목·카테고리 입력', done: !!title.trim() },
    { label: '상황·해결·결과 작성', done: filled === 3 },
    { label: '프로젝트 연결', done: projectLinked },
    { label: '태그 추가', done: tags.length > 0 },
  ]
  // 인증 요청은 준비 항목을 모두 충족해야 가능. 누르면 현재 내용을 저장하고 인증 모달을 연다.
  const canRequestCert = prepChecklist.every((c) => c.done)
  const openCertRequest = () => {
    persist(false)
    onRequestCert()
  }
  const timeline = buildTimeline('draft')

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-5">
          <section className={cn(card, 'flex flex-col gap-4')}>
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[15px] font-bold">기본 정보</span>
              <span className="text-fg-subtle text-[11px]">
                사례를 한 줄로 요약할 제목과 분류를 입력하세요
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-bold">
                제목 <span className="text-danger">*</span>
              </span>
              <input
                className={input}
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="문제와 해결 핵심을 한 줄로"
              />
              <div className="flex items-center justify-between">
                <span className="text-fg-subtle text-[11px]">
                  문제와 해결 핵심을 한 줄로 — 60자 이내 권장
                </span>
                <span className="text-fg-subtle text-[11px]">
                  {title.length} / 60
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-fg text-[13px] font-bold">
                카테고리 <span className="text-danger">*</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  ...TS_CATEGORIES,
                  ...customCategories.map((key) => ({
                    key,
                    tone: 'success' as Tone,
                  })),
                ].map((c) => {
                  const on = c.key === category
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold',
                        on
                          ? 'border-brand bg-brand text-white'
                          : 'border-border text-fg-muted hover:border-brand/50',
                      )}
                    >
                      {on ? (
                        <Check className="size-3" />
                      ) : (
                        <span
                          className={cn('size-1.5 rounded-full', DOT[c.tone])}
                        />
                      )}
                      {c.key}
                    </button>
                  )
                })}
              </div>
              {category === '기타' && (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    className={cn(input, 'flex-1')}
                    value={customInput}
                    maxLength={20}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomCategory()
                      }
                    }}
                    placeholder="카테고리를 직접 입력하고 추가하세요"
                    aria-label="기타 카테고리 직접 입력"
                  />
                  <button
                    type="button"
                    onClick={addCustomCategory}
                    disabled={!customInput.trim()}
                    className="border-brand text-brand shrink-0 rounded-[10px] border px-4 py-3 text-[13px] font-semibold disabled:opacity-40"
                  >
                    추가
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <span className="text-fg text-[13px] font-bold">
                    문제 발생일 <span className="text-danger">*</span>
                  </span>
                  <DateTimePicker
                    mode="date"
                    value={date}
                    onChange={setDate}
                    ariaLabel="문제 발생일"
                    placeholder="날짜 선택"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-fg text-[13px] font-bold">
                    해결 소요
                  </span>
                  <div className="relative">
                    <Clock className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                    <input
                      className={cn(input, 'pr-9 pl-10')}
                      value={dayCount}
                      inputMode="numeric"
                      onChange={(e) =>
                        setDayCount(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      placeholder="예) 3"
                      aria-label="해결 소요 일수"
                    />
                    <span className="text-fg-muted pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[13px]">
                      일
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-fg-subtle text-[11px]">
                실제 문제가 발생한 일자와 해결까지 소요된 영업일
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIndependent((v) => !v)}
              className="bg-surface-muted/50 flex items-center justify-between rounded-xl p-3.5"
            >
              <div className="flex items-center gap-2.5 text-left">
                <span className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Flag className="size-[18px]" />
                </span>
                <div className="flex flex-col">
                  <span className="text-fg text-[13px] font-bold">
                    독립 해결
                  </span>
                  <span className="text-fg-subtle text-[11px]">
                    동료·강사·외부 도움 없이 본인 주도로 해결한 사례
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  'flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                  independent ? 'bg-brand' : 'bg-border',
                )}
              >
                <span
                  className={cn(
                    'size-5 rounded-full bg-white transition-transform',
                    independent && 'translate-x-5',
                  )}
                />
              </span>
            </button>
          </section>

          {STAR.map((s) => (
            <section key={s.key} className={cn(card, 'flex flex-col gap-3')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-[10px]',
                      s.box,
                    )}
                  >
                    <s.Icon className="size-[18px]" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-fg text-[14px] font-bold">
                      {s.label}
                    </span>
                    <span className="text-fg-subtle text-[11px]">{s.sub}</span>
                  </div>
                </div>
                {star[s.key]?.trim() && (
                  <span className="bg-success-bg text-success flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold">
                    <Check className="size-3" /> 작성됨
                  </span>
                )}
              </div>
              <textarea
                className={cn(input, 'min-h-[120px] resize-none leading-6')}
                value={star[s.key]}
                maxLength={500}
                onChange={(e) =>
                  setStar((p) => ({ ...p, [s.key]: e.target.value }))
                }
              />
              <div className="flex items-center justify-between">
                <div className="text-fg-subtle flex items-center gap-3 text-[11px]">
                  <span>Markdown 지원</span>
                  <span className="bg-surface-muted rounded px-1.5 py-0.5 font-mono">
                    ` ` 인라인 코드
                  </span>
                </div>
                <span className="text-fg-subtle text-[11px]">
                  {star[s.key]?.length ?? 0} / 500
                </span>
              </div>
            </section>
          ))}

          <section className={cn(card, 'flex flex-col gap-3')}>
            <div className="flex items-center justify-between">
              <span className="text-fg text-[15px] font-bold">태그 · 첨부</span>
              <span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-bold">
                태그 {tags.length} / 5
              </span>
            </div>
            <span className="text-fg-subtle text-[11px]">
              태그는 검색·필터에 사용해요. 해결 근거 파일을 함께 첨부하세요.
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="bg-brand flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-[12px] font-semibold text-white"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    aria-label={`${t} 제거`}
                    className="text-brand flex size-4 items-center justify-center rounded-full bg-white"
                  >
                    <X className="size-2.5" strokeWidth={3} />
                  </button>
                </span>
              ))}
              {tags.length < 5 && (
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag(tagInput)
                      setTagInput('')
                    }
                  }}
                  placeholder="+ 태그 추가"
                  className="text-fg-subtle placeholder:text-fg-subtle focus:text-fg w-24 bg-transparent px-1 py-1 text-[12px] outline-none"
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-fg-subtle text-[11px]">추천 태그</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {RECOMMENDED_TAGS.map((t) => {
                  const used = tags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => addTag(t)}
                      disabled={used || tags.length >= 5}
                      className={cn(
                        'text-[11px]',
                        used
                          ? 'text-brand/40 cursor-default'
                          : 'text-fg-muted hover:text-brand',
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="bg-surface-muted/40 text-fg-muted rounded-lg px-3 py-2 text-[11px] leading-4">
              허용 형식 — 이미지(PNG·JPG·GIF·WEBP·SVG) · PDF ·
              로그/텍스트(.log·.txt·.md·.json·.yml) · 파일당 최대 10MB
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {files.map((f) => {
                const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)
                return (
                  <span
                    key={f.id}
                    className="border-border flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        isImage
                          ? 'bg-accent-bg text-accent-strong'
                          : 'bg-success-bg text-success',
                      )}
                    >
                      <FileText className="size-4" />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-fg truncate text-[12px] font-semibold">
                        {f.name}
                      </span>
                      <span className="text-fg-subtle text-[11px]">
                        {f.size}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      aria-label={`${f.name} 제거`}
                      className="border-border text-fg-subtle hover:text-fg flex size-6 shrink-0 items-center justify-center rounded-md border"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )
              })}
              <label className="border-border text-fg-subtle hover:border-brand/50 flex cursor-pointer items-center justify-center gap-1 rounded-[10px] border border-dashed px-3 py-2.5 text-[12px]">
                + 파일 추가
                <input
                  type="file"
                  multiple
                  accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {links.map((url) => (
              <span
                key={url}
                className="border-border flex items-center gap-2 rounded-[10px] border px-3 py-2.5 text-[12px]"
              >
                <Link2 className="text-fg-subtle size-3.5 shrink-0" />
                <span className="text-fg-muted flex-1 truncate">{url}</span>
                <button
                  type="button"
                  onClick={() => removeLink(url)}
                  aria-label="링크 제거"
                  className="text-fg-subtle hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-2">
              <div className="border-border focus-within:border-brand flex flex-1 items-center gap-2 rounded-[10px] border px-3 py-2.5">
                <Link2 className="text-fg-subtle size-3.5 shrink-0" />
                <input
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addLink()
                    }
                  }}
                  placeholder="https:// 근거 링크를 붙여넣고 Enter"
                  className="text-fg placeholder:text-fg-subtle flex-1 bg-transparent text-[12px] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addLink}
                className="border-border text-fg-muted hover:bg-surface-muted shrink-0 rounded-[10px] border px-3.5 py-2.5 text-[12px] font-semibold"
              >
                링크 추가
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:w-[320px]">
          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">
              인증 요청 준비
            </span>
            <span className="text-fg-subtle text-[11px]">
              아래 항목을 채우고 ‘작성 완료’ 후 상세에서 인증을 요청해요.
            </span>
            {prepChecklist.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold',
                    c.done
                      ? 'bg-success text-white'
                      : 'bg-warning-bg text-warning',
                  )}
                >
                  {c.done ? '✓' : '!'}
                </span>
                <span className="text-fg flex-1 text-[12px] font-medium">
                  {c.label}
                </span>
              </div>
            ))}
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-2.5 text-[11px] leading-4',
                projectLinked ? 'bg-success-bg' : 'bg-warning-bg',
              )}
            >
              <Link2
                className={cn(
                  'mt-px size-3.5 shrink-0',
                  projectLinked ? 'text-success' : 'text-warning',
                )}
              />
              <span className="text-fg font-medium">
                {projectLinked ? certProjectValue : '연결된 프로젝트가 없어요'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onConnectProject}
                className="border-border text-fg flex-1 rounded-lg border py-2.5 text-[12px] font-semibold"
              >
                {projectLinked ? '연결 변경' : '프로젝트 연결'}
              </button>
              <button
                type="button"
                onClick={openCertRequest}
                disabled={!canRequestCert}
                title={
                  canRequestCert
                    ? undefined
                    : '인증 요청 준비 항목을 모두 충족해야 인증 요청할 수 있어요'
                }
                className={buttonClass({ size: 'sm', className: 'flex-1' })}
              >
                인증 요청
              </button>
            </div>
          </section>

          <section className={cn(card, 'flex flex-col gap-3')}>
            <span className="text-fg text-[14px] font-bold">상태 이력</span>
            {timeline.map((t) => (
              <div key={t.key} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-1 size-2.5 shrink-0 rounded-full',
                    t.state === 'current'
                      ? 'bg-brand'
                      : t.state === 'done'
                        ? 'bg-success'
                        : 'bg-border',
                  )}
                />
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-[13px] font-semibold',
                      t.state === 'todo' ? 'text-fg-subtle' : 'text-fg',
                    )}
                  >
                    {t.label}
                  </span>
                  <span className="text-fg-subtle text-[11px]">{t.sub}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* 하단 고정 바 — [임시 저장](이어 작성) · [작성 완료](상세로 전환) */}
      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold">
            상황·해결·결과 {filled} / 3 작성 · 태그 {tags.length}개 · 프로젝트{' '}
            {projectLinked ? '연결됨' : '미연결'}
          </span>
          <span className="text-[11px] text-white/70">
            임시 저장 → 이어 작성 · 작성 완료 → 상세에서 인증 요청
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={complete}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            작성 완료 →
          </button>
        </div>
      </div>
    </>
  )
}
