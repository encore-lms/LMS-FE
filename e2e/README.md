# 역량 증명서 실 API Headless 검증

이 시나리오는 브라우저 요청을 fixture로 가로채지 않는다. 실행 대상 FE와 LMS-SV가 실제로
연결된 환경에서만 사용한다.

필수 공통값은 `E2E_BASE_URL`이다. 로컬 Chrome을 사용할 때는 `PW_CHANNEL=chrome`을 함께
지정한다. 각 시나리오는 아래 값이 없으면 명시적으로 skip된다.

- READY 수강생: `E2E_STUDENT_USER_ID`, `E2E_STUDENT_PASSWORD`
- 결측 수강생: `E2E_INCOMPLETE_STUDENT_USER_ID`, `E2E_INCOMPLETE_STUDENT_PASSWORD`
- 매니저 상세: `E2E_MANAGER_USER_ID`, `E2E_MANAGER_PASSWORD`,
  `E2E_CERTIFICATE_STUDENT_ID`, `E2E_CERTIFICATE_COURSE_ID`,
  `E2E_CERTIFICATE_COHORT_ID`
- 외부 공개: `E2E_CERTIFICATE_PUBLIC_TOKEN`

실행 전에 `pnpm test:e2e:list`로 등록된 시나리오를 확인하고, 준비된 환경에서는
`pnpm test:e2e`로 실행한다. 비밀번호와 토큰은 `.env`나 저장소에 기록하지 않는다.
