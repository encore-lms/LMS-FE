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
  Send,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { usePageHeader } from '@/shared/store'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { tsKeys } from '../queryKeys'
import {
  TS_CATEGORIES,
  type TsCase,
  type TsListData,
  type Tone,
} from '../types'

// 트러블슈팅 새 사례 작성 (/student/troubleshooting/new) — Figma 394:1500.
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

export default function NewCasePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(
    'Kafka 컨슈머 리밸런싱으로 메시지 중복 처리',
  )
  const [category, setCategory] = useState('DB')
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [customInput, setCustomInput] = useState('')
  const [date, setDate] = useState('2026-04-22')
  const [days, setDays] = useState('3 일')
  const [independent, setIndependent] = useState(true)
  const [star, setStar] = useState<Record<string, string>>({
    situation:
      '스케일아웃 시 컨슈머 리밸런싱이 발생하면서 동일 주문 이벤트가 두 번 처리되어 재고가 잘못 차감됐습니다. 결제도 중복 청구되어 사용자 문의가 급증했습니다.',
    resolution:
      '중복 처리 목표를 세우고 dedup 테이블 추가, ack 정책 정리, 트랜잭션 정합성 점검까지 해결 과정을 기록했습니다.',
    result:
      '중복 처리 0건/주, 결제 실패율 8% → 0.4%, 컨슈머 lag 평균 1.2s → 240ms. 학습: 컨슈머 그룹 토폴로지가 우선이었음을 확인.',
  })
  const [tags, setTags] = useState<string[]>([
    '#Kafka',
    '#이벤트소싱',
    '#멱등성',
  ])
  const [tagInput, setTagInput] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([
    { id: 'f1', name: 'kafka-consumer-config.yml', size: '3.2 KB' },
    { id: 'f2', name: 'dedup-table-schema.png', size: '118 KB' },
  ])
  const filled = STAR.filter((s) => star[s.key]?.trim()).length
  usePageHeader(
    '새 트러블슈팅 사례',
    '학습 과정에서 겪은 문제를 상황·해결·결과로 기록하고 팀별 인증을 준비해요.',
  )

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
    setFiles((p) => [
      ...p,
      ...Array.from(list).map((f) => ({
        id: `u${++fileSeq}`,
        name: f.name,
        size: formatSize(f.size),
      })),
    ])
  }
  const removeFile = (id: string) =>
    setFiles((p) => p.filter((f) => f.id !== id))

  // 제출 — 새 사례를 만들어 목록 캐시 맨 앞에 추가하고 목록으로 이동.
  const submit = () => {
    // 직접 추가한 카테고리는 '기타'와 동일하게 etc 키·success 톤으로 저장.
    const isCustom = customCategories.includes(category)
    const tone =
      TS_CATEGORIES.find((c) => c.key === category)?.tone ??
      (isCustom ? 'success' : 'brand')
    const newCase: TsCase = {
      id: `ts_${Math.random().toString(36).slice(2, 7)}`,
      category,
      categoryKey: CATEGORY_KEY[category] ?? 'etc',
      categoryTone: tone,
      status: 'draft',
      statusLabel: '작성 중',
      independent,
      days: days.trim() || '진행 중',
      repLinked: false,
      accentTone: tone,
      title: title.trim() || '제목 없는 사례',
      createdAt: '작성 방금',
      updatedAt: '최근 수정 방금',
      situation: star.situation,
      resolution: star.resolution,
      result: star.result,
      tags,
      actionLabel: '이어 작성',
    }
    queryClient.setQueryData<TsListData>(tsKeys.list(), (old) =>
      old ? { ...old, cases: [newCase, ...old.cases] } : old,
    )
    navigate('/student/troubleshooting')
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-28">
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-[12px]">
          <button
            type="button"
            onClick={() => navigate('/student/troubleshooting')}
            className="text-fg-muted hover:text-fg"
          >
            ← 트러블슈팅 목록
          </button>
          <span className="text-fg-subtle">›</span>
          <span className="text-fg font-semibold">새 사례 작성</span>
        </nav>
        <span className="text-fg-subtle text-[11px]">✎ 자동 저장 · 1분 전</span>
      </div>

      {/* 헤더 배너 — 작성/태그 진행 배지 */}
      <div className="bg-brand flex items-center justify-between gap-4 rounded-2xl p-6">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider text-white/70">
            TROUBLESHOOTING · 새 사례
          </span>
          <span className="text-[20px] font-bold text-white">
            상황·해결·결과로 기록하세요
          </span>
          <span className="text-[12px] text-white/80">
            상황 · 해결 · 결과 3개 항목을 채우면 사례를 저장할 수 있습니다.
            프로젝트 연결과 인증 요청은 저장 후 진행합니다.
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="bg-surface flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-1.5">
            <span className="text-fg-subtle text-[10px]">작성</span>
            <span className="text-fg text-[14px] font-bold">
              {filled}
              <span className="text-fg-muted text-[11px] font-medium">
                {' '}
                /3 항목
              </span>
            </span>
          </span>
          <span className="bg-surface flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-1.5">
            <span className="text-fg-subtle text-[10px]">태그</span>
            <span className="text-fg text-[14px] font-bold">
              {tags.length}
              <span className="text-fg-muted text-[11px] font-medium">
                {' '}
                /최대 5개
              </span>
            </span>
          </span>
        </div>
      </div>

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
              <span className="text-fg text-[13px] font-bold">해결 소요</span>
              <div className="relative">
                <Clock className="text-fg-subtle pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
                <input
                  className={cn(input, 'pl-10')}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  placeholder="예) 3 일"
                />
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
              <span className="text-fg text-[13px] font-bold">독립 해결</span>
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
                <span className="text-fg text-[14px] font-bold">{s.label}</span>
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
          검색·필터에 사용 · 코드 파일이나 캡처 PDF 첨부 가능
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
                  <span className="text-fg-subtle text-[11px]">{f.size}</span>
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
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </section>

      <div className="bg-brand-deep fixed right-8 bottom-6 left-[232px] z-30 flex items-center justify-between rounded-2xl px-6 py-4 text-white shadow-[0px_12px_32px_0px_rgba(18,23,38,0.28)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold">
            상황·해결·결과 {filled} / 3 작성 완료 · 태그 {tags.length}개 · 첨부{' '}
            {files.length}개
          </span>
          <span className="text-[11px] text-white/70">
            사례 저장 후 프로젝트 연결과 인증 요청은 상세 화면에서 진행합니다
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            className="rounded-lg border border-white/30 px-4 py-2.5 text-[13px] font-semibold"
          >
            임시 저장
          </button>
          <button
            type="button"
            onClick={submit}
            className="bg-brand rounded-lg px-5 py-2.5 text-[13px] font-bold"
          >
            사례 저장 →
          </button>
        </div>
      </div>
    </div>
  )
}
