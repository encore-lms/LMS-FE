import type { ReactNode } from 'react'
import { Check, Download, Hash, Star } from 'lucide-react'
import type { CertifiedPublicResult } from '../types'
import { VerifyPolicyBox } from '../components'

// 6축 색 — Figma 543:2909 축별 토큰(기술 brand / 책임감 success / 소통 info /
// 성장 accent-strong / 팀워크 warning / 문제해결 danger). 순서 기반 매핑.
const AXIS_TONES = [
  { bar: 'bg-brand', text: 'text-brand' },
  { bar: 'bg-success', text: 'text-success' },
  { bar: 'bg-info', text: 'text-info' },
  { bar: 'bg-accent-strong', text: 'text-accent-strong' },
  { bar: 'bg-warning', text: 'text-warning' },
  { bar: 'bg-danger', text: 'text-danger' },
]

// 대표 근거 카테고리 칩 색 — raw #e8f7f7(brand 틴트)은 토큰 부재로 brand/10 매핑.
const CATEGORY_CHIP: Record<string, string> = {
  프로젝트: 'bg-brand/10 text-brand',
  트러블슈팅: 'bg-danger-bg text-danger',
  기록실: 'bg-success-bg text-success',
}

// 흰 카드 공통 셸 — 헤더(좌 타이틀·우 보조) + divider + 바디. Figma 카드 공통 패턴.
function SectionCard({
  title,
  icon,
  aside,
  children,
}: {
  title: string
  icon?: ReactNode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="border-border bg-surface rounded-2xl border shadow-[0_2px_8px_rgba(18,23,38,0.04)]">
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
          <span className="bg-brand text-on-color flex size-[84px] shrink-0 items-center justify-center rounded-full text-lg font-bold">
            {p.student.nameKo}
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

      {/* 6축 점수 — 트랙·score% fill·축별 토큰 색. */}
      <SectionCard
        title="6축 점수 — 동결 시점"
        aside={
          <span className="flex items-baseline gap-1">
            <span className="text-fg-subtle text-[10px] font-medium tracking-[0.6px]">
              평균
            </span>
            <span className="text-brand text-xl font-bold">{p.skillAvg}</span>
            <span className="text-fg-subtle text-[11px] font-medium">
              / 100
            </span>
          </span>
        }
      >
        <div className="flex flex-col gap-2 px-6 pt-3.5 pb-[18px]">
          {p.skills.map((skill, i) => {
            const tone = AXIS_TONES[i % AXIS_TONES.length]
            return (
              <div key={skill.label} className="flex items-center gap-3">
                <span className="text-fg-muted w-14 shrink-0 text-xs font-medium">
                  {skill.label}
                </span>
                <div className="bg-surface-muted h-2 flex-1 overflow-hidden rounded">
                  <div
                    className={`h-full rounded ${tone.bar}`}
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
                <span
                  className={`w-[60px] shrink-0 text-right text-sm font-bold ${tone.text}`}
                >
                  {skill.score}
                </span>
              </div>
            )
          })}
        </div>
      </SectionCard>

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
            className="border-border bg-surface text-fg-muted hover:text-fg flex items-center gap-1.5 rounded-[7px] border px-2.5 py-1.5 text-[11px] font-bold"
          >
            <Download size={12} aria-hidden />
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
            <div key={field.label} className="flex flex-1 flex-col gap-1.5">
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
