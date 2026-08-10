import type { ReactNode } from 'react'
import { Check, Download, Hash, Star } from 'lucide-react'
import type { CertifiedPublicResult } from '../types'
import { VerifyPolicyBox } from '../components'

// 6축 색 — 수강생 미리보기(SummaryTab 의 axisTone)와 같은 축 이름 기준 매핑.
// 순서 기반이면 축이 하나만 늘어도 두 화면의 색이 어긋난다.
const AXIS_TONE: Record<string, { bar: string; text: string }> = {
  '기술·기술기여': { bar: 'bg-brand', text: 'text-brand' },
  '소통·협업·팀워크': { bar: 'bg-info', text: 'text-info' },
  문제해결: { bar: 'bg-danger', text: 'text-danger' },
  책임감: { bar: 'bg-warning', text: 'text-warning' },
  학습지속성: { bar: 'bg-success', text: 'text-success' },
  '성취도 평가': { bar: 'bg-accent-strong', text: 'text-accent-strong' },
}
const AXIS_TONE_FALLBACK = { bar: 'bg-brand', text: 'text-brand' }

// 대표 근거 카테고리 칩 색 — raw #e8f7f7(brand 틴트)은 토큰 부재로 brand/10 매핑.
const CATEGORY_CHIP: Record<string, string> = {
  프로젝트: 'bg-brand/10 text-brand',
  트러블슈팅: 'bg-danger-bg text-danger',
  기록실: 'bg-success-bg text-success',
}

/**
 * 절대 종합 점수 — 수강생 미리보기(SummaryTab)의 도넛과 같은 모양.
 * 검증자가 본인 화면과 나란히 놓고 봐도 같은 문서로 읽히도록 수치·배치를 맞춘다.
 */
function OverallScoreCard({ score, grade }: { score: number; grade: string }) {
  const clamped = Math.min(100, Math.max(0, score))
  return (
    <section className="bg-surface flex flex-col items-center gap-4 rounded-2xl p-6 shadow-[0px_4px_16px_0px_rgba(18,23,38,0.06)]">
      <div className="flex flex-col items-center gap-1">
        <span className="text-fg-subtle text-[10px] font-bold">
          AGGREGATE SCORE
        </span>
        <span className="text-fg text-[15px] font-bold">절대 종합 점수</span>
        <span className="text-fg-muted text-[11px]">
          6축 역량 점수를 종합한 결과
        </span>
      </div>

      <div
        role="img"
        aria-label={`절대 종합 점수 ${score.toFixed(1)}점`}
        className="relative size-48"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 120 120"
          className="size-full -rotate-90"
        >
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            pathLength="100"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface-muted"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            pathLength="100"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - clamped}
            className="text-brand"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-fg text-[44px] leading-none font-bold tracking-[-0.04em]">
            {score.toFixed(1)}
          </span>
          <span className="text-fg-muted mt-1.5 text-[12px] font-medium">
            / 100
          </span>
        </div>
      </div>

      <span className="bg-brand/10 text-brand rounded-full px-3 py-1.5 text-[12px] font-bold">
        Grade {grade}
      </span>
    </section>
  )
}

// 흰 카드 공통 셸 — 헤더(좌 타이틀·우 보조) + divider + 바디. Figma 카드 공통 패턴.
// 라디우스: 핵심 정보(2815:370)=16, 6축·대표 근거·검증 정보(2815:402~)=14.
function SectionCard({
  title,
  icon,
  aside,
  radius = 14,
  children,
}: {
  title: string
  icon?: ReactNode
  aside?: ReactNode
  radius?: 16 | 14
  children: ReactNode
}) {
  return (
    <section
      className={`border-border bg-surface border shadow-[0_2px_8px_rgba(18,23,38,0.04)] ${
        radius === 16 ? 'rounded-2xl' : 'rounded-[14px]'
      }`}
    >
      <div className="border-divider flex items-center justify-between gap-4 border-b px-6 pt-[18px] pb-3.5">
        <h2 className="text-fg flex items-center gap-2 text-[15px] font-bold">
          {icon}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'success' | 'info'
}) {
  return (
    <span
      className={`flex items-baseline gap-1.5 rounded-[7px] px-2.5 py-[5px] ${
        tone === 'success' ? 'bg-success-bg' : 'bg-info-bg'
      }`}
    >
      <span className="text-fg-subtle text-[11px] font-medium">{label}</span>
      <span
        className={`text-sm font-bold ${tone === 'success' ? 'text-success' : 'text-info'}`}
      >
        {value}
      </span>
    </span>
  )
}

