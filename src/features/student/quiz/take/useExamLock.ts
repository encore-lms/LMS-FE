import { useCallback, useEffect, useRef, useState } from 'react'

export type ExamLockPhase = 'intro' | 'active' | 'released'

// 벤더 프리픽스(Safari 등) 보강 — lib.dom 표준 타입에 없는 메서드만 옵셔널로 덧댄다.
type FsElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
type FsDocument = Document & { webkitExitFullscreen?: () => Promise<void> }

/**
 * 퀴즈 응시 집중 모드 락 — 브라우저 전체화면 + 이탈 차단(anti-cheat).
 *
 * 목적: 응시 중 구글링·AI 사용을 막는다. 전체화면 진입 후 ESC·탭 전환·새로고침·
 * 뒤로가기·개발자도구·우클릭을 감지·차단한다. (브라우저 정책상 ESC의 전체화면 해제
 * 자체는 막을 수 없어, 풀리면 재진입 오버레이로 다시 가두는 방식으로 강제한다.)
 *
 * - start():   사용자 클릭 제스처로 전체화면 진입(브라우저 정책상 클릭에서만 가능) + active 전환.
 * - relock():  ESC 등으로 풀린 전체화면을 다시 건다(재진입 오버레이 버튼이 호출).
 * - release(): 제출/시간초과 등 정상 종료 — 전체화면 해제 + 락 비활성(이탈 차단 해제).
 *
 * 반환 violations: 응시 중 전체화면이 해제된 누적 횟수(= 이탈 횟수). ESC 1회 = 1회로 집계해
 * 경고/자동 제출 임계 판정이 예측 가능하도록 한다(탭 전환 이중 집계는 두지 않음).
 */
export function useExamLock() {
  const [phase, setPhase] = useState<ExamLockPhase>('intro')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [violations, setViolations] = useState(0)
  // 전체화면 이탈 집계용 — 직전 전체화면 여부 + 최신 phase를 리스너에서 참조.
  const wasFullscreenRef = useRef(false)
  const phaseRef = useRef<ExamLockPhase>('intro')
  phaseRef.current = phase

  const enterFs = useCallback(async () => {
    const el = document.documentElement as FsElement
    try {
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    } catch {
      // 사용자가 권한을 거부했거나 미지원 — 재진입 오버레이가 계속 노출돼 재시도를 유도한다.
    }
  }, [])

  const exitFs = useCallback(async () => {
    const doc = document as FsDocument
    try {
      if (document.fullscreenElement && document.exitFullscreen)
        await document.exitFullscreen()
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen()
    } catch {
      /* 이미 해제됐거나 미지원 — 무시 */
    }
  }, [])

  const start = useCallback(async () => {
    setPhase('active')
    await enterFs()
  }, [enterFs])

  const relock = useCallback(() => enterFs(), [enterFs])

  const release = useCallback(async () => {
    setPhase('released')
    await exitFs()
  }, [exitFs])

  // 전체화면 상태 추적 — ESC/F11로 풀리면 isFullscreen=false → 페이지가 재진입 오버레이를 띄운다.
  // 응시(active) 중 전체화면이 풀리는 것 자체를 이탈 1회로 집계(= ESC로 빠져나가 검색하는 행위 감지).
  useEffect(() => {
    const onChange = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen(fs)
      if (!fs && wasFullscreenRef.current && phaseRef.current === 'active') {
        setViolations((v) => v + 1)
      }
      wasFullscreenRef.current = fs
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // active 동안만: 새로고침·닫기 경고 + 개발자도구/소스보기 단축키·ESC·우클릭 차단 + 이탈 카운트.
  useEffect(() => {
    if (phase !== 'active') return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const blocked =
        e.key === 'F12' || // 개발자 도구
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          (k === 'i' || k === 'j' || k === 'c')) || // 개발자 도구
        ((e.ctrlKey || e.metaKey) && k === 'u') || // 소스 보기
        e.key === 'Escape' // 전체화면 해제 시도(최선의 차단)
      if (blocked) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    window.addEventListener('beforeunload', onBeforeUnload)
    // capture 단계로 등록해 다른 키 핸들러보다 먼저 가로챈다.
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('contextmenu', onContextMenu)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('contextmenu', onContextMenu)
    }
  }, [phase])

  // 언마운트 시 전체화면 정리 — 어떤 경로로든 페이지를 벗어나면 풀스크린을 남기지 않는다.
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) void exitFs()
    }
  }, [exitFs])

  return { phase, isFullscreen, violations, start, relock, release }
}
