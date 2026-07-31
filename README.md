# Lavi Crew

라비에벨 웨딩홀 구성원을 위한 모바일 우선 스케줄·출석·급여 관리 웹입니다. 하나의 Next.js 앱에서 Supabase Auth의 역할에 따라 관리자와 알바 화면을 분리합니다.

## 기술 구성

- Next.js 16, React 19, React Compiler
- TypeScript, vanilla-extract
- Supabase Auth, PostgreSQL, RLS, RPC
- Zod, Vitest, Playwright

Node.js 버전은 `.nvmrc`의 22를 사용합니다.

## 애플리케이션 실행

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

`.env.local`에는 최소 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요합니다. 서비스 역할 키와 외부 제공자 키는 브라우저에 노출하거나 저장소에 커밋하지 않습니다.

## 로컬 Supabase와 DB E2E

Docker 호환 런타임과 `psql`이 필요합니다.

```bash
npm run db:start
npm run db:reset
npm run test:db
```

`db:reset`은 `supabase/migrations/`를 처음부터 적용합니다. `test:db`는 관리자·알바 fixture를 트랜잭션 안에서 만들고 신청, 마감, 일정 게시·수정·취소, 출석·급여, 공지, 초대 코드, RLS, 멱등성 충돌과 실패 롤백을 검증한 뒤 모든 데이터를 롤백합니다.

로컬 앱을 Supabase에 연결할 때 사용할 URL과 키는 `npx supabase status -o env`로 확인할 수 있습니다. 종료는 `npm run db:stop`입니다.

## 실제 Auth·브라우저 E2E

Playwright Chromium을 한 번 설치한 뒤, 반드시 clean 로컬 DB에서 실행합니다.

```bash
npx playwright install chromium
npm run db:start
npm run db:reset
npm run test:e2e
```

`test:e2e`는 로컬 Supabase API(54321)와 PostgreSQL(54322)만 허용합니다. 임의 비밀번호와 고정 UUID의 관리자·알바 fixture를 만든 뒤 production Next.js 서버에서 실제 이메일·비밀번호 세션, 역할 보호, 신청·취소·월 마감, 일정 등록·배정·수정, 월·주·일 조회와 Mailpit 이메일 확인 callback을 검증합니다. 실행마다 fixture가 남으므로 재실행 전 `npm run db:reset`이 필요합니다.

## 품질 검증

```bash
npm run check:harness
npm run check:architecture
npm run format:check
npm run lint
npm test
npm run build
```

CI는 위 애플리케이션 검증과 별도로 빈 로컬 Supabase의 전체 마이그레이션·DB E2E와 인증된 모바일 Chromium 브라우저 E2E를 실행합니다.

설계와 운영 근거는 `docs/architecture.md`, `docs/decisions/`, `docs/operations/mvp-verification.md`를 참고합니다. 카카오 알림톡 실제 발송은 승인된 템플릿과 운영 자격 증명이 준비된 뒤 별도 검증합니다.
