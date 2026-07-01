// CloudFront Function (viewer request) — 배포 FE의 /api prefix 제거.
// FE는 same-origin으로 /api/*를 호출하고, ALB path pattern은 /api 없는 경로(/student/*, /auth/* …)라
// CloudFront가 origin(ALB)으로 보내기 전에 /api를 떼어 규칙과 일치시킨다.
// /api/* behavior 의 Viewer request 에 연결.
function handler(event) {
  var req = event.request
  if (req.uri === '/api') {
    req.uri = '/'
  } else if (req.uri.startsWith('/api/')) {
    req.uri = req.uri.substring(4) // "/api".length === 4
  }
  return req
}
