/**
 * 학생 관리 탭이 임베드될 때 상위가 정해 주는 과정·기수.
 *
 * <p>기수 허브(/admin/education/:cohortId)는 이미 기수를 골라 들어온 화면이라, 안에서 같은
 * 선택을 또 시키면 헤더가 말하는 기수와 표가 보여 주는 기수가 어긋날 수 있다. 이 값이 있으면
 * 각 탭은 과정·기수 선택 컨트롤을 감추고 여기 담긴 기수만 조회한다.</p>
 */
export interface CohortScope {
  courseId: string
  cohortId: string
}
