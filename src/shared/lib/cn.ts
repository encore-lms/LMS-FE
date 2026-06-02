/**
 * 조건부 className 조합 유틸. falsy 값은 걸러내고 공백으로 join 한다.
 * 외부 의존성 없이 가볍게 유지한다(프로젝트는 무라이브러리 컴포넌트 패턴).
 *
 * @example cn('px-4', isActive && 'bg-brand', className)
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ')
}
