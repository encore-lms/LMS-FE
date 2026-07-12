import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { buttonClass } from '@/components/ui/buttonClass'
import { useToast } from '@/components/ui/use-toast'
import { tsKeys } from '../queryKeys'
import { buildCaseDetail, buildTimeline } from '../detail'
import { TS_STATUS_META } from '../flow'
import {
  TS_CATEGORIES,
  type TsCase,
  type TsListData,
  type TsProjectLink,
} from '../types'
import {
  ALLOWED_EXT,
  card,
  CATEGORY_KEY,
  formatSize,
  MAX_FILE_SIZE,
  STAR,
  type UploadFile,
} from './caseFormConstants'
import { CaseBasicInfoSection } from './CaseBasicInfoSection'
import { CaseStarSection } from './CaseStarSection'
import { CaseTagsAttachments } from './CaseTagsAttachments'

// 트러블슈팅 사례 내용 편집 폼 — 상세 페이지의 '작성 중(draft·미완료)' 모드에서만 쓰인다.
// 하단 바 = [임시 저장](→이어 작성, 계속 작성) · [작성 완료](→draft·완료로 저장 후 목록으로).
// 작성 완료 사례는 목록에서 '사례 열기' → 상세의 '인증 요청 준비'에서 인증 요청. 삭제는 목록에서.
// 첨부 파일 임시 id 시퀀스 — addFiles에서 증가시키므로(let 재할당) 이 모듈에 둔다.
let fileSeq = 0

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
          <CaseBasicInfoSection
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            customCategories={customCategories}
            customInput={customInput}
            setCustomInput={setCustomInput}
            addCustomCategory={addCustomCategory}
            date={date}
            setDate={setDate}
            dayCount={dayCount}
            setDayCount={setDayCount}
            independent={independent}
            setIndependent={setIndependent}
          />

          <CaseStarSection star={star} setStar={setStar} />

          <CaseTagsAttachments
            tags={tags}
            tagInput={tagInput}
            setTagInput={setTagInput}
            addTag={addTag}
            removeTag={removeTag}
            files={files}
            addFiles={addFiles}
            removeFile={removeFile}
            links={links}
            removeLink={removeLink}
            linkInput={linkInput}
            setLinkInput={setLinkInput}
            addLink={addLink}
          />
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
