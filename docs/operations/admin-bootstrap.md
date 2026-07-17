# 최초 관리자 초기화

최초 관리자는 공개 가입이나 브라우저 요청으로 생성하지 않는다. Supabase migration을 적용하고 대상 계정이 이메일 확인과 프로필 생성을 끝낸 뒤, 신뢰할 수 있는 운영자 환경에서 한 번만 실행한다.

```bash
LAVI_ADMIN_EMAIL='admin@example.com' npm run bootstrap:admin
```

필수 서버 환경 변수는 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LAVI_ADMIN_EMAIL`이다. 서비스 역할 키는 로컬 `.env.local` 또는 비밀 관리 시스템에서만 제공하고 커밋하거나 브라우저에 노출하지 않는다.

스크립트는 대상 이메일의 Auth 사용자와 `public.profiles` 행을 확인한 뒤, 이미 관리자가 아닌 경우에만 `role=admin`으로 바꾼다. DB의 부분 고유 인덱스가 두 번째 관리자를 거부한다. 성공 후 `LAVI_ADMIN_EMAIL`과 서비스 역할 키를 작업 환경에서 제거한다.
