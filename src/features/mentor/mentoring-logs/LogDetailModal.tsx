import { useCallback, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Eye,
  FileText,
  Pencil,
  Timer,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { buttonClass } from '@/components/ui/buttonClass'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Empty } from '@/components/ui/Empty'
import { cn } from '@/shared/lib/cn'
import { useMentoringLogDetail } from '../api/logs'
import type { MentoringLogDetailData } from '../types'
import { MENTORING_PLACE_TYPE_LABEL } from '../types'
import { CharCounter, LogStateChip, RequiredChip } from './LogChips'
import { durationLabel } from './logMeta'

const ROUND1 = (n: number) => Math.round(n * 10) / 10

const META_LABEL = 'text-fg-subtle text-[10px] font-medium tracking-[0.6px]'

// 멘토링 일지 상세 보기 모달 (/mentor/mentoring-logs/:logId) — Figma 2582:6514.
// 목록 위 URL 라우팅 모달(중첩 라우트) — 조회 전용. 배경 목록은 2553:4040 정본 사용
// (frame 의 간이 배경 변형은 미사용 — openQuestion 기록).
// 수정 버튼은 초안(이어 작성)·수정 요청(일지 수정 — 재제출)에만 노출:
// 제출 즉시 자동 유효 + 제출 후 임의 수정·삭제 불가 정책(05-31 확정)이라 Figma 의
// '유효 일지 24h 수정 가능' 표기는 채택하지 않는다(결정 기록).
export default function LogDetailModal() {
  const { logId = '' } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError } = useMentoringLogDetail(logId)
  const close = useCallback(
    () => navigate('/mentor/mentoring-logs'),
    [navigate],
  )
  const [showTemplate, setShowTemplate] = useState(false)

  if (isPending) {
    return (
      <Modal open onClose={close} size="lg">
        <div className="text-fg-muted py-10 text-center text-sm">
          일지를 불러오는 중…
        </div>
      </Modal>
    )
  }
  if (isError || !data) {
    return (
      <Modal open onClose={close} size="lg" title="멘토링 일지 상세">
        <Empty
          title="일지를 찾을 수 없어요"
          description="목록에서 일지를 다시 선택해 주세요."
        />
      </Modal>
    )
  }

  const requiredFields = data.answers.filter((a) => a.field.required)
  const requiredDone = requiredFields.filter((a) => a.value.trim()).length
  const editAction =
    data.status === 'draft'
      ? {
          label: '이어 작성',
          to: `/mentor/mentoring-logs/new?logId=${data.logId}`,
        }
      : data.status === 'change_requested'
        ? {
            label: '일지 수정',
            to: `/mentor/mentoring-logs/new?logId=${data.logId}`,
          }
        : null

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title={
        <span className="flex flex-col items-start gap-1.5">
          <span className="flex flex-wrap items-center gap-1.5">
            <span>멘토링 일지 상세</span>
            <span className="bg-accent-bg text-accent-strong rounded-[5px] px-2 py-[3px] text-[11px] font-bold whitespace-nowrap">
              {data.round}회차
            </span>
            <LogStateChip
              status={data.status}
              note={data.statusNote}
              validLabel="유효"
            />
          </span>
          <span className="text-fg-muted text-xs font-medium">
            {data.cohortLabel} · {data.teamName} · 멘토 {data.mentorName}
          </span>
        </span>
      }
      footer={
        <>
          <span className="mr-auto flex flex-col gap-0.5 self-center">
            <span className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
              <Check className="text-success h-3 w-3 shrink-0" />
              필수 항목 {requiredDone} / {requiredFields.length} 작성
              {data.recognizedHours != null
                ? ` 완료 · 인정 시간 ${data.recognizedHours}h 자동 산정`
                : ''}
            </span>
            <span className="text-fg-subtle text-[11px]">
              운영자가 수정 요청 시 멘토가 전체 수정 후 재제출 · 매니저 승인 후
              인정 시간 반영
            </span>
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={close}
            className="self-center"
          >
            닫기
          </Button>
          {editAction && (
            <Link
              to={editAction.to}
              className={buttonClass({ size: 'sm', className: 'self-center' })}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editAction.label}
            </Link>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* 기본 정보 */}
        <section className="bg-surface-muted/50 divide-divider flex flex-col divide-y rounded-xl">
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <span className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
              <FileText className="h-3.5 w-3.5" />
              기본 정보
            </span>
            {data.submittedAtLabel && (
              <span className="text-fg-subtle text-[11px]">
                제출 {data.submittedAtLabel}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5 px-4 py-3">
            <span className={META_LABEL}>대상 팀</span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="bg-surface-muted text-fg-muted rounded px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap">
                {data.cohortLabel}
              </span>
              <span className="text-fg text-sm font-bold">{data.teamName}</span>
            </span>
            <span className="text-fg-subtle text-[11px]">
              {data.round}회차 멘토링 · 누적 {data.teamHours.accumulatedHours}h
              / 배정 N시간 {data.teamHours.allocatedHours}h · 잔여{' '}
              {data.teamHours.remainingHours}h
            </span>
          </div>
          <div className="divide-divider grid grid-cols-1 sm:grid-cols-2 sm:divide-x">
            <InfoCell label="진행 일시" icon={<Calendar className="h-3 w-3" />}>
              {data.sessionLabel}
            </InfoCell>
            <InfoCell label="장소">
              {MENTORING_PLACE_TYPE_LABEL[data.placeType]} · {data.placeDetail}
            </InfoCell>
          </div>
          <div className="divide-divider grid grid-cols-1 sm:grid-cols-3 sm:divide-x">
            <InfoCell
              label="실제 진행 시간"
              icon={<Timer className="h-3 w-3" />}
            >
              {durationLabel(data.actualMinutes)}
            </InfoCell>
            <InfoCell label="인정 시간">
              {data.recognizedHours != null ? (
                <span className="text-brand">{data.recognizedHours}h</span>
              ) : (
                <span className="text-fg-subtle">-</span>
              )}
            </InfoCell>
            <InfoCell label="참석 멘티">
              {data.attendedCount} / {data.memberCount}명 참석
            </InfoCell>
          </div>
        </section>

        {/* 참석 멘티 칩 — 불참 팀원은 흐리게 표시 */}
        <div className="bg-surface-muted flex flex-wrap gap-2 rounded-[10px] p-3">
          {data.attendees.map((m) => (
            <span
              key={m.studentId}
              className={cn(
                'border-border bg-surface flex items-center gap-1.5 rounded-full border py-1 pr-2.5 pl-1',
                !m.attended && 'opacity-50',
              )}
            >
              <Avatar name={m.name} size={24} />
              <span className="text-fg text-xs font-bold">{m.name}</span>
              <span className="bg-surface-muted text-fg-subtle rounded px-1 py-px text-[9px] font-bold">
                {m.tagLabel ?? (m.role === 'pm' ? 'PM' : '팀원')}
              </span>
              {m.attended ? (
                <Check className="text-success h-3 w-3" />
              ) : (
                <span className="text-fg-subtle text-[9px] font-bold">
                  불참
                </span>
              )}
            </span>
          ))}
        </div>

        {/* 시간 차감 자동 산정 — brand 틴트(#e8f7f7→brand/10) */}
        <section className="bg-brand/10 border-brand rounded-xl border px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <Clock className="text-brand h-3.5 w-3.5" />
            <span className="text-fg text-[13px] font-bold">
              시간 차감 자동 산정
            </span>
            <span className="bg-brand text-on-color rounded px-1.5 py-0.5 text-[9px] font-bold">
              자동
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 sm:gap-0">
            <CalcStat
              label="실제 진행"
              value={`${ROUND1(data.actualMinutes / 60)}h`}
            />
            <CalcStat
              label="인정 시간"
              value={
                data.recognizedHours != null ? `${data.recognizedHours}h` : '-'
              }
              valueClass={
                data.recognizedHours != null ? 'text-brand' : 'text-fg-subtle'
              }
            />
            <CalcStat
              label="초과"
              value={data.excessHours > 0 ? `${data.excessHours}h` : '-'}
              valueClass={
                data.excessHours > 0 ? 'text-accent-strong' : 'text-fg-subtle'
              }
            />
            <CalcStat
              label="배정 잔여"
              value={`${data.teamHours.remainingHours}h`}
              valueClass="text-warning"
            />
          </div>
        </section>

        {/* 상태 배너 — 승인 대기 / 유효 / 수정 요청 사유 / 작성 중 */}
        {data.status === 'submitted' && (
          <div className="bg-warning-bg border-warning flex items-start gap-2.5 rounded-xl border p-3.5">
            <Clock className="text-warning mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[13px] font-bold">
                승인 대기 · 매니저 검토 중
              </span>
              <span className="text-fg-muted text-[11px]">
                매니저 승인 후 인정 시간이 반영됩니다
              </span>
            </div>
          </div>
        )}
        {data.status === 'valid' && (
          <div className="bg-success-bg border-success flex items-start gap-2.5 rounded-xl border p-3.5">
            <Check className="text-success mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[13px] font-bold">
                유효 · 매니저 승인 완료
              </span>
              <span className="text-fg-muted text-[11px]">
                매니저 승인으로 인정 시간이 반영되었습니다
              </span>
            </div>
          </div>
        )}
        {data.status === 'change_requested' && data.changeRequest && (
          <div className="bg-danger-bg border-danger flex items-start gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle className="text-danger mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-fg text-[13px] font-bold">
                운영자 수정 요청 — {data.changeRequest.reasonLabel}
              </span>
              <span className="text-fg-muted text-[12px] leading-[18px]">
                {data.changeRequest.note}
              </span>
              <span className="text-fg-subtle text-[11px]">
                요청 {data.changeRequest.requestedAtLabel} · 전체 수정 후 재제출
                시 승인 대기
              </span>
            </div>
          </div>
        )}
        {data.status === 'draft' && (
          <div className="bg-surface-muted text-fg-muted flex items-center gap-2 rounded-xl p-3.5 text-[12px]">
            <Pencil className="h-3.5 w-3.5 shrink-0" />
            작성 중 임시 일지 — 제출 전이라 인정 시간에 반영되지 않습니다
          </div>
        )}

        {/* 운영 설정 항목 */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-fg text-[15px] font-bold">운영 설정 항목</h3>
            <span className="text-fg-subtle text-[11px]">
              팀 템플릿 {data.answers.length}개 · 필수 {requiredFields.length} ·
              선택 {data.answers.length - requiredFields.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowTemplate((v) => !v)}
            className="bg-surface-muted text-fg-muted hover:bg-divider rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap"
          >
            적용된 템플릿 보기
          </button>
        </div>
        {showTemplate && (
          <ul className="bg-surface-muted/50 divide-divider flex flex-col divide-y rounded-xl">
            {data.answers.map(({ field }) => (
              <li
                key={field.fieldSnapshotId}
                className="flex items-center gap-2 px-4 py-2.5"
              >
                <span className="text-fg-subtle w-4 text-[11px] font-bold">
                  {field.order}
                </span>
                <span className="text-fg text-[13px] font-semibold">
                  {field.name}
                </span>
                <RequiredChip required={field.required} />
                <span className="text-fg-subtle ml-auto text-[11px]">
                  {field.description}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* 항목 카드 — 텍스트/첨부 변형 */}
        {data.answers.map(({ field, value }) => (
          <section
            key={field.fieldSnapshotId}
            className="bg-surface-muted/50 flex flex-col gap-2.5 rounded-xl px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex h-[22px] w-[22px] items-center justify-center rounded-md text-[11px] font-bold',
                  field.required
                    ? 'bg-brand/10 text-brand'
                    : 'bg-surface-muted text-fg-muted',
                )}
              >
                {field.order}
              </span>
              <span className="text-fg text-sm font-bold">{field.name}</span>
              <RequiredChip required={field.required} />
              <span className="ml-auto">
                {field.inputKind === 'photos' && data.photos.length > 0 ? (
                  <span className="text-fg-subtle text-[11px]">
                    {data.photos.length}장 · 타임스탬프 확인됨
                  </span>
                ) : field.charLimit != null ? (
                  <CharCounter length={value.length} limit={field.charLimit} />
                ) : null}
              </span>
            </div>
            <p className="text-fg-subtle text-[11px]">{field.description}</p>
            <AnswerContent field={field} value={value} photos={data.photos} />
          </section>
        ))}

        {/* 메타 행 — 승인 단계 도입: 제출 시 승인 대기, 매니저 승인 후 인정 */}
        <div className="bg-surface-muted flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[10px] p-3.5">
          <MetaItem label="제출" value={data.submittedAtLabel ?? '제출 전'} />
          <MetaItem label="유효 처리" value="매니저 승인 후 인정" />
          <MetaItem label="수정" value="수정 요청 시 전체 수정 후 재제출" />
          <span className="ml-auto">
            <MetaItem label="기록 ID" value={data.logId} />
          </span>
        </div>
      </div>
    </Modal>
  )
}

function InfoCell({
  label,
  icon,
  children,
}: {
  label: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className={META_LABEL}>{label}</span>
      <span className="text-fg flex items-center gap-1.5 text-[13px] font-bold">
        {icon}
        {children}
      </span>
    </div>
  )
}

function CalcStat({
  label,
  value,
  valueClass = 'text-fg',
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="border-brand/30 flex flex-1 flex-col gap-0.5 sm:border-l sm:px-4 sm:first:border-l-0 sm:first:pl-0">
      <span className={META_LABEL}>{label}</span>
      <span className={cn('text-xl font-bold', valueClass)}>{value}</span>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={META_LABEL}>{label}</span>
      <span className="text-fg text-xs font-bold">{value}</span>
    </span>
  )
}

// 항목 콘텐츠 — 텍스트(pre-wrap) / 작성 산출물(첨부 빈 상태) / 활동 기록(타임스탬프 사진).
function AnswerContent({
  field,
  value,
  photos,
}: {
  field: MentoringLogDetailData['answers'][number]['field']
  value: string
  photos: MentoringLogDetailData['photos']
}) {
  if (field.inputKind === 'files') {
    // 업로드 계약 미확정(DB 스키마 갭) — 첨부 빈 상태 고정 표시(원문).
    return (
      <div className="border-border flex flex-col items-center gap-1.5 rounded-[10px] border border-dashed px-4 py-6">
        <Eye className="text-fg-subtle h-5 w-5" />
        <span className="text-fg text-xs font-bold">첨부된 산출물 없음</span>
        <span className="text-fg-subtle text-[11px]">
          PDF · DOC · PPT · MD · 이미지 (최대 50MB · 5개)
        </span>
      </div>
    )
  }
  if (field.inputKind === 'photos') {
    if (photos.length === 0) {
      return (
        <div className="bg-surface-muted text-fg-muted rounded-[10px] p-4 text-xs">
          등록된 활동 기록 사진이 없습니다
        </div>
      )
    }
    return (
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div
            key={`${photo.kind}-${photo.timeLabel}`}
            className="bg-brand-deep flex h-[118px] flex-1 basis-40 flex-col justify-end rounded-lg p-2.5"
          >
            <span className="text-on-color/70 text-[9px] font-bold tracking-[0.72px]">
              TIME STAMP
            </span>
            <span className="text-on-color/80 text-[10px]">
              {photo.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-on-color text-[13px] font-bold">
                {photo.timeLabel} ({photo.kind === 'start' ? '시작' : '종료'})
              </span>
              <span className="bg-success text-on-color rounded px-1 py-px text-[9px] font-bold">
                {photo.kind === 'start' ? '시작' : '종료'}
              </span>
            </span>
          </div>
        ))}
      </div>
    )
  }
  if (!value.trim()) {
    return (
      <div className="bg-surface-muted text-fg-muted flex items-center gap-2 rounded-[10px] p-4 text-xs">
        <Pencil className="h-3.5 w-3.5 shrink-0" />
        작성하지 않은 선택 항목입니다
      </div>
    )
  }
  return (
    <div className="border-divider rounded-[10px] border px-3.5 py-3">
      <p className="text-fg text-[13px] leading-5 font-medium whitespace-pre-wrap">
        {value}
      </p>
    </div>
  )
}
