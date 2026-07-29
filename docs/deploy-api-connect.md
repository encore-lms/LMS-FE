# 배포 FE ↔ API 서버 연결 가이드 (CloudFront behavior 경유)

## 목표

S3+CloudFront에 배포된 수강생 FE가 **같은 도메인(`/api/*`)** 으로 API를 호출하고,
CloudFront가 그 요청을 **ALB(백엔드 게이트웨이)** 로 전달하게 한다.
→ CORS 불필요(same-origin), Mixed content 없음(CloudFront가 HTTPS 종단), FE는 `baseURL='/api'` 그대로.

## 현재 구조 (파악 결과)

- **FE 호출**: `apiClient.baseURL = VITE_API_BASE_URL || '/api'`, 경로는 `/student/...`·`/auth/...` (앞에 `/api` 없음).
  - 로컬: `/api` + vite dev proxy가 경로별로 8081/8082 분기(dev 서버 전용).
  - 배포: `/api/*`를 CloudFront가 ALB로 보내야 함.
- **백엔드 게이트웨이 = ALB**(terraform `api_services`). path pattern으로 서비스 분기:
  - `/auth/*`, `/users/*`, `/student/onboarding*` → auth-user-service(8081)
  - `/student/*`, `/admin/*`, `/instructor/*` → learning-service(8082)
  - `/mentor/*`, `/verify/*` → operations(8083) · `/integration/*` → integration(8084)
  - **ALB는 `/api` prefix를 제거하지 않음** → CloudFront 단계에서 `/api`를 떼고 보내야 ALB 규칙과 일치.
- **CloudFront/FE-S3는 terraform 밖(수동 리소스)** — deploy-dev.yml이 `AWS_S3_BUCKET`·`AWS_CLOUDFRONT_DIST_ID` secret으로 참조.

## 선결 조건 (중요)

1. **BE가 ECS에 실제로 떠 있어야 함**: terraform `api_services`의 `desired_count` 기본값이 `0`이고 BE 배포 CI가 없다.
   - ECR에 이미지 push → `desired_count`를 1 이상으로 → ALB health check 통과 확인.
2. ALB의 `/actuator/health`가 200이어야 CloudFront origin이 정상.

## 적용 절차

### 1) CloudFront에 ALB origin 추가

- Origin domain: ALB DNS (terraform output `alb_dns_name`)
- Protocol: **HTTP only** (CloudFront→ALB 내부 구간. viewer→CloudFront는 HTTPS라 Mixed content 없음)
- Origin ID 예: `alb-api`

### 2) `/api/*` behavior 추가

- Path pattern: `/api/*`
- Origin: `alb-api`
- Viewer protocol policy: **Redirect HTTP to HTTPS**
- Allowed methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**
- **Cache policy: `CachingDisabled`** (API 응답 캐시 금지)
- **Origin request policy: `AllViewer`** (Authorization 헤더·쿠키·쿼리스트링 전달 — JWT 인증 필수)
- Function associations(viewer request): 아래 `strip-api-prefix` 연결

### 3) CloudFront Function — `/api` prefix 제거

ALB path pattern이 `/student/*`(=`/api` 없음)이므로, viewer request에서 `/api`를 떼어 origin으로 보낸다.
파일: `infra/cloudfront/strip-api-prefix.js`

```js
function handler(event) {
  var req = event.request
  // /api/student/qna → /student/qna (ALB path pattern과 일치)
  if (req.uri === '/api') {
    req.uri = '/'
  } else if (req.uri.startsWith('/api/')) {
    req.uri = req.uri.substring(4) // "/api".length === 4
  }
  return req
}
```

- CloudFront Functions에 위 코드로 함수 생성 → publish → `/api/*` behavior의 **Viewer request**에 연결.

### 4) FE 빌드를 실 BE 모드로 전환 (`deploy-dev.yml`)

현재 빌드가 `VITE_ENABLE_MOCK: 'true'`로 **mock 모드**라 API를 호출하지 않는다. BE 기동·behavior 적용 후:

```yaml
- name: Build
  run: pnpm build
  # VITE_ENABLE_MOCK 제거(또는 'false') → 실 BE 호출
  # VITE_API_BASE_URL 미설정 → baseURL='/api'(same-origin) → CloudFront /api/* behavior가 ALB로 전달
  env:
    VITE_REAL_AUTH: 'true'
```

- `VITE_API_BASE_URL`은 **주입하지 않는다**(비워야 `/api` same-origin). CloudFront가 라우팅을 담당.

## 동작 흐름 (적용 후)

```
브라우저 https://<cloudfront>/api/student/qna
  → CloudFront /api/* behavior (CachingDisabled, AllViewer, HTTPS)
  → Function: /api 제거 → /student/qna
  → ALB origin(HTTP) : path /student/* → learning-service(8082)
```

`/student/onboarding`은 ALB에서 auth로 가는데 `/student/*`(learning)와 겹치므로, ALB listener rule 우선순위에서 `/student/onboarding*`(auth)이 `/student/*`(learning)보다 **먼저** 평가되도록 확인.

## 검증 체크리스트

- [ ] ECS 서비스 RUNNING + ALB target healthy
- [ ] `curl https://<cloudfront>/api/actuator/health` → 200 (Function이 /api 제거해 ALB 도달)
- [ ] 로그인(`/api/auth/login`) → auth-user-service 응답
- [ ] `/api/student/qna` 등 learning 경로 응답
- [ ] 브라우저 콘솔 CORS·Mixed content 에러 없음

## 대안(참고)

- **VITE_API_BASE_URL 직접 주입**: 빌드 시 `VITE_API_BASE_URL=https://<api-domain>` 주입. CloudFront behavior 불필요하지만 **ALB에 ACM(HTTPS) + BE CORS 허용** 필수(안 하면 Mixed content·CORS 차단). 별도 API 도메인이 있을 때.
- **CloudFront를 IaC화**: 현재 수동인 CloudFront/S3를 terraform으로 import해 behavior·Function을 코드 관리(장기 권장).