/**
 * 공개 증명서 — Figma 543:2909. certified_public 전용 880px 스택.
 * 데이터는 활성 CertificateSnapshot.publicPayload만 사용(내부 근거·결측 경고·검토 코멘트 비노출).
 */
export function VerifyPublicView({
  result,
  publicToken,
}: {
  result: CertifiedPublicResult
  publicToken: string
}) {
  const p = result.publicPayload

  // 공개 JSON 다운로드(P0-EXT-VERIFY-007) — 응답이 {data} 래핑 없는 raw 파일이라
  // apiClient 대신 fetch + Blob 다운로드. 아이콘은 lucide Download(Figma pencil-fill은 오기 판단).
  const downloadPublicJson = async () => {
    const res = await fetch(`/api/verify/${publicToken}/public-payload.json`)
    if (!res.ok) return
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `${publicToken}-public-payload.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="mx-auto flex w-full max-w-[880px] flex-col gap-[18px] px-4 pt-12 pb-[60px]">
      {/* Hero 진본 배너 — brand bg, certified·해시 칩 + 우측 메타 3쌍(흰 세로 구분선). */}
      <section className="bg-brand flex flex-wrap items-center justify-between gap-6 rounded-2xl px-7 py-[26px] shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
        <div className="flex flex-col gap-2">
          <span className="text-on-color text-[11px] font-semibold tracking-[1.98px]">
            PLAYDATA · 수강 역량 증명서
          </span>
          <h1 className="text-on-color text-2xl leading-[30px] font-bold">
            이 증명서는 정식으로 발급된 진본입니다
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-success-bg text-success flex items-center gap-1 rounded-[7px] px-2.5 py-[5px] text-xs font-bold">
              <Check size={11} aria-hidden />
              certified · 진본 검증 완료
            </span>
            {/* 해시 칩 — 유색 배경 위 '배경' 요소라 on-color ADR 기준 bg-surface 유지. */}
            <span className="bg-surface text-fg flex items-center gap-1 rounded-[7px] px-2.5 py-[5px] text-[11px] font-medium">
              <Hash size={11} aria-hidden />
              snapshotHash {result.snapshotHash}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-[18px]">
          {[
            { label: '발급기관', value: p.issuer },
            { label: '인증일', value: p.certifiedDate },
            { label: 'verificationId', value: result.verificationId },
          ].map((meta, i) => (
            <div key={meta.label} className="flex items-center gap-[18px]">
              {i > 0 && (
                // 세로 구분선 — Figma surface 바인딩이나 brand 위 장식선이라 on-color/40로
                // 매핑(2026-06-08 흰색 의미분리 ADR 검토 대상).
                <span className="bg-on-color/40 h-8 w-px" aria-hidden />
              )}
              <div className="flex flex-col items-end gap-1">
                <span className="text-on-color text-[10px] font-medium tracking-[0.6px]">
                  {meta.label}
                </span>
                <span className="text-on-color text-[13px] font-bold">
                  {meta.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 핵심 정보 — 아바타·이름·기수 칩·스탯 칩 4. */}
      <SectionCard
        radius={16}
        title="핵심 정보"
        icon={
          <Star size={16} className="fill-fg-muted text-fg-muted" aria-hidden />
        }
        aside={
          <span className="text-fg-subtle text-[11px] font-medium">
            외부 공개 payload 기준
          </span>
        }
      >
        <div className="flex items-center gap-4 px-6 py-[18px]">
          <span className="bg-brand text-on-color flex size-[84px] shrink-0 items-center justify-center rounded-full text-[32px] font-bold">
            {p.student.nameKo.charAt(0)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-fg text-[28px] font-bold">
                {p.student.nameKo}
              </span>
              <span className="text-fg-subtle text-sm font-medium">
                {p.student.nameEn}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-accent-bg text-accent-strong rounded-[5px] px-[7px] py-[3px] text-[11px] font-bold">
                {p.student.cohort}
              </span>
              <span className="text-fg-muted text-[13px] font-medium">
                {p.student.courseSummary}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              <StatChip
                label="핵심 역량"
                value={p.stats.coreCompetencyGrade}
                tone="success"
              />
              <StatChip
                label="출석률"
                value={p.stats.attendanceRate}
                tone="success"
              />
              <StatChip
                label="시험 평균"
                value={p.stats.examAverage}
                tone="info"
              />
              <StatChip
                label="제출률"
                value={p.stats.submissionRate}
                tone="info"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* 종합 점수 + 6축 — 수강생 미리보기의 '종합 요약' 배치를 그대로 따른다. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_1fr]">
        <OverallScoreCard
          score={p.skillAvg}
          grade={p.stats.coreCompetencyGrade}
        />
        <SectionCard
          title="6축 점수 — 동결 시점"
          aside={
            // 평균은 왼쪽 도넛이 이미 보여준다 — 미리보기처럼 산출 기준 칩만 둔다.
            <span className="bg-surface-muted text-fg-subtle rounded-full px-2 py-1 text-[9px] font-bold">
              종합 점수 산출 기준
            </span>
          }
        >
          {/* 격자·게이지 두께·점수 표기를 수강생 미리보기(AxisGaugeList)와 맞춘다. */}
          <div className="grid gap-3.5 px-6 pt-3.5 pb-[18px]">
            {p.skills.map((skill) => {
              const tone = AXIS_TONE[skill.label] ?? AXIS_TONE_FALLBACK
              return (
                <div
                  key={skill.label}
                  className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[150px_minmax(120px,1fr)_56px]"
                >
                  <span className="text-fg truncate text-[12px] font-bold">
                    {skill.label}
                  </span>
                  <div
                    role="img"
                    aria-label={`${skill.label} 절대 점수 ${skill.score}점`}
                    className="bg-surface-muted h-2.5 min-w-0 overflow-hidden rounded-full"
                  >
                    <div
                      className={`h-full rounded-full ${tone.bar}`}
                      style={{
                        width: `${Math.min(100, Math.max(0, skill.score))}%`,
                      }}
                    />
                  </div>
                  <span className="text-fg text-right text-[12px] font-bold tabular-nums">
                    {skill.score}점
                  </span>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      {/* 대표 근거 — 공개 허용 산출물 3행. */}
      <SectionCard
        title="대표 근거 — 공개 허용 산출물"
        aside={
          <span className="text-fg-subtle text-[11px] font-medium">
            {p.evidenceSummary}
          </span>
        }
      >
        <div className="divide-divider flex flex-col divide-y">
          {p.evidence.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3.5 px-6 py-3.5"
            >
              <span
                className={`w-[90px] shrink-0 rounded-[5px] px-[9px] py-[3px] text-center text-[11px] font-bold ${
                  CATEGORY_CHIP[item.category] ?? 'bg-brand/10 text-brand'
                }`}
              >
                {item.category}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-fg text-[13px] font-bold">
                  {item.title}
                </span>
                <span className="text-fg-subtle text-[11px] leading-4">
                  {item.description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 검증 정보 — 무결성 + 공개 JSON 다운로드(이 화면의 유일한 인터랙션). */}
      <SectionCard
        title="검증 정보 — 무결성"
        aside={
          <button
            type="button"
            onClick={downloadPublicJson}
            className="border-border bg-surface text-fg-muted hover:text-fg flex shrink-0 items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap"
          >
            <Download size={12} aria-hidden className="shrink-0" />
            공개 JSON 다운로드
          </button>
        }
      >
        <div className="flex flex-col gap-3.5 px-6 pt-3.5 pb-[18px] sm:flex-row">
          {[
            { label: 'snapshotHash', value: result.snapshotHash },
            { label: 'publicToken', value: publicToken },
            { label: '발급 시점', value: p.issuedAt },
          ].map((field) => (
            <div
              key={field.label}
              className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
              <span className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
                {field.label}
              </span>
              <span className="bg-surface-muted text-fg truncate rounded-lg px-2.5 py-[9px] text-xs font-bold">
                {field.value}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <VerifyPolicyBox title="외부 검증 페이지 정책" withIcon>
        로그인 없이 접근 · 공개 payload만 사용 · 내부 근거 노출 없음 ·
        비공개·미인증 상태에서 상세 정보 렌더링 없음
      </VerifyPolicyBox>
    </main>
  )
}
